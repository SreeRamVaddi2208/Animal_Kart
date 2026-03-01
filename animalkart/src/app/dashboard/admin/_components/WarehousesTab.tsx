'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Package, RefreshCw, AlertCircle, CheckCircle, X, Search,
  Hash, PackagePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchAdminWarehouses, fetchWarehouseStock, fetchAdminWarehouseSales,
  createAdminWarehouse, updateAdminWarehouse, deleteAdminWarehouse,
  fetchAdminWarehouseStock, addAdminWarehouseStock, fetchAdminProducts,
  type AdminWarehouse, type AdminWarehouseStock, type AdminProduct,
} from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import {
  useSafeAnimation,
  fadeUpVariants,
  staggerFastVariants,
  VIEWPORT_SECTION,
  VIEWPORT_CARD,
} from '@/lib/hooks/useAnimation';

type WarehouseRow = AdminWarehouse & {
  available: number;
  sold: number;
  total: number;
};

/* ── Shared Modal Shell ── */
function Modal({
  title, onClose, children, wide,
}: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} p-6`}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/* ── Delete Confirm Modal ── */
function DeleteModal({
  warehouse, onConfirm, onClose, loading,
}: { warehouse: WarehouseRow; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <Modal title="Delete Warehouse" onClose={onClose}>
      <div className="bg-red-50 rounded-xl p-4 mb-5 text-sm text-red-700 border border-red-100">
        <p className="font-semibold mb-1">⚠️ This action cannot be undone.</p>
        <p>You are about to archive <strong>{warehouse.name}</strong> ({warehouse.code}).</p>
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? 'Deleting…' : 'Yes, Delete'}
        </Button>
      </div>
    </Modal>
  );
}

/* ── Create / Edit Modal ── */
function WarehouseFormModal({
  warehouse, onSave, onClose,
}: {
  warehouse?: WarehouseRow | null;
  onSave: (name: string, code: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(warehouse?.name ?? '');
  const [code, setCode] = useState(warehouse?.code ?? '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!name.trim() || !code.trim()) { setErr('Name and code are required.'); return; }
    setLoading(true);
    setErr('');
    try {
      await onSave(name.trim(), code.trim().toUpperCase());
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save warehouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={warehouse ? 'Edit Warehouse' : 'New Warehouse'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Warehouse Name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Chennai Central"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Short Code</Label>
          <Input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. CHC"
            maxLength={10}
          />
        </div>
        {err && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{err}</p>}
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? 'Saving…' : warehouse ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Add Stock Modal ── */
function AddStockModal({
  warehouse, onClose, onSuccess,
}: {
  warehouse: WarehouseRow;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchAdminProducts()
      .then(prods => {
        setProducts(prods);
        if (prods.length > 0) setSelectedProduct(prods[0].id);
      })
      .catch(() => setErr('Failed to load products'))
      .finally(() => setLoadingProducts(false));
  }, []);

  const submit = async () => {
    if (!selectedProduct) { setErr('Please select a product.'); return; }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { setErr('Quantity must be greater than 0.'); return; }
    setSaving(true);
    setErr('');
    try {
      await addAdminWarehouseStock({
        product_id: selectedProduct,
        warehouse_id: warehouse.id,
        quantity: qty,
      });
      const prod = products.find(p => p.id === selectedProduct);
      onSuccess(`Added ${qty} units of "${prod?.name ?? 'Product'}" to ${warehouse.name}`);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to add stock');
    } finally {
      setSaving(false);
    }
  };

  const selected = products.find(p => p.id === selectedProduct);

  return (
    <Modal title={`Add Stock — ${warehouse.name}`} onClose={onClose} wide>
      <div className="space-y-4">
        {/* Warehouse info badge */}
        <div className="flex items-center gap-2 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
          <Warehouse className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-800">{warehouse.name}</span>
          <Badge className="text-xs bg-indigo-100 text-indigo-600 border border-indigo-200 ml-auto">{warehouse.code}</Badge>
        </div>

        {/* Product selection */}
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Select Product</Label>
          {loadingProducts ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading products…
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No products available</p>
          ) : (
            <select
              value={selectedProduct ?? ''}
              onChange={e => setSelectedProduct(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
            >
              {Array.from(new Map(products.map(p => [p.id, p])).values()).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(${p.sku})` : ''} — ₹{p.price.toLocaleString('en-IN')}/unit
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected product info */}
        {selected && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-400">SKU</p>
              <p className="text-sm font-mono font-bold text-gray-700 mt-0.5">{selected.sku || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-400">Unit Price</p>
              <p className="text-sm font-bold text-gray-700 mt-0.5">₹{selected.price.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-400">Current Stock</p>
              <p className="text-sm font-bold text-gray-700 mt-0.5">{selected.stock_available}</p>
            </div>
          </div>
        )}

        {/* Quantity input */}
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Quantity to Add</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="e.g. 100"
            className="text-lg font-bold"
          />
        </div>

        {err && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{err}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={saving || loadingProducts || !selectedProduct}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <PackagePlus className="w-4 h-4" />
            {saving ? 'Adding Stock…' : 'Add Stock'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Stock Drawer ── */
function StockDrawer({ warehouse, onClose }: { warehouse: WarehouseRow; onClose: () => void }) {
  const [stock, setStock] = useState<AdminWarehouseStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAdminWarehouseStock(warehouse.id)
      .then(setStock)
      .catch(() => setStock([]))
      .finally(() => setLoading(false));
  }, [warehouse.id]);

  const filtered = stock.filter(s =>
    search === '' ||
    s.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.sku ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal title={`📦 Stock — ${warehouse.name}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="pl-8 text-sm"
          />
        </div>
        {loading && <p className="text-sm text-gray-400 py-4 text-center">Loading stock…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">No products found.</p>
        )}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {filtered.map(item => (
            <div key={item.product_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                <p className="text-xs text-gray-400">{item.sku || '—'} · ₹{item.unit_price.toLocaleString('en-IN')}/unit</p>
              </div>
              <Badge
                className={`text-xs font-bold ml-3 flex-shrink-0 ${item.qty_available > 50 ? 'bg-green-100 text-green-700'
                  : item.qty_available > 10 ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                  }`}
              >
                {item.qty_available} units
              </Badge>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-1" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

/* ── Main Component ── */
export default function WarehousesTab() {
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Reduced-motion-aware — a11y users get instant renders
  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerFastVariants);
  const viewport = VIEWPORT_SECTION;
  const cardViewport = VIEWPORT_CARD;

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<WarehouseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseRow | null>(null);
  const [stockTarget, setStockTarget] = useState<WarehouseRow | null>(null);
  const [addStockTarget, setAddStockTarget] = useState<WarehouseRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [whMeta, stock, sales] = await Promise.all([
        fetchAdminWarehouses(),
        fetchWarehouseStock(),
        fetchAdminWarehouseSales(),
      ]);

      const byId = new Map<number, WarehouseRow>();
      for (const wh of whMeta) {
        byId.set(wh.id, { ...wh, available: 0, sold: 0, total: 0 });
      }
      for (const row of stock) {
        const cur = byId.get(row.warehouse_id);
        if (cur) byId.set(row.warehouse_id, { ...cur, available: cur.available + row.qty_available, total: cur.total + row.qty_available });
      }
      for (const sale of sales) {
        const cur = byId.get(sale.warehouse_id);
        if (cur) byId.set(sale.warehouse_id, { ...cur, sold: cur.sold + sale.units_sold });
      }
      setWarehouses(Array.from(byId.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (name: string, code: string) => {
    const created = await createAdminWarehouse({ name, code });
    setWarehouses(prev => [...prev, { ...created, available: 0, sold: 0, total: 0 }]);
    showToast(`Warehouse "${name}" created!`);
  };

  const handleEdit = async (name: string, code: string) => {
    if (!editTarget) return;
    await updateAdminWarehouse(editTarget.id, { name, code });
    setWarehouses(prev => prev.map(w => w.id === editTarget.id ? { ...w, name, code } : w));
    showToast(`Warehouse updated!`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminWarehouse(deleteTarget.id);
      setWarehouses(prev => prev.filter(w => w.id !== deleteTarget.id));
      showToast(`Warehouse deleted.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Delete failed', false);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleAddStockSuccess = (msg: string) => {
    showToast(msg);
    load(); // refresh stock numbers
  };

  const filtered = useMemo(() =>
    warehouses.filter(w =>
      search === '' ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.code ?? '').toLowerCase().includes(search.toLowerCase()),
    ), [warehouses, search]);

  const totals = useMemo(() => ({
    capacity: warehouses.reduce((s, w) => s + w.total, 0),
    sold: warehouses.reduce((s, w) => s + w.sold, 0),
    avail: warehouses.reduce((s, w) => s + w.available, 0),
  }), [warehouses]);

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-4">

      {/* ─ Toast ─ */}
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

      {/* ─ Summary Cards ─ */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Warehouses', value: warehouses.length, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Units Sold', value: totals.sold, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Units Available', value: totals.avail, color: 'text-blue-700', bg: 'bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 text-center border border-gray-100`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ─ Toolbar ─ */}
      <motion.div variants={fadeUp} className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search warehouses…" className="pl-9" />
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50" title="Refresh">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 ml-auto">
          <Plus className="w-4 h-4" /> Add Warehouse
        </Button>
      </motion.div>

      {/* ─ States ─ */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-4">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No warehouses found</p>
        </div>
      )}

      {/* ─ Warehouse Cards ─ */}
      <AnimatePresence>
        {filtered.map(wh => {
          const capacityBase = Math.max(wh.total, 1);
          const pct = Math.max(0, Math.min(100, Math.round((wh.available / capacityBase) * 100)));
          const isOpen = expanded === wh.id;

          return (
            <motion.div
              key={wh.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={cardViewport}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Color stripe */}
              <div className={`h-1.5 ${pct > 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                : pct > 30 ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                  : 'bg-gradient-to-r from-red-400 to-rose-500'
                }`} />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{wh.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <Hash className="w-3 h-3" />
                        <span>Code: {wh.code || '—'}</span>
                        <span className="text-gray-300">·</span>
                        <span>ID: {wh.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${pct > 70 ? 'bg-green-100 text-green-700' : pct > 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {pct > 70 ? 'Well Stocked' : pct > 30 ? 'Limited' : 'Low Stock'}
                    </Badge>
                    <button
                      onClick={() => setExpanded(isOpen ? null : wh.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Total', value: wh.total, color: 'text-gray-900' },
                    { label: 'Sold', value: wh.sold, color: 'text-green-700' },
                    { label: 'Available', value: wh.available, color: 'text-blue-700' },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className={`text-lg font-black ${s.color}`}>{formatNumber(s.value)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.label} units</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Availability</span>
                    <span>{pct}% available</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${pct > 70 ? 'bg-green-500' : pct > 30 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setAddStockTarget(wh)}
                  >
                    <PackagePlus className="w-3.5 h-3.5" /> Add Stock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setStockTarget(wh)}
                  >
                    <Package className="w-3.5 h-3.5" /> View Stock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
                    onClick={() => setEditTarget(wh)}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50 ml-auto"
                    onClick={() => setDeleteTarget(wh)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>

              {/* Expanded: Quick Info */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                      <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Quick Info</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Warehouse ID</p>
                          <p className="font-mono font-bold text-gray-800 text-sm mt-0.5">{wh.id}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Code</p>
                          <p className="font-mono font-bold text-gray-800 text-sm mt-0.5">{wh.code || '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Lot Stock ID</p>
                          <p className="font-mono font-bold text-gray-800 text-sm mt-0.5">{wh.lot_stock_id ?? '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Availability %</p>
                          <p className="font-bold text-gray-800 text-sm mt-0.5">{pct}%</p>
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

      {/* ─ Modals ─ */}
      <AnimatePresence>
        {showCreate && (
          <WarehouseFormModal onSave={handleCreate} onClose={() => setShowCreate(false)} />
        )}
        {editTarget && (
          <WarehouseFormModal warehouse={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />
        )}
        {deleteTarget && (
          <DeleteModal
            warehouse={deleteTarget}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
        {stockTarget && (
          <StockDrawer warehouse={stockTarget} onClose={() => setStockTarget(null)} />
        )}
        {addStockTarget && (
          <AddStockModal
            warehouse={addStockTarget}
            onClose={() => setAddStockTarget(null)}
            onSuccess={handleAddStockSuccess}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
