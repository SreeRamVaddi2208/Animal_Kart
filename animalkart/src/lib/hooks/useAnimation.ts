'use client';

/**
 * useSafeAnimation — Accessibility-aware animation config selector.
 *
 * Returns the `reducedConfig` (default: {}) when the user has enabled
 * prefers-reduced-motion in their OS, otherwise returns `fullConfig`.
 *
 * Usage:
 *   const variants = useSafeAnimation(fadeUp, { hidden: {}, visible: {} });
 *   <motion.div variants={variants} ... />
 */

import { useReducedMotion } from 'framer-motion';

export function useSafeAnimation<T>(fullConfig: T, reducedConfig: Partial<T> = {}): T {
    const prefersReduced = useReducedMotion();
    return (prefersReduced ? reducedConfig : fullConfig) as T;
}

/**
 * Shared animation variants — used across all dashboard components.
 * Only animates `transform` (y) and `opacity` — both GPU-accelerated.
 * Easing: cubic-bezier(0.16, 1, 0.3, 1) = Expo out — snappy modern feel.
 */
export const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const fadeUpVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: EASE_EXPO },
    },
};

export const staggerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09 } },
};

export const staggerFastVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};

/**
 * Standard viewport configs.
 * `once: true`  → animation fires once and stays; never replays on scroll back
 * `amount: 0.15` → fires when 15% of the element is in view (sections)
 * `amount: 0.08` → fires earlier, for list cards buried further in page
 */
export const VIEWPORT_SECTION = { once: true, amount: 0.15 } as const;
export const VIEWPORT_CARD = { once: true, amount: 0.08 } as const;
