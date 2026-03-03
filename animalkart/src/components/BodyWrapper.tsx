'use client';

import dynamic from "next/dynamic";

const SmoothScrollProviderDirect = dynamic(
    () => import("@/components/SmoothScrollProvider"),
    { ssr: false }
);

export default function BodyWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SmoothScrollProviderDirect>{children}</SmoothScrollProviderDirect>;
}
