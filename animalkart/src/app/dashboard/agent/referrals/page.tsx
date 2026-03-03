'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import DashboardShell, { DashCard } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchReferrals, type LiveReferralsData } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AgentReferralsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<LiveReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.email) { setLoading(false); setError('Please login to view your referrals.'); return; }
    setLoading(true);
    fetchReferrals(user.email)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load referrals'))
      .finally(() => setLoading(false));
  }, [user?.email]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const handleCopy = () => {
    if (data?.referral_code) { navigator.clipboard.writeText(data.referral_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>Referral Network</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Your investor referral tree and commission performance — live from Odoo.</p>
      </div>

      {loading ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading from Odoo…
        </div>
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : (
        <>
          {data?.referral_code && (
            <div style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.12),rgba(16,185,129,0.06))', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Your Agent Referral Code</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#34d399', letterSpacing: 3, marginTop: 4 }}>{data.referral_code}</p>
              </div>
              <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, color: '#34d399', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {copied ? <CheckCircle size={15} /> : <Copy size={15} />}{copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <DashCard label="Total Referrals" value={data?.total_referrals ?? 0} icon={<Users size={18} />} />
            <DashCard label="Direct (Lvl 1)" value={data?.direct_referrals ?? 0} icon={<Users size={18} />} iconColor="#34d399" />
            <DashCard label="Indirect (Lvl 2)" value={data?.indirect_referrals ?? 0} icon={<Users size={18} />} iconColor="#60a5fa" />
            <DashCard label="5% Direct Rate" value="₹17,500/unit" icon={<Users size={18} />} iconColor="#fbbf24" />
          </div>
          <div className="ak-glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16 }}>Investor Referral List ({items.length})</h2>
            </div>
            {items.length === 0 ? (
              <div style={{ padding: '24px 20px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No referral records yet. Share your code with potential investors.</div>
            ) : (
              <div>
                {items.map(ref => (
                  <div key={`${ref.level}-${ref.referral_id}`} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{ref.name}</p>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: ref.level === 1 ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)', color: ref.level === 1 ? '#34d399' : '#60a5fa', fontWeight: 600 }}>
                          Level {ref.level}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{ref.email || '—'} · {formatDate(ref.date)}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{ref.units_purchased.toFixed(2)} units</p>
                      <p style={{ fontSize: 12, color: '#34d399', marginTop: 2 }}>{formatCurrency(ref.commission_earned)}</p>
                    </div>
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
