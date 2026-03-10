'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck, Users, CreditCard, Warehouse, BarChart3,
  IndianRupee, Package,
} from 'lucide-react';
import DashboardShell, { DashCard } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchAdminUsers, fetchAdminInvoices, fetchAdminDashboardSummary } from '@/lib/api';
import KycTab from './_components/KycTab';
import PaymentsTab from './_components/PaymentsTab';
import WarehousesTab from './_components/WarehousesTab';
import PnlTab from './_components/PnlTab';

type Tab = 'kyc' | 'payments' | 'warehouses' | 'pnl';
const VALID_TABS: Tab[] = ['kyc', 'payments', 'warehouses', 'pnl'];

function AdminDashboardInner() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramTab = searchParams.get('tab') as Tab | null;
  const initialTab: Tab = paramTab && VALID_TABS.includes(paramTab) ? paramTab : 'kyc';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [pendingKyc, setPendingKyc] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [unitsSold, setUnitsSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') router.replace('/');
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    setLoadingStats(true);
    Promise.all([fetchAdminUsers(), fetchAdminInvoices(), fetchAdminDashboardSummary()])
      .then(([users, invoices, summary]) => {
        setPendingKyc(users.filter(u => (u.kyc_status || 'pending') === 'pending').length);
        setPendingPayments(invoices.filter(inv => (inv.payment_state || '').toLowerCase() !== 'paid').length);
        setUnitsSold(summary.units_sold || 0);
        setTotalRevenue(summary.total_revenue || 0);
        setTotalCapacity(summary.total_capacity || 0);
      })
      .catch(() => { })
      .finally(() => setLoadingStats(false));
  }, []);

  /* Persist tab to URL on change */
  const handleTabChange = (next: Tab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'kyc', label: 'KYC Approvals', icon: Users, badge: pendingKyc },
    { key: 'payments', label: 'Payment Approvals', icon: CreditCard, badge: pendingPayments },
    { key: 'warehouses', label: 'Warehouse Mgmt', icon: Warehouse },
    { key: 'pnl', label: 'Profit & Loss', icon: BarChart3 },
  ];

  return (
    <DashboardShell>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(99,102,241,0.3)' }}>
          <ShieldCheck size={26} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>AnimalKart Operations Dashboard — Live Odoo Data</p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <DashCard label="Pending KYC" value={pendingKyc} icon={<Users size={16} />} iconColor="#fbbf24" loading={loadingStats} />
        <DashCard label="Pending Payments" value={pendingPayments} icon={<CreditCard size={16} />} iconColor="#60a5fa" loading={loadingStats} />
        <DashCard label="Units Sold" value={unitsSold.toLocaleString()} icon={<Package size={16} />} iconColor="#34d399" loading={loadingStats} />
        <DashCard label="Total Revenue" value={`₹${(totalRevenue / 10000000).toFixed(2)} Cr`} icon={<IndianRupee size={16} />} iconColor="#c084fc" loading={loadingStats} />
        <DashCard label="Total Capacity" value={`${totalCapacity.toLocaleString()} units`} icon={<Warehouse size={16} />} iconColor="#6ee7b7" loading={loadingStats} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 14, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
                color: active ? '#34d399' : 'rgba(255,255,255,0.5)',
                background: active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.07)',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={15} />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span style={{ background: active ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.2)', color: active ? '#34d399' : '#fbbf24', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 100 }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content — sub-components render their own content */}
      <div style={{ background: 'transparent' }}>
        {tab === 'kyc' && <KycTab />}
        {tab === 'payments' && <PaymentsTab />}
        {tab === 'warehouses' && <WarehousesTab />}
        {tab === 'pnl' && <PnlTab />}
      </div>
    </DashboardShell>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardInner />
    </Suspense>
  );
}
