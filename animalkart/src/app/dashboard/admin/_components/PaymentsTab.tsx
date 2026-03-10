'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, Eye, CreditCard, RefreshCw,
  AlertCircle, Search, ChevronDown, ChevronUp, Truck,
  FileText, Hash, IndianRupee, Calendar, User, X,
  ShoppingCart, Package, Receipt,
} from 'lucide-react';
import {
  fetchAdminInvoices, fetchAdminOrders, approveAdminOrder,
  markOrderDelivered, payAdminInvoice,
  generateInvoice,
  type AdminInvoice, type AdminOrder,
} from '@/lib/api';
import {
  useSafeAnimation,
  fadeUpVariants,
  staggerFastVariants,
  VIEWPORT_SECTION,
  VIEWPORT_CARD,
} from '@/lib/hooks/useAnimation';

/* ── Dark palette constants ── */
const CARD = 'rgba(255,255,255,0.04)';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const ROW_BG = 'rgba(255,255,255,0.03)';
const TEXT_DIM = 'rgba(255,255,255,0.4)';
const TEXT_MID = 'rgba(255,255,255,0.65)';

/* ── Status config (dark) ── */
const orderStateCfg: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft: { label: 'Draft', color: TEXT_MID, bg: CARD, dot: 'rgba(255,255,255,0.3)' },
  sent: { label: 'Sent', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', dot: '#60a5fa' },
  sale: { label: 'Confirmed', color: '#c084fc', bg: 'rgba(192,132,252,0.12)', dot: '#c084fc' },
  done: { label: 'Done', color: '#34d399', bg: 'rgba(52,211,153,0.12)', dot: '#34d399' },
  cancel: { label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.12)', dot: '#f87171' },
};

function cfgFor(state?: string | null) { return orderStateCfg[state ?? ''] ?? orderStateCfg['draft']; }
function fmtINR(n: number) { return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }

