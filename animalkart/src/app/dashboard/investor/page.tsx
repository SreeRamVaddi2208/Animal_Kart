'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, FileText, Warehouse, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';
import { fetchHoldings, type LiveHoldings } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import {
  useSafeAnimation,
  fadeUpVariants,
  staggerVariants,
  VIEWPORT_SECTION,
  VIEWPORT_CARD,
} from '@/lib/hooks/useAnimation';

export default function InvestorDashboard() {
  const { user } = useAuthStore();
  const [holdings, setHoldings] = useState<LiveHoldings | null>(null);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [holdingsError, setHoldingsError] = useState<string | null>(null);

  // Reduced-motion-aware — a11y users get instant renders
  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerVariants);
  const viewport = VIEWPORT_SECTION;
  const cardViewport = VIEWPORT_CARD;

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setLoadingHoldings(false);
        setHoldingsError('Please login with your registered Odoo email to see your holdings.');
        return;
      }
      try {
        setLoadingHoldings(true);
        setHoldingsError(null);
        const data = await fetchHoldings(user.email);
        setHoldings(data);
      } catch (err) {
        setHoldingsError(err instanceof Error ? err.message : 'Failed to load holdings');
      } finally {
        setLoadingHoldings(false);
      }
    };
    load();
  }, [user?.email]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Welcome Card ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={fadeUp}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name || 'Investor'}</h1>
          <p className="text-gray-500 mt-2">
            This dashboard is now running without demo/mock data. Orders and invoices are fetched live from Odoo.
          </p>

          {/* Action buttons — staggered scroll reveal */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={stagger}
            className="mt-6 flex flex-wrap gap-3"
          >
            {[
              { href: '/warehouses', label: 'Buy Units', icon: ShoppingCart, primary: true },
              { href: '/dashboard/investor/orders', label: 'Live Orders', icon: null, primary: false },
              { href: '/dashboard/investor/invoices', label: 'Live Invoices', icon: FileText, primary: false },
            ].map((item) => (
              <motion.div key={item.href} variants={fadeUp}>
                <Link
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${item.primary
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Unit Holdings Section ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={fadeUp}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Unit Holdings</h2>
              <p className="text-sm text-gray-500">Total units you own and their distribution across warehouses.</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2">
              <Warehouse className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Total Units</p>
                <p className="text-lg font-bold text-green-700">
                  {holdings ? formatNumber(holdings.total_units) : loadingHoldings ? '—' : '0'}
                </p>
              </div>
            </div>
          </div>

          {/* States */}
          {loadingHoldings ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading holdings from Odoo…
            </div>
          ) : holdingsError ? (
            <p className="text-sm text-red-600">{holdingsError}</p>
          ) : !holdings || holdings.per_warehouse.length === 0 ? (
            <p className="text-sm text-gray-500">No unit purchases found yet.</p>
          ) : (
            /*
              Warehouse cards — each staggered child reveals on scroll.
              cardViewport (amount: 0.08) fires earlier than sections
              so cards feel like they push up from below the fold.
            */
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={cardViewport}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {holdings.per_warehouse.map((row) => (
                <motion.div
                  key={`${row.warehouse_id ?? 'na'}-${row.warehouse_name ?? 'unknown'}`}
                  variants={fadeUp}
                  className="border border-gray-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Warehouse</p>
                    <p className="font-semibold text-gray-900">
                      {row.warehouse_name || 'Warehouse N/A'}
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-0.5">Units Owned</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatNumber(row.units)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
