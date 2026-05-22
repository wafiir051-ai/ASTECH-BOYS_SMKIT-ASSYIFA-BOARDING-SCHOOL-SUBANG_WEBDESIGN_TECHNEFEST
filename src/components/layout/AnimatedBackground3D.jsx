import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function AnimatedBackground3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(60, mount.offsetWidth / mount.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.offsetWidth, mount.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    camera.position.z = 20;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0x34d399, 1.5);
    dir.position.set(5, 5, 5);
    scene.add(dir);
    const pt1 = new THREE.PointLight(0x60a5fa, 1.2, 60);
    pt1.position.set(-10, 6, 8);
    scene.add(pt1);
    const pt2 = new THREE.PointLight(0x34d399, 0.8, 40);
    pt2.position.set(10, -6, 4);
    scene.add(pt2);

    const objects = [];

    // --- Main icosahedron (bigger, more visible) ---
    const icoG = new THREE.IcosahedronGeometry(4.5, 1);
    const icoW = new THREE.Mesh(icoG, new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.18 }));
    const icoS = new THREE.Mesh(icoG, new THREE.MeshPhongMaterial({ color: 0x064e3b, transparent: true, opacity: 0.08, shininess: 120 }));
    const icoGroup = new THREE.Group();
    icoGroup.add(icoW, icoS);
    icoGroup.position.set(7, 1, -4);
    scene.add(icoGroup);
    objects.push({ mesh: icoGroup, rx: 0.003, ry: 0.006, rz: 0.002 });

    // --- Torus knot (more visible) ---
    const tkG = new THREE.TorusKnotGeometry(2.5, 0.55, 120, 16);
    const tkW = new THREE.Mesh(tkG, new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.16 }));
    const tkS = new THREE.Mesh(tkG, new THREE.MeshPhongMaterial({ color: 0x059669, transparent: true, opacity: 0.07, shininess: 80 }));
    const tkGroup = new THREE.Group();
    tkGroup.add(tkW, tkS);
    tkGroup.position.set(-9, 3, -5);
    scene.add(tkGroup);
    objects.push({ mesh: tkGroup, rx: 0.005, ry: 0.004, rz: 0.006 });

    // --- Octahedron ---
    const octG = new THREE.OctahedronGeometry(3, 0);
    const octW = new THREE.Mesh(octG, new THREE.MeshBasicMaterial({ color: 0x60a5fa, wireframe: true, transparent: true, opacity: 0.14 }));
    const octS = new THREE.Mesh(octG, new THREE.MeshPhongMaterial({ color: 0x1e40af, transparent: true, opacity: 0.06 }));
    const octGroup = new THREE.Group();
    octGroup.add(octW, octS);
    octGroup.position.set(-6, -5, -3);
    scene.add(octGroup);
    objects.push({ mesh: octGroup, rx: 0.007, ry: 0.005, rz: 0.003 });

    // --- DNA Helix ---
    const helixGroup = new THREE.Group();
    const helixMat1 = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.22 });
    const helixMat2 = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.18 });
    const connMat   = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
    for (let i = 0; i < 28; i++) {
      const t = (i / 28) * Math.PI * 4;
      const r = 1.6;
      // strand 1
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), helixMat1);
      s1.position.set(Math.cos(t) * r, i * 0.28 - 3.8, Math.sin(t) * r);
      helixGroup.add(s1);
      // strand 2
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), helixMat2);
      s2.position.set(Math.cos(t + Math.PI) * r, i * 0.28 - 3.8, Math.sin(t + Math.PI) * r);
      helixGroup.add(s2);
      // connectors every 4
      if (i % 4 === 0) {
        const mid = new THREE.Vector3(
          (Math.cos(t) + Math.cos(t + Math.PI)) * r / 2,
          i * 0.28 - 3.8,
          (Math.sin(t) + Math.sin(t + Math.PI)) * r / 2
        );
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, r * 2, 6),
          connMat
        );
        cyl.position.set(mid.x, mid.y, mid.z);
        cyl.rotation.z = Math.PI / 2;
        cyl.rotation.y = t;
        helixGroup.add(cyl);
      }
    }
    helixGroup.position.set(0, 2, -8);
    scene.add(helixGroup);
    objects.push({ mesh: helixGroup, rx: 0.002, ry: 0.008, rz: 0 });

    // --- Node network ---
    const nodeGroup = new THREE.Group();
    const nodePositions = [];
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.25 });
    for (let i = 0; i < 14; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6
      );
      nodePositions.push(pos);
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), nodeMat);
      node.position.copy(pos);
      nodeGroup.add(node);
    }
    // edges between close nodes
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.12 });
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 6) {
          const pts = [nodePositions[i], nodePositions[j]];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          nodeGroup.add(new THREE.Line(lineGeo, edgeMat));
        }
      }
    }
    nodeGroup.position.set(3, -2, -6);
    scene.add(nodeGroup);
    objects.push({ mesh: nodeGroup, rx: 0.001, ry: 0.004, rz: 0.002 });

    // --- Floating rings ---
    const ringConfigs = [
      { pos: [5, -3, -5], rx: Math.PI/3, color: 0x34d399, op: 0.18, r: 3.2 },
      { pos: [-5, 4, -8], rx: Math.PI/5, color: 0x60a5fa, op: 0.14, r: 2.2 },
      { pos: [0, -6, -4], rx: Math.PI/2, color: 0x34d399, op: 0.1,  r: 1.8 },
    ];
    ringConfigs.forEach(({ pos, rx, color, op, r }) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.07, 8, 60),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op })
      );
      ring.position.set(...pos);
      ring.rotation.x = rx;
      scene.add(ring);
      objects.push({ mesh: ring, rx: 0.002, ry: 0.006, rz: 0.003 });
    });

    // --- Small floating icosahedrons ---
    [
      [4, -5, -2, 0x34d399], [-3, 6, -5, 0x60a5fa], [9, -2, -7, 0x34d399],
      [-9, -2, -4, 0x60a5fa], [1, 7, -8, 0x34d399],
    ].forEach(([x, y, z, color], i) => {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.7 + i * 0.18, 0),
        new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.2 })
      );
      m.position.set(x, y, z);
      scene.add(m);
      objects.push({ mesh: m, rx: 0.009 + i * 0.002, ry: 0.007 + i * 0.001, rz: 0.005 });
    });

    // --- Particles ---
    const pGeo = new THREE.BufferGeometry();
    const pCount = 180;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 50;
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0x34d399, size: 0.07, transparent: true, opacity: 0.45,
    }));
    scene.add(particles);

    // Mouse parallax
    let mouseX = 0, mouseY = 0;
    const onMouse = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const onResize = () => {
      camera.aspect = mount.offsetWidth / mount.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.offsetWidth, mount.offsetHeight);
    };
    window.addEventListener("resize", onResize);

    // Animate
    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      objects.forEach(({ mesh, rx, ry, rz }) => {
        mesh.rotation.x += rx;
        mesh.rotation.y += ry;
        mesh.rotation.z += rz;
      });

      // Helix bob
      helixGroup.position.y = 2 + Math.sin(t * 0.5) * 0.8;

      // Node network pulse
      nodeGroup.rotation.y = t * 0.06;

      // Particles drift
      particles.rotation.y = t * 0.018;
      particles.rotation.x = t * 0.009;

      // Camera parallax
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

  return (
    <div ref={mountRef} style={{
      position: "fixed", inset: 0,
      width: "100vw", height: "100vh",
      zIndex: 0, pointerEvents: "none",
    }} />
  );
}