/* ── Dark Order Detail Modal ── */
function OrderModal({ order, invoice, onClose }: { order: AdminOrder; invoice?: AdminInvoice; onClose: () => void }) {
  const cfg = cfgFor(order.status);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ position: 'relative', background: '#0d1a12', border: `1px solid ${CARD_BORDER}`, borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', width: '100%', maxWidth: 440 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${CARD_BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(192,132,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart style={{ width: 18, height: 18, color: '#c084fc' }} />
            </div>
            <div>
              <p style={{ fontWeight: 800, color: 'white', fontSize: 15 }}>{order.order_number}</p>
              <p style={{ fontSize: 11, color: TEXT_DIM }}>Order Details</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${CARD_BORDER}`, cursor: 'pointer', color: TEXT_MID, display: 'flex' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: Hash, label: 'Order ID', value: String(order.order_id) },
              { icon: Calendar, label: 'Created', value: order.created_at?.slice(0, 10) || '—' },
              { icon: User, label: 'Customer', value: order.customer_name },
              { icon: IndianRupee, label: 'Amount', value: fmtINR(order.total_amount) },
              { icon: Package, label: 'Status', value: cfg.label },
              { icon: FileText, label: 'Order Ref', value: order.order_number },
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={i} style={{ background: ROW_BG, borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <Icon style={{ width: 11, height: 11, color: TEXT_DIM }} />
                  <p style={{ fontSize: 10, color: TEXT_DIM }}>{label}</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', wordBreak: 'break-all' }}>{value}</p>
              </div>
            ))}
          </div>

          {invoice && (
            <div style={{ background: 'rgba(192,132,252,0.08)', borderRadius: 12, padding: 16, border: '1px solid rgba(192,132,252,0.15)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', marginBottom: 10 }}>Linked Invoice</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><p style={{ fontSize: 10, color: TEXT_DIM }}>Invoice #</p><p style={{ fontWeight: 600, color: 'white' }}>{invoice.invoice_number}</p></div>
                <div><p style={{ fontSize: 10, color: TEXT_DIM }}>Payment</p><p style={{ fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>{invoice.payment_state || '—'}</p></div>
                <div><p style={{ fontSize: 10, color: TEXT_DIM }}>Amount</p><p style={{ fontWeight: 600, color: 'white' }}>{fmtINR(invoice.amount)}</p></div>
                <div><p style={{ fontSize: 10, color: TEXT_DIM }}>Date</p><p style={{ fontWeight: 600, color: 'white' }}>{invoice.invoice_date?.slice(0, 10) || '—'}</p></div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 12, background: CARD, border: `1px solid ${CARD_BORDER}`, color: TEXT_MID, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main ── */
export default function PaymentsTab() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [acting, setActing] = useState<{ id: number; action: string } | null>(null);
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerFastVariants);
  const viewport = VIEWPORT_SECTION;
  const cardViewport = VIEWPORT_CARD;

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [ord, inv] = await Promise.all([fetchAdminOrders(), fetchAdminInvoices()]);
      setOrders(ord); setInvoices(inv);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load orders'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const invoiceByOrderRef = useMemo(() => {
    const m = new Map<string, AdminInvoice>();
    for (const inv of invoices) { if (inv.order_reference) m.set(inv.order_reference, inv); }
    return m;
  }, [invoices]);

  const filtered = useMemo(() =>
    orders.filter(o => filterState === 'all' || o.status === filterState)
      .filter(o => search === '' || o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase())),
    [orders, filterState, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) { c[o.status] = (c[o.status] ?? 0) + 1; }
    return c;
  }, [orders]);

  const totalRevenue = useMemo(() =>
    orders.filter(o => o.status === 'sale' || o.status === 'done').reduce((s, o) => s + o.total_amount, 0), [orders]);

  const doApprove = async (order: AdminOrder) => {
    setActing({ id: order.order_id, action: 'approve' });
    try { await approveAdminOrder(order.order_id); showToast(`Order ${order.order_number} approved!`); await load(); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Approve failed', false); }
    finally { setActing(null); }
  };

  const doDeliver = async (order: AdminOrder) => {
    setActing({ id: order.order_id, action: 'deliver' });
    try { await markOrderDelivered(order.order_id); showToast(`Order ${order.order_number} delivery validated!`); await load(); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Deliver failed', false); }
    finally { setActing(null); }
  };

  const doGenerateInvoice = async (order: AdminOrder) => {
    setActing({ id: order.order_id, action: 'invoice' });
    try { const r = await generateInvoice(order.order_id); showToast(`Invoice ${r.invoice_number} generated!`); await load(); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Invoice generation failed', false); }
    finally { setActing(null); }
  };

  const doPayInvoice = async (order: AdminOrder) => {
    const inv = invoiceByOrderRef.get(order.order_number);
    if (!inv) { showToast('No linked invoice found', false); return; }
    setActing({ id: order.order_id, action: 'pay' });
    try { await payAdminInvoice(inv.invoice_id); showToast(`Payment registered for invoice ${inv.invoice_number}!`); await load(); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Payment failed', false); }
    finally { setActing(null); }
  };

  const FILTERS = [
    { key: 'all', label: 'All Orders' },
    { key: 'draft', label: 'Draft' },
    { key: 'sale', label: 'Confirmed' },
    { key: 'done', label: 'Done' },
    { key: 'cancel', label: 'Cancelled' },
  ];

  /* ── Summary card data ── */
  const SUMMARY = [
    { label: 'Total Orders', value: String(orders.length), color: 'white', bg: CARD },
    { label: 'Pending', value: String(orders.filter(o => o.status === 'draft').length), color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
    { label: 'Confirmed', value: String(orders.filter(o => o.status === 'sale' || o.status === 'done').length), color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    {
      label: 'Revenue', color: '#c084fc', bg: 'rgba(192,132,252,0.08)',
      value: totalRevenue >= 1e7 ? `₹${(totalRevenue / 1e7).toFixed(2)} Cr` : totalRevenue >= 1e5 ? `₹${(totalRevenue / 1e5).toFixed(2)} L` : fmtINR(totalRevenue),
    },
  ];

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-4">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', background: toast.ok ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', color: toast.ok ? '#34d399' : '#f87171', border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}
          >
            {toast.ok ? <CheckCircle style={{ width: 15, height: 15 }} /> : <AlertCircle style={{ width: 15, height: 15 }} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
        {SUMMARY.map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 16, border: `1px solid ${CARD_BORDER}`, padding: '14px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11, color: TEXT_DIM, marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Filter Tabs + Search */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const active = filterState === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilterState(f.key)}
                style={{
                  fontSize: 12, padding: '6px 12px', borderRadius: 10, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s',
                  background: active ? 'rgba(52,211,153,0.15)' : CARD,
                  color: active ? '#34d399' : TEXT_MID,
                  border: `1px solid ${active ? 'rgba(52,211,153,0.35)' : CARD_BORDER}`,
                }}
              >
                {f.label} {counts[f.key] !== undefined ? `(${counts[f.key]})` : ''}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <div style={{ position: 'relative', minWidth: 192 }}>
            <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: TEXT_DIM }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…"
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, background: CARD, border: `1px solid ${CARD_BORDER}`, color: 'white', fontSize: 12, outline: 'none' }}
            />
          </div>
          <button onClick={load} style={{ padding: 9, borderRadius: 10, background: CARD, border: `1px solid ${CARD_BORDER}`, cursor: 'pointer', color: TEXT_MID, display: 'flex', alignItems: 'center' }}>
            <RefreshCw style={{ width: 14, height: 14, ...(loading ? { animation: 'spin 1s linear infinite' } : {}) }} />
          </button>
        </div>
      </motion.div>

      {/* States */}
      {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_DIM, padding: '12px 0' }}><RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Loading orders from Odoo…</div>}
      {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}><AlertCircle style={{ width: 14, height: 14 }} />{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: TEXT_DIM }}>
          <ShoppingCart style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontWeight: 600 }}>No orders found</p>
        </div>
      )}

      {/* Order Cards */}
      <AnimatePresence>
        {filtered.map(order => {
          const cfg = cfgFor(order.status);
          const open = expanded === order.order_id;
          const busy = acting?.id === order.order_id;
          const linkedInvoice = invoiceByOrderRef.get(order.order_number);
          const isPaid = linkedInvoice?.payment_state === 'paid';

          return (
            <motion.div
              key={order.order_id}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={cardViewport} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: CARD, border: `1px solid ${CARD_BORDER}`, borderRadius: 16, overflow: 'hidden' }}
            >
              {/* Status stripe */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.dot}88)` }} />

              <div style={{ padding: 20 }}>
                {/* Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShoppingCart style={{ width: 20, height: 20, color: '#60a5fa' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <p style={{ fontWeight: 800, color: 'white', fontSize: 14 }}>{order.order_number}</p>
                        <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>{cfg.label}</span>
                        {linkedInvoice && (
                          <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: isPaid ? '#34d399' : '#fbbf24', background: isPaid ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)', border: isPaid ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(251,191,36,0.3)' }}>
                            {isPaid ? '💰 Paid' : '🧾 Invoiced'}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: TEXT_DIM }}>{order.customer_name} · {order.created_at?.slice(0, 10) || '—'}</p>
                      <p style={{ fontSize: 17, fontWeight: 900, color: 'white', marginTop: 5 }}>{fmtINR(order.total_amount)}</p>
                    </div>
                  </div>
                  <button onClick={() => setExpanded(open ? null : order.order_id)} style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${CARD_BORDER}`, cursor: 'pointer', color: TEXT_DIM, display: 'flex', alignItems: 'center' }}>
                    {open ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                  </button>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${CARD_BORDER}` }}>
                  <button onClick={() => setViewOrder(order)} style={btnStyle('rgba(255,255,255,0.06)', TEXT_MID, 'rgba(255,255,255,0.12)')}>
                    <Eye style={{ width: 13, height: 13 }} /> View
                  </button>

                  {order.status === 'draft' && (
                    <button onClick={() => doApprove(order)} disabled={!!busy} style={btnStyle('rgba(192,132,252,0.12)', '#c084fc', 'rgba(192,132,252,0.3)', busy)}>
                      <CheckCircle style={{ width: 13, height: 13 }} />
                      {busy && acting?.action === 'approve' ? 'Approving…' : 'Approve Order'}
                    </button>
                  )}
                  {order.status === 'sale' && !linkedInvoice && (
                    <button onClick={() => doDeliver(order)} disabled={!!busy} style={btnStyle('rgba(96,165,250,0.12)', '#60a5fa', 'rgba(96,165,250,0.3)', busy)}>
                      <Truck style={{ width: 13, height: 13 }} />
                      {busy && acting?.action === 'deliver' ? 'Delivering…' : 'Validate Delivery'}
                    </button>
                  )}
                  {order.status === 'sale' && !linkedInvoice && (
                    <button onClick={() => doGenerateInvoice(order)} disabled={!!busy} style={btnStyle('rgba(251,191,36,0.1)', '#fbbf24', 'rgba(251,191,36,0.25)', busy)}>
                      <Receipt style={{ width: 13, height: 13 }} />
                      {busy && acting?.action === 'invoice' ? 'Generating…' : 'Generate Invoice'}
                    </button>
                  )}
                  {linkedInvoice && !isPaid && (
                    <button onClick={() => doPayInvoice(order)} disabled={!!busy} style={btnStyle('rgba(52,211,153,0.12)', '#34d399', 'rgba(52,211,153,0.3)', busy)}>
                      <IndianRupee style={{ width: 13, height: 13 }} />
                      {busy && acting?.action === 'pay' ? 'Processing…' : 'Confirm Payment'}
                    </button>
                  )}
                  {order.status === 'done' && isPaid && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                      <CheckCircle style={{ width: 13, height: 13 }} /> Fully Complete
                    </span>
                  )}
                  {order.status === 'cancel' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <XCircle style={{ width: 13, height: 13 }} /> Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded row details */}
              <AnimatePresence>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                    <div style={{ borderTop: `1px solid ${CARD_BORDER}`, padding: '16px 20px 20px' }}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Order ID', value: String(order.order_id) },
                          { label: 'Status', value: cfg.label },
                          { label: 'Customer', value: order.customer_name },
                          { label: 'Invoice', value: linkedInvoice ? `${linkedInvoice.invoice_number} (${linkedInvoice.payment_state || '—'})` : 'None' },
                        ].map((item, i) => (
                          <div key={i} style={{ background: ROW_BG, borderRadius: 10, padding: 12 }}>
                            <p style={{ fontSize: 10, color: TEXT_DIM }}>{item.label}</p>
                            <p style={{ fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {viewOrder && <OrderModal order={viewOrder} invoice={invoiceByOrderRef.get(viewOrder.order_number)} onClose={() => setViewOrder(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Inline button style helper ── */
function btnStyle(bg: string, color: string, border: string, disabled?: boolean | null): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
    background: bg, color, border: `1px solid ${border}`, opacity: disabled ? 0.5 : 1,
  };
}
