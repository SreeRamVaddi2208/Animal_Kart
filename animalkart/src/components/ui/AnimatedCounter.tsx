'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
    end: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    decimals?: number;
}

export default function AnimatedCounter({
    end,
    prefix = '',
    suffix = '',
    duration = 2000,
    decimals = 0,
}: AnimatedCounterProps) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const startTime = performance.now();
                    const tick = (now: number) => {
                        const progress = Math.min((now - startTime) / duration, 1);
                        const eased =
                            progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
                        setCount(eased * end);
                        if (progress < 1) requestAnimationFrame(tick);
                        else setCount(end);
                    };
                    requestAnimationFrame(tick);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [end, duration]);

    const fmt = (n: number) =>
        decimals > 0
            ? n.toFixed(decimals)
            : Math.floor(n).toLocaleString('en-IN');

    return (
        <span ref={ref}>
            {prefix}
            {fmt(count)}
            {suffix}
        </span>
    );
}
