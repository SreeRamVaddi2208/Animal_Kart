'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Gift, Star } from 'lucide-react';
import DashboardShell, { DashCard } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchRewards, type LiveRewards } from '@/lib/api';

const REWARD_ICONS: Record<string, string> = {
  thailand_1: '✈️', thailand_2: '🌴', silver_thailand: '🥈', thar: '🚙',
};
const CP_META: Record<string, { label: string; icon: string; color: string }> = {
  checkpoint_30: { label: '30 Units — Thailand Trip (1 Person)', icon: '✈️', color: '#34d399' },
  checkpoint_50: { label: '50 Units — Latest iPhone Pro Max', icon: '📱', color: '#60a5fa' },
  checkpoint_100: { label: '100 Units — Ather E-Bike', icon: '⚡', color: '#fbbf24' },
};

export default function RewardsPage() {
  const { user } = useAuthStore();
  const [rewards, setRewards] = useState<LiveRewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) { setLoading(false); setError('Please login to view your rewards.'); return; }
    setLoading(true);
    fetchRewards(user.email)
      .then(setRewards)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load rewards'))
      .finally(() => setLoading(false));
  }, [user?.email]);

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>Rewards Programme</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Unlock exclusive rewards based on your purchases and referrals.</p>
      </div>

      {loading ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading from Odoo…
        </div>
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : (
        <div className="space-y-6">
          {/* KPI */}
          <DashCard label="Total Units Purchased" value={rewards?.total_units?.toFixed(2) ?? '0.00'} icon={<Gift size={18} />} iconColor="#fbbf24" />

          {/* Purchase rewards */}
          <div className="ak-glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16 }}>Purchase-Based Rewards</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Buy multiple units in one transaction to unlock</p>
            </div>
            {(rewards?.purchase_rewards ?? []).length === 0 ? (
              <div style={{ padding: '20px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No purchase reward data available.</div>
            ) : (
              <div>
                {(rewards?.purchase_rewards ?? []).map(item => (
                  <div
                    key={item.id}
                    style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: 28, lineHeight: 1 }}>{REWARD_ICONS[item.type] || '🎁'}</div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{item.label}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          {item.threshold} units in one transaction
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
                        color: item.claimed ? '#60a5fa' : item.eligible ? '#34d399' : 'rgba(255,255,255,0.3)',
                        background: item.claimed ? 'rgba(96,165,250,0.12)' : item.eligible ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${item.claimed ? 'rgba(96,165,250,0.25)' : item.eligible ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                        {item.claimed ? 'Claimed' : item.eligible ? 'Eligible ✓' : 'Locked'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referral reward progress */}
          <div className="ak-glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16 }}>Referral Reward Milestones</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Track milestone progress for each of your referred investors</p>
            </div>
            {(rewards?.referral_rewards?.length ?? 0) === 0 ? (
              <div style={{ padding: '20px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No referral reward progress yet.</div>
            ) : (
              <div>
                {(rewards?.referral_rewards ?? []).map(row => (
                  <div key={row.investor_id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{row.investor_name}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Total units: {row.total_units.toFixed(2)}</p>
                      </div>
                      <Star size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.entries(row.checkpoints).map(([key, cp]) => {
                        const meta = CP_META[key] || { label: key, icon: '🎁', color: '#94a3b8' };
                        return (
                          <div
                            key={key}
                            style={{
                              padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                              background: cp.reached ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${cp.reached ? meta.color + '33' : 'rgba(255,255,255,0.08)'}`,
                              color: cp.reached ? meta.color : 'rgba(255,255,255,0.3)',
                            }}
                          >
                            {meta.icon} {meta.label.split('—')[0].trim()} {cp.claimed ? '(Claimed)' : cp.reached ? '✓' : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
