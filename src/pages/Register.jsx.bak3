import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen } from "lucide-react";
import * as THREE from "three";

function ThreeBG() {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.offsetWidth / mount.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.offsetWidth, mount.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    camera.position.z = 18;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0x34d399, 1.5);
    dir.position.set(5, 5, 5); scene.add(dir);
    const pt = new THREE.PointLight(0x60a5fa, 1, 60);
    pt.position.set(-8, 4, 6); scene.add(pt);

    const objects = [];

    // Icosahedron kiri
    const icoG = new THREE.IcosahedronGeometry(5, 1);
    const icoW = new THREE.Mesh(icoG, new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.13 }));
    const icoS = new THREE.Mesh(icoG, new THREE.MeshPhongMaterial({ color: 0x064e3b, transparent: true, opacity: 0.06 }));
    const icoGrp = new THREE.Group(); icoGrp.add(icoW, icoS);
    icoGrp.position.set(-10, 2, -6); scene.add(icoGrp);
    objects.push({ mesh: icoGrp, rx: 0.003, ry: 0.005, rz: 0.002 });

    // Torus knot kanan
    const tkG = new THREE.TorusKnotGeometry(2.8, 0.6, 120, 16);
    const tkW = new THREE.Mesh(tkG, new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.14 }));
    const tkGrp = new THREE.Group(); tkGrp.add(tkW);
    tkGrp.position.set(10, -2, -5); scene.add(tkGrp);
    objects.push({ mesh: tkGrp, rx: 0.004, ry: 0.006, rz: 0.003 });

    // Octahedron bawah
    const octG = new THREE.OctahedronGeometry(3, 0);
    const octW = new THREE.Mesh(octG, new THREE.MeshBasicMaterial({ color: 0x60a5fa, wireframe: true, transparent: true, opacity: 0.12 }));
    const octGrp = new THREE.Group(); octGrp.add(octW);
    octGrp.position.set(4, -7, -4); scene.add(octGrp);
    objects.push({ mesh: octGrp, rx: 0.006, ry: 0.004, rz: 0.005 });

    // DNA Helix
    const helixGrp = new THREE.Group();
    const hm1 = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.2 });
    const hm2 = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.16 });
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * Math.PI * 4;
      const r = 1.4;
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), hm1);
      s1.position.set(Math.cos(t) * r, i * 0.3 - 3.5, Math.sin(t) * r);
      helixGrp.add(s1);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), hm2);
      s2.position.set(Math.cos(t + Math.PI) * r, i * 0.3 - 3.5, Math.sin(t + Math.PI) * r);
      helixGrp.add(s2);
    }
    helixGrp.position.set(-5, 1, -7);
    scene.add(helixGrp);
    objects.push({ mesh: helixGrp, rx: 0.002, ry: 0.007, rz: 0 });

    // Rings
    [[6, -3, -5, Math.PI/3, 0x34d399, 0.15, 3], [-7, 4, -8, Math.PI/5, 0x60a5fa, 0.12, 2.2]].forEach(([x,y,z,rx,col,op,r]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 8, 60), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op }));
      ring.position.set(x, y, z); ring.rotation.x = rx; scene.add(ring);
      objects.push({ mesh: ring, rx: 0.002, ry: 0.006, rz: 0.003 });
    });

    // Small icosahedrons
    [[3,-6,-2,0x34d399],[-4,6,-5,0x60a5fa],[8,-1,-6,0x34d399],[-9,-3,-3,0x60a5fa]].forEach(([x,y,z,col],i) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7+i*0.15, 0), new THREE.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.2 }));
      m.position.set(x,y,z); scene.add(m);
      objects.push({ mesh: m, rx: 0.008+i*0.002, ry: 0.006+i*0.001, rz: 0.004 });
    });

    // Particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200 * 3; i++) pPos[i] = (Math.random() - 0.5) * 50;
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x34d399, size: 0.06, transparent: true, opacity: 0.4 }));
    scene.add(particles);

    let mouseX = 0, mouseY = 0;
    const onMouse = e => { mouseX = (e.clientX/window.innerWidth - 0.5)*2; mouseY = (e.clientY/window.innerHeight - 0.5)*2; };
    window.addEventListener("mousemove", onMouse);
    const onResize = () => { camera.aspect = mount.offsetWidth/mount.offsetHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.offsetWidth, mount.offsetHeight); };
    window.addEventListener("resize", onResize);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      objects.forEach(({ mesh, rx, ry, rz }) => { mesh.rotation.x += rx; mesh.rotation.y += ry; mesh.rotation.z += rz; });
      helixGrp.position.y = 1 + Math.sin(t * 0.5) * 1;
      particles.rotation.y = t * 0.015;
      particles.rotation.x = t * 0.008;
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.025;
      camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.025;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={mountRef} style={{ position:"fixed", inset:0, width:"100vw", height:"100vh", zIndex:0, pointerEvents:"none" }} />;
}

