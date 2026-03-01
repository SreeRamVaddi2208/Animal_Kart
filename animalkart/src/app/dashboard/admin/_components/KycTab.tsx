'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Search, Filter, User, Mail, Phone, MapPin, CreditCard,
  Building2, Hash, BadgeCheck, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { KycStatus } from './types';
import { fetchAdminUsers, updateKycStatus } from '@/lib/api';
import {
  useSafeAnimation,
  fadeUpVariants,
  staggerFastVariants,
  VIEWPORT_SECTION,
  VIEWPORT_CARD,
} from '@/lib/hooks/useAnimation';

const statusCfg: Record<KycStatus, { label: string; icon: React.ElementType; cls: string; dot: string }> = {
  pending: { label: 'Pending', icon: Clock, cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  approved: { label: 'Approved', icon: CheckCircle, cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  rejected: { label: 'Rejected', icon: XCircle, cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
};

type ExtendedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  kyc_status: KycStatus;
  pan?: string;
  aadhaar?: string;
  phone?: string;
  address?: string;
  bank?: string;
  account?: string;
  ifsc?: string;
  submitted: string;
};

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-all">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function KycTab() {
  const [list, setList] = useState<ExtendedUser[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<KycStatus | 'all'>('all');
  const [acting, setActing] = useState<string | null>(null);

  // Reduced-motion-aware — a11y users get instant renders
  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerFastVariants);
  const viewport = VIEWPORT_SECTION;
  const cardViewport = VIEWPORT_CARD;

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const users = await fetchAdminUsers();
      const mapped: ExtendedUser[] = users.map(u => ({
        id: String(u.partner_id),
        name: u.name,
        email: u.email,
        role: u.role,
        kyc_status: (u.kyc_status as KycStatus) || 'pending',
        submitted: u.created_at ? u.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        pan: 'N/A',
        aadhaar: 'N/A',
        phone: 'N/A',
        address: 'N/A',
        bank: 'N/A',
        account: 'N/A',
        ifsc: 'N/A',
      }));
      setList(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KYC records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, next: KycStatus) => {
    const record = list.find(k => k.id === id);
    if (!record) return;
    setActing(id);
    setList(prev => prev.map(k => (k.id === id ? { ...k, kyc_status: next } : k)));
    try {
      await updateKycStatus(Number(id), record.email, next);
    } catch {
      setList(prev => prev.map(k => (k.id === id ? { ...k, kyc_status: record.kyc_status } : k)));
    } finally {
      setActing(null);
    }
  };

  const filtered = useMemo(() => {
    return list
      .filter(u => filter === 'all' || u.kyc_status === filter)
      .filter(u =>
        search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
      );
  }, [list, filter, search]);

  const counts = useMemo(() => ({
    all: list.length,
    pending: list.filter(u => u.kyc_status === 'pending').length,
    approved: list.filter(u => u.kyc_status === 'approved').length,
    rejected: list.filter(u => u.kyc_status === 'rejected').length,
  }), [list]);

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-4">

      {/* ── Stats Bar ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
        {([
          { key: 'all', label: 'All Users', color: 'bg-gray-100 text-gray-700' },
          { key: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
          { key: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700' },
          { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
        ] as const).map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key as KycStatus | 'all')}
            className={`rounded-xl p-3 text-center transition-all border-2 ${filter === s.key ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-transparent'
              } ${s.color}`}
          >
            <p className="text-xl font-black">{counts[s.key as keyof typeof counts]}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </button>
        ))}
      </motion.div>

      {/* ── Toolbar ── */}
      <motion.div variants={fadeUp} className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* ── States ── */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading KYC records from Odoo…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No KYC records found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* ── Records ── */}
      <AnimatePresence>
        {filtered.map(kyc => {
          const cfg = statusCfg[kyc.kyc_status];
          const Icon = cfg.icon;
          const open = expanded === kyc.id;
          const busy = acting === kyc.id;

          return (
            <motion.div
              key={kyc.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={cardViewport}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Status stripe */}
              <div className={`h-1 ${cfg.dot}`} />

              {/* Row */}
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-indigo-700 text-base">
                    {kyc.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{kyc.name}</p>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3" />{kyc.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`text-xs border ${cfg.cls} flex items-center gap-1`}>
                    <Icon className="w-3 h-3" />{cfg.label}
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-600 text-xs capitalize border border-gray-200">
                    {kyc.role}
                  </Badge>
                  <p className="text-xs text-gray-400 hidden sm:block">{kyc.submitted}</p>
                  <button
                    onClick={() => setExpanded(open ? null : kyc.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* ── Expanded Detail ── */}
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                      {/* KYC Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                        <DetailRow icon={Hash} label="Partner ID" value={kyc.id} />
                        <DetailRow icon={Mail} label="Email" value={kyc.email} />
                        <DetailRow icon={BadgeCheck} label="Role" value={kyc.role} />
                        <DetailRow icon={CreditCard} label="PAN Card" value={kyc.pan || '—'} />
                        <DetailRow icon={CreditCard} label="Aadhaar" value={kyc.aadhaar || '—'} />
                        <DetailRow icon={Phone} label="Phone" value={kyc.phone || '—'} />
                        <DetailRow icon={MapPin} label="Address" value={kyc.address || '—'} />
                        <DetailRow icon={Building2} label="Bank Name" value={kyc.bank || '—'} />
                        <DetailRow icon={Hash} label="Account Number" value={kyc.account || '—'} />
                        <DetailRow icon={Hash} label="IFSC Code" value={kyc.ifsc || '—'} />
                        <DetailRow icon={Clock} label="Submitted On" value={kyc.submitted} />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-50">
                        {kyc.kyc_status === 'pending' && (
                          <>
                            <Button
                              onClick={() => setStatus(kyc.id, 'approved')}
                              disabled={busy}
                              className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {busy ? 'Approving…' : 'Approve KYC'}
                            </Button>
                            <Button
                              onClick={() => setStatus(kyc.id, 'rejected')}
                              disabled={busy}
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        {kyc.kyc_status === 'approved' && (
                          <>
                            <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium bg-green-50 px-4 py-2 rounded-xl">
                              <CheckCircle className="w-4 h-4" /> KYC Approved
                            </span>
                            <Button
                              onClick={() => setStatus(kyc.id, 'rejected')}
                              disabled={busy}
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5 text-xs"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Revoke
                            </Button>
                          </>
                        )}
                        {kyc.kyc_status === 'rejected' && (
                          <>
                            <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium bg-red-50 px-4 py-2 rounded-xl">
                              <XCircle className="w-4 h-4" /> KYC Rejected
                            </span>
                            <Button
                              onClick={() => setStatus(kyc.id, 'approved')}
                              disabled={busy}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Re-Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
