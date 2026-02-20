'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { KycRecord, KycStatus } from './types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

const statusCfg: Record<KycStatus, { label: string; icon: React.ElementType; cls: string }> = {
  pending:  { label: 'Pending',  icon: Clock,         cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', icon: CheckCircle,   cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', icon: XCircle,       cls: 'bg-red-100 text-red-700' },
};

const INITIAL: KycRecord[] = [
  { id: 'KYC001', name: 'Rahul Sharma',  email: 'rahul@example.com',  pan: 'ABCDE1234F', aadhaar: '****-****-1234', role: 'investor', submitted: '2025-02-10', status: 'pending'  },
  { id: 'KYC002', name: 'Priya Mehta',   email: 'priya@example.com',  pan: 'FGHIJ5678K', aadhaar: '****-****-5678', role: 'agent',    submitted: '2025-02-12', status: 'pending'  },
  { id: 'KYC003', name: 'Amit Patel',    email: 'amit@example.com',   pan: 'LMNOP9012Q', aadhaar: '****-****-9012', role: 'investor', submitted: '2025-02-08', status: 'approved' },
  { id: 'KYC004', name: 'Sneha Joshi',   email: 'sneha@example.com',  pan: 'RSTUV3456W', aadhaar: '****-****-3456', role: 'investor', submitted: '2025-02-14', status: 'rejected' },
  { id: 'KYC005', name: 'Vikram Singh',  email: 'vikram@example.com', pan: 'XYZAB7890C', aadhaar: '****-****-7890', role: 'investor', submitted: '2025-02-16', status: 'pending'  },
];

export default function KycTab() {
  const [list, setList]       = useState<KycRecord[]>(INITIAL);
  const [expanded, setExpanded] = useState<string | null>(null);

  const approve = (id: string) => setList(prev => prev.map(k => k.id === id ? { ...k, status: 'approved' as const } : k));
  const reject  = (id: string) => setList(prev => prev.map(k => k.id === id ? { ...k, status: 'rejected' as const } : k));

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      {list.map(kyc => {
        const cfg  = statusCfg[kyc.status];
        const Icon = cfg.icon;
        const open = expanded === kyc.id;

        return (
          <motion.div key={kyc.id} variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Row */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-indigo-700 text-sm">
                  {kyc.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{kyc.name}</p>
                  <p className="text-xs text-gray-400 truncate">{kyc.email} · Submitted {kyc.submitted}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={`text-xs ${cfg.cls}`}>
                  <Icon className="w-3 h-3 mr-1" />{cfg.label}
                </Badge>
                <Badge className="bg-gray-100 text-gray-600 text-xs capitalize">{kyc.role}</Badge>
                <button
                  onClick={() => setExpanded(open ? null : kyc.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Expanded Detail */}
            {open && (
              <div className="border-t border-gray-50 px-5 pb-5 pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">KYC ID</p>
                    <p className="text-sm font-mono font-semibold text-gray-800">{kyc.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">PAN Card</p>
                    <p className="text-sm font-mono font-semibold text-gray-800">{kyc.pan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Aadhaar</p>
                    <p className="text-sm font-mono font-semibold text-gray-800">{kyc.aadhaar}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Role</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{kyc.role}</p>
                  </div>
                </div>

                {kyc.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button onClick={() => approve(kyc.id)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                      <CheckCircle className="w-4 h-4" /> Approve KYC
                    </Button>
                    <Button onClick={() => reject(kyc.id)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-2">
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                )}

                {kyc.status === 'approved' && (
                  <p className="text-sm text-green-700 font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> KYC has been approved.
                  </p>
                )}

                {kyc.status === 'rejected' && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> KYC has been rejected.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
