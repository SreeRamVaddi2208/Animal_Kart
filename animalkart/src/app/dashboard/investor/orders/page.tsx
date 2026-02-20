'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { fetchOrders, type LiveOrder } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user?.id) {
          throw new Error('Please login to view orders.');
        }
        const customerId = Number(user.id);
        if (!Number.isFinite(customerId) || customerId <= 0) {
          throw new Error('Invalid customer profile. Please login again.');
        }
        const data = await fetchOrders(customerId);
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <Link href="/dashboard/investor" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Purchase History</h1>
          <p className="text-gray-500 mt-1">All your unit purchases</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
          {loading && <p className="text-sm text-gray-500">Loading live Odoo orders...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && orders.length === 0 && <p className="text-sm text-gray-500">No Odoo orders found for this email.</p>}

          {orders.map(order => {
            return (
              <motion.div key={order.order_id} variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{order.order_reference}</h3>
                        <Badge className={`text-xs ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{order.warehouse_name || 'Warehouse N/A'}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(order.created_at)} · {order.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Order #{order.order_id}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span>Invoice available in Invoices tab</span>
                  </div>
                  <Link href="/dashboard/investor/invoices">
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      <Download className="w-3.5 h-3.5 mr-1" /> View Invoices
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
