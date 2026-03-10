'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Search, User, Mail, Phone, MapPin, CreditCard,
  Building2, Hash, BadgeCheck, AlertCircle, RefreshCw,
} from 'lucide-react';
import type { KycStatus } from './types';
import { fetchAdminUsers, updateKycStatus } from '@/lib/api';
import { exportCSV } from '@/lib/utils';
import { usePolling, useTimeSince } from '@/lib/hooks/usePolling';
import {
  useSafeAnimation,
  fadeUpVariants,
  staggerFastVariants,
  VIEWPORT_SECTION,
  VIEWPORT_CARD,
} from '@/lib/hooks/useAnimation';

/* ── Dark-theme status config ── */
const statusCfg: Record<KycStatus, { label: string; icon: React.ElementType; color: string; bg: string; dot: string }> = {
  pending: { label: 'Pending', icon: Clock, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', dot: '#fbbf24' },
  approved: { label: 'Approved', icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.12)', dot: '#34d399' },
  rejected: { label: 'Rejected', icon: XCircle, color: '#f87171', bg: 'rgba(248,113,113,0.12)', dot: '#f87171' },
};

type ExtendedUser = {
  id: string; name: string; email: string; role: string;
  kyc_status: KycStatus; pan?: string; aadhaar?: string;
  phone?: string; address?: string; bank?: string;
  account?: string; ifsc?: string; submitted: string;
};

const CARD = 'rgba(255,255,255,0.04)';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const ROW_BG = 'rgba(255,255,255,0.03)';
const TEXT_DIM = 'rgba(255,255,255,0.4)';
const TEXT_MID = 'rgba(255,255,255,0.65)';

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <Icon style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.4)' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', wordBreak: 'break-all' }}>{value || '—'}</p>
      </div>
    </div>
  );
}

function KycTabInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [list, setList] = useState<ExtendedUser[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [filter, setFilter] = useState<KycStatus | 'all'>('all');
  const [acting, setActing] = useState<string | null>(null);

  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerFastVariants);
  const viewport = VIEWPORT_SECTION;
  const cardViewport = VIEWPORT_CARD;

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const users = await fetchAdminUsers();
      const mapped: ExtendedUser[] = users.map(u => ({
        id: String(u.partner_id), name: u.name, email: u.email, role: u.role,
        kyc_status: (u.kyc_status as KycStatus) || 'pending',
        submitted: u.created_at ? u.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        pan: 'N/A', aadhaar: 'N/A', phone: 'N/A', address: 'N/A', bank: 'N/A', account: 'N/A', ifsc: 'N/A',
      }));
      setList(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KYC records');
    } finally { setLoading(false); }
  }, []);

  const { lastUpdated, refresh } = usePolling(load, 60_000);
  const timeSince = useTimeSince(lastUpdated);

  /* Sync search to URL */
  const handleSearch = (val: string) => {
    setSearch(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('search', val); else params.delete('search');
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const setStatus = async (id: string, next: KycStatus) => {
    const record = list.find(k => k.id === id);
    if (!record) return;
    setActing(id);
    setList(prev => prev.map(k => (k.id === id ? { ...k, kyc_status: next } : k)));
    try { await updateKycStatus(Number(id), record.email, next); }
    catch { setList(prev => prev.map(k => (k.id === id ? { ...k, kyc_status: record.kyc_status } : k))); }
    finally { setActing(null); }
  };

  const filtered = useMemo(() =>
    list.filter(u => filter === 'all' || u.kyc_status === filter)
      .filter(u => search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())),
    [list, filter, search]);

  const counts = useMemo(() => ({
    all: list.length,
    pending: list.filter(u => u.kyc_status === 'pending').length,
    approved: list.filter(u => u.kyc_status === 'approved').length,
    rejected: list.filter(u => u.kyc_status === 'rejected').length,
  }), [list]);

  const FILTER_OPTIONS = [
    { key: 'all', label: 'All Users', color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
    { key: 'pending', label: 'Pending', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    { key: 'approved', label: 'Approved', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    { key: 'rejected', label: 'Rejected', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  ] as const;

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-4">

      {/* ── Stats Bar ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
        {FILTER_OPTIONS.map(s => {
          const active = filter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setFilter(s.key as KycStatus | 'all')}
              style={{
                borderRadius: 14, padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                background: active ? s.bg : CARD,
                border: `1px solid ${active ? s.color + '44' : CARD_BORDER}`,
                transition: 'all 0.2s',
                boxShadow: active ? `0 0 16px ${s.color}22` : 'none',
              }}
            >
              <p style={{ fontSize: 22, fontWeight: 900, color: active ? s.color : 'rgba(255,255,255,0.7)' }}>
                {counts[s.key as keyof typeof counts]}
              </p>
              <p style={{ fontSize: 11, fontWeight: 500, marginTop: 2, color: active ? s.color : TEXT_DIM }}>
                {s.label}
              </p>
            </button>
          );
        })}
      </motion.div>

      {/* ── Toolbar ── */}
      <motion.div variants={fadeUp} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: TEXT_DIM }} />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              borderRadius: 12, background: CARD, border: `1px solid ${CARD_BORDER}`,
              color: 'white', fontSize: 13, outline: 'none',
            }}
          />
        </div>
        <button
          onClick={refresh}
          style={{ padding: 10, borderRadius: 12, background: CARD, border: `1px solid ${CARD_BORDER}`, cursor: 'pointer', color: TEXT_MID, display: 'flex', alignItems: 'center' }}
          title="Refresh"
        >
          <RefreshCw style={{ width: 15, height: 15, ...(loading ? { animation: 'spin 1s linear infinite' } : {}) }} />
        </button>
        {filtered.length > 0 && (
          <button
            onClick={() => exportCSV('kyc_records.csv', filtered.map(u => ({
              'Partner ID': u.id, 'Name': u.name, 'Email': u.email, 'Role': u.role,
              'KYC Status': u.kyc_status, 'Submitted': u.submitted,
            })))}
            style={{ fontSize: 12, padding: '8px 14px', borderRadius: 12, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', cursor: 'pointer', color: '#60a5fa', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            ↓ Export CSV
          </button>
        )}
        {lastUpdated && (
          <span style={{ fontSize: 11, color: TEXT_DIM, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 4px #34d399' }} />
            {timeSince}
          </span>
        )}
      </motion.div>

      {/* ── States ── */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_DIM, padding: '12px 0' }}>
          <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
          Loading KYC records from Odoo…
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}>
          <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} /> {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: TEXT_DIM }}>
          <User style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.25 }} />
          <p style={{ fontWeight: 600 }}>No KYC records found</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters</p>
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
              style={{ background: CARD, border: `1px solid ${CARD_BORDER}`, borderRadius: 16, overflow: 'hidden' }}
            >
              {/* Status stripe */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.dot}88)` }} />

              {/* Row */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 800, color: '#c084fc' }}>
                    {kyc.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: 'white', marginBottom: 2, fontSize: 14 }}>{kyc.name}</p>
                    <p style={{ fontSize: 11, color: TEXT_DIM, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail style={{ width: 10, height: 10 }} />{kyc.email}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* Status badge */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
                    <Icon style={{ width: 11, height: 11 }} />{cfg.label}
                  </span>
                  {/* Role badge */}
                  <span style={{ display: 'inline-block', padding: '4px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, color: TEXT_MID, background: 'rgba(255,255,255,0.06)', border: `1px solid ${CARD_BORDER}`, textTransform: 'capitalize' }}>
                    {kyc.role}
                  </span>
                  <span style={{ fontSize: 11, color: TEXT_DIM }}>
                    <span className="hidden sm:inline">{kyc.submitted}</span>
                  </span>
                  <button
                    onClick={() => setExpanded(open ? null : kyc.id)}
                    style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${CARD_BORDER}`, cursor: 'pointer', color: TEXT_DIM, display: 'flex', alignItems: 'center' }}
                  >
                    {open ? <ChevronUp style={{ width: 15, height: 15 }} /> : <ChevronDown style={{ width: 15, height: 15 }} />}
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
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: `1px solid ${CARD_BORDER}`, padding: '20px 20px 20px' }}>
                      {/* KYC Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ marginBottom: 20 }}>
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
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 16, borderTop: `1px solid ${CARD_BORDER}` }}>
                        {kyc.kyc_status === 'pending' && (
                          <>
                            <button
                              onClick={() => setStatus(kyc.id, 'approved')} disabled={busy}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)', opacity: busy ? 0.6 : 1 }}
                            >
                              <CheckCircle style={{ width: 14, height: 14 }} /> {busy ? 'Approving…' : 'Approve KYC'}
                            </button>
                            <button
                              onClick={() => setStatus(kyc.id, 'rejected')} disabled={busy}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', opacity: busy ? 0.6 : 1 }}
                            >
                              <XCircle style={{ width: 14, height: 14 }} /> Reject
                            </button>
                          </>
                        )}
                        {kyc.kyc_status === 'approved' && (
                          <>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                              <CheckCircle style={{ width: 14, height: 14 }} /> KYC Approved
                            </span>
                            <button
                              onClick={() => setStatus(kyc.id, 'rejected')} disabled={busy}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', opacity: busy ? 0.6 : 1 }}
                            >
                              <XCircle style={{ width: 13, height: 13 }} /> Revoke
                            </button>
                          </>
                        )}
                        {kyc.kyc_status === 'rejected' && (
                          <>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                              <XCircle style={{ width: 14, height: 14 }} /> KYC Rejected
                            </span>
                            <button
                              onClick={() => setStatus(kyc.id, 'approved')} disabled={busy}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', opacity: busy ? 0.6 : 1 }}
                            >
                              <CheckCircle style={{ width: 13, height: 13 }} /> Re-Approve
                            </button>
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

export default function KycTab() {
  return (
    <Suspense fallback={null}>
      <KycTabInner />
    </Suspense>
  );
}
