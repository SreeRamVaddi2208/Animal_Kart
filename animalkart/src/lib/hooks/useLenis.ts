'use client';

/**
 * useLenis — App-wide smooth scroll foundation.
 *
 * Rules:
 *  - Init Lenis inside useEffect (SSR-safe — no window at module level)
 *  - Drive Lenis via gsap.ticker so it syncs with GSAP ScrollTrigger
 *  - Full cleanup on unmount: destroy Lenis + remove ticker callback
 *  - lagSmoothing(0) prevents GSAP from throttling during tab switch
 */

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useLenis() {
    useEffect(() => {
        const lenis = new Lenis({
            // lerp: smoothing factor — 0.08 = very smooth, 0.15 = snappier
            lerp: 0.08,
            // Disable on touch devices to preserve native momentum feel
            smoothWheel: true,
            touchMultiplier: 0,
        });

        // Sync Lenis scroll position with GSAP ScrollTrigger each frame
        lenis.on('scroll', ScrollTrigger.update);

        // Drive Lenis through GSAP's ticker (not RAF) so they share the same frame
        const tickerFn = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tickerFn);

        // Prevent GSAP lag smoothing from interfering when tab becomes active again
        gsap.ticker.lagSmoothing(0);

        return () => {
            lenis.destroy();
            gsap.ticker.remove(tickerFn);
        };
    }, []);
}
