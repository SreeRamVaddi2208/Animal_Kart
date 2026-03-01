import type { Metadata } from "next";
import { Geist } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnimalKart - Livestock Investment Platform",
  description: "Invest in premium buffalo and calf units across Andhra Pradesh. Earn commissions through referrals and enjoy exclusive rewards.",
  keywords: "livestock investment, buffalo, calf, Andhra Pradesh, AnimalKart",
};

/**
 * SmoothScrollProvider wrapped with next/dynamic + ssr:false.
 *
 * WHY: Lenis accesses `window` — a browser-only API. If we import it
 * directly in this Server Component, Next.js will try to run it server-side
 * and throw. `ssr: false` ensures it only ever runs in the browser, preventing
 * hydration mismatches and server crashes.
 */
const SmoothScrollProvider = dynamic(
  () => import("@/components/SmoothScrollProvider"),
  { ssr: false }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        {/*
          SmoothScrollProvider activates Lenis (buttery smooth scroll)
          + syncs it with GSAP's ticker for ScrollTrigger compatibility.
          Rendered client-side only — zero impact on SSR/hydration.
        */}
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
