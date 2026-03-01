'use client';

/**
 * SmoothScrollProvider
 *
 * A thin client-only wrapper that initialises Lenis at the root level.
 * Imported into RootLayout via next/dynamic with ssr:false so it never
 * runs on the server — no window/document access at module level.
 *
 * Place this as a direct child of <body> wrapping {children}.
 */

import { useLenis } from '@/lib/hooks/useLenis';

export default function SmoothScrollProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // Initialises Lenis + GSAP ticker sync inside useEffect (SSR-safe)
    useLenis();

    return <>{children}</>;
}
