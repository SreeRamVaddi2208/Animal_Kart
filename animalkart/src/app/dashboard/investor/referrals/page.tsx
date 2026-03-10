'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Users, Copy, CheckCircle } from 'lucide-react';
import DashboardShell, { DashCard } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchReferrals, type LiveReferralsData } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

/* ─── Types ─── */
interface RefItem {
  level: number;
  referral_id: number | string;
  name: string;
  email?: string;
  date: string;
  units_purchased: number;
  commission_earned: number;
}

/* ─── Skeleton ─── */
function ReferralSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ak-glass" style={{ borderRadius: 16, height: 90 }}>
        <div className="shimmer" style={{ height: '100%', borderRadius: 16 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="ak-glass" style={{ borderRadius: 16, height: 80 }}>
            <div className="shimmer" style={{ height: '100%', borderRadius: 16 }} />
          </div>
        ))}
      </div>
      <div className="ak-glass" style={{ borderRadius: 18, height: 340 }}>
        <div className="shimmer" style={{ height: '100%', borderRadius: 18 }} />
      </div>
    </div>
  );
}

/* ─── Tree Node ─── */
function TreeNode({
  name, units, commission, level, active, onClick,
}: {
  name: string; units: number; commission: number;
  level: 0 | 1 | 2; active: boolean; onClick: () => void;
}) {
  const color = level === 0 ? '#34d399' : level === 1 ? '#60a5fa' : '#c084fc';
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        cursor: 'pointer', background: 'none', border: 'none', padding: 0,
      }}
    >
      {/* Avatar ring */}
      <div
        style={{
          width: level === 0 ? 56 : level === 1 ? 46 : 38,
          height: level === 0 ? 56 : level === 1 ? 46 : 38,
          borderRadius: '50%',
          background: `${color}18`,
          border: `2px solid ${active ? color : color + '44'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: level === 0 ? 18 : level === 1 ? 15 : 13,
          fontWeight: 800, color,
          transition: 'all 0.2s',
          boxShadow: active ? `0 0 18px ${color}55` : 'none',
        }}
      >
        {initial}
      </div>
      <div style={{ textAlign: 'center', maxWidth: 80 }}>
        <p style={{
          fontSize: level === 0 ? 12 : 10, fontWeight: 700,
          color: active ? 'white' : 'rgba(255,255,255,0.65)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80,
        }}>
          {name.split(' ')[0]}
        </p>
        {level > 0 && (
          <p style={{ fontSize: 9, color: color + 'aa', marginTop: 1 }}>{units.toFixed(1)} u</p>
        )}
      </div>
    </button>
  );
}

/* ─── Tooltip detail panel ─── */
function NodeDetail({ item, onClose }: { item: RefItem; onClose: () => void }) {
  const color = item.level === 1 ? '#60a5fa' : '#c084fc';
  return (
    <div
      style={{
        position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(10,20,15,0.96)', border: `1px solid ${color}44`,
        borderRadius: 14, padding: '14px 18px', zIndex: 10, minWidth: 200,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 14 }}
      >✕</button>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 6 }}>{item.name}</p>
      {item.email && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{item.email}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Level</span>
          <span style={{ color, fontWeight: 700 }}>Level {item.level}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Units</span>
          <span style={{ color: 'white', fontWeight: 700 }}>{item.units_purchased.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Commission</span>
          <span style={{ color: '#34d399', fontWeight: 700 }}>{formatCurrency(item.commission_earned)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Joined</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{formatDate(item.date)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Full Tree Graph ─── */
function ReferralTree({
  items, userName,
}: {
  items: RefItem[];
  userName: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const l1 = useMemo(() => items.filter(i => i.level === 1), [items]);
  const l2ByParent = useMemo(() => {
    // Simple grouping: level-2 referrals are indirect — we can only approximate grouping alphabetically/by index
    const lvl2 = items.filter(i => i.level === 2);
    const perL1 = l1.length;
    const perSlot = perL1 > 0 ? Math.ceil(lvl2.length / perL1) : 0;
    return l1.map((_, idx) => lvl2.slice(idx * perSlot, (idx + 1) * perSlot));
  }, [items, l1]);

  const NODE_W = 92;
  const ROW_GAP = 90;
  const totalL2 = items.filter(i => i.level === 2).length;
  const maxCols = Math.max(l1.length, totalL2);
  const svgW = Math.max(600, maxCols * NODE_W + 80);
  const svgH = 280;

  // Positions for root, L1 nodes, L2 nodes
  const rootX = svgW / 2;
  const rootY = 50;

  const l1Positions = l1.map((_, i) => ({
    x: (svgW / (l1.length + 1)) * (i + 1),
    y: rootY + ROW_GAP,
  }));

  const l2Positions: { x: number; y: number; parentIdx: number }[] = [];
  l1.forEach((_, pi) => {
    const childCount = l2ByParent[pi]?.length ?? 0;
    const parentX = l1Positions[pi]?.x ?? svgW / 2;
    const spread = childCount > 1 ? (childCount - 1) * 70 : 0;
    l2ByParent[pi]?.forEach((_, ci) => {
      l2Positions.push({
        x: parentX - spread / 2 + ci * 70,
        y: rootY + ROW_GAP * 2,
        parentIdx: pi,
      });
    });
  });

  const handleToggle = (id: string) => setActiveId(prev => prev === id ? null : id);

  return (
    <div style={{ overflowX: 'auto', padding: '16px 0' }}>
      <div style={{ position: 'relative', minWidth: svgW, height: svgH + 30 }}>
        {/* SVG lines layer */}
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* Root → L1 lines */}
          {l1Positions.map((pos, i) => (
            <line
              key={`root-l1-${i}`}
              x1={rootX} y1={rootY + 30}
              x2={pos.x} y2={pos.y - 26}
              stroke={`rgba(96,165,250,0.3)`} strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          ))}
          {/* L1 → L2 lines */}
          {l2Positions.map((pos, i) => (
            <line
              key={`l1-l2-${i}`}
              x1={l1Positions[pos.parentIdx]?.x ?? 0}
              y1={(l1Positions[pos.parentIdx]?.y ?? 0) + 26}
              x2={pos.x} y2={pos.y - 22}
              stroke="rgba(192,132,252,0.25)" strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          ))}
        </svg>

        {/* Root node */}
        <div style={{ position: 'absolute', left: rootX, top: rootY, transform: 'translate(-50%,-50%)' }}>
          <TreeNode
            name={userName || 'You'}
            units={0}
            commission={0}
            level={0}
            active={activeId === 'root'}
            onClick={() => handleToggle('root')}
          />
          {/* Level labels */}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 36, whiteSpace: 'nowrap', fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
            You
          </div>
        </div>

        {/* L1 label */}
        {l1.length > 0 && (
          <div style={{ position: 'absolute', right: 12, top: rootY + ROW_GAP - 24, fontSize: 9, color: 'rgba(96,165,250,0.5)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Level 1
          </div>
        )}
        {/* L1 nodes */}
        {l1.map((ref, i) => {
          const pos = l1Positions[i];
          const id = `l1-${ref.referral_id}`;
          return (
            <div key={id} style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)' }}>
              <div style={{ position: 'relative' }}>
                <TreeNode
                  name={ref.name}
                  units={ref.units_purchased}
                  commission={ref.commission_earned}
                  level={1}
                  active={activeId === id}
                  onClick={() => handleToggle(id)}
                />
                {activeId === id && (
                  <NodeDetail item={ref} onClose={() => setActiveId(null)} />
                )}
              </div>
            </div>
          );
        })}

        {/* L2 label */}
        {totalL2 > 0 && (
          <div style={{ position: 'absolute', right: 12, top: rootY + ROW_GAP * 2 - 24, fontSize: 9, color: 'rgba(192,132,252,0.5)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Level 2
          </div>
        )}
        {/* L2 nodes */}
        {l2Positions.map((pos, i) => {
          const flatL2 = items.filter(it => it.level === 2);
          const ref = flatL2[i];
          if (!ref) return null;
          const id = `l2-${ref.referral_id}-${i}`;
          return (
            <div key={id} style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)' }}>
              <div style={{ position: 'relative' }}>
                <TreeNode
                  name={ref.name}
                  units={ref.units_purchased}
                  commission={ref.commission_earned}
                  level={2}
                  active={activeId === id}
                  onClick={() => handleToggle(id)}
                />
                {activeId === id && (
                  <NodeDetail item={ref} onClose={() => setActiveId(null)} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function InvestorReferralsPage() {
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
    if (data?.referral_code) {
      navigator.clipboard.writeText(data.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>Referral Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Track your referral network and commissions live from Odoo.</p>
      </div>

      {loading ? (
        <ReferralSkeleton />
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : (
        <>
          {/* Referral code banner */}
          {data?.referral_code && (
            <div
              style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.12),rgba(16,185,129,0.06))', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
            >
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Your Referral Code</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#34d399', letterSpacing: 3, marginTop: 4 }}>{data.referral_code}</p>
              </div>
              <button
                onClick={handleCopy}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, color: '#34d399', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <DashCard label="Total Referrals" value={data?.total_referrals ?? 0} icon={<Users size={18} />} />
            <DashCard label="Direct (Lvl 1)" value={data?.direct_referrals ?? 0} icon={<Users size={18} />} iconColor="#34d399" />
            <DashCard label="Indirect (Lvl 2)" value={data?.indirect_referrals ?? 0} icon={<Users size={18} />} iconColor="#60a5fa" />
            <DashCard label="Active Code" value={data?.referral_code || '—'} icon={<Users size={18} />} iconColor="#fbbf24" />
          </div>

          {/* Commission info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="ak-glass" style={{ padding: 20, borderRadius: 16, borderLeft: '3px solid #34d399' }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#34d399', marginBottom: 6 }}>Direct Referral Commission</p>
              <p style={{ fontSize: 22, fontWeight: 900 }}>5%</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>₹17,500 per unit on each direct referral purchase</p>
            </div>
            <div className="ak-glass" style={{ padding: 20, borderRadius: 16, borderLeft: '3px solid #60a5fa' }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#60a5fa', marginBottom: 6 }}>Indirect Referral Commission</p>
              <p style={{ fontSize: 22, fontWeight: 900 }}>0.5%</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>₹1,750 per unit on second-level referral purchases</p>
            </div>
          </div>

          {/* ─── Tree Visualizer ─── */}
          <div className="ak-glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 16 }}>Referral Network</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Tap any node to see details · L1 → L2 tree view</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} /> Lvl 1
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc', display: 'inline-block' }} /> Lvl 2
                </span>
              </div>
            </div>
            {items.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
                No referrals yet. Share your code to start growing your network!
              </div>
            ) : (
              <div style={{ padding: '16px 20px' }}>
                <ReferralTree items={items as RefItem[]} userName={user?.full_name || 'You'} />
              </div>
            )}
          </div>

          {/* Flat list (below tree for reference) */}
          {items.length > 0 && (
            <div className="ak-glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ fontWeight: 700, fontSize: 16 }}>Referral List ({items.length})</h2>
              </div>
              <div>
                {items.map(ref => (
                  <div
                    key={`${ref.level}-${ref.referral_id}`}
                    style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                  >
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
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
