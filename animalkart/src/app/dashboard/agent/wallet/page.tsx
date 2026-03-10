'use client';

import { useEffect, useMemo, useState } from 'react';
import { TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import DashboardShell, { DashCard } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchWallet, type LiveWallet } from '@/lib/api';
import { formatDate, formatNumber, exportCSV } from '@/lib/utils';

/* ── Skeleton ── */
function WalletSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="ak-glass" style={{ borderRadius: 16, height: 88 }}>
            <div className="shimmer" style={{ height: '100%', borderRadius: 16 }} />
          </div>
        ))}
      </div>
      <div className="ak-glass" style={{ borderRadius: 18, height: 220 }}>
        <div className="shimmer" style={{ height: '100%', borderRadius: 18 }} />
      </div>
      <div className="ak-glass" style={{ borderRadius: 18, height: 260 }}>
        <div className="shimmer" style={{ height: '100%', borderRadius: 18 }} />
      </div>
    </div>
  );
}

/* ── Sparkline Tooltip ── */
function SparkTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,20,15,0.95)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, backdropFilter: 'blur(10px)' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#34d399', fontWeight: 700 }}>₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
    </div>
  );
}

/* ── Tx Icon ── */
function TxIcon({ amount }: { amount: number }) {
  return amount >= 0
    ? <ArrowUpRight size={16} style={{ color: '#34d399' }} />
    : <ArrowDownRight size={16} style={{ color: '#f87171' }} />;
}

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

  /* Sparkline data */
  const sparkData = useMemo(() => {
    const sorted = [...transactions].reverse().slice(0, 30);
    let running = (wallet?.balance ?? 0) - transactions.slice(0, sorted.length).reduce((acc, t) => acc + t.amount, 0);
    return sorted.map(tx => {
      running += tx.amount;
      return { date: formatDate(tx.date), balance: Math.max(running, 0) };
    }).filter((_, i) => i % Math.max(1, Math.floor(sorted.length / 15)) === 0 || i === sorted.length - 1);
  }, [transactions, wallet?.balance]);

  const handleExport = () => {
    exportCSV('agent_commission_history.csv', transactions.map(tx => ({
      'Date': formatDate(tx.date),
      'Description': tx.description,
      'Amount (Coins)': tx.amount,
      'Type': tx.type,
    })));
  };

  return (
    <DashboardShell>
      <div className="mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>Agent Wallet</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Commission earnings and spending — live from Odoo. 1 Coin = ₹1.</p>
        </div>
        {!loading && transactions.length > 0 && (
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, color: '#60a5fa', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            ↓ Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <WalletSkeleton />
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <DashCard label="Wallet Balance (Coins)" value={wallet?.balance ?? 0} icon={<Wallet size={18} />} />
            <DashCard label="Total Commission Earned" value={wallet?.total_earned ?? 0} icon={<TrendingUp size={18} />} iconColor="#60a5fa" />
            <DashCard label="Total Spent" value={wallet?.total_spent ?? 0} icon={<TrendingDown size={18} />} iconColor="#f87171" />
          </div>

          {/* ── Sparkline ── */}
          {sparkData.length > 1 && (
            <div className="ak-glass" style={{ borderRadius: 18, padding: '20px 20px 12px', marginBottom: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Commission Balance History</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Running balance over recent transactions</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={sparkData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="agentWalletGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis hide />
                  <Tooltip content={<SparkTooltip />} />
                  <Area type="monotone" dataKey="balance" stroke="#34d399" strokeWidth={2} fill="url(#agentWalletGrad)" dot={false}
                    activeDot={{ r: 4, fill: '#34d399', stroke: 'rgba(52,211,153,0.3)', strokeWidth: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Eligibility banner */}
          {(wallet?.balance ?? 0) >= 350000 && (
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <p style={{ fontWeight: 700, color: '#34d399', fontSize: 14 }}>Eligible for Free Unit!</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Your wallet balance is ≥ 3,50,000 coins. You can purchase a unit without cash.</p>
              </div>
            </div>
          )}

          {/* Commission History */}
          <div className="ak-glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16 }}>Commission History</h2>
            </div>
            {transactions.length === 0 ? (
              <div style={{ padding: '24px 20px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                No transactions yet. Commissions appear here when your referrals make purchases.
              </div>
            ) : (
              <div>
                {transactions.map(tx => (
                  <div key={tx.transaction_id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: tx.amount >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TxIcon amount={tx.amount} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{tx.description}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{formatDate(tx.date)}</p>
                      </div>
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
