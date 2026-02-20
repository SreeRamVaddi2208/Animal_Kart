'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';
import { fetchReferrals, type LiveReferralsData } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AgentReferralsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<LiveReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setLoading(false);
        setError('Please login with your registered Odoo email to view referrals.');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        setData(await fetchReferrals(user.email));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load referrals');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard/agent" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Referral Dashboard</h1>
          <p className="text-gray-500 mt-1">Live referral performance synced from Odoo orders.</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-600">Loading referrals...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center"><p className="text-2xl font-bold text-gray-900">{data?.total_referrals ?? 0}</p><p className="text-xs text-gray-500">Total Referrals</p></div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center"><p className="text-2xl font-bold text-green-700">{data?.direct_referrals ?? 0}</p><p className="text-xs text-gray-500">Direct</p></div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center"><p className="text-2xl font-bold text-blue-700">{data?.indirect_referrals ?? 0}</p><p className="text-xs text-gray-500">Indirect</p></div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center"><p className="text-xl font-bold text-amber-700">{data?.referral_code || '-'}</p><p className="text-xs text-gray-500">Referral Code</p></div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Referral List</h2>
              </div>
              {items.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">No referral records yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {items.map(ref => (
                    <div key={`${ref.level}-${ref.referral_id}`} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{ref.name}</p>
                        <p className="text-xs text-gray-400">{ref.email || '-'} · Level {ref.level} · {formatDate(ref.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">{ref.units_purchased.toFixed(2)} units</p>
                        <p className="text-xs text-green-600">{formatCurrency(ref.commission_earned)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
