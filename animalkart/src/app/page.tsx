'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, MapPin, TrendingUp, Shield, Users, Star, CheckCircle, Coins, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { fetchWarehouseStock } from '@/lib/api';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

export default function LandingPage() {
  const [stockRows, setStockRows] = useState<Awaited<ReturnType<typeof fetchWarehouseStock>>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await fetchWarehouseStock();
        setStockRows(rows);
      } catch {
        setStockRows([]);
      }
    };
    load();
  }, []);

  const warehouseSummary = useMemo(() => {
    const byWarehouse = new Map<number, { id: number; name: string; available_units: number }>();
    for (const row of stockRows) {
      const existing = byWarehouse.get(row.warehouse_id);
      if (existing) {
        existing.available_units += Number(row.qty_available || 0);
      } else {
        byWarehouse.set(row.warehouse_id, {
          id: row.warehouse_id,
          name: row.warehouse_name,
          available_units: Number(row.qty_available || 0),
        });
      }
    }
    return Array.from(byWarehouse.values());
  }, [stockRows]);

  const unitPrice = stockRows[0]?.unit_price || 0;
  const totalUnits = warehouseSummary.reduce((sum, w) => sum + w.available_units, 0);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <motion.div className="max-w-3xl" initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp}>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mb-6 text-sm px-4 py-1.5">
                🐃 India&apos;s #1 Livestock Investment Platform
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Invest in Premium{' '}
              <span className="text-green-400">Buffalo &amp; Calf</span>{' '}
              Units
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-green-100 mb-8 leading-relaxed max-w-2xl">
              Join thousands of investors across Andhra Pradesh. Each unit includes 2 Buffalos + 2 Calves.
              Earn up to 5% commission through referrals and unlock exclusive rewards.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-green-500 hover:bg-green-400 text-white font-semibold px-8 h-12 text-base shadow-lg">
                  Start Investing <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="border-green-400/40 text-white hover:bg-green-800/40 h-12 text-base bg-transparent">
                  How it Works
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-8 mt-10">
              {[
                { label: 'Per Unit Price', value: formatCurrency(unitPrice) },
                { label: 'Available Units', value: formatNumber(totalUnits) },
                { label: 'Farm Locations', value: `${warehouseSummary.length} in AP` },
                { label: 'Commission Rate', value: 'Up to 5%' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-green-300">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Banner */}
      <section className="bg-green-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
            <span>🐃 1 Unit = 2 Buffalos + 2 Calves</span>
            <span className="hidden sm:block text-green-300">|</span>
            <span>💰 {formatCurrency(unitPrice)} per unit</span>
            <span className="hidden sm:block text-green-300">|</span>
            <span>🎁 Rewards on bulk purchases</span>
            <span className="hidden sm:block text-green-300">|</span>
            <span>📱 Invoice on WhatsApp &amp; Email</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Badge className="bg-green-100 text-green-700 border-green-200 mb-4">Simple Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How AnimalKart Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">From registration to investment in just a few simple steps</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { step: '01', icon: '📝', title: 'Register', desc: 'Sign up as an Agent or Investor with your KYC details and bank information.' },
              { step: '02', icon: '🏚️', title: 'Choose Warehouse', desc: 'Browse our 4 farm locations across Andhra Pradesh and select your preferred warehouse.' },
              { step: '03', icon: '💳', title: 'Make Payment', desc: 'Pay via Bank Transfer, Cheque, or Cash. Admin verifies and confirms your payment.' },
              { step: '04', icon: '📄', title: 'Get Invoice', desc: 'Receive your tax invoice on WhatsApp and Email instantly after payment confirmation.' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="relative">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="absolute top-4 right-4 text-5xl font-black text-gray-50 select-none">{item.step}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
                {i < 3 && <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 items-center justify-center"><ChevronRight className="w-6 h-6 text-green-400" /></div>}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Warehouses */}
      <section id="warehouses" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Badge className="bg-green-100 text-green-700 border-green-200 mb-4">{warehouseSummary.length} Locations</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Farm Warehouses</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Premium livestock farms across Andhra Pradesh with real-time unit availability</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {warehouseSummary.map((warehouse) => {
              const pct = 100;
              return (
                <motion.div key={warehouse.id} variants={fadeUp}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{warehouse.name}</h3>
                          <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /><span>{warehouse.name}, Andhra Pradesh</span>
                          </div>
                        </div>
                        <Badge className={`text-xs ${pct > 50 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{pct}% Free</Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Available</span>
                          <span className="font-semibold">{formatNumber(warehouse.available_units)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 text-right">Live from Odoo</p>
                      </div>
                      <Link href="/auth/register">
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-9">
                          Invest Now <ArrowRight className="ml-1 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Referral System */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Badge className="bg-green-100 text-green-700 border-green-200 mb-4">Earn More</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Powerful Referral System</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Earn commissions by referring investors. Two-level referral chain for maximum earnings.</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-4">
              {[
                { icon: <Users className="w-6 h-6 text-green-600" />, title: 'Direct Referral — 5% Commission', desc: 'Earn ₹17,500 per unit when your directly referred investor makes a purchase.', bg: 'bg-green-50' },
                { icon: <TrendingUp className="w-6 h-6 text-blue-600" />, title: 'Indirect Referral — 0.5% Commission', desc: "Earn ₹1,750 per unit when your referral's referral makes a purchase.", bg: 'bg-blue-50' },
                { icon: <Coins className="w-6 h-6 text-amber-600" />, title: 'Wallet System (1 Coin = ₹1)', desc: 'Commissions credited as coins. Use 3,50,000 coins to purchase a unit for yourself.', bg: 'bg-amber-50' },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} className={`${item.bg} rounded-2xl p-5 flex items-start gap-4`}>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-5 text-lg">Referral Chain Example</h3>
              <div className="space-y-3">
                {[
                  { name: 'Investor D', action: 'Buys 1 Unit (₹3,50,000)', color: 'bg-gray-100 text-gray-700' },
                  { name: 'Investor C (Direct Referrer)', action: '5% = ₹17,500 credited', color: 'bg-green-100 text-green-700' },
                  { name: 'Investor B (Indirect Referrer)', action: '0.5% = ₹1,750 credited', color: 'bg-blue-100 text-blue-700' },
                  { name: 'Investor A', action: 'No commission (beyond 2 levels)', color: 'bg-gray-50 text-gray-400' },
                ].map((item, i) => (
                  <div key={i} className={`rounded-xl px-4 py-3 ${item.color}`}>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs mt-0.5">{item.action}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Rewards */}
      <section id="rewards" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 mb-4">🎁 Exclusive Rewards</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Purchase-Based Rewards</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Buy more units in a single transaction and unlock incredible rewards</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { units: 5, reward: 'Thailand Trip for 1 Person', emoji: '✈️', color: 'from-blue-500 to-cyan-500' },
              { units: 10, reward: 'Thailand Trip for 2 Persons', emoji: '🌴', color: 'from-purple-500 to-pink-500' },
              { units: 50, reward: '1kg Silver + Thailand Trip (2)', emoji: '🥈', color: 'from-gray-400 to-gray-600' },
              { units: 100, reward: 'Mahindra Thar Roxx 4x4', emoji: '🚙', color: 'from-amber-500 to-orange-500' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className={`bg-gradient-to-br ${item.color} p-6 text-white text-center`}>
                    <div className="text-5xl mb-2">{item.emoji}</div>
                    <div className="text-3xl font-black">{item.units}</div>
                    <div className="text-sm opacity-80">Units at Once</div>
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="font-bold text-gray-900 text-sm">{item.reward}</h3>
                    <p className="text-xs text-gray-500 mt-1">Single transaction</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div className="mt-10 bg-gradient-to-br from-green-900 to-emerald-800 rounded-3xl p-8 text-white" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Referral-Based Rewards</h3>
              <p className="text-green-200">Earn rewards when your referred investors reach milestones</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { checkpoint: '30 Units', reward: 'Thailand Trip (1 Person)', icon: '✈️' },
                { checkpoint: '50 Units', reward: 'Latest iPhone Pro Max', icon: '📱' },
                { checkpoint: '100 Units', reward: 'Ather E-Bike', icon: '⚡' },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="text-green-300 text-sm font-medium mb-1">Referred investor buys</div>
                  <div className="text-2xl font-black mb-2">{item.checkpoint}</div>
                  <div className="text-green-100 text-sm">{item.reward}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-green-300 text-sm mt-6">* At each checkpoint, choose between the reward OR equivalent cash commission</p>
          </motion.div>
        </div>
      </section>

      {/* Why AnimalKart */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Badge className="bg-green-100 text-green-700 border-green-200 mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why AnimalKart?</h2>
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: <Shield className="w-6 h-6 text-green-600" />, title: 'Secure Investment', desc: 'KYC-verified platform with admin-approved payments and GST-compliant invoices.' },
              { icon: <TrendingUp className="w-6 h-6 text-blue-600" />, title: 'High Returns', desc: 'Earn up to 5% commission per unit through our powerful two-level referral system.' },
              { icon: <MapPin className="w-6 h-6 text-purple-600" />, title: '4 Farm Locations', desc: 'Choose from Kurnool, Vijayawada, Guntur, or Kakinada for your unit allocation.' },
              { icon: <Gift className="w-6 h-6 text-amber-600" />, title: 'Exclusive Rewards', desc: 'Unlock trips, gadgets, silver, and cars based on your investment milestones.' },
              { icon: <Star className="w-6 h-6 text-yellow-500" />, title: 'Instant Invoice', desc: 'Receive GST-compliant tax invoices instantly on WhatsApp and Email after payment.' },
              { icon: <CheckCircle className="w-6 h-6 text-green-600" />, title: 'Transparent Process', desc: 'Real-time inventory, transparent commission tracking, and full transaction history.' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">Ready to Start Investing?</motion.h2>
            <motion.p variants={fadeUp} className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of investors and agents across Andhra Pradesh. Register today and start earning.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register?role=investor">
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 font-semibold px-8 h-12">
                  Register as Investor <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth/register?role=agent">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-green-600/50 h-12 bg-transparent">
                  Register as Agent
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
