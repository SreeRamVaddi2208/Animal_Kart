'use client';

import Link from 'next/link';
import { ShoppingCart, ArrowRightLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';

export default function AgentDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name || 'Agent'}</h1>
          <p className="text-gray-500 mt-2">
            Demo/mock dashboard data has been removed. Continue with live inventory and order operations only.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/warehouses" className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
              <ShoppingCart className="h-4 w-4" /> Buy Units
            </Link>
            <Link href="/dashboard/agent/transfers" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <ArrowRightLeft className="h-4 w-4" /> Unit Transfers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
