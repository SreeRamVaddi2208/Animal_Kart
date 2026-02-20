'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Building2, FileText, Banknote, Upload, CheckCircle, ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore, useCartStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { submitCheckout } from '@/lib/api';

const COMPANY_BANK = {
  name: 'AnimalKart Pvt. Ltd.',
  bank: 'HDFC Bank',
  account: '50100987654321',
  ifsc: 'HDFC0001234',
  branch: 'Hyderabad Main Branch',
};

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function PaymentPage() {
  const [method, setMethod] = useState<'bank_transfer' | 'cheque' | 'cash'>('bank_transfer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [utr, setUtr] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, getTotal, clearCart } = useCartStore();
  useEffect(() => {
    setMounted(true);
  }, []);

  const safeItems = mounted ? items : [];
  const total = mounted ? getTotal() : 0;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('Please login before checkout.');
      }
      const customerId = Number(user.id);
      if (!Number.isFinite(customerId) || customerId <= 0) {
        throw new Error('Invalid customer profile. Please login again.');
      }
      const result = await submitCheckout({
        customer_id: customerId,
        payment_method: method,
        lines: items.map(item => ({
          warehouse_id: item.warehouse_id,
          product_id: item.product_id,
          sku: item.sku,
          quantity: item.quantity,
        })),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('ak_last_checkout', JSON.stringify(result));
      }

      clearCart();
      router.push('/payment/confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, desc: 'NEFT / RTGS / IMPS' },
    { id: 'cheque', label: 'Cheque Payment', icon: FileText, desc: 'Account payee cheque' },
    { id: 'cash', label: 'Cash Payment', icon: Banknote, desc: 'Schedule collection' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-500 mt-1">Select your payment method and complete the payment</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-5">
            {/* Method Selection */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Select Payment Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {methods.map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${method === m.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${method === m.id ? 'text-green-600' : 'text-gray-400'}`} />
                      <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Payment Details */}
            <AnimatePresence mode="wait">
              {method === 'bank_transfer' && (
                <motion.div key="bank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
                  <h2 className="font-bold text-gray-900">Bank Transfer Details</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 font-medium">Transfer the exact amount to the account below</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Account Name', value: COMPANY_BANK.name },
                        { label: 'Bank', value: COMPANY_BANK.bank },
                        { label: 'Account Number', value: COMPANY_BANK.account },
                        { label: 'IFSC Code', value: COMPANY_BANK.ifsc },
                        { label: 'Branch', value: COMPANY_BANK.branch },
                        { label: 'Amount', value: formatCurrency(total) },
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-gray-500 text-xs">{item.label}</p>
                          <p className="font-semibold text-gray-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="utr">UTR / Transaction Reference Number *</Label>
                    <Input id="utr" placeholder="Enter UTR number after transfer" value={utr} onChange={e => setUtr(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Upload Payment Screenshot *</Label>
                    <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-green-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('screenshot-upload')?.click()}>
                      {screenshot ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Screenshot uploaded</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Click to upload payment screenshot</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input id="screenshot-upload" type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && setScreenshot(e.target.files[0].name)} />
                  </div>
                </motion.div>
              )}

              {method === 'cheque' && (
                <motion.div key="cheque" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
                  <h2 className="font-bold text-gray-900">Cheque Payment Details</h2>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <p className="font-semibold mb-1">Instructions</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Make cheque payable to: <strong>AnimalKart Pvt. Ltd.</strong></li>
                      <li>• Write the amount: <strong>{formatCurrency(total)}</strong></li>
                      <li>• Account payee cheque only (cross it)</li>
                      <li>• Submit cheque at nearest office or courier to HQ</li>
                    </ul>
                  </div>
                  <div>
                    <Label htmlFor="cheque-no">Cheque Number *</Label>
                    <Input id="cheque-no" placeholder="6-digit cheque number" value={chequeNo} onChange={e => setChequeNo(e.target.value)} className="mt-1" maxLength={6} />
                  </div>
                  <div>
                    <Label>Upload Cheque Image *</Label>
                    <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-green-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('cheque-upload')?.click()}>
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Upload front side of cheque</p>
                    </div>
                    <input id="cheque-upload" type="file" accept="image/*" className="hidden" />
                  </div>
                </motion.div>
              )}

              {method === 'cash' && (
                <motion.div key="cash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
                  <h2 className="font-bold text-gray-900">Cash Payment</h2>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                    <p className="font-semibold mb-2">Schedule Cash Collection</p>
                    <p className="text-xs">Our representative will visit your location to collect the cash payment. Please ensure the exact amount is ready.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Preferred Date *</Label>
                      <Input type="date" className="mt-1" min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div>
                      <Label>Preferred Time *</Label>
                      <Input type="time" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Collection Address *</Label>
                    <Input placeholder="Enter address for cash collection" className="mt-1" />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <p className="font-semibold text-gray-900">Payment Receipt</p>
                    <p className="text-gray-500 text-xs mt-1">A receipt number will be generated after scheduling. Keep it for reference.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold">Payment Verification Process</p>
                <p className="text-xs mt-1">After submission, our admin team will verify your payment within 24 hours. You will receive a confirmation on WhatsApp and Email once approved.</p>
              </div>
            </motion.div>
          </div>

          {error && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Order Summary */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                {safeItems.map(item => (
                  <div key={item.warehouse_id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{item.warehouse_name}</p>
                      <p className="text-xs text-gray-400">{item.quantity} unit{item.quantity > 1 ? 's' : ''}</p>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Payable</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!mounted || loading || (method === 'bank_transfer' && !utr) || (method === 'cheque' && !chequeNo)}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold mt-5"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : `Submit Payment — ${formatCurrency(total)}`}
              </Button>

              <div className="mt-4 space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2"><span>🔒</span><span>256-bit SSL encryption</span></div>
                <div className="flex items-center gap-2"><span>✅</span><span>Admin-verified payment</span></div>
                <div className="flex items-center gap-2"><span>📄</span><span>GST invoice after confirmation</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
