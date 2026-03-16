'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, Users, CreditCard, Warehouse, BarChart3,
  IndianRupee, Package, LayoutDashboard, ArrowRight
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
  const currentTab: Tab = paramTab && VALID_TABS.includes(paramTab) ? paramTab : 'kyc';
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

  const navItems = [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/admin?tab=kyc', label: 'KYC Approvals', icon: Users, badge: pendingKyc },
    { href: '/dashboard/admin?tab=payments', label: 'Payment Approvals', icon: CreditCard, badge: pendingPayments },
    { href: '/dashboard/admin?tab=warehouses', label: 'Warehouse Mgmt', icon: Warehouse },
    { href: '/dashboard/admin?tab=pnl', label: 'Profit & Loss', icon: BarChart3 },
  ];

  // If no tab is specified, we check if it is explicitly the overview or defaults to KYC logic.
  // Actually, the user asked to move them all. Let's highlight the exact href.
  const activeHref = paramTab ? `/dashboard/admin?tab=${paramTab}` : '/dashboard/admin';

  return (
    <DashboardShell navItemsOverride={navItems} activeHref={activeHref}>
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



      {/* Tab content — sub-components render their own content */}
      <div style={{ background: 'transparent' }}>
        {!paramTab && (
          <div className="mt-8 space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Operations Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* KYC Summary Card */}
              <Link href="/dashboard/admin?tab=kyc" className="bg-[#0a1811] border border-[#1b3625] rounded-2xl p-6 hover:border-[#34d399] transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center text-[#fbbf24]">
                      <Users size={20} />
                    </div>
                    {pendingKyc > 0 && <span className="bg-[#fbbf24]/20 text-[#fbbf24] text-xs font-bold px-2 py-1 rounded-full">{pendingKyc} Pending</span>}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#34d399] transition-colors">KYC Approvals</h3>
                  <p className="text-sm text-gray-400">Review and verify investor identity documents to enable their accounts for trading.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-[#34d399]">
                  Manage KYC <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Payments Summary Card */}
              <Link href="/dashboard/admin?tab=payments" className="bg-[#0a1811] border border-[#1b3625] rounded-2xl p-6 hover:border-[#34d399] transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#60a5fa]/10 flex items-center justify-center text-[#60a5fa]">
                      <CreditCard size={20} />
                    </div>
                    {pendingPayments > 0 && <span className="bg-[#60a5fa]/20 text-[#60a5fa] text-xs font-bold px-2 py-1 rounded-full">{pendingPayments} Pending</span>}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#34d399] transition-colors">Payment Approvals</h3>
                  <p className="text-sm text-gray-400">Verify manual bank transfers and wire deposits to credit user wallets for unit purchases.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-[#34d399]">
                  Manage Payments <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Warehouses Summary Card */}
              <Link href="/dashboard/admin?tab=warehouses" className="bg-[#0a1811] border border-[#1b3625] rounded-2xl p-6 hover:border-[#34d399] transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#6ee7b7]/10 flex items-center justify-center text-[#6ee7b7]">
                      <Warehouse size={20} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#34d399] transition-colors">Warehouse Management</h3>
                  <p className="text-sm text-gray-400">Sync and track live unit inventory and capacity across all farm locations via Odoo.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-[#34d399]">
                  View Warehouses <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* PnL Summary Card */}
              <Link href="/dashboard/admin?tab=pnl" className="bg-[#0a1811] border border-[#1b3625] rounded-2xl p-6 hover:border-[#34d399] transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#c084fc]/10 flex items-center justify-center text-[#c084fc]">
                      <BarChart3 size={20} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#34d399] transition-colors">Profit & Loss Reporting</h3>
                  <p className="text-sm text-gray-400">Generate PNL reports from Odoo accounting data to track platform revenue and agent commissions.</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-semibold text-[#34d399]">
                  View Reports <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        )}
        {currentTab === 'kyc' && paramTab && <KycTab />}
        {currentTab === 'payments' && paramTab && <PaymentsTab />}
        {currentTab === 'warehouses' && paramTab && <WarehousesTab />}
        {currentTab === 'pnl' && paramTab && <PnlTab />}
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
