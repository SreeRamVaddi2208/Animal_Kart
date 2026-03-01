'use client';

import Link from 'next/link';
import { ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';
import {
  useSafeAnimation,
  fadeUpVariants,
  staggerVariants,
  VIEWPORT_SECTION,
} from '@/lib/hooks/useAnimation';

export default function AgentDashboard() {
  const { user } = useAuthStore();

  // Reduced-motion-aware — a11y users get instant renders
  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerVariants);
  const viewport = VIEWPORT_SECTION;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Card */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={fadeUp}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name || 'Agent'}</h1>
          <p className="text-gray-500 mt-2">
            Demo/mock dashboard data has been removed. Continue with live inventory and order operations only.
          </p>

          {/* Action buttons — staggered on scroll */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={stagger}
            className="mt-6 flex flex-wrap gap-3"
          >
            <motion.div variants={fadeUp}>
              <Link
                href="/warehouses"
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
              >
                <ShoppingCart className="h-4 w-4" /> Buy Units
              </Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link
                href="/dashboard/agent/transfers"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowRightLeft className="h-4 w-4" /> Unit Transfers
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
