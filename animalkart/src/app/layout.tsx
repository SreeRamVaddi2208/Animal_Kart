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

import BodyWrapper from "@/components/BodyWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        {/*
          BodyWrapper handles the client-only smooth scroll
          initialisation via dynamic import with ssr:false.
        */}
        <BodyWrapper>
          {children}
        </BodyWrapper>
      </body>
    </html>
  );
}
