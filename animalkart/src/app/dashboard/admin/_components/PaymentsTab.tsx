'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, Eye, CreditCard, RefreshCw,
  AlertCircle, Search, ChevronDown, ChevronUp, Truck,
  FileText, Hash, IndianRupee, Calendar, User, X,
  ShoppingCart, Package, Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  fetchAdminInvoices, fetchAdminOrders, approveAdminOrder,
  markOrderDelivered, payAdminInvoice, validateDelivery,
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

/* ── Status config ── */
const orderStateCfg: Record<string, { label: string; cls: string; dot: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  sent: { label: 'Sent', cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
  sale: { label: 'Confirmed', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  done: { label: 'Done', cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  cancel: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-400' },
};

function cfgFor(state?: string | null) {
  return orderStateCfg[state ?? ''] ?? orderStateCfg['draft'];
}

function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* ── Order Detail Modal ── */
function OrderModal({ order, invoice, onClose }: {
  order: AdminOrder;
  invoice?: AdminInvoice;
  onClose: () => void;
}) {
  const cfg = cfgFor(order.status);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{order.order_number}</p>
              <p className="text-xs text-gray-400">Order Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Hash, label: 'Order ID', value: String(order.order_id) },
              { icon: Calendar, label: 'Created', value: order.created_at?.slice(0, 10) || '—' },
              { icon: User, label: 'Customer', value: order.customer_name },
              { icon: IndianRupee, label: 'Amount', value: fmtINR(order.total_amount) },
              { icon: Package, label: 'Status', value: cfg.label },
              { icon: FileText, label: 'Order Ref', value: order.order_number },
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800 break-all">{value}</p>
              </div>
            ))}
          </div>

          {invoice && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-600 mb-2">Linked Invoice</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-xs text-gray-400">Invoice #</p><p className="font-medium">{invoice.invoice_number}</p></div>
                <div><p className="text-xs text-gray-400">Payment</p><p className="font-medium capitalize">{invoice.payment_state || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Amount</p><p className="font-medium">{fmtINR(invoice.amount)}</p></div>
                <div><p className="text-xs text-gray-400">Date</p><p className="font-medium">{invoice.invoice_date?.slice(0, 10) || '—'}</p></div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
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

  // Reduced-motion-aware — a11y users get instant renders
  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerFastVariants);
  const viewport = VIEWPORT_SECTION;
  const cardViewport = VIEWPORT_CARD;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ord, inv] = await Promise.all([fetchAdminOrders(), fetchAdminInvoices()]);
      setOrders(ord);
      setInvoices(inv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── Maps ── */
  // Map: order_number -> linked invoice
  const invoiceByOrderRef = useMemo(() => {
    const m = new Map<string, AdminInvoice>();
    for (const inv of invoices) {
      if (inv.order_reference) m.set(inv.order_reference, inv);
    }
    return m;
  }, [invoices]);

  /* ── Filtered ── */
  const filtered = useMemo(() => {
    return orders
      .filter(o => filterState === 'all' || o.status === filterState)
      .filter(o =>
        search === '' ||
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()),
      );
  }, [orders, filterState, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      c[o.status] = (c[o.status] ?? 0) + 1;
    }
    return c;
  }, [orders]);

  const totalRevenue = useMemo(() =>
    orders.filter(o => o.status === 'sale' || o.status === 'done').reduce((s, o) => s + o.total_amount, 0),
    [orders]);

  /* ── Actions ── */
  const doApprove = async (order: AdminOrder) => {
    setActing({ id: order.order_id, action: 'approve' });
    try {
      await approveAdminOrder(order.order_id);
      showToast(`Order ${order.order_number} approved — confirmed, delivered, invoiced & posted!`);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Approve failed', false);
    } finally {
      setActing(null);
    }
  };

  const doDeliver = async (order: AdminOrder) => {
    setActing({ id: order.order_id, action: 'deliver' });
    try {
      await markOrderDelivered(order.order_id);
      showToast(`Order ${order.order_number} delivery validated!`);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Deliver failed', false);
    } finally {
      setActing(null);
    }
  };

  const doGenerateInvoice = async (order: AdminOrder) => {
    setActing({ id: order.order_id, action: 'invoice' });
    try {
      const result = await generateInvoice(order.order_id);
      showToast(`Invoice ${result.invoice_number} generated for ${order.order_number}!`);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Invoice generation failed', false);
    } finally {
      setActing(null);
    }
  };

  const doPayInvoice = async (order: AdminOrder) => {
    const inv = invoiceByOrderRef.get(order.order_number);
    if (!inv) { showToast('No linked invoice found', false); return; }
    setActing({ id: order.order_id, action: 'pay' });
    try {
      await payAdminInvoice(inv.invoice_id);
      showToast(`Payment registered for invoice ${inv.invoice_number}!`);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Payment failed', false);
    } finally {
      setActing(null);
    }
  };

  /* ── Filter Tabs ── */
  const FILTERS = [
    { key: 'all', label: 'All Orders' },
    { key: 'draft', label: 'Draft' },
    { key: 'sale', label: 'Confirmed' },
    { key: 'done', label: 'Done' },
    { key: 'cancel', label: 'Cancelled' },
  ];

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-4">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-md ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
          >
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{orders.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Orders</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-center">
          <p className="text-2xl font-black text-amber-700">
            {orders.filter(o => o.status === 'draft').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-black text-green-700">
            {orders.filter(o => o.status === 'sale' || o.status === 'done').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Confirmed</p>
        </div>
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 text-center">
          <p className="text-xl font-black text-indigo-700">
            {totalRevenue >= 1e7
              ? `₹${(totalRevenue / 1e7).toFixed(2)} Cr`
              : totalRevenue >= 1e5
                ? `₹${(totalRevenue / 1e5).toFixed(2)} L`
                : fmtINR(totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Revenue</p>
        </div>
      </motion.div>

      {/* Filter Tabs + Search */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterState(f.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${filterState === f.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
            >
              {f.label} {counts[f.key] !== undefined ? `(${counts[f.key]})` : ''}
            </button>
          ))}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…" className="pl-8 text-sm" />
          </div>
          <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* States */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading orders from Odoo…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-4">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No orders found</p>
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
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={cardViewport}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Status stripe */}
              <div className={`h-1 ${cfg.dot}`} />

              <div className="p-5">
                {/* Row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-bold text-gray-900">{order.order_number}</p>
                        <Badge className={`text-xs border ${cfg.cls}`}>{cfg.label}</Badge>
                        {linkedInvoice && (
                          <Badge className={`text-xs border ${isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                            {isPaid ? '💰 Paid' : '🧾 Invoiced'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {order.customer_name} · {order.created_at?.slice(0, 10) || '—'}
                      </p>
                      <p className="text-lg font-black text-gray-900 mt-1.5">{fmtINR(order.total_amount)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpanded(open ? null : order.order_id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ── Action Buttons ── */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                  {/* View Details */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => setViewOrder(order)}
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Button>

                  {/* DRAFT → Approve (Confirm + Deliver + Invoice + Post) */}
                  {order.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => doApprove(order)}
                      disabled={!!busy}
                      className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {busy && acting?.action === 'approve' ? 'Approving…' : 'Approve Order'}
                    </Button>
                  )}

                  {/* CONFIRMED (sale) → Validate Delivery */}
                  {order.status === 'sale' && !linkedInvoice && (
                    <Button
                      size="sm"
                      onClick={() => doDeliver(order)}
                      disabled={!!busy}
                      className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      {busy && acting?.action === 'deliver' ? 'Delivering…' : 'Validate Delivery'}
                    </Button>
                  )}

                  {/* CONFIRMED (sale) → Generate Invoice (if not already invoiced) */}
                  {order.status === 'sale' && !linkedInvoice && (
                    <Button
                      size="sm"
                      onClick={() => doGenerateInvoice(order)}
                      disabled={!!busy}
                      variant="outline"
                      className="gap-1.5 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      {busy && acting?.action === 'invoice' ? 'Generating…' : 'Generate Invoice'}
                    </Button>
                  )}

                  {/* Has invoice but not paid → Mark Paid */}
                  {linkedInvoice && !isPaid && (
                    <Button
                      size="sm"
                      onClick={() => doPayInvoice(order)}
                      disabled={!!busy}
                      className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      {busy && acting?.action === 'pay' ? 'Processing…' : 'Confirm Payment'}
                    </Button>
                  )}

                  {/* Done + Paid status badge */}
                  {order.status === 'done' && isPaid && (
                    <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                      <CheckCircle className="w-3.5 h-3.5" /> Fully Complete
                    </span>
                  )}

                  {/* Cancelled */}
                  {order.status === 'cancel' && (
                    <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                      <XCircle className="w-3.5 h-3.5" /> Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded row details */}
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Order ID</p>
                          <p className="font-mono font-bold text-sm text-gray-800 mt-0.5">{order.order_id}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Status</p>
                          <p className="font-bold text-sm text-gray-800 mt-0.5 capitalize">{cfg.label}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Customer</p>
                          <p className="font-bold text-sm text-gray-800 mt-0.5 truncate">{order.customer_name}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Invoice</p>
                          <p className="font-bold text-sm text-gray-800 mt-0.5">
                            {linkedInvoice ? `${linkedInvoice.invoice_number} (${linkedInvoice.payment_state || '—'})` : 'None'}
                          </p>
                        </div>
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
        {viewOrder && (
          <OrderModal
            order={viewOrder}
            invoice={invoiceByOrderRef.get(viewOrder.order_number)}
            onClose={() => setViewOrder(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