export default function Register() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!role) { setError("Pilih peran kamu dulu (Pelajar atau Guru)."); return; }
    if (!fullName.trim()) { setError("Nama lengkap harus diisi."); return; }
    if (password !== confirm) { setError("Password tidak cocok."); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter."); return; }
    setLoading(true);
    try {
      sessionStorage.setItem("pending_insert", "1");
      const { data: signUpData, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });
      if (error) { sessionStorage.removeItem("pending_insert"); throw error; }
      const authUser = signUpData?.user;
      if (authUser?.id) {
        const { error: insertError } = await supabase.from("User").insert({ email: authUser.email || email, full_name: fullName || (authUser.email||email).split("@")[0], role, auth_id: authUser.id });
        if (insertError && insertError.code !== "23505") { sessionStorage.removeItem("pending_insert"); throw insertError; }
      }
      sessionStorage.removeItem("pending_insert");
      window.location.href = "/";
    } catch (err) { setError(err.message || "Pendaftaran gagal. Coba lagi."); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    if (!role) { setError("Pilih peran kamu dulu sebelum daftar dengan Google."); return; }
    try {
      setError(""); setLoading(true);
      sessionStorage.setItem("pending_role", role);
      if (fullName) sessionStorage.setItem("pending_name", fullName);
      const { error: err } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/choose-role`, queryParams: { access_type: "offline", prompt: "consent" } } });
      if (err) { sessionStorage.removeItem("pending_role"); sessionStorage.removeItem("pending_name"); setError(err.message || "Gagal daftar dengan Google."); setLoading(false); }
    } catch { sessionStorage.removeItem("pending_role"); sessionStorage.removeItem("pending_name"); setError("Terjadi kesalahan. Coba lagi."); setLoading(false); }
  };

  const inp = {
    width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:10, padding:"12px 14px", fontFamily:"Inter,sans-serif", fontSize:14,
    color:"#fff", outline:"none", boxSizing:"border-box", transition:"border 0.2s, box-shadow 0.2s",
  };
  const onF = e => { e.target.style.border="1px solid rgba(52,211,153,0.5)"; e.target.style.boxShadow="0 0 0 3px rgba(52,211,153,0.08)"; };
  const onB = e => { e.target.style.border="1px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow="none"; };

  return (
    <div style={{ minHeight:"100vh", width:"100vw", background:"#020f0a", fontFamily:"Inter,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", boxSizing:"border-box", position:"relative" }}>
      <style>{`
        @keyframes shimmerBar { from{transform:translateX(-100%)} to{transform:translateX(200%)} }
        @keyframes badgePop   { 0%{transform:scale(.7);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes cardIn     { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .reg-input::placeholder { color: rgba(255,255,255,0.25); }
        .reg-input:focus { border:1px solid rgba(52,211,153,0.5)!important; box-shadow:0 0 0 3px rgba(52,211,153,0.08)!important; }
      `}</style>

      <ThreeBG />

      {/* Glassmorphism card */}
      <div style={{
        position:"relative", zIndex:1,
        width:"100%", maxWidth:460,
        background:"rgba(2,15,10,0.75)",
        border:"1px solid rgba(52,211,153,0.15)",
        borderRadius:20,
        backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
        boxShadow:"0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(52,211,153,0.1)",
        padding:"36px 36px 32px",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(24px)",
        transition:"opacity 0.6s ease, transform 0.6s cubic-bezier(.22,1,.36,1)",
      }}>
        {/* Orb glow inside card */}
        <div style={{ position:"absolute", top:-60, right:-60, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,0.1) 0%,transparent 70%)", animation:"orbFloat 5s ease-in-out infinite", pointerEvents:"none" }} />

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:28, position:"relative" }}>
          <div style={{ display:"inline-block", background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:8, padding:"5px 14px", fontSize:9, fontWeight:700, letterSpacing:"3px", color:"#34d399", marginBottom:16, animation:"badgePop 0.6s 0.2s both" }}>
            EDUSPACE
          </div>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"2.5px", textTransform:"uppercase", margin:"0 0 10px" }}>Mulai Sekarang</p>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:32, color:"#fff", margin:"0 0 6px", fontWeight:"normal", lineHeight:1.1 }}>Daftar Akun</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", margin:0 }}>Isi data kamu untuk membuat akun EduSpace</p>
          <div style={{ margin:"16px auto 0", height:2, width:60, background:"rgba(52,211,153,0.2)", borderRadius:2, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.8),transparent)", animation:"shimmerBar 2.2s infinite" }} />
          </div>
        </div>

        <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {error && (
            <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#f87171" }}>
              {error}
            </div>
          )}

          {/* Role */}
          <div>
            <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:10 }}>Saya Adalah</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["student","Pelajar",GraduationCap],["teacher","Guru",BookOpen]].map(([val,lbl,Icon]) => {
                const active = role === val;
                return (
                  <button key={val} type="button" onClick={() => setRole(val)} style={{
                    background: active ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${active ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius:10, padding:"13px 16px",
                    cursor:"pointer", fontFamily:"Inter,sans-serif",
                    display:"flex", alignItems:"center", gap:10,
                    transition:"all 0.2s",
                    boxShadow: active ? "0 2px 12px rgba(52,211,153,0.15)" : "none",
                  }}>
                    <Icon size={18} color={active ? "#34d399" : "rgba(255,255,255,0.35)"} />
                    <span style={{ fontSize:13, color: active ? "#fff" : "rgba(255,255,255,0.45)", fontWeight: active ? 600 : 400 }}>{lbl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nama */}
          <div>
            <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:8 }}>Nama Lengkap</label>
            <input className="reg-input" style={inp} type="text" placeholder="Nama lengkap kamu" value={fullName} onChange={e => setFullName(e.target.value)} required onFocus={onF} onBlur={onB} />
          </div>

          {/* Email */}
          <div>
            <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:8 }}>Email</label>
            <input className="reg-input" style={inp} type="email" placeholder="nama@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required onFocus={onF} onBlur={onB} />
          </div>

          {/* Password */}
          <div>
            <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:8 }}>Password</label>
            <div style={{ position:"relative" }}>
              <input className="reg-input" style={{ ...inp, paddingRight:52 }} type={showPassword?"text":"password"} placeholder="Minimal 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required onFocus={onF} onBlur={onB} />
              <button type="button" onClick={() => setShowPassword(v=>!v)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", fontSize:11, color:"rgba(255,255,255,0.35)", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>{showPassword?"Hide":"Show"}</button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.35)", marginBottom:8 }}>Konfirmasi Password</label>
            <div style={{ position:"relative" }}>
              <input className="reg-input" style={{ ...inp, paddingRight:52 }} type={showConfirm?"text":"password"} placeholder="Ulangi password" value={confirm} onChange={e => setConfirm(e.target.value)} required onFocus={onF} onBlur={onB} />
              <button type="button" onClick={() => setShowConfirm(v=>!v)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", fontSize:11, color:"rgba(255,255,255,0.35)", cursor:"pointer", fontFamily:"Inter,sans-serif" }}>{showConfirm?"Hide":"Show"}</button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width:"100%", background:"linear-gradient(135deg,#059669,#34d399)",
            color:"#022c22", border:"none", borderRadius:10, padding:"13px",
            fontFamily:"Inter,sans-serif", fontSize:11, fontWeight:700,
            letterSpacing:"2px", textTransform:"uppercase", cursor:"pointer",
            marginTop:4, boxShadow:"0 4px 20px rgba(52,211,153,0.25)",
            transition:"transform 0.2s, box-shadow 0.2s",
            opacity: loading ? 0.7 : 1,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(52,211,153,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 20px rgba(52,211,153,0.25)"; }}
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ flex:1, height:"0.5px", background:"rgba(255,255,255,0.08)", display:"block" }} />
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>atau</span>
            <span style={{ flex:1, height:"0.5px", background:"rgba(255,255,255,0.08)", display:"block" }} />
          </div>

          <button type="button" onClick={handleGoogle} disabled={loading} style={{
            width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:10, padding:"12px 14px", fontFamily:"Inter,sans-serif", fontSize:13,
            color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            gap:10, transition:"background 0.2s, border 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.border="1px solid rgba(255,255,255,0.18)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.border="1px solid rgba(255,255,255,0.1)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Lanjutkan dengan Google
          </button>

          <p style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.3)", margin:0 }}>
            Sudah mempunyai akun?{" "}
            <Link to="/login" style={{ color:"#34d399", fontWeight:600, textDecoration:"none" }}>Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
