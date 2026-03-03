'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Navbar from './Navbar';
import {
    LayoutDashboard, Wallet, Users, Gift, FileText, ShoppingBag,
    ArrowRightLeft, ShieldCheck, Warehouse, BarChart3, CreditCard, Bell,
} from 'lucide-react';

/* ─── role-based nav config ─── */
const NAV_CONFIG = {
    investor: [
        { href: '/dashboard/investor', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/warehouses', label: 'Warehouses', icon: Warehouse },
        { href: '/dashboard/investor/wallet', label: 'Wallet', icon: Wallet },
        { href: '/dashboard/investor/referrals', label: 'Referrals', icon: Users },
        { href: '/dashboard/investor/rewards', label: 'Rewards', icon: Gift },
        { href: '/dashboard/investor/invoices', label: 'Invoices', icon: FileText },
        { href: '/dashboard/investor/orders', label: 'Orders', icon: ShoppingBag },
    ],
    agent: [
        { href: '/dashboard/agent', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/warehouses', label: 'Warehouses', icon: Warehouse },
        { href: '/dashboard/agent/wallet', label: 'Wallet', icon: Wallet },
        { href: '/dashboard/agent/referrals', label: 'Referrals', icon: Users },
        { href: '/dashboard/agent/transfers', label: 'Transfers', icon: ArrowRightLeft },
    ],
    admin: [
        { href: '/dashboard/admin', label: 'Admin Panel', icon: ShieldCheck },
        { href: '/warehouses', label: 'Warehouses', icon: Warehouse },
    ],
};

const ROLE_BADGE = {
    investor: { label: 'Investor', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    agent: { label: 'Agent', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    admin: { label: 'Admin', color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuthStore();

    const role = (user?.role as 'investor' | 'agent' | 'admin') || 'investor';
    const navLinks = NAV_CONFIG[role] ?? NAV_CONFIG.investor;
    const badge = ROLE_BADGE[role] ?? ROLE_BADGE.investor;

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#030d07',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Navbar />

            <div style={{ display: 'flex', flex: 1, paddingTop: 64 }}>
                {/* ── Left Sidebar ── */}
                <aside
                    className="hidden lg:flex flex-col"
                    style={{
                        width: 240,
                        flexShrink: 0,
                        position: 'sticky',
                        top: 64,
                        height: 'calc(100vh - 64px)',
                        background: 'rgba(255,255,255,0.02)',
                        backdropFilter: 'blur(12px)',
                        borderRight: '1px solid rgba(52,211,153,0.1)',
                        padding: '24px 12px',
                        overflowY: 'auto',
                    }}
                >
                    {/* Role badge */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 12,
                            background: badge.bg,
                            border: `1px solid ${badge.color}22`,
                            marginBottom: 24,
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: badge.color,
                                flexShrink: 0,
                                boxShadow: `0 0 6px ${badge.color}`,
                            }}
                        />
                        <div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>Signed in as</div>
                            <div style={{ fontSize: 13, color: badge.color, fontWeight: 700, marginTop: 2 }}>
                                {badge.label}
                            </div>
                        </div>
                    </div>

                    {/* Nav links */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {navLinks.map(link => {
                            const Icon = link.icon;
                            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href) && link.href.split('/').length >= 3);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '10px 14px',
                                        borderRadius: 12,
                                        fontSize: 14,
                                        fontWeight: active ? 600 : 400,
                                        color: active ? '#34d399' : 'rgba(255,255,255,0.55)',
                                        background: active ? 'rgba(52,211,153,0.1)' : 'transparent',
                                        border: active ? '1px solid rgba(52,211,153,0.2)' : '1px solid transparent',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => {
                                        if (!active) {
                                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                                            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!active) {
                                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                                            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
                                        }
                                    }}
                                >
                                    <Icon size={16} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* ── Main content ── */}
                <main
                    style={{
                        flex: 1,
                        padding: '32px 24px',
                        maxWidth: '100%',
                        overflowX: 'hidden',
                        backgroundImage:
                            'linear-gradient(rgba(52,211,153,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.025) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                >
                    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

/* ── Reusable dark stat card ── */
export function DashCard({
    label,
    value,
    icon,
    iconColor = '#34d399',
    loading = false,
    suffix = '',
}: {
    label: string;
    value?: string | number | null;
    icon?: React.ReactNode;
    iconColor?: string;
    loading?: boolean;
    suffix?: string;
}) {
    return (
        <div
            className="ak-glass ak-glass-hover"
            style={{ padding: '20px 20px', borderRadius: 16 }}
        >
            {icon && (
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: `${iconColor}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: iconColor,
                        marginBottom: 12,
                    }}
                >
                    {icon}
                </div>
            )}
            <div style={{ fontSize: 24, fontWeight: 800, color: iconColor, lineHeight: 1 }}>
                {loading ? '—' : value !== null && value !== undefined ? `${value}${suffix}` : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>{label}</div>
        </div>
    );
}

/* ── Dark table wrapper ── */
export function DashTable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`ak-glass ${className}`}
            style={{ borderRadius: 16, overflow: 'hidden' }}
        >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                {children}
            </table>
        </div>
    );
}

export function DashTh({ children }: { children: React.ReactNode }) {
    return (
        <th
            style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: 'rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {children}
        </th>
    );
}

export function DashTd({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <td
            className={className}
            style={{
                padding: '13px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.75)',
                verticalAlign: 'middle',
            }}
        >
            {children}
        </td>
    );
}

/* ── Status badge ── */
export function StatusBadge({ status }: { status: string }) {
    const s = (status || '').toLowerCase();
    let color = '#94a3b8', bg = 'rgba(148,163,184,0.1)';
    if (['approved', 'paid', 'confirmed', 'completed', 'delivered', 'done'].includes(s)) {
        color = '#34d399'; bg = 'rgba(52,211,153,0.12)';
    } else if (['pending', 'not_paid', 'draft'].includes(s)) {
        color = '#fbbf24'; bg = 'rgba(251,191,36,0.12)';
    } else if (['rejected', 'cancelled', 'cancel'].includes(s)) {
        color = '#f87171'; bg = 'rgba(248,113,113,0.12)';
    }
    return (
        <span
            style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 600,
                color,
                background: bg,
                border: `1px solid ${color}33`,
                textTransform: 'capitalize',
            }}
        >
            {status}
        </span>
    );
}
