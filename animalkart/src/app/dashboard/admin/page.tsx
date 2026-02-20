'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  ShieldCheck, Users, CreditCard, Warehouse, BarChart3,
  IndianRupee, Package,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';
import KycTab from './_components/KycTab';
import PaymentsTab from './_components/PaymentsTab';
import WarehousesTab from './_components/WarehousesTab';
import PnlTab from './_components/PnlTab';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

type Tab = 'kyc' | 'payments' | 'warehouses' | 'pnl';

const UNIT_PRICE  = 350000;
const TOTAL_SOLD  = 1060;
const TOTAL_CAP   = 1800;
const PENDING_KYC = 3;
const PENDING_PAY = 3;

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('kyc');

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'kyc',        label: 'KYC Approvals',       icon: Users,     badge: PENDING_KYC },
    { key: 'payments',   label: 'Payment Approvals',    icon: CreditCard, badge: PENDING_PAY },
    { key: 'warehouses', label: 'Warehouse Management', icon: Warehouse  },
    { key: 'pnl',        label: 'Profit & Loss',        icon: BarChart3  },
  ];

  const summaryCards = [
    { label: 'Pending KYC',      value: String(PENDING_KYC),                  icon: Users,       color: 'text-amber-600',  bg: 'bg-amber-50'  },
    { label: 'Pending Payments', value: String(PENDING_PAY),                  icon: CreditCard,  color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Units Sold',       value: TOTAL_SOLD.toLocaleString(),           icon: Package,     color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'Total Revenue',    value: `₹${((TOTAL_SOLD * UNIT_PRICE) / 10000000).toFixed(2)} Cr`, icon: IndianRupee, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Capacity',   value: TOTAL_CAP.toLocaleString() + ' units', icon: Warehouse,   color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500">AnimalKart Operations Dashboard</p>
            </div>
          </div>
        </motion.div>

        {/* ── Summary Cards ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
        >
          {summaryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-2 flex-wrap mb-6">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        {tab === 'kyc'        && <KycTab />}
        {tab === 'payments'   && <PaymentsTab />}
        {tab === 'warehouses' && <WarehousesTab />}
        {tab === 'pnl'        && <PnlTab />}

      </div>
    </div>
  );
}
