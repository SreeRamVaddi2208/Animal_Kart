'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Eye, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PaymentRecord, PayStatus } from './types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

const statusCfg: Record<PayStatus, { label: string; icon: React.ElementType; cls: string }> = {
  pending:  { label: 'Pending',  icon: Clock,       cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', icon: XCircle,     cls: 'bg-red-100 text-red-700' },
};

function fmtINR(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

const INITIAL: PaymentRecord[] = [
  { id: 'PAY001', investor: 'Rahul Sharma', email: 'rahul@example.com', amount: 350000,  units: 1,  method: 'bank_transfer', date: '2025-02-15', status: 'pending',  ref: 'SO/2025/001' },
  { id: 'PAY002', investor: 'Priya Mehta',  email: 'priya@example.com', amount: 1750000, units: 5,  method: 'cheque',        date: '2025-02-14', status: 'pending',  ref: 'SO/2025/002' },
  { id: 'PAY003', investor: 'Amit Patel',   email: 'amit@example.com',  amount: 700000,  units: 2,  method: 'bank_transfer', date: '2025-02-13', status: 'approved', ref: 'SO/2025/003' },
  { id: 'PAY004', investor: 'Kiran Rao',    email: 'kiran@example.com', amount: 3500000, units: 10, method: 'cash',          date: '2025-02-12', status: 'approved', ref: 'SO/2025/004' },
  { id: 'PAY005', investor: 'Vikram Singh', email: 'vikram@example.com',amount: 1050000, units: 3,  method: 'cheque',        date: '2025-02-16', status: 'pending',  ref: 'SO/2025/005' },
];

export default function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL);

  const approve = (id: string) => setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' as const } : p));
  const reject  = (id: string) => setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' as const } : p));

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      {payments.map(pay => {
        const cfg  = statusCfg[pay.status];
        const Icon = cfg.icon;

        return (
          <motion.div key={pay.id} variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">

              {/* Left: info */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900">{pay.investor}</p>
                    <Badge className={`text-xs ${cfg.cls}`}>
                      <Icon className="w-3 h-3 mr-1" />{cfg.label}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-600 text-xs capitalize">
                      {pay.method.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{pay.email} · {pay.date} · Ref: {pay.ref}</p>

                  <div className="flex items-center gap-6 mt-2">
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="font-bold text-gray-900">{fmtINR(pay.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Units</p>
                      <p className="font-bold text-gray-900">{pay.units} unit{pay.units > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Payment ID</p>
                      <p className="font-mono text-xs text-gray-700">{pay.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex gap-2 flex-shrink-0 items-start">
                {pay.status === 'pending' && (
                  <>
                    <Button onClick={() => approve(pay.id)} size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button onClick={() => reject(pay.id)} size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> View
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
