'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import Navbar from './Navbar';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import {
    LayoutDashboard, Wallet, Users, Gift, FileText, ShoppingBag,
    ArrowRightLeft, ShieldCheck, Warehouse, BarChart3, CreditCard,
    Menu, X, ChevronLeft, ChevronRight
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

/* ─── Shared nav link renderer ─── */
function NavLink({ href, label, icon: Icon, active, collapsed, onClick }: {
    href: string; label: string; icon: React.ElementType; active: boolean; collapsed?: boolean; onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            title={collapsed ? label : undefined}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '12px' : '10px 14px',
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
            <Icon size={collapsed ? 20 : 16} />
            {!collapsed && label}
        </Link>
    );
}

function RoleBadge({ badge, collapsed = false }: { badge: typeof ROLE_BADGE[keyof typeof ROLE_BADGE]; collapsed?: boolean }) {
    if (collapsed) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
                borderRadius: 12, background: badge.bg, border: `1px solid ${badge.color}22`, marginBottom: 24,
            }} title={`Signed in as ${badge.label}`}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: badge.color, flexShrink: 0, boxShadow: `0 0 6px ${badge.color}` }} />
            </div>
        );
    }
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 12, background: badge.bg, border: `1px solid ${badge.color}22`, marginBottom: 24,
        }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: badge.color, flexShrink: 0, boxShadow: `0 0 6px ${badge.color}` }} />
            <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>Signed in as</div>
                <div style={{ fontSize: 13, color: badge.color, fontWeight: 700, marginTop: 2 }}>{badge.label}</div>
            </div>
        </div>
    );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const role = (user?.role as 'investor' | 'agent' | 'admin') || 'investor';
    const navLinks = NAV_CONFIG[role] ?? NAV_CONFIG.investor;
    const badge = ROLE_BADGE[role] ?? ROLE_BADGE.investor;

    /* Close drawer on route change */
    useEffect(() => { setDrawerOpen(false); }, [pathname]);

    /* Prevent body scroll when drawer is open */
    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    const isActive = (href: string) =>
        pathname === href || (href !== '/' && pathname.startsWith(href) && href.split('/').length >= 3);

    return (
        <div style={{ minHeight: '100vh', background: '#030a06', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div style={{ display: 'flex', flex: 1, paddingTop: 64 }}>
                {/* ── Desktop Left Sidebar ── */}
                <aside
                    className="hidden lg:flex flex-col relative"
                    style={{
                        width: isCollapsed ? 80 : 240, 
                        flexShrink: 0, position: 'sticky', top: 64,
                        height: 'calc(100vh - 64px)',
                        background: '#0a1811',
                        borderRight: '1px solid #1b3625',
                        padding: isCollapsed ? '24px 8px' : '24px 12px', 
                        overflowY: 'auto',
                        transition: 'width 0.3s ease, padding 0.3s ease',
                    }}
                >
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{
                            position: 'absolute',
                            top: 24,
                            right: isCollapsed ? 'auto' : -12,
                            left: isCollapsed ? '50%' : 'auto',
                            transform: isCollapsed ? 'translateX(-50%)' : 'none',
                            zIndex: 10,
                            background: '#0a1811',
                            border: '1px solid #1b3625',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.7)',
                            opacity: isCollapsed ? 0 : 1, // Only show toggle fully when hovered or expanded. Handled by hover below mostly
                        }}
                        className="hover:text-white hover:bg-[#1b3625] transition-colors"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                    {/* Show expand button when collapsed at the top center nicely */}
                    {isCollapsed && (
                        <button
                          onClick={() => setIsCollapsed(false)}
                          style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid #1b3625',
                              borderRadius: '8px',
                              width: '100%',
                              padding: '8px 0',
                              marginBottom: 16,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'rgba(255,255,255,0.7)',
                          }}
                          className="hover:text-white hover:bg-[#1b3625] transition-colors"
                          title="Expand sidebar"
                        >
                            <ChevronRight size={16} />
                        </button>
                    )}

                    <RoleBadge badge={badge} collapsed={isCollapsed} />
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {navLinks.map(link => (
                            <NavLink key={link.href} href={link.href} label={link.label} icon={link.icon} active={isActive(link.href)} collapsed={isCollapsed} />
                        ))}
                    </nav>
                </aside>

                {/* ── Mobile hamburger button ── */}
                <button
                    className="lg:hidden"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open navigation"
                    style={{
                        position: 'fixed', bottom: 24, left: 20, zIndex: 40,
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#34d399,#059669)',
                        border: 'none', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(52,211,153,0.45)',
                    }}
                >
                    <Menu size={22} color="white" />
                </button>

                {/* ── Mobile Drawer ── */}
                <AnimatePresence>
                    {drawerOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setDrawerOpen(false)}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 45,
                                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                }}
                            />

                            {/* Drawer panel */}
                            <motion.div
                                key="drawer"
                                initial={{ x: -280 }}
                                animate={{ x: 0 }}
                                exit={{ x: -280 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 38 }}
                                style={{
                                    position: 'fixed', top: 0, left: 0, bottom: 0,
                                    width: 260, zIndex: 50,
                                    background: '#060f08',
                                    borderRight: '1px solid rgba(52,211,153,0.15)',
                                    padding: '20px 12px',
                                    display: 'flex', flexDirection: 'column',
                                    overflowY: 'auto',
                                    boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
                                }}
                            >
                                {/* Drawer header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingLeft: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#34d399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ color: 'white', fontWeight: 800, fontSize: 11 }}>AK</span>
                                        </div>
                                        <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>AnimalKart</span>
                                    </div>
                                    <button
                                        onClick={() => setDrawerOpen(false)}
                                        style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <RoleBadge badge={badge} />

                                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {navLinks.map(link => (
                                        <NavLink
                                            key={link.href}
                                            href={link.href}
                                            label={link.label}
                                            icon={link.icon}
                                            active={isActive(link.href)}
                                            onClick={() => setDrawerOpen(false)}
                                        />
                                    ))}
                                </nav>

                                {/* User info at bottom */}
                                {user && (
                                    <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{user.full_name}</p>
                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{user.email}</p>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* ── Main content ── */}
                <main
                    style={{
                        flex: 1,
                        padding: '32px 24px',
                        maxWidth: '100%',
                        overflowX: 'hidden',
                        background: '#030a06',
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
                        width: 40, height: 40, borderRadius: 12,
                        background: `${iconColor}18`, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: iconColor, marginBottom: 12,
                    }}
                >
                    {icon}
                </div>
            )}
            <div style={{ fontSize: 24, fontWeight: 800, color: iconColor, lineHeight: 1 }}>
                {loading
                    ? '—'
                    : value !== null && value !== undefined
                        ? typeof value === 'number'
                            ? <AnimatedCounter end={value} suffix={suffix} />
                            : `${value}${suffix}`
                        : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>{label}</div>
        </div>
    );
}

/* ── Dark table wrapper ── */
export function DashTable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`ak-glass ${className}`} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                {children}
            </table>
        </div>
    );
}

export function DashTh({ children }: { children: React.ReactNode }) {
    return (
        <th style={{
            padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
            {children}
        </th>
    );
}

export function DashTd({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <td className={className} style={{
            padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.75)', verticalAlign: 'middle',
        }}>
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
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 100,
            fontSize: 11, fontWeight: 600, color, background: bg,
            border: `1px solid ${color}33`, textTransform: 'capitalize',
        }}>
            {status}
        </span>
    );
}
