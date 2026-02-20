'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';
import { fetchRewards, type LiveRewards } from '@/lib/api';

export default function RewardsPage() {
  const { user } = useAuthStore();
  const [rewards, setRewards] = useState<LiveRewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setLoading(false);
        setError('Please login with your registered Odoo email to view rewards.');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        setRewards(await fetchRewards(user.email));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rewards');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard/investor" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
          <p className="text-gray-500 mt-1">Live rewards eligibility from Odoo-linked purchases/referrals.</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-600">Loading rewards...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">{error}</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900">Your Purchased Units</h2>
              <p className="text-2xl font-bold text-green-700 mt-1">{rewards?.total_units?.toFixed(2) || '0.00'}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Purchase Rewards</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {(rewards?.purchase_rewards ?? []).map(item => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-400">Threshold: {item.threshold} units</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.eligible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {item.eligible ? 'Eligible' : 'Locked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Referral Reward Progress</h2>
              </div>
              {(rewards?.referral_rewards?.length ?? 0) === 0 ? (
                <div className="p-6 text-sm text-gray-600">No referral reward progress yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(rewards?.referral_rewards ?? []).map(row => (
                    <div key={row.investor_id} className="p-4">
                      <p className="font-medium text-gray-900 text-sm">{row.investor_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Units: {row.total_units.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
