'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Download, Mail, MessageCircle, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { fetchInvoices, type LiveInvoice } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<LiveInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user?.id && !user?.email) {
          throw new Error('Please login to view invoices.');
        }
        const customerId = user?.id ? Number(user.id) : undefined;
        const data = await fetchInvoices({
          customerId: customerId && Number.isFinite(customerId) && customerId > 0 ? customerId : undefined,
          email: user?.email || undefined,
        });
        setInvoices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, user?.email]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <Link href="/dashboard/investor" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
          <p className="text-gray-500 mt-1">Download and manage your tax invoices</p>
        </motion.div>

        {/* Info Banner */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">GST-Compliant Tax Invoices</p>
            <p className="text-xs mt-1">All invoices are automatically sent to your WhatsApp and Email after payment confirmation. You can also download them here anytime.</p>
          </div>
        </motion.div>

        {/* Invoices List */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
          {loading && <p className="text-sm text-gray-500">Loading live Odoo invoices...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && invoices.length === 0 && <p className="text-sm text-gray-500">No invoices found yet.</p>}

          {invoices.map((invoice, i) => {
            return (
              <motion.div key={invoice.invoice_id} variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{invoice.invoice_number}</h3>
                        <Badge className="bg-green-100 text-green-700 text-xs">{invoice.payment_state || 'posted'}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {invoice.order_reference || 'Odoo Invoice'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Invoice Date: {formatDate(invoice.invoice_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Generated in Odoo</p>
                  </div>
                </div>

                {/* Delivery Status */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Sent</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Sent</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8">
                      <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Invoice Preview Sample */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Sample Invoice Contents</h2>
          <div className="border border-gray-200 rounded-xl p-5 text-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-lg text-green-700">AnimalKart Pvt. Ltd.</p>
                <p className="text-gray-500 text-xs">GSTIN: 36AABCA1234B1Z5</p>
                <p className="text-gray-500 text-xs">Hyderabad, Telangana 500001</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">TAX INVOICE</p>
                <p className="text-gray-500 text-xs">AK-INV-2024-001</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div>
                <p className="font-semibold text-gray-700">Bill To:</p>
                <p className="text-gray-600">Customer Name</p>
                <p className="text-gray-500">PAN: XXXXX1234X</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Date: 21 Jan 2024</p>
                <p className="text-gray-500">Warehouse: Kurnool Farm</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-2">
                <span>Item</span><span>Qty</span><span>Rate</span><span>Amount</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Buffalo-Calf Unit (2 Buffalos + 2 Calves)</span><span>5</span><span>₹3,50,000</span><span>₹17,50,000</span>
              </div>
              <div className="border-t border-gray-100 mt-3 pt-2 flex justify-between font-bold text-sm">
                <span>Total</span><span className="text-green-700">₹17,50,000</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
