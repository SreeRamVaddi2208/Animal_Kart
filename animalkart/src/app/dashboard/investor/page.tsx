'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, FileText, Warehouse, Wallet, Users, Gift } from 'lucide-react';
import DashboardShell, { DashCard } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchHoldings, type LiveHoldings } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

export default function InvestorDashboard() {
  const { user } = useAuthStore();
  const [holdings, setHoldings] = useState<LiveHoldings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) { setLoading(false); setError('Please login to see your holdings.'); return; }
    setLoading(true);
    fetchHoldings(user.email)
      .then(setHoldings)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load holdings'))
      .finally(() => setLoading(false));
  }, [user?.email]);

  const quickLinks = [
    { href: '/warehouses', label: 'Buy Units', icon: ShoppingCart, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    { href: '/dashboard/investor/wallet', label: 'My Wallet', icon: Wallet, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    { href: '/dashboard/investor/referrals', label: 'Referrals', icon: Users, color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
    { href: '/dashboard/investor/rewards', label: 'Rewards', icon: Gift, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    { href: '/dashboard/investor/invoices', label: 'Invoices', icon: FileText, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  ];

  /* ── skeleton while loading ── */
  function DashboardSkeleton() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Quick-nav skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="ak-glass" style={{ borderRadius: 16, height: 88 }}>
              <div className="shimmer" style={{ height: '100%', borderRadius: 16 }} />
            </div>
          ))}
        </div>
        {/* KPI row skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="ak-glass" style={{ borderRadius: 16, height: 88 }}>
              <div className="shimmer" style={{ height: '100%', borderRadius: 16 }} />
            </div>
          ))}
        </div>
        {/* Holdings grid skeleton */}
        <div className="ak-glass" style={{ borderRadius: 18, padding: 24 }}>
          <div className="shimmer" style={{ height: 24, borderRadius: 8, width: 220, marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, height: 100 }}>
                <div className="shimmer" style={{ height: '100%', borderRadius: 14 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell>
      {/* Page header */}
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>
          Welcome back, <span style={{ color: '#34d399' }}>{user?.full_name || 'Investor'}</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
          Live data synced from Odoo — all values reflect real-time activity.
        </p>
      </div>
      {/* ── loading / error / content ── */}
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : (
        <>
          {/* Quick nav cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                  <div
                    className="ak-glass ak-glass-hover"
                    style={{ padding: '18px 14px', borderRadius: 16, textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: link.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: link.color, margin: '0 auto 10px' }}>
                      <Icon size={20} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{link.label}</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <DashCard
              label="Total Units Owned"
              value={holdings ? formatNumber(holdings.total_units) : null}
              icon={<Warehouse size={18} />}
              loading={loading}
            />
            <DashCard
              label="Farm Locations"
              value={holdings ? holdings.per_warehouse.length : null}
              icon={<Warehouse size={18} />}
              iconColor="#60a5fa"
              loading={loading}
            />
            <DashCard
              label="Status"
              value={user?.kyc_status ? user.kyc_status.charAt(0).toUpperCase() + user.kyc_status.slice(1) : 'Unknown'}
              icon={<Warehouse size={18} />}
              iconColor={user?.kyc_status === 'approved' ? '#34d399' : '#fbbf24'}
              loading={false}
            />
          </div>

          {/* Holdings section */}
          <div className="ak-glass" style={{ borderRadius: 18, padding: '24px 24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Unit Holdings by Warehouse</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>Distribution of your units across farm locations</p>
              </div>
            </div>

            {!holdings || holdings.per_warehouse.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', padding: '12px 0' }}>No unit purchases found yet. <Link href="/warehouses" style={{ color: '#34d399' }}>Browse warehouses →</Link></p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {holdings.per_warehouse.map(row => (
                  <div
                    key={`${row.warehouse_id}-${row.warehouse_name}`}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: 14, padding: '16px' }}
                  >
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Warehouse</p>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 10 }}>{row.warehouse_name || 'N/A'}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Units Owned</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>{formatNumber(row.units)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
