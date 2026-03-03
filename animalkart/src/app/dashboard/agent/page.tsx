'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowRightLeft, Wallet, Users, RefreshCw } from 'lucide-react';
import DashboardShell, { DashCard } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchWallet, fetchReferrals } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

export default function AgentDashboard() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [refCount, setRefCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    Promise.all([fetchWallet(user.email), fetchReferrals(user.email)])
      .then(([wallet, refs]) => {
        setBalance(wallet.balance);
        setRefCount(refs.total_referrals);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user?.email]);

  const quickLinks = [
    { href: '/warehouses', label: 'Buy Units for Investors', icon: ShoppingCart, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    { href: '/dashboard/agent/wallet', label: 'My Wallet', icon: Wallet, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    { href: '/dashboard/agent/referrals', label: 'My Referrals', icon: Users, color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
    { href: '/dashboard/agent/transfers', label: 'Unit Transfers', icon: ArrowRightLeft, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  ];

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>
          Welcome back, <span style={{ color: '#34d399' }}>{user?.full_name || 'Agent'}</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
          Agent portal — live data synced from Odoo. Manage your investor referral network.
        </p>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {quickLinks.map(link => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
              <div className="ak-glass ak-glass-hover" style={{ padding: '16px 14px', borderRadius: 16, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: link.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: link.color, margin: '0 auto 10px' }}>
                  <Icon size={20} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{link.label}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <DashCard label="Wallet Balance (Coins)" value={balance !== null ? formatNumber(balance) : null} icon={<Wallet size={18} />} loading={loading} />
        <DashCard label="Total Referrals" value={refCount ?? null} icon={<Users size={18} />} iconColor="#c084fc" loading={loading} />
        <DashCard label="Commission Rate" value="5%" icon={<RefreshCw size={18} />} iconColor="#fbbf24" loading={false} />
      </div>

      {/* Commission info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="ak-glass" style={{ padding: 20, borderRadius: 16, borderLeft: '3px solid #34d399' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#34d399', marginBottom: 6 }}>Direct Referral Earnings</p>
          <p style={{ fontSize: 22, fontWeight: 900 }}>₹17,500 / unit</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>5% commission on each unit purchased by a direct referral</p>
        </div>
        <div className="ak-glass" style={{ padding: 20, borderRadius: 16, borderLeft: '3px solid #60a5fa' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#60a5fa', marginBottom: 6 }}>Indirect Referral Earnings</p>
          <p style={{ fontSize: 22, fontWeight: 900 }}>₹1,750 / unit</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>0.5% commission on second-level referral purchases</p>
        </div>
      </div>
    </DashboardShell>
  );
}
