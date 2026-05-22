import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";

const PHRASES = ["Belajar Tanpa Batas.", "Kelola Kelas Mudah.", "Nilai Lebih Akurat.", "Kolaborasi Lebih Baik."];

function AnimatedText() {
  const [idx, setIdx] = React.useState(0);
  const [displayed, setDisplayed] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    const target = PHRASES[idx];
    let timeout;
    if (!deleting && displayed.length < target.length) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === target.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((idx + 1) % PHRASES.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, idx]);

  return (
    <span>
      {displayed}
      <span style={{ borderRight: "2px solid #34d399", marginLeft: 2, animation: "blink 1s step-end infinite" }}>&nbsp;</span>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </span>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0 });
  const canvasRef = useRef(null);
  const urlError = new URLSearchParams(window.location.search).get("error");
  if (urlError) { window.history.replaceState({}, "", "/login"); }

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const [resStudents, resTeachers, resCourses] = await Promise.all([
        supabase.from("User").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("User").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("Course").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        students: resStudents.count || 0,
        teachers: resTeachers.count || 0,
        courses: resCourses.count || 0,
      });
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (isMobile) return;
    let animFrameId, cleanupFn;
    const initScene = async () => {
      const THREE = (await import("three")).default || (await import("three"));
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const W = parent.offsetWidth, H = parent.offsetHeight;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.shadowMap.enabled = true;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x010a06);
      scene.fog = new THREE.FogExp2(0x010a06, 0.022);

      const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 300);
      camera.position.set(0, 4, 18);
      camera.lookAt(0, 2, 0);

      // Lights
      scene.add(new THREE.AmbientLight(0x0a2e1a, 1.2));
      const sunLight = new THREE.DirectionalLight(0x34d399, 2.5);
      sunLight.position.set(-8, 12, 6);
      scene.add(sunLight);
      const rimLight = new THREE.DirectionalLight(0x059669, 1.0);
      rimLight.position.set(10, -4, -10);
      scene.add(rimLight);
      const glowLight = new THREE.PointLight(0x34d399, 3, 25);
      glowLight.position.set(0, 6, 0);
      scene.add(glowLight);

      // Planet besar
      const planetGeo = new THREE.SphereGeometry(5.5, 64, 64);
      const planetMat = new THREE.MeshStandardMaterial({
        color: 0x1a8a50, roughness: 0.4, metalness: 0.2,
        emissive: 0x0d5c30, emissiveIntensity: 1.2,
      });
      const planet = new THREE.Mesh(planetGeo, planetMat);
      planet.position.set(2, 2, -4);
      scene.add(planet);

      // Planet atmosphere glow
      const atmosGeo = new THREE.SphereGeometry(6.0, 64, 64);
      const atmosMat = new THREE.MeshStandardMaterial({
        color: 0x34d399, transparent: true, opacity: 0.18,
        side: THREE.BackSide, emissive: 0x34d399, emissiveIntensity: 0.3,
      });
      const atmos = new THREE.Mesh(atmosGeo, atmosMat);
      atmos.position.copy(planet.position);
      scene.add(atmos);

      // Planet ring
      const ringGeo = new THREE.TorusGeometry(7.5, 0.3, 8, 80);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x10b981, transparent: true, opacity: 0.25,
        emissive: 0x065f46, emissiveIntensity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(planet.position);
      ring.rotation.x = Math.PI * 0.35;
      scene.add(ring);

      // Grid floor
      const gridHelper = new THREE.GridHelper(40, 30, 0x0d4a2a, 0x052918);
      gridHelper.position.y = -3;
      scene.add(gridHelper);

      // Kubus animasi (lebih sedikit, lebih dramatis)
      const COLS = 8, ROWS = 8, GAP = 1.4;
      const tiles = [], targetH = [], currentH = [];
      const matTall  = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.3, emissive: 0x034d30, emissiveIntensity: 0.3 });
      const matMid   = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.5, metalness: 0.1 });
      const matShort = new THREE.MeshStandardMaterial({ color: 0x022c22, roughness: 0.8 });
      const matHover = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.15, metalness: 0.5, emissive: 0x10b981, emissiveIntensity: 0.6 });
      const matClick = new THREE.MeshStandardMaterial({ color: 0xa7f3d0, roughness: 0.1, metalness: 0.6, emissive: 0x34d399, emissiveIntensity: 0.8 });
      const pickMat  = (h) => h > 2.2 ? matTall : h > 1.0 ? matMid : matShort;

      for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) {
        const h = Math.random() * 3.2 + 0.15;
        targetH.push(h); currentH.push(0.05);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1, 1.0), pickMat(h));
        mesh.position.set((cc - COLS/2) * GAP, -3, (r - ROWS/2) * GAP);
        mesh.scale.y = 0.05;
        scene.add(mesh);
        tiles.push({ mesh });
      }

      // Partikel melayang
      const partCount = 200;
      const partPositions = new Float32Array(partCount * 3);
      for (let i = 0; i < partCount; i++) {
        partPositions[i*3]   = (Math.random() - 0.5) * 35;
        partPositions[i*3+1] = (Math.random() - 0.5) * 20 + 4;
        partPositions[i*3+2] = (Math.random() - 0.5) * 30;
      }
      const partGeo = new THREE.BufferGeometry();
      partGeo.setAttribute("position", new THREE.BufferAttribute(partPositions, 3));
      const partMat = new THREE.PointsMaterial({ color: 0x34d399, size: 0.08, transparent: true, opacity: 0.7 });
      const particles = new THREE.Points(partGeo, partMat);
      scene.add(particles);

      // Debris / asteroid kecil melayang
      const debris = [];
      for (let i = 0; i < 12; i++) {
        const size = Math.random() * 0.25 + 0.06;
        const dMesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(size, 0),
          new THREE.MeshStandardMaterial({ color: 0x0a3d20, roughness: 0.9, emissive: 0x052918 })
        );
        dMesh.position.set(
          (Math.random() - 0.5) * 20,
          Math.random() * 12 - 2,
          (Math.random() - 0.5) * 15
        );
        dMesh.userData = {
          vx: (Math.random() - 0.5) * 0.008,
          vy: (Math.random() - 0.5) * 0.004,
          vz: (Math.random() - 0.5) * 0.006,
          rx: Math.random() * 0.01,
          ry: Math.random() * 0.008,
        };
        scene.add(dMesh);
        debris.push(dMesh);
      }

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(-999, -999);
      let hoveredIdx = -1;
      const clickBoost = new Array(COLS * ROWS).fill(0);

      const onMouseMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      };
      const onClick = () => {
        if (hoveredIdx === -1) return;
        const col = hoveredIdx % COLS, row = Math.floor(hoveredIdx / COLS);
        tiles.forEach((_, i) => {
          const cc = i % COLS, rr = Math.floor(i / COLS);
          const dist = Math.sqrt((cc-col)**2 + (rr-row)**2);
          clickBoost[i] = Math.max(clickBoost[i], Math.max(0, 4 - dist * 0.8));
        });
      };
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("click", onClick);
      const planetMouse = { x: 0, y: 0 };
      let isDragging = false;
      let dragStart = { x: 0, y: 0 };
      let planetRotation = { x: 0, y: 0 };
      const onPlanetMouse = (e) => {
        const rect = canvas.getBoundingClientRect();
        planetMouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        planetMouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;

      };
      canvas.addEventListener("mousemove", onPlanetMouse);

      let t = 0;
      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        t += 0.007;

        // Planet rotate — auto + drag + cursor follow
        if (!isDragging) {
          planetRotation.y += 0.004;
          planetRotation.x += (planetMouse.y * 0.3 - planetRotation.x) * 0.04;
          planetRotation.y += (planetMouse.x * 0.3 - planetRotation.y) * 0.02;
        }
        planet.rotation.y = planetRotation.y;
        planet.rotation.x = planetRotation.x;
        ring.rotation.z   = t * 0.04;

        // Glow pulse
        glowLight.intensity = 2.5 + Math.sin(t * 1.2) * 0.8;

        // Partikel drift
        particles.rotation.y = t * 0.015;
        const pos = partGeo.attributes.position.array;
        for (let i = 0; i < partCount; i++) {
          pos[i*3+1] += Math.sin(t + i) * 0.002;
        }
        partGeo.attributes.position.needsUpdate = true;

        // Debris float
        debris.forEach(d => {
          d.position.x += d.userData.vx;
          d.position.y += d.userData.vy;
          d.position.z += d.userData.vz;
          d.rotation.x += d.userData.rx;
          d.rotation.y += d.userData.ry;
          if (Math.abs(d.position.x) > 12) d.userData.vx *= -1;
          if (Math.abs(d.position.y) > 8)  d.userData.vy *= -1;
          if (Math.abs(d.position.z) > 10) d.userData.vz *= -1;
        });

        // Kubus hover
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(tiles.map(t => t.mesh));
        hoveredIdx = hits.length > 0 ? tiles.findIndex(tt => tt.mesh === hits[0].object) : -1;

        tiles.forEach(({ mesh }, i) => {
          const col = i % COLS, row = Math.floor(i / COLS);
          const wave = Math.sin(t + col * 0.6 + row * 0.6) * 0.2 + 1.0;
          let hoverBoost = 0;
          if (hoveredIdx !== -1) {
            const hc = hoveredIdx % COLS, hr = Math.floor(hoveredIdx / COLS);
            const dist = Math.sqrt((col-hc)**2 + (row-hr)**2);
            hoverBoost = Math.max(0, 2.2 - dist * 0.55);
          }
          clickBoost[i] *= 0.87;
          const tH = targetH[i] * wave + hoverBoost + clickBoost[i];
          currentH[i] += (tH - currentH[i]) * 0.07;
          mesh.scale.y = currentH[i];
          mesh.position.y = -3 + currentH[i] * 0.5;
          mesh.material = i === hoveredIdx ? matClick
            : hoveredIdx !== -1 && Math.sqrt(((i%COLS)-(hoveredIdx%COLS))**2+(Math.floor(i/COLS)-Math.floor(hoveredIdx/COLS))**2) < 2
              ? matHover : pickMat(currentH[i]);
        });

        // Camera gentle drift
        camera.position.x = Math.sin(t * 0.1) * 1.5;
        camera.position.y = 4 + Math.cos(t * 0.07) * 0.8;
        camera.lookAt(0, 2, 0);

        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const nW = parent.offsetWidth, nH = parent.offsetHeight;
        renderer.setSize(nW, nH);
        camera.aspect = nW / nH;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("click", onClick);
        canvas.removeEventListener("mousemove", onPlanetMouse);
        cancelAnimationFrame(animFrameId);
        renderer.dispose();
      };
    };
    initScene().then(fn => { cleanupFn = fn; });
    return () => { if (cleanupFn) cleanupFn(); cancelAnimationFrame(animFrameId); };
  }, [isMobile]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (err) {
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("not found")) {
        setError("Email atau password salah. Belum punya akun? Daftar dulu.");
      } else {
        setError(err.message);
      }
      return;
    }

    // JANGAN navigate() di sini.
    // AuthContext.onAuthStateChange akan menangkap event SIGNED_IN
    // dan melakukan loadUserProfile → redirect ke "/" secara otomatis.
  };

  const handleGoogle = async () => {
    try {
      setError("");
      // Pastikan tidak ada sisa pending_role dari sesi register sebelumnya
      sessionStorage.removeItem("pending_role");
      sessionStorage.removeItem("pending_name");

      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (err) {
        console.error("Google OAuth Error:", err);
        setError(err.message || "Gagal login dengan Google. Coba lagi.");
      }
    } catch (e) {
      console.error("Google login exception:", e);
      setError("Terjadi kesalahan. Coba refresh halaman dan ulangi.");
    }
  };

  const handleForgot = async () => {
    if (!email) { setError("Masukkan email kamu dulu."); return; }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (err) { setError(err.message); return; }
    setError("");
    alert("Email reset password sudah dikirim!");
  };

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      {!isMobile && (
        <div style={s.left}>
          <canvas ref={canvasRef} style={s.canvas} />
          <div style={s.leftOverlay} />
          <div style={s.leftInner}>
            <div style={s.logo}>EduSpace</div>
            <div style={s.leftBottom}>
              <p style={s.headline}><AnimatedText /></p>
              <p style={s.subline}>Platform pembelajaran modern untuk guru dan murid. Kelola kelas, tugas, dan nilai dalam satu tempat.</p>
              <div style={s.leftStats}>
                <div style={s.statItem}>
                  <span style={s.statNum}>{stats.students}</span>
                  <span style={s.statLabel}>Pelajar Aktif</span>
                </div>
                <div style={s.statDivider} />
                <div style={s.statItem}>
                  <span style={s.statNum}>{stats.courses}</span>
                  <span style={s.statLabel}>Kelas Tersedia</span>
                </div>
                <div style={s.statDivider} />
                <div style={s.statItem}>
                  <span style={s.statNum}>{stats.teachers}</span>
                  <span style={s.statLabel}>Guru Terdaftar</span>
                </div>
              </div>
              <div style={s.featureList}>
                <div style={s.featureItem}><span style={s.featureDot} />Manajemen kelas real-time</div>
                <div style={s.featureItem}><span style={s.featureDot} />Penilaian otomatis & analitik</div>
                <div style={s.featureItem}><span style={s.featureDot} />Kolaborasi guru & murid</div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{ ...s.right, width: isMobile ? "100%" : "56%" }}>
        {isMobile && <div style={{ ...s.logo, marginBottom: 40, textAlign: "center" }}>EduSpace</div>}
        <form onSubmit={handleLogin} style={s.form}>
          <p style={s.eyebrow}>Selamat Datang</p>
          <h1 style={{ ...s.h1, fontSize: isMobile ? 32 : 28 }}>Login</h1>
          <p style={s.desc}>Masukkan detail akun kamu untuk melanjutkan</p>

          {urlError === "not_registered" && (
            <div style={{ ...s.errorBox, borderColor: "rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.08)" }}>
              <p style={{ color: "#fbbf24", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Akun belum terdaftar</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>
                Email ini belum memiliki akun EduSpace.{" "}
                <a href="/register" style={{ color: "#fbbf24", fontWeight: 600, textDecoration: "none" }}>Daftar sekarang →</a>
              </p>
            </div>
          )}

          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="nama@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...s.input, paddingRight: 44 }}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={s.forgotRow}>
            <button type="button" onClick={handleForgot} style={s.forgot}>Lupa password</button>
          </div>

          <button type="submit" disabled={loading} style={s.btnMain}>
            {loading ? "Masuk..." : "Masuk"}
          </button>

          <div style={s.dividerRow}>
            <span style={s.dividerLine} /><span style={s.dividerText}>atau</span><span style={s.dividerLine} />
          </div>

          <button type="button" onClick={handleGoogle} style={s.btnGoogle}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Lanjutkan dengan Google
          </button>

          <p style={s.footerNote}>
            Belum mempunyai akun?{" "}
            <Link to="/register" style={s.footerLink}>Daftar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", width: "100vw", minHeight: "100vh", fontFamily: "'Inter', sans-serif", overflow: "hidden", background: "#020f0a" },
  left: { width: "44%", flexShrink: 0, position: "relative", background: "#020f0a", borderRight: "0.5px solid rgba(255,255,255,0.08)", overflow: "hidden" },
  canvas: { position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", opacity: 1.0 },
  leftOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(2,15,10,0.95) 0%, rgba(2,15,10,0.3) 60%, transparent 100%)", zIndex: 1, pointerEvents: "none" },
  leftInner: { position: "relative", zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: "32px 36px", pointerEvents: "none" },
  logo: { fontFamily: "'DM Serif Display', serif", fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "3px", textTransform: "uppercase" },
  headline: { fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 28, lineHeight: 1.15, color: "#fff", margin: "0 0 10px" },
  subline: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300, lineHeight: 1.6, margin: "0 0 16px", maxWidth: 280 },
  right: { flexShrink: 0, background: "#020f0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", overflowY: "auto", minHeight: "100vh" },
  form: { width: "100%", maxWidth: 380 },
  eyebrow: { fontSize: 10.5, fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", margin: "0 0 20px" },
  h1: { fontFamily: "'DM Serif Display', serif", color: "#fff", lineHeight: 1.15, margin: "0 0 6px", fontWeight: "normal" },
  desc: { fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 300, margin: "0 0 28px" },
  errorBox: { background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 18 },
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: 10.5, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 },
  input: { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", padding: "11px 0", fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" },
  eyeBtn: { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 11, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 500, letterSpacing: "0.5px" },
  forgotRow: { display: "flex", justifyContent: "flex-end", marginTop: -8, marginBottom: 22 },
  forgot: { background: "none", border: "none", fontSize: 12, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: "'Inter', sans-serif", padding: 0 },
  btnMain: { width: "100%", background: "linear-gradient(135deg, #10b981, #34d399)", color: "#022c22", border: "none", borderRadius: 0, padding: "13px", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", marginBottom: 20 },
  dividerRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 0 },
  dividerLine: { flex: 1, height: "0.5px", background: "rgba(255,255,255,0.1)", display: "block" },
  dividerText: { fontSize: 12, color: "rgba(255,255,255,0.2)" },
  btnGoogle: { width: "100%", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 0, padding: "11px 14px", fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 },
  footerNote: { textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 },
  footerLink: { color: "#fff", fontWeight: 500, textDecoration: "none" },
  leftBottom: { display: "flex", flexDirection: "column" },
  leftStats: { display: "flex", alignItems: "center", gap: 20, marginBottom: 20 },
  statItem: { display: "flex", flexDirection: "column", gap: 2 },
  statNum: { fontSize: 18, fontWeight: 700, color: "#34d399", fontFamily: "'Inter', sans-serif", lineHeight: 1 },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "1px", textTransform: "uppercase" },
  statDivider: { width: "0.5px", height: 32, background: "rgba(255,255,255,0.1)" },
  featureList: { marginTop: 0, display: "flex", flexDirection: "column", gap: 8 },
  featureItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 300 },
  featureDot: { width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 },
};