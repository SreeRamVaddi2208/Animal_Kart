'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, Download, MessageCircle, Mail, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';

type LastCheckout = {
  order_id: number;
  order_number: string;
  invoice_id?: number | null;
  invoice_number?: string | null;
  status?: string;
};

export default function ConfirmationPage() {
  const [step, setStep] = useState(0);
  const [checkout, setCheckout] = useState<LastCheckout | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const raw = localStorage.getItem('ak_last_checkout');
    if (!raw) {
      return;
    }
    try {
      setCheckout(JSON.parse(raw) as LastCheckout);
    } catch {
      setCheckout(null);
    }
  }, []);

  const orderRef = checkout?.order_number || ('AK-' + Date.now().toString().slice(-6));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>
            {/* Ripple effects */}
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-green-400"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2 + i * 0.5, opacity: 0 }}
                transition={{ delay: 0.3 + i * 0.2, duration: 1, repeat: Infinity, repeatDelay: 1 }}
              />
            ))}
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Payment Submitted! 🎉
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-gray-500"
          >
            Your payment is under review. We&apos;ll confirm within 24 hours.
          </motion.p>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Order Reference</h2>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Verification</Badge>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 font-mono text-center text-xl font-bold text-gray-900 mb-4">
            {orderRef}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-400">Customer</p><p className="font-semibold text-gray-900">{user?.full_name}</p></div>
            <div><p className="text-gray-400">Date</p><p className="font-semibold text-gray-900">{new Date().toLocaleDateString('en-IN')}</p></div>
            <div><p className="text-gray-400">Status</p><p className="font-semibold text-amber-600">Pending Admin Approval</p></div>
            <div><p className="text-gray-400">Invoice</p><p className="font-semibold text-gray-500">{checkout?.invoice_number || 'After confirmation'}</p></div>
          </div>
        </motion.div>

        {/* What Happens Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <h2 className="font-bold text-gray-900 mb-4">What happens next?</h2>
          <div className="space-y-4">
            {[
              { icon: '🔍', title: 'Payment Verification', desc: 'Our admin team reviews your payment proof within 24 hours.', done: step >= 1 },
              { icon: '✅', title: 'Order Confirmation', desc: 'Once verified, your order is confirmed and inventory reserved.', done: step >= 2 },
              { icon: '📄', title: 'Invoice Delivery', desc: 'Tax invoice sent to your WhatsApp and Email instantly.', done: step >= 3 },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg transition-all ${item.done ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    {item.done && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Delivery Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-5 text-white mb-6"
        >
          <h3 className="font-bold mb-3">Invoice will be sent to:</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <MessageCircle className="w-5 h-5 text-green-200" />
              <div>
                <p className="text-sm font-medium">WhatsApp</p>
                <p className="text-xs text-green-200">{user?.whatsapp_number || '+91 98765 43210'}</p>
              </div>
              <Badge className="ml-auto bg-green-500/30 text-green-100 border-0">Auto</Badge>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <Mail className="w-5 h-5 text-green-200" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-green-200">{user?.email || 'user@example.com'}</p>
              </div>
              <Badge className="ml-auto bg-green-500/30 text-green-100 border-0">Auto</Badge>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link href={user?.role === 'agent' ? '/dashboard/agent' : '/dashboard/investor'} className="flex-1">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-11">
              <Home className="w-4 h-4 mr-2" /> Go to Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/investor/invoices" className="flex-1">
            <Button variant="outline" className="w-full h-11">
              <FileText className="w-4 h-4 mr-2" /> View Invoices
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
