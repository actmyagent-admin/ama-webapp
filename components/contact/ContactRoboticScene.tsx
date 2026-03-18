"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function ContactRoboticScene() {
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
      // Brighter/shinier gold so the robot pops on any background
      const goldColor   = isDark ? 0xf0c040 : 0xc99004;
      const goldBright  = isDark ? 0xffe066 : 0xf0c040;
      const bgNodeColor = isDark ? 0xb57e04 : 0x9a6c02;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
      camera.position.z = 8;

      // Helpers — higher base opacity so robot is visible without a card bg
      const wireMat = (opacity = 0.78) =>
        new THREE.MeshBasicMaterial({ color: goldColor, wireframe: true, transparent: true, opacity });
      const solidMat = (opacity = 0.95) =>
        new THREE.MeshBasicMaterial({ color: goldBright, transparent: true, opacity });

      // ── Robot Group ───────────────────────────────────────────────
      const robot = new THREE.Group();
      scene.add(robot);

      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.1, 0.44), wireMat(0.6));
      robot.add(body);

      // Chest detail (inner box outline)
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.46), wireMat(0.25));
      chest.position.y = 0.1;
      robot.add(chest);

      // Head group
      const headGroup = new THREE.Group();
      headGroup.position.y = 0.92;
      robot.add(headGroup);

      headGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.56, 0.42), wireMat(0.65)));

      // Eyes
      const eyeGeo = new THREE.SphereGeometry(0.085, 8, 8);
      const leftEyeMat  = solidMat(0.9);
      const rightEyeMat = solidMat(0.9);
      const leftEye  = new THREE.Mesh(eyeGeo, leftEyeMat);
      const rightEye = new THREE.Mesh(eyeGeo, rightEyeMat);
      leftEye.position.set(-0.17, 0.03, 0.22);
      rightEye.position.set(0.17, 0.03, 0.22);
      headGroup.add(leftEye, rightEye);

      // Mouth bar
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.44), wireMat(0.45));
      mouth.position.y = -0.16;
      headGroup.add(mouth);

      // Antenna post
      const antennaPost = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.32, 8), wireMat(0.7));
      antennaPost.position.y = 0.44;
      headGroup.add(antennaPost);

      // Antenna tip
      const antennaTipMat = solidMat(0.85);
      const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), antennaTipMat);
      antennaTip.position.y = 0.64;
      headGroup.add(antennaTip);

      // Arms
      const leftArmGroup  = new THREE.Group();
      const rightArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.66, 0.1, 0);
      rightArmGroup.position.set(0.66, 0.1, 0);
      robot.add(leftArmGroup, rightArmGroup);

      const armGeo = new THREE.BoxGeometry(0.28, 0.76, 0.28);
      const leftArmMesh  = new THREE.Mesh(armGeo, wireMat(0.5));
      const rightArmMesh = new THREE.Mesh(armGeo, wireMat(0.5));
      leftArmMesh.position.y  = -0.38;
      rightArmMesh.position.y = -0.38;
      leftArmGroup.add(leftArmMesh);
      rightArmGroup.add(rightArmMesh);

      // Hand nodes
      const handGeo = new THREE.OctahedronGeometry(0.1, 0);
      const leftHand  = new THREE.Mesh(handGeo, wireMat(0.6));
      const rightHand = new THREE.Mesh(handGeo, wireMat(0.6));
      leftHand.position.y  = -0.82;
      rightHand.position.y = -0.82;
      leftArmGroup.add(leftHand);
      rightArmGroup.add(rightHand);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.3, 0.66, 0.3);
      const leftLeg  = new THREE.Mesh(legGeo, wireMat(0.5));
      const rightLeg = new THREE.Mesh(legGeo, wireMat(0.5));
      leftLeg.position.set(-0.28, -0.88, 0);
      rightLeg.position.set(0.28, -0.88, 0);
      robot.add(leftLeg, rightLeg);

      // Feet
      const footGeo = new THREE.BoxGeometry(0.34, 0.14, 0.4);
      const leftFoot  = new THREE.Mesh(footGeo, wireMat(0.45));
      const rightFoot = new THREE.Mesh(footGeo, wireMat(0.45));
      leftFoot.position.set(-0.28, -1.28, 0.05);
      rightFoot.position.set(0.28, -1.28, 0.05);
      robot.add(leftFoot, rightFoot);

      // ── Orbiting particles ────────────────────────────────────────
      interface Orbiter {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mesh: any;
        radius: number;
        speed: number;
        angle: number;
        yOffset: number;
        tiltX: number;
      }
      const orbiters: Orbiter[] = [];
      for (let i = 0; i < 6; i++) {
        const geo = i % 2 === 0
          ? new THREE.IcosahedronGeometry(0.055 + Math.random() * 0.04, 0)
          : new THREE.OctahedronGeometry(0.05 + Math.random() * 0.04, 0);
        const mat = new THREE.MeshBasicMaterial({
          color: goldColor, wireframe: true, transparent: true,
          opacity: 0.35 + Math.random() * 0.3,
        });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        orbiters.push({
          mesh,
          radius: 1.7 + Math.random() * 0.9,
          speed: 0.25 + Math.random() * 0.35,
          angle: (Math.PI * 2 * i) / 6,
          yOffset: (Math.random() - 0.5) * 0.7,
          tiltX: (Math.random() - 0.5) * 0.6,
        });
      }

      // ── Signal rings (expanding torus) ────────────────────────────
      interface Ring {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mesh: any;
        scale: number;
        maxScale: number;
      }
      const rings: Ring[] = [];
      const spawnRing = () => {
        const geo = new THREE.TorusGeometry(0.14, 0.014, 8, 32);
        const mat = new THREE.MeshBasicMaterial({ color: goldBright, transparent: true, opacity: 0.65 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 1.56 + (robot.position.y || 0), 0);
        mesh.rotation.x = Math.PI / 2;
        scene.add(mesh);
        rings.push({ mesh, scale: 1, maxScale: 7 });
      };

      // ── Background floating nodes ─────────────────────────────────
      const bgNodes: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mesh: any; vx: number; vy: number; rx: number; ry: number; phase: number
      }[] = [];
      for (let i = 0; i < 14; i++) {
        const geo = new THREE.IcosahedronGeometry(0.04 + Math.random() * 0.04, 0);
        const mat = new THREE.MeshBasicMaterial({
          color: bgNodeColor, wireframe: true, transparent: true,
          opacity: 0.08 + Math.random() * 0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 3 - 1,
        );
        scene.add(mesh);
        bgNodes.push({
          mesh,
          vx: (Math.random() - 0.5) * 0.003,
          vy: (Math.random() - 0.5) * 0.002,
          rx: (Math.random() - 0.5) * 0.006,
          ry: (Math.random() - 0.5) * 0.006,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // BG connection lines
      const linesGroup = new THREE.Group();
      scene.add(linesGroup);
      const LINK_THRESHOLD = 3.5;

      const rebuildLines = () => {
        while (linesGroup.children.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const child = linesGroup.children[0] as any;
          child.geometry?.dispose();
          linesGroup.remove(child);
        }
        for (let i = 0; i < bgNodes.length; i++) {
          for (let j = i + 1; j < bgNodes.length; j++) {
            const d = bgNodes[i].mesh.position.distanceTo(bgNodes[j].mesh.position);
            if (d < LINK_THRESHOLD) {
              const pts = [bgNodes[i].mesh.position.clone(), bgNodes[j].mesh.position.clone()];
              const geo = new THREE.BufferGeometry().setFromPoints(pts);
              const mat = new THREE.LineBasicMaterial({
                color: bgNodeColor, transparent: true,
                opacity: 0.07 * (1 - d / LINK_THRESHOLD),
              });
              linesGroup.add(new THREE.Line(geo, mat));
            }
          }
        }
      };
      rebuildLines();

      // ── Animate ───────────────────────────────────────────────────
      let frame = 0;
      let ringTimer = 0;

      const animate = (t: number) => {
        animationId = requestAnimationFrame(animate);
        frame++;

        // Robot float + sway
        robot.position.y = Math.sin(t * 0.0006) * 0.13;
        robot.rotation.y = Math.sin(t * 0.0003) * 0.12;

        // Head look
        headGroup.rotation.y = Math.sin(t * 0.0005) * 0.18;
        headGroup.rotation.z = Math.sin(t * 0.00038) * 0.045;

        // Arms swing
        leftArmGroup.rotation.z  =  Math.sin(t * 0.0007) * 0.22;
        rightArmGroup.rotation.z = -Math.sin(t * 0.0007) * 0.22;

        // Eye pulse
        const eyeAlpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.0018));
        leftEyeMat.opacity  = eyeAlpha;
        rightEyeMat.opacity = eyeAlpha;
        const eyeS = 0.82 + 0.18 * Math.abs(Math.sin(t * 0.0018));
        leftEye.scale.setScalar(eyeS);
        rightEye.scale.setScalar(eyeS);

        // Antenna tip pulse
        antennaTipMat.opacity = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.003));

        // Orbiters
        orbiters.forEach((orb) => {
          orb.angle += orb.speed * 0.014;
          orb.mesh.position.set(
            Math.cos(orb.angle) * orb.radius,
            orb.yOffset + Math.sin(orb.angle * 1.4 + orb.tiltX) * 0.35 + robot.position.y,
            Math.sin(orb.angle) * orb.radius * 0.45,
          );
          orb.mesh.rotation.x += 0.01;
          orb.mesh.rotation.y += 0.009;
        });

        // Signal rings
        ringTimer++;
        if (ringTimer > 95) { ringTimer = 0; spawnRing(); }
        for (let i = rings.length - 1; i >= 0; i--) {
          const ring = rings[i];
          ring.scale += 0.04;
          ring.mesh.scale.setScalar(ring.scale);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ring.mesh.material as any).opacity = 0.6 * (1 - ring.scale / ring.maxScale);
          if (ring.scale >= ring.maxScale) {
            scene.remove(ring.mesh);
            ring.mesh.geometry.dispose();
            rings.splice(i, 1);
          }
        }

        // BG nodes
        bgNodes.forEach((nd) => {
          nd.mesh.position.x += nd.vx;
          nd.mesh.position.y += nd.vy;
          nd.mesh.rotation.x += nd.rx;
          nd.mesh.rotation.y += nd.ry;
          if (Math.abs(nd.mesh.position.x) > 7) nd.vx *= -1;
          if (Math.abs(nd.mesh.position.y) > 4) nd.vy *= -1;
        });

        if (frame % 6 === 0) rebuildLines();
        renderer?.render(scene, camera);
      };
      requestAnimationFrame(animate);

      // Resize
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
      className="w-full h-full"
      aria-hidden="true"
    />
  );
}
