'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, MapPin, TrendingUp, Shield, Users, Star,
  CheckCircle, Coins, Gift,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RevealCard from '@/components/ui/RevealCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { fetchWarehouseStock } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* ─── static chart data ─── */
const chartData = [
  { m: 'Jan', val: 82000 }, { m: 'Feb', val: 91000 },
  { m: 'Mar', val: 87000 }, { m: 'Apr', val: 105000 },
  { m: 'May', val: 112000 }, { m: 'Jun', val: 125000 },
  { m: 'Jul', val: 119000 }, { m: 'Aug', val: 138000 },
  { m: 'Sep', val: 145000 },
];

/* ─── block card helper ─── */
function SCard({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-[#0a1811] border border-[#1b3625] rounded-2xl ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [stockRows, setStockRows] = useState<Awaited<ReturnType<typeof fetchWarehouseStock>>>([]);
  const [stockLoading, setStockLoading] = useState(true);

  useEffect(() => {
    setStockLoading(true);
    fetchWarehouseStock()
      .then(setStockRows)
      .catch(() => setStockRows([]))
      .finally(() => setStockLoading(false));
  }, []);

  const warehouseSummary = useMemo(() => {
    const map = new Map<number, { id: number; name: string; available_units: number }>();
    for (const row of stockRows) {
      const existing = map.get(row.warehouse_id);
      if (existing) {
        existing.available_units += Number(row.qty_available || 0);
      } else {
        map.set(row.warehouse_id, {
          id: row.warehouse_id,
          name: row.warehouse_name,
          available_units: Number(row.qty_available || 0),
        });
      }
    }
    return Array.from(map.values());
  }, [stockRows]);

  const unitPrice = stockRows[0]?.unit_price ?? null;
  const totalUnits = warehouseSummary.reduce((s, w) => s + w.available_units, 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030a06] text-white">
      <Navbar />

      {/* ═══════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center bg-[#030a06] pt-24 pb-16">
        <div className="w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span
              className="inline-block mb-6 text-xs font-semibold tracking-widest text-[#10b981] bg-[#0a1811] px-6 py-2 border border-[#1b3625] rounded-full"
            >
              🌿 INDIA&apos;S #1 DIGITAL LIVESTOCK INVESTMENT
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mb-8 font-bold leading-tight"
            style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 1.1 }}
          >
            Invest in Premium<br />
            <span className="text-[#10b981]">Buffalo &amp; Calf</span> Units
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg text-gray-400 mb-10 max-w-2xl leading-relaxed"
          >
            Own digital livestock assets with verifiable ownership, real-time health
            tracking, and guaranteed returns from premium dairy operations across Andhra Pradesh.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/register">
              <button
                className="bg-[#10b981] text-[#022c22] font-bold py-4 px-8 rounded-xl hover:bg-[#059669] transition-colors w-full sm:w-auto"
                style={{ fontSize: 16 }}
              >
                Start Investing
              </button>
            </Link>
            <Link href="#how-it-works">
              <button
                className="bg-[#0a1811] text-white font-bold py-4 px-8 rounded-xl border border-[#1b3625] hover:bg-[#112419] transition-colors w-full sm:w-auto"
                style={{ fontSize: 16 }}
              >
                How It Works
              </button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20 max-w-4xl w-full"
          >
            {[
              { val: unitPrice, pre: '₹', suf: '', label: 'Per Unit' },
              { val: totalUnits > 0 ? totalUnits : null, pre: '', suf: '+', label: 'Active Units' },
              { val: warehouseSummary.length > 0 ? warehouseSummary.length : null, pre: '', suf: '', label: 'Farm Locations' },
              { val: 'Live', pre: '', suf: '', label: 'Market Status' },
            ].map(({ val, pre, suf, label }) => (
              <SCard key={label} className="p-5">
                <div className="text-2xl sm:text-3xl font-bold text-[#10b981]">
                  {stockLoading ? '—' : val !== null && typeof val === 'number' ? `${pre}${Number(val).toLocaleString('en-IN')}${suf}` : val}
                </div>
                <div className="text-sm text-gray-400 mt-2">{label}</div>
              </SCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 bg-[#05110a]">
        <div className="max-w-6xl mx-auto">
          <RevealCard>
            <div className="text-center mb-16">
              <span className="text-[#10b981] text-sm font-bold tracking-widest uppercase">Simple Process</span>
              <h2 className="mt-3 text-4xl font-bold">How AnimalKart Works</h2>
              <p className="text-gray-400 mt-4 text-lg">
                Four steps to become a livestock asset investor
              </p>
            </div>
          </RevealCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🔐', step: '01', title: 'Register & KYC', desc: 'Quick onboarding with Aadhaar-based verification. Set up your investor profile in under 5 minutes.' },
              { icon: '🐃', step: '02', title: 'Choose Your Unit', desc: 'Browse premium buffalo & calf units across verified farm locations in Andhra Pradesh.' },
              { icon: '💰', step: '03', title: 'Invest Digitally', desc: 'Secure UPI / NEFT / bank transfer payment. Instant GST invoice issued on WhatsApp & Email.' },
              { icon: '📈', step: '04', title: 'Track & Earn', desc: 'Real-time dashboard tracks your herd, health records, returns, and referral commissions.' },
            ].map((s, i) => (
              <RevealCard key={s.title} delay={i * 0.12}>
                <SCard className="p-8 h-full relative group">
                  <span className="absolute top-6 right-6 text-sm font-bold text-[#1b3625] transition-colors group-hover:text-[#10b981]">{s.step}</span>
                  <div className="text-4xl mb-6">{s.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{s.desc}</p>
                </SCard>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          WAREHOUSES / FARM LOCATIONS
      ═══════════════════════════════════════════════════ */}
      <section id="warehouses" className="py-24 px-6 bg-[#030a06]">
        <div className="max-w-7xl mx-auto">
          <RevealCard>
            <div className="text-center mb-16">
              <span className="text-[#10b981] text-sm font-bold tracking-widest uppercase">
                {warehouseSummary.length || 4} Locations
              </span>
              <h2 className="mt-3 text-4xl font-bold">Our Farm Warehouses</h2>
              <p className="text-gray-400 mt-4 text-lg">
                Premium livestock farms across Andhra Pradesh with real-time unit availability
              </p>
            </div>
          </RevealCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {(warehouseSummary.length > 0 ? warehouseSummary : [
              { id: 1, name: 'Kurnool Farm', available_units: 320 },
              { id: 2, name: 'Vijayawada Hub', available_units: 215 },
              { id: 3, name: 'Guntur Ranch', available_units: 410 },
              { id: 4, name: 'Kakinada Base', available_units: 280 },
            ]).map((w, i) => (
              <RevealCard key={w.id} delay={i * 0.12}>
                <SCard className="overflow-hidden">
                  <div className="h-1 w-full bg-[#10b981]" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{w.name}</h3>
                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                          <MapPin size={14} /> <span>Andhra Pradesh</span>
                        </div>
                      </div>
                      <span className="bg-[#10b981] text-[#022c22] text-xs font-bold px-3 py-1 rounded-full">Active</span>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Available</span>
                        <span className="font-bold text-[#10b981]">{formatNumber(w.available_units)}</span>
                      </div>
                    </div>
                    <Link href="/auth/register">
                      <button className="w-full bg-[#0a1811] hover:bg-[#10b981] hover:text-[#022c22] border border-[#1b3625] hover:border-[#10b981] text-[#10b981] rounded-xl py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        Invest Now <ArrowRight size={16} />
                      </button>
                    </Link>
                  </div>
                </SCard>
              </RevealCard>
            ))}
          </div>

          {/* Mini portfolio chart */}
          <RevealCard>
            <SCard className="p-8 max-w-4xl mx-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-xl font-bold">Portfolio Growth Trend</div>
                  <div className="text-gray-400 text-sm mt-1">Last 9 months</div>
                </div>
                <span className="text-[#10b981] font-bold text-lg">+57.3%</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData}>
                  <XAxis dataKey="m" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#0a1811', border: '1px solid #1b3625', borderRadius: 12, color: 'white' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(v: number | undefined) => [`₹${(v ?? 0).toLocaleString('en-IN')}`, 'Value']}
                  />
                  <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.1}
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </SCard>
          </RevealCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          REFERRAL SYSTEM
      ═══════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#05110a]">
        <div className="max-w-7xl mx-auto">
          <RevealCard>
            <div className="text-center mb-16">
              <span className="text-[#10b981] text-sm font-bold tracking-widest uppercase">Earn More</span>
              <h2 className="mt-3 text-4xl font-bold">Powerful Referral System</h2>
              <p className="text-gray-400 mt-4 text-lg">Two-level referral chain — earn commissions on every successful investor you bring in.</p>
            </div>
          </RevealCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              {[
                { icon: <Users size={24} />, iconColor: '#10b981', bg: '#0a1811', border: '#1b3625', title: 'Direct Referral — 5% Commission', desc: `Earn ₹17,500 per unit when your directly referred investor makes a purchase.` },
                { icon: <TrendingUp size={24} />, iconColor: '#3b82f6', bg: '#0a1811', border: '#172554', title: 'Indirect Referral — 0.5% Commission', desc: `Earn ₹1,750 per unit when your referral's own referral makes a purchase.` },
                { icon: <Coins size={24} />, iconColor: '#eab308', bg: '#0a1811', border: '#422006', title: 'Wallet System (1 Coin = ₹1)', desc: 'Commissions credited as coins. Use 3,50,000 coins to purchase a unit for yourself.' },
              ].map((item, i) => (
                <RevealCard key={i} delay={i * 0.12}>
                  <SCard className="p-6 flex items-start gap-5">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: item.bg, color: item.iconColor, borderColor: item.border }}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">{item.desc}</p>
                    </div>
                  </SCard>
                </RevealCard>
              ))}
            </div>

            <RevealCard delay={0.2}>
              <SCard className="p-8">
                <h3 className="font-bold text-xl mb-6">Referral Chain Example</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Investor D', action: 'Buys 1 Unit (₹3,50,000)', color: '#0a1811', borderColor: '#1b3625', textColor: 'white' },
                    { name: 'Investor C — Direct Referrer', action: '5% = ₹17,500 credited', color: '#064e3b', borderColor: '#065f46', textColor: '#34d399' },
                    { name: 'Investor B — Indirect Referrer', action: '0.5% = ₹1,750 credited', color: '#1e3a8a', borderColor: '#1e40af', textColor: '#60a5fa' },
                    { name: 'Investor A', action: 'No commission (beyond 2 levels)', color: '#18181b', borderColor: '#27272a', textColor: '#71717a' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl p-4 border" style={{ backgroundColor: item.color, borderColor: item.borderColor }}>
                      <p className="font-bold text-sm" style={{ color: item.textColor }}>{item.name}</p>
                      <p className="text-sm mt-1" style={{ color: item.textColor, opacity: 0.8 }}>{item.action}</p>
                    </div>
                  ))}
                </div>
              </SCard>
            </RevealCard>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          REWARDS
      ═══════════════════════════════════════════════════ */}
      <section id="rewards" className="py-24 px-6 bg-[#030a06]">
        <div className="max-w-7xl mx-auto">
          <RevealCard>
            <div className="text-center mb-16">
              <span className="text-[#eab308] text-sm font-bold tracking-widest uppercase">Exclusive Rewards</span>
              <h2 className="mt-3 text-4xl font-bold">Purchase-Based Rewards</h2>
              <p className="text-gray-400 mt-4 text-lg">Buy more units in a single transaction and unlock incredible rewards</p>
            </div>
          </RevealCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { units: 5, reward: 'Thailand Trip for 1 Person', emoji: '✈️', color: '#1e40af' },
              { units: 10, reward: 'Thailand Trip for 2 Persons', emoji: '🌴', color: '#86198f' },
              { units: 50, reward: '1kg Silver + Thailand Trip', emoji: '🥈', color: '#374151' },
              { units: 100, reward: 'Mahindra Thar Roxx 4x4', emoji: '🚙', color: '#b45309' },
            ].map((item, i) => (
              <RevealCard key={i} delay={i * 0.12}>
                <SCard className="overflow-hidden">
                  <div className="py-10 px-6 text-center" style={{ backgroundColor: item.color }}>
                    <div className="text-5xl mb-4">{item.emoji}</div>
                    <div className="text-4xl font-black">{item.units}</div>
                    <div className="text-sm opacity-80 mt-1">units at once</div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-base">{item.reward}</h3>
                    <p className="text-sm text-gray-500 mt-2">Single transaction</p>
                  </div>
                </SCard>
              </RevealCard>
            ))}
          </div>

          {/* Referral milestones */}
          <RevealCard delay={0.1}>
            <SCard className="p-10 border-[#10b981] bg-[#022c22]">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold mb-3">Referral-Based Rewards</h3>
                <p className="text-gray-300 text-lg">Earn rewards when your referred investors reach milestones</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { checkpoint: '30 Units', reward: 'Thailand Trip (1 Person)', icon: '✈️' },
                  { checkpoint: '50 Units', reward: 'Latest iPhone Pro Max', icon: '📱' },
                  { checkpoint: '100 Units', reward: 'Ather E-Bike', icon: '⚡' },
                ].map((item, i) => (
                  <div key={i} className="bg-[#0a1811] rounded-2xl p-8 text-center border border-[#1b3625]">
                    <div className="text-5xl mb-4">{item.icon}</div>
                    <div className="text-[#10b981] text-sm font-bold mb-2">Referred investor buys</div>
                    <div className="text-2xl font-black mb-3">{item.checkpoint}</div>
                    <div className="text-gray-300">{item.reward}</div>
                  </div>
                ))}
              </div>
              <p className="text-center mt-8 text-gray-400 text-sm">
                * At each checkpoint, choose between the reward OR equivalent cash commission
              </p>
            </SCard>
          </RevealCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          WHY ANIMALKART
      ═══════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#05110a]">
        <div className="max-w-6xl mx-auto">
          <RevealCard>
            <div className="text-center mb-16">
              <span className="text-[#10b981] text-sm font-bold tracking-widest uppercase">Why Choose Us</span>
              <h2 className="mt-3 text-4xl font-bold">Why AnimalKart?</h2>
            </div>
          </RevealCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Shield size={24} />, c: '#10b981', bg: '#064e3b', title: 'Secure Investment', desc: 'KYC-verified platform with admin-approved payments and GST-compliant invoices.' },
              { icon: <TrendingUp size={24} />, c: '#3b82f6', bg: '#1e3a8a', title: 'High Returns', desc: 'Earn up to 5% commission per unit through our powerful two-level referral system.' },
              { icon: <MapPin size={24} />, c: '#a855f7', bg: '#581c87', title: '4 Farm Locations', desc: 'Choose from Kurnool, Vijayawada, Guntur, or Kakinada for your unit allocation.' },
              { icon: <Gift size={24} />, c: '#eab308', bg: '#713f12', title: 'Exclusive Rewards', desc: 'Unlock trips, gadgets, silver, and cars based on your investment milestones.' },
              { icon: <Star size={24} />, c: '#ec4899', bg: '#831843', title: 'Instant Invoice', desc: 'Receive GST-compliant tax invoices instantly on WhatsApp and Email after payment.' },
              { icon: <CheckCircle size={24} />, c: '#10b981', bg: '#064e3b', title: 'Transparent Process', desc: 'Real-time inventory, transparent commission tracking, and full transaction history.' },
            ].map((item, i) => (
              <RevealCard key={i} delay={i * 0.1}>
                <SCard className="p-8 h-full">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: item.bg, color: item.c }}>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{item.desc}</p>
                </SCard>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════ */}
      <section className="py-32 px-6 bg-[#030a06]">
        <div className="max-w-4xl mx-auto text-center">
          <RevealCard>
            <SCard className="py-20 px-8">
              <div className="text-6xl mb-8">🐃</div>
              <h2 className="font-black text-5xl mb-6 flex justify-center gap-3">
                Ready to Start <span className="text-[#10b981]">Investing?</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
                Join thousands of investors and agents across Andhra Pradesh. Register today and
                start earning from premium livestock assets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register?role=investor">
                  <button className="bg-[#10b981] hover:bg-[#059669] text-[#022c22] font-bold py-4 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                    Register as Investor <ArrowRight size={20} />
                  </button>
                </Link>
                <Link href="/auth/register?role=agent">
                  <button className="bg-[#0a1811] hover:bg-[#112419] border border-[#1b3625] text-white font-bold py-4 px-8 rounded-xl transition-colors w-full sm:w-auto">
                    Register as Agent
                  </button>
                </Link>
              </div>
              {/* Social proof */}
              <div className="grid grid-cols-3 gap-6 mt-16 pt-10 border-t border-[#1b3625]">
                {[
                  { n: 1200, suffix: '+', label: 'Active Investors' },
                  { n: 4, suffix: '', label: 'Farm Locations' },
                  { n: 5, suffix: '%', label: 'Max Commission' },
                ].map(({ n, suffix, label }) => (
                  <div key={label}>
                    <div className="text-3xl font-black text-[#10b981]">
                      <AnimatedCounter end={n} suffix={suffix} />
                    </div>
                    <div className="text-sm text-gray-500 mt-2">{label}</div>
                  </div>
                ))}
              </div>
            </SCard>
          </RevealCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}
