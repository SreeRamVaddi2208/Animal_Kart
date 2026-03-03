'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const el = document.documentElement;
            const total = el.scrollHeight - el.clientHeight;
            setProgress(total > 0 ? el.scrollTop / total : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[60] h-[3px]"
            style={{ background: 'rgba(255,255,255,0.06)' }}
        >
            <div
                style={{
                    width: `${progress * 100}%`,
                    background: 'linear-gradient(90deg, #34d399, #10b981, #059669)',
                    height: '100%',
                    transition: 'width 0.1s linear',
                    boxShadow: '0 0 10px #34d399, 0 0 20px rgba(52,211,153,0.4)',
                }}
            />
        </div>
    );
}
