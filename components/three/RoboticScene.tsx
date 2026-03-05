"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface NodeData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mesh: any;
  vx: number;
  vy: number;
  rx: number;
  ry: number;
  phase: number;
}

export function RoboticScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderer: any;
    let resizeObserver: ResizeObserver | undefined;
    let isDestroyed = false;

    import("three").then((THREE) => {
      if (isDestroyed || !canvas) return;

      const isDark = resolvedTheme !== "light";
      const goldColor = isDark ? 0xd4a017 : 0xb57e04;
      const lineColor = isDark ? 0x9a7010 : 0x8a6003;

      // ── Renderer ─────────────────────────────────────────────
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);

      // ── Scene & Camera ────────────────────────────────────────
      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
      camera.position.z = 9;

      // ── Floating robotic nodes ────────────────────────────────
      const nodes: NodeData[] = [];
      const COUNT = 22;

      const matBase = new THREE.MeshBasicMaterial({
        color: goldColor,
        wireframe: true,
        transparent: true,
      });

      for (let i = 0; i < COUNT; i++) {
        const geo =
          i % 3 === 0
            ? new THREE.IcosahedronGeometry(0.07 + Math.random() * 0.06, 0)
            : i % 3 === 1
            ? new THREE.BoxGeometry(0.1, 0.1, 0.1)
            : new THREE.OctahedronGeometry(0.07 + Math.random() * 0.04, 0);

        const mat = matBase.clone();
        mat.opacity = 0.18 + Math.random() * 0.2;

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 3,
        );

        scene.add(mesh);
        nodes.push({
          mesh,
          vx: (Math.random() - 0.5) * 0.004,
          vy: (Math.random() - 0.5) * 0.003,
          rx: (Math.random() - 0.5) * 0.008,
          ry: (Math.random() - 0.5) * 0.008,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // ── Connection lines ──────────────────────────────────────
      const linesGroup = new THREE.Group();
      scene.add(linesGroup);

      const LINK_THRESHOLD = 4.2;

      const rebuildLines = () => {
        while (linesGroup.children.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const child = linesGroup.children[0] as any;
          child.geometry?.dispose();
          linesGroup.remove(child);
        }
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const d = nodes[i].mesh.position.distanceTo(nodes[j].mesh.position);
            if (d < LINK_THRESHOLD) {
              const pts = [
                nodes[i].mesh.position.clone(),
                nodes[j].mesh.position.clone(),
              ];
              const geo = new THREE.BufferGeometry().setFromPoints(pts);
              const mat = new THREE.LineBasicMaterial({
                color: lineColor,
                transparent: true,
                opacity: 0.12 * (1 - d / LINK_THRESHOLD),
              });
              linesGroup.add(new THREE.Line(geo, mat));
            }
          }
        }
      };
      rebuildLines();

      // ── Animate ───────────────────────────────────────────────
      let frame = 0;
      const animate = (t: number) => {
        animationId = requestAnimationFrame(animate);
        frame++;

        nodes.forEach((nd) => {
          nd.mesh.position.x += nd.vx;
          nd.mesh.position.y += nd.vy;
          nd.mesh.rotation.x += nd.rx;
          nd.mesh.rotation.y += nd.ry;

          if (Math.abs(nd.mesh.position.x) > 8) nd.vx *= -1;
          if (Math.abs(nd.mesh.position.y) > 5) nd.vy *= -1;

          // Subtle assembly pulse
          const s = 0.88 + 0.12 * Math.sin(t * 0.0006 + nd.phase);
          nd.mesh.scale.setScalar(s);
        });

        if (frame % 6 === 0) rebuildLines();
        renderer?.render(scene, camera);
      };
      requestAnimationFrame(animate);

      // ── Resize ────────────────────────────────────────────────
      resizeObserver = new ResizeObserver(() => {
        if (!canvas || !renderer) return;
        const nw = canvas.clientWidth;
        const nh = canvas.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh, false);
      });
      resizeObserver.observe(canvas);
    });

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      renderer?.dispose();
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
