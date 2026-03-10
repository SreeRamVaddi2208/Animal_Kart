import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePollingResult {
    lastUpdated: Date | null;
    refresh: () => void;
}

/**
 * Runs `fn()` immediately on mount, then every `interval` ms.
 * Returns the last update time and a manual refresh trigger.
 */
export function usePolling(fn: () => void, interval = 60_000): UsePollingResult {
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const fnRef = useRef(fn);
    fnRef.current = fn;

    const run = useCallback(() => {
        fnRef.current();
        setLastUpdated(new Date());
    }, []);

    useEffect(() => {
        run();
        const id = setInterval(run, interval);
        return () => clearInterval(id);
    }, [run, interval]);

    return { lastUpdated, refresh: run };
}

/**  Returns a human-readable "X seconds/minutes ago" string from a Date. */
export function useTimeSince(date: Date | null): string {
    const [label, setLabel] = useState('');

    useEffect(() => {
        if (!date) { setLabel(''); return; }
        const tick = () => {
            const diff = Math.floor((Date.now() - date.getTime()) / 1000);
            if (diff < 60) setLabel(`${diff}s ago`);
            else setLabel(`${Math.floor(diff / 60)}m ago`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [date]);

    return label;
}
