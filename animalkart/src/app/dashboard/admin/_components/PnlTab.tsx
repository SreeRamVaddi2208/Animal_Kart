'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import {
  useSafeAnimation, fadeUpVariants, staggerVariants, VIEWPORT_SECTION,
} from '@/lib/hooks/useAnimation';

/* ── Dark palette ── */
const CARD = 'rgba(255,255,255,0.04)';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const ROW_BG = 'rgba(255,255,255,0.03)';
const TEXT_DIM = 'rgba(255,255,255,0.4)';
const TEXT_MID = 'rgba(255,255,255,0.65)';

/* ── Business constants ── */
const UNIT_PRICE = 350000;
const DIRECT_PCT = 0.05;
const INDIRECT_PCT = 0.005;
const THAR = 2225000;
const THAILAND = 100000;
const ATHER = 164000;

function fmt(n: number) {
  const abs = Math.abs(n); const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(3)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}
function fmtINR(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

function calcPnL(units: number, costPerUnit: number) {
  const revenue = units * UNIT_PRICE;
  const direct = units * UNIT_PRICE * DIRECT_PCT;
  const indirect = units * UNIT_PRICE * INDIRECT_PCT;
  const totalCommission = direct + indirect;
  const maxBuyers = Math.floor(units / 100);
  const investorReward = maxBuyers * (THAR + THAILAND);
  const referrerReward = maxBuyers * ATHER;
  const totalRewards = investorReward + referrerReward;
  const totalPayouts = totalCommission + totalRewards;
  const netRevenue = revenue - totalPayouts;
  const productionCost = units * costPerUnit;
  const profit = netRevenue - productionCost;
  const profitPct = (profit / revenue) * 100;
  const breakEven = netRevenue / units;
  return { revenue, direct, indirect, totalCommission, maxBuyers, investorReward, referrerReward, totalRewards, totalPayouts, netRevenue, productionCost, profit, profitPct, breakEven };
}

const SCENARIOS = [
  { label: '₹2 Lakh / unit', cost: 200000, tag: '🟢 Very Safe' },
  { label: '₹2.5 Lakh / unit', cost: 250000, tag: '🟢 Safe' },
  { label: '₹3 Lakh / unit', cost: 300000, tag: '🟡 Thin Margin' },
  { label: '₹3.2 Lakh / unit', cost: 320000, tag: '🔴 Loss Begins' },
];

/* ── Dark section card wrapper ── */
function DarkCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${CARD_BORDER}`, borderRadius: 16, padding: 24 }}>
      {children}
    </div>
  );
}

/* ── Dark row item ── */
function PnlRow({ label, sub, value, color, border }: { label: string; sub?: string; value: string; color: string; border?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: border ? 'center' : 'flex-start', justifyContent: 'space-between', padding: border ? '16px' : '12px', borderRadius: 12, background: border ? `${color}08` : ROW_BG, border: border ? `1px solid ${color}22` : `1px solid ${CARD_BORDER}` }}>
      <div>
        <p style={{ fontWeight: border ? 800 : 600, color: border ? 'white' : 'rgba(255,255,255,0.8)', fontSize: border ? 14 : 13 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{sub}</p>}
      </div>
      <p style={{ fontWeight: 900, color, fontSize: border ? 18 : 14, textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>{value}</p>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${CARD_BORDER}`, color: 'white', fontSize: 14, fontWeight: 600, outline: 'none' };

