'use client';

import { useEffect, useRef, useState } from 'react';
import { Gift, Star } from 'lucide-react';
import DashboardShell, { DashCard } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchRewards, type LiveRewards } from '@/lib/api';

/* ─── Milestone definitions ─── */
const MILESTONES = [
  { key: 'checkpoint_30', threshold: 30, label: 'Thailand Trip', sublabel: '1 Person', icon: '✈️', color: '#34d399', glow: 'rgba(52,211,153,0.35)' },
  { key: 'checkpoint_50', threshold: 50, label: 'iPhone Pro Max', sublabel: 'Latest Model', icon: '📱', color: '#60a5fa', glow: 'rgba(96,165,250,0.35)' },
  { key: 'checkpoint_100', threshold: 100, label: 'Ather E-Bike', sublabel: 'Electric', icon: '⚡', color: '#fbbf24', glow: 'rgba(251,191,36,0.35)' },
];

const REWARD_ICONS: Record<string, string> = {
  thailand_1: '✈️', thailand_2: '🌴', silver_thailand: '🥈', thar: '🚙',
};

const CP_META: Record<string, { label: string; icon: string; color: string }> = {
  checkpoint_30: { label: '30 Units — Thailand Trip (1 Person)', icon: '✈️', color: '#34d399' },
  checkpoint_50: { label: '50 Units — Latest iPhone Pro Max', icon: '📱', color: '#60a5fa' },
  checkpoint_100: { label: '100 Units — Ather E-Bike', icon: '⚡', color: '#fbbf24' },
};

/* ─── Animated SVG Ring ─── */
function CircularProgress({
  value, max, color, glow, icon, label, sublabel, reached,
}: {
  value: number; max: number; color: string; glow: string;
  icon: string; label: string; sublabel: string; reached: boolean;
}) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const pct = Math.min(value / max, 1);
  const ref = useRef<SVGCircleElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimated(true); obs.disconnect(); }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const offset = C - (animated ? pct : 0) * C;

  return (
    <div
      style={{
        background: reached ? `${color}0d` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${reached ? color + '33' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 20,
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.4s',
        boxShadow: reached ? `0 0 28px ${glow}` : 'none',
      }}
    >
      {/* Ring */}
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          {/* Progress */}
          <circle
            ref={ref}
            cx="64" cy="64" r={R}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{
              transition: animated ? 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' : 'none',
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        {/* Center icon + pct */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2,
        }}>
          <div style={{ fontSize: 26, lineHeight: 1 }}>{icon}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1 }}>
            {Math.round(pct * 100)}%
          </div>
        </div>
      </div>

      {/* Labels */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{sublabel}</p>
      </div>

      {/* Progress text */}
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
          <span>{value.toFixed(1)} units</span>
          <span>{max} target</span>
        </div>
        {/* Linear bar */}
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${animated ? pct * 100 : 0}%`,
              background: `linear-gradient(90deg, ${color}99, ${color})`,
              borderRadius: 99,
              transition: animated ? 'width 1.2s cubic-bezier(0.4,0,0.2,1) 0.1s' : 'none',
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
      </div>

      {/* Status pill */}
      <div style={{
        fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99,
        color: reached ? color : 'rgba(255,255,255,0.3)',
        background: reached ? `${color}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${reached ? color + '44' : 'rgba(255,255,255,0.07)'}`,
      }}>
        {reached ? '✓ Milestone Reached' : `${(max - value).toFixed(1)} units to go`}
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function RewardsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI skeleton */}
      <div className="ak-glass" style={{ borderRadius: 16, padding: 20, height: 88 }}>
        <div className="shimmer" style={{ height: '100%', borderRadius: 10 }} />
      </div>
      {/* Milestone cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="ak-glass" style={{ borderRadius: 20, padding: 24, height: 290 }}>
            <div className="shimmer" style={{ height: '100%', borderRadius: 10 }} />
          </div>
        ))}
      </div>
      {/* Section skeleton */}
      <div className="ak-glass" style={{ borderRadius: 18, height: 180 }}>
        <div className="shimmer" style={{ height: '100%', borderRadius: 18 }} />
      </div>
    </div>
  );
}

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

  const totalUnits = rewards?.total_units ?? 0;

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>Rewards Programme</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Unlock exclusive rewards based on your purchases and referrals.</p>
      </div>

      {loading ? (
        <RewardsSkeleton />
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : (
        <div className="space-y-6">
          {/* KPI */}
          <DashCard label="Total Units Purchased" value={rewards?.total_units?.toFixed(2) ?? '0.00'} icon={<Gift size={18} />} iconColor="#fbbf24" />

          {/* ─── Milestone Progress Rings ─── */}
          <div>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>Milestone Progress</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Your journey towards 30, 50 & 100 unit milestones</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
              {MILESTONES.map(m => (
                <CircularProgress
                  key={m.key}
                  value={totalUnits}
                  max={m.threshold}
                  color={m.color}
                  glow={m.glow}
                  icon={m.icon}
                  label={m.label}
                  sublabel={m.sublabel}
                  reached={totalUnits >= m.threshold}
                />
              ))}
            </div>
          </div>

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
                    {/* Per-referral milestone progress bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(row.checkpoints).map(([key, cp]) => {
                        const meta = CP_META[key] || { label: key, icon: '🎁', color: '#94a3b8' };
                        const thresh = key === 'checkpoint_30' ? 30 : key === 'checkpoint_50' ? 50 : 100;
                        const pct = Math.min((row.total_units / thresh) * 100, 100);
                        return (
                          <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: cp.reached ? meta.color : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                {meta.icon} {meta.label.split('—')[0].trim()} {cp.claimed ? '(Claimed)' : cp.reached ? '✓' : ''}
                              </span>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{pct.toFixed(0)}%</span>
                            </div>
                            <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${pct}%`,
                                background: cp.reached ? `linear-gradient(90deg, ${meta.color}99, ${meta.color})` : 'rgba(255,255,255,0.12)',
                                borderRadius: 99,
                                transition: 'width 0.8s ease',
                              }} />
                            </div>
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
