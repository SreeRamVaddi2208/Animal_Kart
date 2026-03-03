'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MiniGlobe() {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const W = 180, H = 180;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.z = 3.5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);

        const geo = new THREE.SphereGeometry(1, 32, 32);
        const mat = new THREE.MeshPhongMaterial({ color: 0x059669, transparent: true, opacity: 0.9 });
        const globe = new THREE.Mesh(geo, mat);
        scene.add(globe);

        const wireGeo = new THREE.SphereGeometry(1.01, 14, 14);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.25 });
        scene.add(new THREE.Mesh(wireGeo, wireMat));

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const dl = new THREE.DirectionalLight(0x34d399, 2);
        dl.position.set(3, 3, 3);
        scene.add(dl);

        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            globe.rotation.y += 0.008;
            renderer.render(scene, camera);
        };
        animate();

        const el = mountRef.current;
        return () => {
            cancelAnimationFrame(frameId);
            renderer.dispose();
            if (el?.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} style={{ width: 180, height: 180 }} />;
}
