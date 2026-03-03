'use client';

import { useEffect, useMemo, useState } from 'react';
import { TrendingDown, TrendingUp, Wallet, RefreshCw } from 'lucide-react';
import DashboardShell, { DashCard } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchWallet, type LiveWallet } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';

export default function AgentWalletPage() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<LiveWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) { setLoading(false); setError('Please login to view your wallet.'); return; }
    setLoading(true);
    fetchWallet(user.email)
      .then(setWallet)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load wallet'))
      .finally(() => setLoading(false));
  }, [user?.email]);

  const transactions = useMemo(() => wallet?.transactions ?? [], [wallet]);

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>Agent Wallet</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Commission earnings and spending — live from Odoo. 1 Coin = ₹1.</p>
      </div>

      {loading ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading wallet from Odoo…
        </div>
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <DashCard label="Wallet Balance (Coins)" value={formatNumber(wallet?.balance ?? 0)} icon={<Wallet size={18} />} />
            <DashCard label="Total Commission Earned" value={formatNumber(wallet?.total_earned ?? 0)} icon={<TrendingUp size={18} />} iconColor="#60a5fa" />
            <DashCard label="Total Spent" value={formatNumber(wallet?.total_spent ?? 0)} icon={<TrendingDown size={18} />} iconColor="#f87171" />
          </div>
          {(wallet?.balance ?? 0) >= 350000 && (
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <p style={{ fontWeight: 700, color: '#34d399', fontSize: 14 }}>Eligible for Free Unit!</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Your wallet balance is ≥ 3,50,000 coins. You can purchase a unit without cash.</p>
              </div>
            </div>
          )}
          <div className="ak-glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16 }}>Commission History</h2>
            </div>
            {transactions.length === 0 ? (
              <div style={{ padding: '24px 20px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No transactions yet. Commissions appear here when your referrals make purchases.</div>
            ) : (
              <div>
                {transactions.map(tx => (
                  <div key={tx.transaction_id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{tx.description}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{formatDate(tx.date)}</p>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: tx.amount >= 0 ? '#34d399' : '#f87171', flexShrink: 0 }}>
                      {tx.amount >= 0 ? '+' : ''}{formatNumber(tx.amount)}
                    </p>
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
