'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useSafeAnimation,
  fadeUpVariants,
  staggerVariants,
  VIEWPORT_SECTION,
} from '@/lib/hooks/useAnimation';

const UNIT_PRICE = 350000;
const DIRECT_PCT = 0.05;
const INDIRECT_PCT = 0.005;
const THAR = 2225000;
const THAILAND = 100000;
const ATHER = 164000;

function fmt(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
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
  return {
    revenue, direct, indirect, totalCommission,
    maxBuyers, investorReward, referrerReward, totalRewards,
    totalPayouts, netRevenue, productionCost, profit, profitPct, breakEven,
  };
}

const SCENARIOS = [
  { label: '₹2 Lakh / unit', cost: 200000, tag: '🟢 Very Safe' },
  { label: '₹2.5 Lakh / unit', cost: 250000, tag: '🟢 Safe' },
  { label: '₹3 Lakh / unit', cost: 300000, tag: '🟡 Thin Margin' },
  { label: '₹3.2 Lakh / unit', cost: 320000, tag: '🔴 Loss Begins' },
];

export default function PnlTab() {
  const [totalUnits, setTotalUnits] = useState(1500);
  const [costPerUnit, setCostPerUnit] = useState(200000);

  const pnl = calcPnL(totalUnits, costPerUnit);
  const isProfit = pnl.profit >= 0;

  // Reduced-motion-aware — a11y users get instant renders
  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerVariants);
  const viewport = VIEWPORT_SECTION;

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-6">

      {/* ── Calculator Inputs ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" /> P&amp;L Calculator
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Unit Price (Fixed)</Label>
            <Input value={fmtINR(UNIT_PRICE)} disabled className="bg-gray-50 font-semibold" />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Total Units Sold</Label>
            <Input
              type="number"
              value={totalUnits}
              onChange={e => setTotalUnits(Math.max(1, parseInt(e.target.value) || 1))}
              className="font-semibold"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Production Cost per Unit (₹)</Label>
            <Input
              type="number"
              value={costPerUnit}
              onChange={e => setCostPerUnit(Math.max(1, parseInt(e.target.value) || 1))}
              className="font-semibold"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Revenue Banner ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden" className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">Total Revenue</p>
        <p className="text-4xl font-black">{fmt(pnl.revenue)}</p>
        <p className="text-indigo-200 text-sm mt-1">
          {totalUnits.toLocaleString()} units × {fmtINR(UNIT_PRICE)}
        </p>
      </motion.div>

      {/* ── 1. Commission Breakdown ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">1️⃣ Direct &amp; Indirect Commission</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Direct Commission (5%)</p>
              <p className="text-xs text-gray-500">
                5% × {fmtINR(UNIT_PRICE)} = {fmtINR(17500)} per unit &nbsp;·&nbsp;
                Equivalent free units = {Math.round(pnl.direct / UNIT_PRICE)}
              </p>
            </div>
            <p className="font-bold text-orange-700 text-right">{fmt(pnl.direct)}</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Indirect Commission (0.5%) — Worst Case</p>
              <p className="text-xs text-gray-500">
                0.5% × {fmtINR(UNIT_PRICE)} = {fmtINR(1750)} per unit
              </p>
            </div>
            <p className="font-bold text-yellow-700 text-right">{fmt(pnl.indirect)}</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-orange-100 rounded-xl border border-orange-200">
            <div>
              <p className="font-bold text-gray-900">Total Commission</p>
              <p className="text-xs text-gray-500">8.25% of total revenue</p>
            </div>
            <p className="font-black text-orange-800 text-lg">{fmt(pnl.totalCommission)}</p>
          </div>
        </div>
      </motion.div>

      {/* ── 2. Rewards Breakdown ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-1">2️⃣ Heavy Reward Scenario — Worst Case</h2>
        <p className="text-xs text-gray-400 mb-4">
          Every 100-unit buyer claims Thar (₹22.25L) + Thailand trip (₹1L). Referrer gets Ather e-bike (₹1.64L).
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Max 100-Unit Buyers</p>
              <p className="text-xs text-gray-500">{totalUnits.toLocaleString()} ÷ 100 = {pnl.maxBuyers} investors</p>
            </div>
            <p className="font-bold text-purple-700">{pnl.maxBuyers} investors</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Investor Rewards (Thar + Thailand)</p>
              <p className="text-xs text-gray-500">{pnl.maxBuyers} × {fmtINR(THAR + THAILAND)} = {fmtINR(THAR + THAILAND)} per investor</p>
            </div>
            <p className="font-bold text-purple-700">{fmt(pnl.investorReward)}</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Referrer Reward (Ather e-bike)</p>
              <p className="text-xs text-gray-500">{pnl.maxBuyers} × {fmtINR(ATHER)}</p>
            </div>
            <p className="font-bold text-purple-700">{fmt(pnl.referrerReward)}</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-100 rounded-xl border border-purple-200">
            <p className="font-bold text-gray-900">Total Rewards Cost</p>
            <p className="font-black text-purple-800 text-lg">{fmt(pnl.totalRewards)}</p>
          </div>
        </div>
      </motion.div>

      {/* ── 3. Total Payouts ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">3️⃣ Total Payouts (Worst Case)</h2>
        <div className="space-y-3">
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-700">Commission</p>
            <p className="font-semibold text-gray-900">{fmt(pnl.totalCommission)}</p>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-700">Rewards</p>
            <p className="font-semibold text-gray-900">{fmt(pnl.totalRewards)}</p>
          </div>
          <div className="flex justify-between p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="font-bold text-gray-900">Total Payouts</p>
            <p className="font-black text-red-700 text-lg">{fmt(pnl.totalPayouts)}</p>
          </div>
        </div>
      </motion.div>

      {/* ── 4. Net Revenue ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">4️⃣ Net Revenue After All Payouts</h2>
        <div className="space-y-3">
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-700">Revenue</p>
            <p className="font-semibold text-gray-900">{fmt(pnl.revenue)}</p>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-700">Minus Payouts</p>
            <p className="font-semibold text-red-600">− {fmt(pnl.totalPayouts)}</p>
          </div>
          <div className="flex justify-between p-4 bg-green-50 rounded-xl border border-green-200">
            <div>
              <p className="font-bold text-gray-900">Company Keeps</p>
              <p className="text-xs text-gray-500">Before production cost</p>
            </div>
            <p className="font-black text-green-700 text-lg">{fmt(pnl.netRevenue)}</p>
          </div>
        </div>
      </motion.div>

      {/* ── 5. Break-Even ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden" className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
        <h2 className="font-bold text-white mb-3">5️⃣ Break-Even Production Cost</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-300 text-xs mb-1">Break-Even Total Cost</p>
            <p className="text-2xl font-black">{fmt(pnl.netRevenue)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-slate-300 text-xs mb-1">Break-Even Cost per Unit</p>
            <p className="text-2xl font-black">{fmt(pnl.breakEven)}</p>
            <p className="text-slate-300 text-xs mt-1">≈ {(pnl.breakEven / 100000).toFixed(2)} Lakh</p>
          </div>
        </div>
        <p className="text-slate-300 text-xs mt-3">
          Safe production cost must be <strong className="text-white">below {fmt(pnl.breakEven)}</strong> per unit.
        </p>
      </motion.div>

      {/* ── 6. Current Scenario Result ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className={`rounded-2xl p-6 border ${isProfit
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
          }`}
      >
        <div className="flex items-center gap-3 mb-4">
          {isProfit
            ? <TrendingUp className="w-6 h-6 text-green-600" />
            : <TrendingDown className="w-6 h-6 text-red-600" />}
          <h2 className={`font-bold text-lg ${isProfit ? 'text-green-800' : 'text-red-800'}`}>
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
            <div key={i} className={`rounded-xl p-3 text-center ${isProfit ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className={`text-xl font-black ${isProfit ? 'text-green-800' : 'text-red-800'}`}>{s.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 7. Scenario Table ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">📊 Profit / Loss Scenarios ({totalUnits.toLocaleString()} units)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-xs text-gray-400 font-medium">Production Cost</th>
                <th className="text-right py-2 pr-4 text-xs text-gray-400 font-medium">Total Cost</th>
                <th className="text-right py-2 pr-4 text-xs text-gray-400 font-medium">Profit / Loss</th>
                <th className="text-right py-2 text-xs text-gray-400 font-medium">%</th>
                <th className="text-right py-2 pl-4 text-xs text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SCENARIOS.map(sc => {
                const s = calcPnL(totalUnits, sc.cost);
                const isP = s.profit >= 0;
                return (
                  <tr key={sc.cost} className={costPerUnit === sc.cost ? 'bg-indigo-50' : ''}>
                    <td className="py-3 pr-4 font-semibold text-gray-900">{sc.label}</td>
                    <td className="py-3 pr-4 text-right text-gray-700">{fmt(s.productionCost)}</td>
                    <td className={`py-3 pr-4 text-right font-bold ${isP ? 'text-green-700' : 'text-red-600'}`}>
                      {isP ? '+' : '−'}{fmt(Math.abs(s.profit))}
                    </td>
                    <td className={`py-3 text-right font-bold ${isP ? 'text-green-700' : 'text-red-600'}`}>
                      {Math.abs(s.profitPct).toFixed(2)}%
                    </td>
                    <td className="py-3 pl-4 text-right text-xs">{sc.tag}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Final Summary ── */}
      <motion.div variants={fadeUp} viewport={viewport} whileInView="visible" initial="hidden" className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h2 className="font-bold text-lg mb-4">🔥 Final Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-green-200 text-xs mb-1">Total Revenue</p>
            <p className="text-2xl font-black">{fmt(pnl.revenue)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-green-200 text-xs mb-1">Worst-Case Payouts</p>
            <p className="text-2xl font-black">{fmt(pnl.totalPayouts)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-green-200 text-xs mb-1">Company Keeps</p>
            <p className="text-2xl font-black">{fmt(pnl.netRevenue)}</p>
          </div>
        </div>
        <div className="mt-4 bg-white/10 rounded-xl p-4 text-sm text-green-100 space-y-1">
          <p>✅ <strong className="text-white">₹2–2.5 Lakh/unit</strong> → Strong profit</p>
          <p>⚠️ <strong className="text-white">₹3 Lakh/unit</strong> → Very risky (thin margin)</p>
          <p>🔴 <strong className="text-white">Above {fmt(Math.round(pnl.breakEven / 1000) * 1000)}/unit</strong> → Loss territory</p>
        </div>
      </motion.div>

    </motion.div>
  );
}
