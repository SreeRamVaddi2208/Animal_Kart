'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeScene() {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const W = mountRef.current.clientWidth;
        const H = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
        camera.position.set(0, 0, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);

        /* Torus knot */
        const geo1 = new THREE.TorusKnotGeometry(1.2, 0.35, 180, 20);
        const mat1 = new THREE.MeshPhongMaterial({
            color: 0x34d399,
            shininess: 120,
            transparent: true,
            opacity: 0.85,
        });
        const knot = new THREE.Mesh(geo1, mat1);
        scene.add(knot);

        /* Outer wireframe ring */
        const geo2 = new THREE.TorusGeometry(2.2, 0.03, 16, 120);
        const mat2 = new THREE.MeshBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.35 });
        const ring = new THREE.Mesh(geo2, mat2);
        ring.rotation.x = Math.PI / 3;
        scene.add(ring);

        /* Particle field */
        const pCount = 600;
        const pGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount * 3; i++) positions[i] = (Math.random() - 0.5) * 20;
        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pMat = new THREE.PointsMaterial({ color: 0xa7f3d0, size: 0.04, transparent: true, opacity: 0.6 });
        const particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);

        /* Floating small spheres */
        const spheres: THREE.Mesh[] = [];
        for (let i = 0; i < 8; i++) {
            const sg = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 16, 16);
            const sm = new THREE.MeshPhongMaterial({ color: 0x10b981, transparent: true, opacity: 0.7 });
            const sphere = new THREE.Mesh(sg, sm);
            const angle = (i / 8) * Math.PI * 2;
            sphere.position.set(Math.cos(angle) * 2.8, Math.sin(angle) * 2.8, (Math.random() - 0.5));
            sphere.userData['angle'] = angle;
            sphere.userData['speed'] = 0.003 + Math.random() * 0.003;
            scene.add(sphere);
            spheres.push(sphere);
        }

        /* Lights */
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dLight = new THREE.DirectionalLight(0x34d399, 2);
        dLight.position.set(5, 5, 5);
        scene.add(dLight);
        const pLight = new THREE.PointLight(0x6ee7b7, 3, 15);
        pLight.position.set(-3, 2, 2);
        scene.add(pLight);

        let frameId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            knot.rotation.x = t * 0.3;
            knot.rotation.y = t * 0.2;
            ring.rotation.z = t * 0.1;
            particles.rotation.y = t * 0.02;
            spheres.forEach((s) => {
                const d = s.userData as { angle: number; speed: number };
                d.angle += d.speed;
                s.position.x = Math.cos(d.angle) * 2.8;
                s.position.y = Math.sin(d.angle) * 2.8;
                s.position.z = Math.sin(t + d.angle) * 0.5;
            });
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!mountRef.current) return;
            const nW = mountRef.current.clientWidth;
            const nH = mountRef.current.clientHeight;
            camera.aspect = nW / nH;
            camera.updateProjectionMatrix();
            renderer.setSize(nW, nH);
        };
        window.addEventListener('resize', handleResize);

        const el = mountRef.current;
        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (el?.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} className="w-full h-full" />;
}
