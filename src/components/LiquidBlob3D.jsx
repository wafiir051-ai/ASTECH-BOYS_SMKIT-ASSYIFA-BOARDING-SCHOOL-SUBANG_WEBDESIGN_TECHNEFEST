import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * 3D Shape Component (Cinema 4D vibe)
 * Props:
 *  - size: pixel size (default 180)
 *  - shape: "blob" | "crystal" | "torus" (default "blob")
 *  - speed: animation speed multiplier (default 1)
 *  - colors: optional [colorA, colorB, colorC] hex strings
 */
export default function LiquidBlob3D({
  size = 180,
  shape = "blob",
  speed = 1,
  colors = ["#34d399", "#fbbf24", "#ec4899"],
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Geometry per shape
    let geometry;
    let originalPositions = null;
    if (shape === "crystal") {
      geometry = new THREE.OctahedronGeometry(1.4, 0); // diamond facets
    } else if (shape === "torus") {
      geometry = new THREE.TorusKnotGeometry(0.9, 0.32, 128, 16, 2, 3);
    } else {
      geometry = new THREE.IcosahedronGeometry(1.2, 6); // blob (reduced detail)
      originalPositions = geometry.attributes.position.array.slice();
    }

    // Iridescent shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(colors[0]) },
        uColorB: { value: new THREE.Color(colors[1]) },
        uColorC: { value: new THREE.Color(colors[2]) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);

          float t = sin(uTime * 0.5 + vPosition.y * 2.0) * 0.5 + 0.5;
          vec3 col1 = mix(uColorA, uColorB, t);
          vec3 col2 = mix(col1, uColorC, fresnel);

          vec3 light = normalize(vec3(0.5, 1.0, 0.8));
          float spec = pow(max(dot(vNormal, light), 0.0), 16.0);

          vec3 finalColor = col2 + vec3(spec * 0.8);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Noise function (only used for blob)
    function noise3D(x, y, z, t) {
      return (
        Math.sin(x * 2.0 + t) * 0.3 +
        Math.cos(y * 2.5 + t * 0.8) * 0.3 +
        Math.sin(z * 2.0 + t * 1.2) * 0.3
      );
    }

    // Animation — frame rate capped at 30fps for performance
    let frameId;
    let lastTime = 0;
    const FRAME_INTERVAL = 1000 / 30;
    const clock = new THREE.Clock();

    const animate = (now) => {
      frameId = requestAnimationFrame(animate);
      if (now - lastTime < FRAME_INTERVAL) return;
      lastTime = now;

      const elapsed = clock.getElapsedTime() * speed;
      material.uniforms.uTime.value = elapsed;

      // Liquid distortion (blob only)
      if (shape === "blob" && originalPositions) {
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          const ox = originalPositions[i];
          const oy = originalPositions[i + 1];
          const oz = originalPositions[i + 2];
          const dist = noise3D(ox, oy, oz, elapsed * 0.6) * 0.15;
          const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
          positions[i] = ox + (ox / len) * dist;
          positions[i + 1] = oy + (oy / len) * dist;
          positions[i + 2] = oz + (oz / len) * dist;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
      }

      // Rotation
      if (shape === "crystal") {
        mesh.rotation.x = elapsed * 0.3;
        mesh.rotation.y = elapsed * 0.5;
        mesh.rotation.z = elapsed * 0.1;
      } else if (shape === "torus") {
        mesh.rotation.x = elapsed * 0.4;
        mesh.rotation.y = elapsed * 0.3;
      } else {
        mesh.rotation.x = elapsed * 0.15;
        mesh.rotation.y = elapsed * 0.25;
      }

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [size, shape, speed, colors]);

  return (
    <div
      ref={mountRef}
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        filter: "drop-shadow(0 0 30px rgba(251,191,36,0.5)) drop-shadow(0 0 60px rgba(236,72,153,0.3)) drop-shadow(0 0 100px rgba(52,211,153,0.25))",
      }}
    />
  );
}