export default function PnlTab() {
  const [totalUnits, setTotalUnits] = useState(1500);
  const [costPerUnit, setCostPerUnit] = useState(200000);
  const pnl = calcPnL(totalUnits, costPerUnit);
  const isProfit = pnl.profit >= 0;

  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerVariants);
  const viewport = VIEWPORT_SECTION;

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-6">

      {/* ── Calculator Inputs ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden">
        <DarkCard>
          <h2 style={{ fontWeight: 800, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
            <BarChart3 style={{ width: 18, height: 18, color: '#c084fc' }} /> P&amp;L Calculator
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label style={{ fontSize: 11, color: TEXT_DIM, display: 'block', marginBottom: 6 }}>Unit Price (Fixed)</label>
              <input value={fmtINR(UNIT_PRICE)} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT_DIM, display: 'block', marginBottom: 6 }}>Total Units Sold</label>
              <input type="number" value={totalUnits} onChange={e => setTotalUnits(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: TEXT_DIM, display: 'block', marginBottom: 6 }}>Production Cost per Unit (₹)</label>
              <input type="number" value={costPerUnit} onChange={e => setCostPerUnit(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} />
            </div>
          </div>
        </DarkCard>
      </motion.div>

      {/* ── Revenue Banner ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden">
        <div style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(99,102,241,0.12))', border: '1px solid rgba(192,132,252,0.25)', borderRadius: 16, padding: 24 }}>
          <p style={{ color: 'rgba(192,132,252,0.7)', fontSize: 13, marginBottom: 4 }}>Total Revenue</p>
          <p style={{ fontSize: 40, fontWeight: 900, color: 'white', lineHeight: 1 }}>{fmt(pnl.revenue)}</p>
          <p style={{ color: TEXT_MID, fontSize: 13, marginTop: 6 }}>
            {totalUnits.toLocaleString()} units × {fmtINR(UNIT_PRICE)}
          </p>
        </div>
      </motion.div>

      {/* ── 1. Commission Breakdown ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden">
        <DarkCard>
          <h2 style={{ fontWeight: 800, color: 'white', marginBottom: 16, fontSize: 14 }}>1️⃣ Direct &amp; Indirect Commission</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PnlRow
              label="Direct Commission (5%)"
              sub={`5% × ${fmtINR(UNIT_PRICE)} = ${fmtINR(17500)} per unit · Equiv free units = ${Math.round(pnl.direct / UNIT_PRICE)}`}
              value={fmt(pnl.direct)} color="#fbbf24"
            />
            <PnlRow
              label="Indirect Commission (0.5%) — Worst Case"
              sub={`0.5% × ${fmtINR(UNIT_PRICE)} = ${fmtINR(1750)} per unit`}
              value={fmt(pnl.indirect)} color="#f97316"
            />
            <PnlRow label="Total Commission" sub="8.25% of total revenue" value={fmt(pnl.totalCommission)} color="#fbbf24" border />
          </div>
        </DarkCard>
      </motion.div>

      {/* ── 2. Rewards Breakdown ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden">
        <DarkCard>
          <h2 style={{ fontWeight: 800, color: 'white', marginBottom: 4, fontSize: 14 }}>2️⃣ Heavy Reward Scenario — Worst Case</h2>
          <p style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 16 }}>Every 100-unit buyer claims Thar (₹22.25L) + Thailand trip (₹1L). Referrer gets Ather e-bike (₹1.64L).</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PnlRow label="Max 100-Unit Buyers" sub={`${totalUnits.toLocaleString()} ÷ 100 = ${pnl.maxBuyers} investors`} value={`${pnl.maxBuyers} investors`} color="#c084fc" />
            <PnlRow label="Investor Rewards (Thar + Thailand)" sub={`${pnl.maxBuyers} × ${fmtINR(THAR + THAILAND)}`} value={fmt(pnl.investorReward)} color="#c084fc" />
            <PnlRow label="Referrer Reward (Ather e-bike)" sub={`${pnl.maxBuyers} × ${fmtINR(ATHER)}`} value={fmt(pnl.referrerReward)} color="#c084fc" />
            <PnlRow label="Total Rewards Cost" value={fmt(pnl.totalRewards)} color="#c084fc" border />
          </div>
        </DarkCard>
      </motion.div>

      {/* ── 3. Total Payouts ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden">
        <DarkCard>
          <h2 style={{ fontWeight: 800, color: 'white', marginBottom: 16, fontSize: 14 }}>3️⃣ Total Payouts (Worst Case)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PnlRow label="Commission" value={fmt(pnl.totalCommission)} color="#fbbf24" />
            <PnlRow label="Rewards" value={fmt(pnl.totalRewards)} color="#c084fc" />
            <PnlRow label="Total Payouts" value={fmt(pnl.totalPayouts)} color="#f87171" border />
          </div>
        </DarkCard>
      </motion.div>

      {/* ── 4. Net Revenue ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden">
        <DarkCard>
          <h2 style={{ fontWeight: 800, color: 'white', marginBottom: 16, fontSize: 14 }}>4️⃣ Net Revenue After All Payouts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PnlRow label="Revenue" value={fmt(pnl.revenue)} color="rgba(255,255,255,0.8)" />
            <PnlRow label="Minus Payouts" value={`− ${fmt(pnl.totalPayouts)}`} color="#f87171" />
            <PnlRow label="Company Keeps" sub="Before production cost" value={fmt(pnl.netRevenue)} color="#34d399" border />
          </div>
        </DarkCard>
      </motion.div>

      {/* ── 5. Break-Even ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden">
        <div style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(3,13,7,0.6))', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontWeight: 800, color: 'white', marginBottom: 14, fontSize: 14 }}>5️⃣ Break-Even Production Cost</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Break-Even Total Cost', value: fmt(pnl.netRevenue) },
              { label: 'Break-Even Cost per Unit', value: fmt(pnl.breakEven), sub: `≈ ${(pnl.breakEven / 100000).toFixed(2)} Lakh` },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 11, color: TEXT_MID, marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>{item.value}</p>
                {item.sub && <p style={{ fontSize: 11, color: TEXT_DIM, marginTop: 4 }}>{item.sub}</p>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: TEXT_MID, marginTop: 12 }}>
            Safe production cost must be <strong style={{ color: 'white' }}>below {fmt(pnl.breakEven)}</strong> per unit.
          </p>
        </div>
      </motion.div>

      {/* ── 6. Current Scenario Result ── */}
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
        <div style={{ borderRadius: 16, padding: 24, background: isProfit ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)', border: `1px solid ${isProfit ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            {isProfit ? <TrendingUp style={{ width: 22, height: 22, color: '#34d399' }} /> : <TrendingDown style={{ width: 22, height: 22, color: '#f87171' }} />}
            <h2 style={{ fontWeight: 800, fontSize: 15, color: isProfit ? '#34d399' : '#f87171' }}>
              6️⃣ Current Scenario — {isProfit ? 'Profit' : 'Loss'}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Production Cost/Unit', value: fmtINR(costPerUnit) },
              { label: 'Total Production Cost', value: fmt(pnl.productionCost) },
              { label: isProfit ? 'Profit' : 'Loss', value: fmt(Math.abs(pnl.profit)) },
              { label: isProfit ? 'Profit %' : 'Loss %', value: `${Math.abs(pnl.profitPct).toFixed(2)}%` },
            ].map((s, i) => (
              <div key={i} style={{ borderRadius: 12, padding: 12, textAlign: 'center', background: isProfit ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${isProfit ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: isProfit ? '#34d399' : '#f87171' }}>{s.value}</p>
                <p style={{ fontSize: 11, color: TEXT_MID, marginTop: 3 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── 7. Scenario Table ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden">
        <DarkCard>
          <h2 style={{ fontWeight: 800, color: 'white', marginBottom: 16, fontSize: 14 }}>📊 Profit / Loss Scenarios ({totalUnits.toLocaleString()} units)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                  {['Production Cost', 'Total Cost', 'Profit / Loss', '%', 'Status'].map((h, i) => (
                    <th key={i} style={{ padding: '8px 12px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, fontWeight: 600, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map(sc => {
                  const s = calcPnL(totalUnits, sc.cost);
                  const isP = s.profit >= 0;
                  const isActive = costPerUnit === sc.cost;
                  return (
                    <tr key={sc.cost} style={{ background: isActive ? 'rgba(192,132,252,0.08)' : 'transparent', borderBottom: `1px solid ${CARD_BORDER}` }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'white' }}>{sc.label}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: TEXT_MID }}>{fmt(s.productionCost)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: isP ? '#34d399' : '#f87171' }}>{isP ? '+' : '−'}{fmt(Math.abs(s.profit))}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: isP ? '#34d399' : '#f87171' }}>{Math.abs(s.profitPct).toFixed(2)}%</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: 11 }}>{sc.tag}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DarkCard>
      </motion.div>

      {/* ── Final Summary ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden">
        <div style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.06))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 16, color: 'white', marginBottom: 16 }}>🔥 Final Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Revenue', value: fmt(pnl.revenue) },
              { label: 'Worst-Case Payouts', value: fmt(pnl.totalPayouts) },
              { label: 'Company Keeps', value: fmt(pnl.netRevenue) },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 11, color: TEXT_MID, marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{item.value}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, fontSize: 13, color: TEXT_MID, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p>✅ <strong style={{ color: 'white' }}>₹2–2.5 Lakh/unit</strong> → Strong profit</p>
            <p>⚠️ <strong style={{ color: 'white' }}>₹3 Lakh/unit</strong> → Very risky (thin margin)</p>
            <p>🔴 <strong style={{ color: 'white' }}>Above {fmt(Math.round(pnl.breakEven / 1000) * 1000)}/unit</strong> → Loss territory</p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
