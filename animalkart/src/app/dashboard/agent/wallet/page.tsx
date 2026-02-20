'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';
import { fetchWallet, type LiveWallet } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

export default function AgentWalletPage() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<LiveWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setLoading(false);
        setError('Please login with your registered Odoo email to view wallet.');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchWallet(user.email);
        setWallet(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  const transactions = useMemo(() => wallet?.transactions ?? [], [wallet]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard/agent" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Agent Wallet</h1>
          <p className="text-gray-500 mt-1">Live wallet data synced from Odoo activity.</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-600">Loading wallet...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><Wallet className="w-4 h-4" /> Balance</div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(wallet?.balance ?? 0)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><TrendingUp className="w-4 h-4 text-green-600" /> Earned</div>
                <p className="text-2xl font-bold text-green-700">{formatNumber(wallet?.total_earned ?? 0)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><TrendingDown className="w-4 h-4 text-red-600" /> Spent</div>
                <p className="text-2xl font-bold text-red-700">{formatNumber(wallet?.total_spent ?? 0)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Transaction History</h2>
              </div>
              {transactions.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">No wallet transactions yet.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {transactions.map(tx => (
                    <div key={tx.transaction_id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{tx.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.date)}</p>
                      </div>
                      <p className={`font-bold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatNumber(tx.amount)}
                      </p>
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
