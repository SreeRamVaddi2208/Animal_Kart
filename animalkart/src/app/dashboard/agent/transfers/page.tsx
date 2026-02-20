'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft, Plus, Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navbar from '@/components/layout/Navbar';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { createTransferRequest, fetchTransfers, type LiveTransfer, type LiveTransfersPayload } from '@/lib/api';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const statusConfig = {
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending Approval', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 text-red-700' },
};

export default function TransfersPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<LiveTransfersPayload | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [investorEmail, setInvestorEmail] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setLoadingData(false);
        setError('Please login with your registered Odoo email to view transfers.');
        return;
      }
      try {
        setLoadingData(true);
        setError(null);
        setData(await fetchTransfers(user.email));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transfers');
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [user?.email]);

  const ownedUnits = useMemo(() => data?.owned_units ?? [], [data]);
  const transferHistory = useMemo(() => data?.transfers ?? [], [data]);

  const handleTransfer = async () => {
    if (!investorEmail || !selectedUnit || !user?.email) return;
    try {
      setLoadingSubmit(true);
      setError(null);
      const item = await createTransferRequest({
        agent_email: user.email,
        investor_email: investorEmail,
        unit_id: selectedUnit,
      });
      setData(prev => ({
        owned_units: prev?.owned_units ?? [],
        transfers: [item, ...(prev?.transfers ?? [])],
      }));
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDialogOpen(false);
        setInvestorEmail('');
        setSelectedUnit('');
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit transfer');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <Link href="/dashboard/agent" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Unit Transfers</h1>
              <p className="text-gray-500 mt-1">Transfer your owned units to registered investors</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> New Transfer
            </Button>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Info Banner */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Agent Unit Transfer Rules</p>
              <ul className="space-y-1 text-xs">
                <li>• You must own a unit (purchased using 3,50,000 wallet coins) to transfer it</li>
                <li>• Units can only be transferred to registered investors</li>
                <li>• Transfer requires admin approval before completion</li>
                <li>• Once transferred, the unit belongs to the investor permanently</li>
                <li>• Wallet coins cannot be transferred — only units</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Owned Units */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Your Owned Units</h2>
          {loadingData ? (
            <div className="text-sm text-gray-600">Loading owned units...</div>
          ) : ownedUnits.length === 0 ? (
            <div className="text-sm text-gray-600">No owned units available for transfer.</div>
          ) : (
            <div className="space-y-3">
              {ownedUnits.map(unit => (
                <div key={unit.unit_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{unit.unit_id}</p>
                    <p className="text-xs text-gray-500">{unit.warehouse_name || 'Warehouse'} · Purchased {formatDate(unit.purchased_date)}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => { setSelectedUnit(unit.unit_id); setDialogOpen(true); }}
                >
                  Transfer
                </Button>
              </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Transfer History */}
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <h2 className="font-bold text-gray-900 mb-4">Transfer History</h2>
          {loadingData ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-sm text-gray-600">Loading transfer history...</div>
          ) : transferHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-sm text-gray-600">No transfer records to show.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {transferHistory.map((tx: LiveTransfer) => {
                const status = statusConfig[(tx.transfer_status as keyof typeof statusConfig) || 'pending'] || statusConfig.pending;
                const Icon = status.icon;
                return (
                  <div key={tx.transfer_id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{tx.unit_id} → {tx.investor_name || tx.investor_email || 'Investor'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.transfer_date)} · {tx.transfer_id}</p>
                    </div>
                    <Badge className={`text-xs ${status.bg}`}><Icon className="w-3 h-3 mr-1" />{status.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Unit to Investor</DialogTitle>
          </DialogHeader>
          {success ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-bold text-gray-900">Transfer Submitted!</p>
              <p className="text-sm text-gray-500 mt-2">Pending admin approval. You will be notified once approved.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label>Select Unit to Transfer</Label>
                <div className="mt-2 space-y-2">
                  {ownedUnits.map(unit => (
                    <button
                      key={unit.unit_id}
                      onClick={() => setSelectedUnit(unit.unit_id)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${selectedUnit === unit.unit_id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">{unit.unit_id}</p>
                      <p className="text-xs text-gray-500">{unit.warehouse_name || 'Warehouse'}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="investor-id">Investor Email or ID *</Label>
                <Input
                  id="investor-id"
                  placeholder="investor@example.com"
                  value={investorEmail}
                  onChange={e => setInvestorEmail(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">The investor must be registered on AnimalKart</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                ⚠️ Once transferred, this unit will permanently belong to the investor. This action requires admin approval.
              </div>
              <Button
                onClick={handleTransfer}
                disabled={loadingSubmit || !investorEmail || !selectedUnit}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {loadingSubmit ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit Transfer Request'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
