'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowRight, MapPin, TrendingUp, Shield, Users, Star,
  CheckCircle, Coins, Gift, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RevealCard from '@/components/ui/RevealCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { fetchWarehouseStock } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* lazy-load Three.js scenes to avoid SSR issues */
const ThreeScene = dynamic(() => import('@/components/hero/ThreeScene'), { ssr: false });
const MiniGlobe = dynamic(() => import('@/components/hero/MiniGlobe'), { ssr: false });
const ScrollProgressBar = dynamic(() => import('@/components/ui/ScrollProgressBar'), { ssr: false });

/* ─── static chart data ─── */
const chartData = [
  { m: 'Jan', val: 82000 }, { m: 'Feb', val: 91000 },
  { m: 'Mar', val: 87000 }, { m: 'Apr', val: 105000 },
  { m: 'May', val: 112000 }, { m: 'Jun', val: 125000 },
  { m: 'Jul', val: 119000 }, { m: 'Aug', val: 138000 },
  { m: 'Sep', val: 145000 },
];

/* ─── glassmorphism card helper ─── */
function GCard({
  children,
  className = '',
  pulse = false,
  hover = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`ak-glass ${pulse ? 'ak-pulse-border' : ''} ${hover ? 'ak-glass-hover' : ''} ${className}`}
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
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#030d07', color: 'white' }}>
      <ScrollProgressBar />
      <Navbar />

      {/* ═══════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════ */}
      <section className="ak-hero-bg relative min-h-screen flex items-center overflow-hidden">
        {/* Grid overlay */}
        <div className="ak-grid-bg absolute inset-0 opacity-60 pointer-events-none" />

        {/* Animated blobs */}
        <div
          className="ak-blob-a absolute w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(52,211,153,0.22),transparent)', top: '5%', left: '2%' }}
        />
        <div
          className="ak-blob-b absolute w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(16,185,129,0.18),transparent)', bottom: '8%', right: '5%' }}
        />
        <div
          className="ak-blob-c absolute w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(6,95,70,0.3),transparent)', top: '40%', right: '30%' }}
        />

        {/* Decorative orbital rings */}
        <div className="ak-ring-1" />
        <div className="ak-ring-2" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-28 pb-20 flex flex-col lg:flex-row items-center gap-12">
          {/* Left: copy */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <span
                className="inline-block mb-6 text-xs font-semibold tracking-widest"
                style={{
                  background: 'rgba(52,211,153,0.12)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: 100,
                  padding: '6px 18px',
                  color: '#6ee7b7',
                }}
              >
                🌿 INDIA&apos;S #1 DIGITAL LIVESTOCK INVESTMENT
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="mb-6 font-bold leading-tight"
              style={{ fontSize: 'clamp(2.6rem,5.5vw,5rem)', lineHeight: 1.08 }}
            >
              Invest in Premium<br />
              <span className="ak-shimmer-text">Buffalo &amp; Calf</span><br />
              Units
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, maxWidth: 500, marginBottom: 32 }}
            >
              Own digital livestock assets with blockchain-verified ownership, real-time health
              tracking, and guaranteed returns from premium dairy operations across Andhra Pradesh.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="flex flex-wrap gap-3 justify-center lg:justify-start"
            >
              <Link href="/auth/register">
                <button
                  className="ak-btn-primary"
                  style={{
                    background: 'linear-gradient(135deg,#34d399,#059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '14px 32px',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  🚀 Start Investing
                </button>
              </Link>
              <Link href="#how-it-works">
                <button
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 14,
                    padding: '14px 32px',
                    fontWeight: 500,
                    fontSize: 16,
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s',
                  }}
                >
                  ▶ How It Works
                </button>
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10"
            >
              {[
                { val: unitPrice, pre: '₹', suf: '', label: 'Per Unit' },
                { val: totalUnits > 0 ? totalUnits : null, pre: '', suf: '+', label: 'Active Units' },
                { val: warehouseSummary.length > 0 ? warehouseSummary.length : null, pre: '', suf: '', label: 'Farm Locations' },
              ].map(({ val, pre, suf, label }) => (
                <GCard key={label} className="p-3 text-center" pulse>
                  <div style={{ fontSize: 'clamp(1rem,2.2vw,1.5rem)', fontWeight: 800, color: '#34d399' }}>
                    {stockLoading ? '—' : val !== null ? `${pre}${Number(val).toLocaleString('en-IN')}${suf}` : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{label}</div>
                </GCard>
              ))}
            </motion.div>
          </div>

          {/* Right: 3D scene */}
          <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: 420 }}>
            <div
              style={{
                width: '100%',
                height: 420,
                borderRadius: 24,
                overflow: 'hidden',
                border: '1px solid rgba(52,211,153,0.12)',
                boxShadow: '0 0 80px rgba(52,211,153,0.08)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <ThreeScene />
            </div>
            {/* Live price bubble */}
            <GCard
              className="absolute bottom-6 left-6 px-4 py-3"
              pulse
            >
              <div style={{ fontSize: 11, color: '#6ee7b7' }}>🟢 LIVE</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{formatCurrency(unitPrice)} / unit</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Next batch: 3d 14h</div>
            </GCard>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="ak-scroll-bounce text-center" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(#34d399,transparent)', margin: '0 auto 8px' }} />
          scroll
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: '100px 24px', background: '#040f09', position: 'relative' }}>
        <div className="ak-grid-bg absolute inset-0 opacity-30 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <RevealCard>
            <div className="text-center mb-16">
              <span style={{ color: '#34d399', fontSize: 12, letterSpacing: 3, fontWeight: 600, textTransform: 'uppercase' }}>Simple Process</span>
              <h2 className="mt-3 font-bold" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>How AnimalKart Works</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10, fontSize: 16 }}>
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
                <GCard className="p-6 h-full relative" hover>
                  <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, color: 'rgba(52,211,153,0.35)', fontWeight: 800 }}>{s.step}</span>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
                  <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.65 }}>{s.desc}</p>
                  <div style={{ marginTop: 20, height: 2, background: `linear-gradient(90deg,#34d399,transparent)`, borderRadius: 1, width: `${25 * (i + 1)}%` }} />
                </GCard>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          WAREHOUSES / FARM LOCATIONS
      ═══════════════════════════════════════════════════ */}
      <section id="warehouses" style={{ padding: '100px 24px', background: 'linear-gradient(180deg,#040f09 0%,#021208 100%)', position: 'relative' }}>
        <div className="max-w-7xl mx-auto">
          <RevealCard>
            <div className="text-center mb-16">
              <span style={{ color: '#34d399', fontSize: 12, letterSpacing: 3, fontWeight: 600, textTransform: 'uppercase' }}>
                {warehouseSummary.length || 4} Locations
              </span>
              <h2 className="mt-3 font-bold" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Our Farm Warehouses</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10, fontSize: 16 }}>
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
                <GCard className="overflow-hidden" hover>
                  <div style={{ height: 3, background: 'linear-gradient(90deg,#34d399,#10b981)' }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{w.name}</h3>
                        <div className="flex items-center gap-1 mt-1" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                          <MapPin size={12} /> <span>Andhra Pradesh</span>
                        </div>
                      </div>
                      <span style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', borderRadius: 100, padding: '3px 10px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>Active</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Available</span>
                        <span style={{ fontWeight: 600, color: '#6ee7b7' }}>{formatNumber(w.available_units)}</span>
                      </div>
                      <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 5 }}>
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg,#34d399,#10b981)', borderRadius: 99 }} />
                      </div>
                    </div>
                    <Link href="/auth/register">
                      <button style={{ width: '100%', background: 'linear-gradient(135deg,rgba(52,211,153,0.15),rgba(16,185,129,0.08))', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        Invest Now <ArrowRight size={14} />
                      </button>
                    </Link>
                  </div>
                </GCard>
              </RevealCard>
            ))}
          </div>

          {/* Mini portfolio chart + globe */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RevealCard className="lg:col-span-2">
              <GCard className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>Portfolio Growth Trend</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Last 9 months</div>
                  </div>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>+57.3%</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="m" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'rgba(4,15,9,0.97)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, color: 'white', fontSize: 13 }}
                      formatter={(v: number | undefined) => [`₹${(v ?? 0).toLocaleString('en-IN')}`, 'Value']}
                    />
                    <Area type="monotone" dataKey="val" stroke="#34d399" strokeWidth={2} fill="url(#areaGrad)"
                      dot={{ fill: '#34d399', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#6ee7b7' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </GCard>
            </RevealCard>

            <RevealCard delay={0.15}>
              <GCard className="p-6 flex flex-col items-center justify-center" style={{ minHeight: 280 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Farm Network</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
                  {warehouseSummary.length || 4} Active Locations
                </div>
                <MiniGlobe />
                <div style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>🟢 All farms operational</div>
              </GCard>
            </RevealCard>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          REFERRAL SYSTEM
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 24px', background: '#040f09', position: 'relative', overflow: 'hidden' }}>
        <div className="ak-blob-a absolute w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(52,211,153,0.1),transparent)', top: '20%', right: '5%' }} />

        <div className="max-w-7xl mx-auto">
          <RevealCard>
            <div className="text-center mb-14">
              <span style={{ color: '#34d399', fontSize: 12, letterSpacing: 3, fontWeight: 600, textTransform: 'uppercase' }}>Earn More</span>
              <h2 className="mt-3 font-bold" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Powerful Referral System</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10, fontSize: 16 }}>Two-level referral chain — earn commissions on every successful investor you bring in.</p>
            </div>
          </RevealCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {[
                { icon: <Users size={22} />, iconColor: '#34d399', bg: 'rgba(52,211,153,0.08)', title: 'Direct Referral — 5% Commission', desc: `Earn ₹17,500 per unit when your directly referred investor makes a purchase.` },
                { icon: <TrendingUp size={22} />, iconColor: '#60a5fa', bg: 'rgba(96,165,250,0.08)', title: 'Indirect Referral — 0.5% Commission', desc: `Earn ₹1,750 per unit when your referral's own referral makes a purchase.` },
                { icon: <Coins size={22} />, iconColor: '#fbbf24', bg: 'rgba(251,191,36,0.08)', title: 'Wallet System (1 Coin = ₹1)', desc: 'Commissions credited as coins. Use 3,50,000 coins to purchase a unit for yourself.' },
              ].map((item, i) => (
                <RevealCard key={i} delay={i * 0.12}>
                  <GCard className="p-5 flex items-start gap-4" hover>
                    <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.bg, color: item.iconColor, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{item.title}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.65 }}>{item.desc}</p>
                    </div>
                  </GCard>
                </RevealCard>
              ))}
            </div>

            <RevealCard delay={0.2}>
              <GCard className="p-6">
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Referral Chain Example</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Investor D', action: 'Buys 1 Unit (₹3,50,000)', color: 'rgba(255,255,255,0.06)', textColor: 'rgba(255,255,255,0.7)' },
                    { name: 'Investor C — Direct Referrer', action: '5% = ₹17,500 credited', color: 'rgba(52,211,153,0.1)', textColor: '#34d399' },
                    { name: 'Investor B — Indirect Referrer', action: '0.5% = ₹1,750 credited', color: 'rgba(96,165,250,0.1)', textColor: '#60a5fa' },
                    { name: 'Investor A', action: 'No commission (beyond 2 levels)', color: 'rgba(255,255,255,0.03)', textColor: 'rgba(255,255,255,0.3)' },
                  ].map((item, i) => (
                    <div key={i} style={{ borderRadius: 12, padding: '12px 16px', background: item.color }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: item.textColor }}>{item.name}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{item.action}</p>
                    </div>
                  ))}
                </div>
              </GCard>
            </RevealCard>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          REWARDS
      ═══════════════════════════════════════════════════ */}
      <section id="rewards" style={{ padding: '100px 24px', background: 'linear-gradient(180deg,#021208 0%,#040f09 100%)', position: 'relative' }}>
        <div className="max-w-7xl mx-auto">
          <RevealCard>
            <div className="text-center mb-14">
              <span style={{ color: '#fbbf24', fontSize: 12, letterSpacing: 3, fontWeight: 600, textTransform: 'uppercase' }}>Exclusive Rewards</span>
              <h2 className="mt-3 font-bold" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Purchase-Based Rewards</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10, fontSize: 16 }}>Buy more units in a single transaction and unlock incredible rewards</p>
            </div>
          </RevealCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { units: 5, reward: 'Thailand Trip for 1 Person', emoji: '✈️', grad: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
              { units: 10, reward: 'Thailand Trip for 2 Persons', emoji: '🌴', grad: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
              { units: 50, reward: '1kg Silver + Thailand Trip', emoji: '🥈', grad: 'linear-gradient(135deg,#6b7280,#374151)' },
              { units: 100, reward: 'Mahindra Thar Roxx 4x4', emoji: '🚙', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
            ].map((item, i) => (
              <RevealCard key={i} delay={i * 0.12}>
                <div className="ak-glass-hover" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ background: item.grad, padding: '28px 24px', textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>{item.emoji}</div>
                    <div style={{ fontSize: 36, fontWeight: 900 }}>{item.units}</div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>units at once</div>
                  </div>
                  <div className="p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <h3 style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{item.reward}</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Single transaction</p>
                  </div>
                </div>
              </RevealCard>
            ))}
          </div>

          {/* Referral milestones */}
          <RevealCard delay={0.1}>
            <div style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.12),rgba(16,185,129,0.06))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, padding: '40px 32px' }}>
              <div className="text-center mb-8">
                <h3 style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Referral-Based Rewards</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Earn rewards when your referred investors reach milestones</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { checkpoint: '30 Units', reward: 'Thailand Trip (1 Person)', icon: '✈️' },
                  { checkpoint: '50 Units', reward: 'Latest iPhone Pro Max', icon: '📱' },
                  { checkpoint: '100 Units', reward: 'Ather E-Bike', icon: '⚡' },
                ].map((item, i) => (
                  <div key={i} className="text-center" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '24px 16px', border: '1px solid rgba(52,211,153,0.12)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>{item.icon}</div>
                    <div style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Referred investor buys</div>
                    <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{item.checkpoint}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{item.reward}</div>
                  </div>
                ))}
              </div>
              <p className="text-center mt-8" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                * At each checkpoint, choose between the reward OR equivalent cash commission
              </p>
            </div>
          </RevealCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          WHY ANIMALKART
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 24px', background: '#040f09', position: 'relative' }}>
        <div className="ak-grid-bg absolute inset-0 opacity-20 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <RevealCard>
            <div className="text-center mb-14">
              <span style={{ color: '#34d399', fontSize: 12, letterSpacing: 3, fontWeight: 600, textTransform: 'uppercase' }}>Why Choose Us</span>
              <h2 className="mt-3 font-bold" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Why AnimalKart?</h2>
            </div>
          </RevealCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Shield size={22} />, c: '#34d399', title: 'Secure Investment', desc: 'KYC-verified platform with admin-approved payments and GST-compliant invoices.' },
              { icon: <TrendingUp size={22} />, c: '#60a5fa', title: 'High Returns', desc: 'Earn up to 5% commission per unit through our powerful two-level referral system.' },
              { icon: <MapPin size={22} />, c: '#c084fc', title: '4 Farm Locations', desc: 'Choose from Kurnool, Vijayawada, Guntur, or Kakinada for your unit allocation.' },
              { icon: <Gift size={22} />, c: '#fbbf24', title: 'Exclusive Rewards', desc: 'Unlock trips, gadgets, silver, and cars based on your investment milestones.' },
              { icon: <Star size={22} />, c: '#f472b6', title: 'Instant Invoice', desc: 'Receive GST-compliant tax invoices instantly on WhatsApp and Email after payment.' },
              { icon: <CheckCircle size={22} />, c: '#34d399', title: 'Transparent Process', desc: 'Real-time inventory, transparent commission tracking, and full transaction history.' },
            ].map((item, i) => (
              <RevealCard key={i} delay={i * 0.1}>
                <GCard className="p-6 h-full" hover>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${item.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.c, marginBottom: 16 }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.65 }}>{item.desc}</p>
                </GCard>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 24px', background: '#021208', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blob */}
        <div className="ak-blob-b absolute w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(52,211,153,0.1),transparent)', top: '10%', right: '-10%' }} />
        <div className="ak-blob-a absolute w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(16,185,129,0.08),transparent)', bottom: 0, left: '-5%' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <RevealCard>
            <GCard className="p-14 ak-pulse-border" pulse>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🐃</div>
              <h2 style={{ fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', marginBottom: 16 }}>
                Ready to Start&nbsp;
                <span className="ak-shimmer-text">Investing?</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.75, maxWidth: 540, margin: '0 auto 36px' }}>
                Join thousands of investors and agents across Andhra Pradesh. Register today and
                start earning from premium livestock assets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register?role=investor">
                  <button className="ak-btn-primary" style={{ background: 'linear-gradient(135deg,#34d399,#059669)', color: 'white', border: 'none', borderRadius: 14, padding: '14px 36px', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Register as Investor <ArrowRight size={18} />
                  </button>
                </Link>
                <Link href="/auth/register?role=agent">
                  <button style={{ background: 'rgba(255,255,255,0.07)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '14px 36px', fontWeight: 500, fontSize: 16, cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}>
                    Register as Agent
                  </button>
                </Link>
              </div>
              {/* Social proof */}
              <div className="grid grid-cols-3 gap-6 mt-12" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 32 }}>
                {[
                  { n: 1200, suffix: '+', label: 'Active Investors' },
                  { n: 4, suffix: '', label: 'Farm Locations' },
                  { n: 5, suffix: '%', label: 'Max Commission' },
                ].map(({ n, suffix, label }) => (
                  <div key={label}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399' }}>
                      <AnimatedCounter end={n} suffix={suffix} />
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </GCard>
          </RevealCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}
