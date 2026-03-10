'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Package, RefreshCw, AlertCircle, CheckCircle, X, Search,
  Hash, PackagePlus,
} from 'lucide-react';
import {
  fetchAdminWarehouses, fetchWarehouseStock, fetchAdminWarehouseSales,
  createAdminWarehouse, updateAdminWarehouse, deleteAdminWarehouse,
  fetchAdminWarehouseStock, addAdminWarehouseStock, fetchAdminProducts,
  type AdminWarehouse, type AdminWarehouseStock, type AdminProduct,
} from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import {
  useSafeAnimation, fadeUpVariants, staggerFastVariants, VIEWPORT_SECTION, VIEWPORT_CARD,
} from '@/lib/hooks/useAnimation';

/* ── Dark palette ── */
const CARD = 'rgba(255,255,255,0.04)';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const ROW_BG = 'rgba(255,255,255,0.03)';
const TEXT_DIM = 'rgba(255,255,255,0.4)';
const TEXT_MID = 'rgba(255,255,255,0.65)';
const MODAL_BG = '#0d1a12';

type WarehouseRow = AdminWarehouse & { available: number; sold: number; total: number };

/* ── Btn style helper ── */
function btnStyle(bg: string, color: string, border: string, disabled?: boolean): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', background: bg, color, border: `1px solid ${border}`, opacity: disabled ? 0.5 : 1, transition: 'all 0.15s' };
}

/* ── Shared Modal Shell ── */
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ position: 'relative', background: MODAL_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', width: '100%', maxWidth: wide ? 480 : 420, padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, color: 'white', fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${CARD_BORDER}`, cursor: 'pointer', color: TEXT_MID, display: 'flex', alignItems: 'center' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/* ── Delete Confirm Modal ── */
function DeleteModal({ warehouse, onConfirm, onClose, loading }: { warehouse: WarehouseRow; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <Modal title="Delete Warehouse" onClose={onClose}>
      <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13, color: '#f87171' }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ This action cannot be undone.</p>
        <p style={{ color: TEXT_MID }}>You are about to archive <strong style={{ color: 'white' }}>{warehouse.name}</strong> ({warehouse.code}).</p>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} disabled={loading} style={btnStyle(CARD, TEXT_MID, CARD_BORDER, loading)}>Cancel</button>
        <button onClick={onConfirm} disabled={loading} style={btnStyle('rgba(248,113,113,0.15)', '#f87171', 'rgba(248,113,113,0.35)', loading)}>
          {loading ? 'Deleting…' : 'Yes, Delete'}
        </button>
      </div>
    </Modal>
  );
}

/* ── Create / Edit Modal ── */
function WarehouseFormModal({ warehouse, onSave, onClose }: { warehouse?: WarehouseRow | null; onSave: (name: string, code: string) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState(warehouse?.name ?? '');
  const [code, setCode] = useState(warehouse?.code ?? '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!name.trim() || !code.trim()) { setErr('Name and code are required.'); return; }
    setLoading(true); setErr('');
    try { await onSave(name.trim(), code.trim().toUpperCase()); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Failed to save warehouse'); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${CARD_BORDER}`, color: 'white', fontSize: 13, outline: 'none' };

  return (
    <Modal title={warehouse ? 'Edit Warehouse' : 'New Warehouse'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, color: TEXT_DIM, display: 'block', marginBottom: 6 }}>Warehouse Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chennai Central" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: TEXT_DIM, display: 'block', marginBottom: 6 }}>Short Code</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. CHC" maxLength={10} style={inputStyle} />
        </div>
        {err && <p style={{ fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle style={{ width: 13, height: 13 }} />{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button onClick={onClose} disabled={loading} style={btnStyle(CARD, TEXT_MID, CARD_BORDER, loading)}>Cancel</button>
          <button onClick={submit} disabled={loading} style={btnStyle('rgba(52,211,153,0.12)', '#34d399', 'rgba(52,211,153,0.3)', loading)}>
            {loading ? 'Saving…' : warehouse ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Add Stock Modal ── */
function AddStockModal({ warehouse, onClose, onSuccess }: { warehouse: WarehouseRow; onClose: () => void; onSuccess: (msg: string) => void }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchAdminProducts().then(prods => { setProducts(prods); if (prods.length > 0) setSelectedProduct(prods[0].id); })
      .catch(() => setErr('Failed to load products')).finally(() => setLoadingProducts(false));
  }, []);

  const submit = async () => {
    if (!selectedProduct) { setErr('Please select a product.'); return; }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { setErr('Quantity must be greater than 0.'); return; }
    setSaving(true); setErr('');
    try {
      await addAdminWarehouseStock({ product_id: selectedProduct, warehouse_id: warehouse.id, quantity: qty });
      const prod = products.find(p => p.id === selectedProduct);
      onSuccess(`Added ${qty} units of "${prod?.name ?? 'Product'}" to ${warehouse.name}`);
      onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed to add stock'); }
    finally { setSaving(false); }
  };

  const selected = products.find(p => p.id === selectedProduct);
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${CARD_BORDER}`, color: 'white', fontSize: 13, outline: 'none' };

  return (
    <Modal title={`Add Stock — ${warehouse.name}`} onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Warehouse info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.08)', borderRadius: 12, padding: 12, border: '1px solid rgba(52,211,153,0.15)' }}>
          <Warehouse style={{ width: 16, height: 16, color: '#34d399' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>{warehouse.name}</span>
          <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>{warehouse.code}</span>
        </div>

        {/* Product selection */}
        <div>
          <label style={{ fontSize: 11, color: TEXT_DIM, display: 'block', marginBottom: 6 }}>Select Product</label>
          {loadingProducts ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT_DIM, padding: '10px 0' }}>
              <RefreshCw style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> Loading products…
            </div>
          ) : products.length === 0 ? (
            <p style={{ fontSize: 13, color: TEXT_DIM, padding: '8px 0' }}>No products available</p>
          ) : (
            <select
              value={selectedProduct ?? ''}
              onChange={e => setSelectedProduct(Number(e.target.value))}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              {Array.from(new Map(products.map(p => [p.id, p])).values()).map(p => (
                <option key={p.id} value={p.id} style={{ background: '#0d1a12' }}>
                  {p.name} {p.sku ? `(${p.sku})` : ''} — ₹{p.price.toLocaleString('en-IN')}/unit
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected product info */}
        {selected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'SKU', value: selected.sku || '—' },
              { label: 'Unit Price', value: `₹${selected.price.toLocaleString('en-IN')}` },
              { label: 'Current Stock', value: String(selected.stock_available) },
            ].map((item, i) => (
              <div key={i} style={{ background: ROW_BG, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: TEXT_DIM }}>{item.label}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quantity */}
        <div>
          <label style={{ fontSize: 11, color: TEXT_DIM, display: 'block', marginBottom: 6 }}>Quantity to Add</label>
          <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 100" style={{ ...inputStyle, fontSize: 16, fontWeight: 700 }} />
        </div>

        {err && <p style={{ fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle style={{ width: 13, height: 13 }} />{err}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button onClick={onClose} disabled={saving} style={btnStyle(CARD, TEXT_MID, CARD_BORDER, saving)}>Cancel</button>
          <button onClick={submit} disabled={saving || loadingProducts || !selectedProduct} style={btnStyle('rgba(52,211,153,0.12)', '#34d399', 'rgba(52,211,153,0.3)', saving || loadingProducts || !selectedProduct)}>
            <PackagePlus style={{ width: 14, height: 14 }} />
            {saving ? 'Adding Stock…' : 'Add Stock'}
          </button>
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

  useEffect(() => { fetchAdminWarehouseStock(warehouse.id).then(setStock).catch(() => setStock([])).finally(() => setLoading(false)); }, [warehouse.id]);

  const filtered = stock.filter(s => search === '' || s.product_name.toLowerCase().includes(search.toLowerCase()) || (s.sku ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal title={`📦 Stock — ${warehouse.name}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: TEXT_DIM }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${CARD_BORDER}`, color: 'white', fontSize: 12, outline: 'none' }} />
        </div>
        {loading && <p style={{ fontSize: 13, color: TEXT_DIM, textAlign: 'center', padding: '16px 0' }}>Loading stock…</p>}
        {!loading && filtered.length === 0 && <p style={{ fontSize: 13, color: TEXT_DIM, textAlign: 'center', padding: '16px 0' }}>No products found.</p>}
        <div style={{ maxHeight: 288, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 2 }}>
          {filtered.map(item => (
            <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: ROW_BG, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</p>
                <p style={{ fontSize: 11, color: TEXT_DIM }}>{item.sku || '—'} · ₹{item.unit_price.toLocaleString('en-IN')}/unit</p>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 100, marginLeft: 10, flexShrink: 0,
                color: item.qty_available > 50 ? '#34d399' : item.qty_available > 10 ? '#fbbf24' : '#f87171',
                background: item.qty_available > 50 ? 'rgba(52,211,153,0.12)' : item.qty_available > 10 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)',
                border: `1px solid ${item.qty_available > 50 ? 'rgba(52,211,153,0.2)' : item.qty_available > 10 ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}`,
              }}>
                {item.qty_available} units
              </span>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 12, background: CARD, border: `1px solid ${CARD_BORDER}`, color: TEXT_MID, cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 4 }}>Close</button>
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
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<WarehouseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseRow | null>(null);
  const [stockTarget, setStockTarget] = useState<WarehouseRow | null>(null);
  const [addStockTarget, setAddStockTarget] = useState<WarehouseRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fadeUp = useSafeAnimation(fadeUpVariants);
  const stagger = useSafeAnimation(staggerFastVariants);
  const viewport = VIEWPORT_SECTION;
  const cardViewport = VIEWPORT_CARD;

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [whMeta, stock, sales] = await Promise.all([fetchAdminWarehouses(), fetchWarehouseStock(), fetchAdminWarehouseSales()]);
      const byId = new Map<number, WarehouseRow>();
      for (const wh of whMeta) byId.set(wh.id, { ...wh, available: 0, sold: 0, total: 0 });
      for (const row of stock) { const cur = byId.get(row.warehouse_id); if (cur) byId.set(row.warehouse_id, { ...cur, available: cur.available + row.qty_available, total: cur.total + row.qty_available }); }
      for (const sale of sales) { const cur = byId.get(sale.warehouse_id); if (cur) byId.set(sale.warehouse_id, { ...cur, sold: cur.sold + sale.units_sold }); }
      setWarehouses(Array.from(byId.values()));
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load warehouses'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (name: string, code: string) => { const created = await createAdminWarehouse({ name, code }); setWarehouses(prev => [...prev, { ...created, available: 0, sold: 0, total: 0 }]); showToast(`Warehouse "${name}" created!`); };
  const handleEdit = async (name: string, code: string) => { if (!editTarget) return; await updateAdminWarehouse(editTarget.id, { name, code }); setWarehouses(prev => prev.map(w => w.id === editTarget.id ? { ...w, name, code } : w)); showToast(`Warehouse updated!`); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteAdminWarehouse(deleteTarget.id); setWarehouses(prev => prev.filter(w => w.id !== deleteTarget.id)); showToast(`Warehouse deleted.`); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Delete failed', false); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };
  const handleAddStockSuccess = (msg: string) => { showToast(msg); load(); };

  const filtered = useMemo(() => warehouses.filter(w => search === '' || w.name.toLowerCase().includes(search.toLowerCase()) || (w.code ?? '').toLowerCase().includes(search.toLowerCase())), [warehouses, search]);
  const totals = useMemo(() => ({ capacity: warehouses.reduce((s, w) => s + w.total, 0), sold: warehouses.reduce((s, w) => s + w.sold, 0), avail: warehouses.reduce((s, w) => s + w.available, 0) }), [warehouses]);

  const SUMMARY = [
    { label: 'Total Warehouses', value: warehouses.length, color: 'white', bg: CARD },
    { label: 'Units Sold', value: totals.sold, color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    { label: 'Units Available', value: totals.avail, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  ];

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-4">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: toast.ok ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: toast.ok ? '#34d399' : '#f87171', border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
            {toast.ok ? <CheckCircle style={{ width: 14, height: 14 }} /> : <AlertCircle style={{ width: 14, height: 14 }} />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {SUMMARY.map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${CARD_BORDER}`, borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value.toLocaleString()}</p>
            <p style={{ fontSize: 11, color: TEXT_DIM, marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={fadeUp} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: TEXT_DIM }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search warehouses…" style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 12, background: CARD, border: `1px solid ${CARD_BORDER}`, color: 'white', fontSize: 13, outline: 'none' }} />
        </div>
        <button onClick={load} style={{ padding: 10, borderRadius: 12, background: CARD, border: `1px solid ${CARD_BORDER}`, cursor: 'pointer', color: TEXT_MID, display: 'flex', alignItems: 'center' }} title="Refresh">
          <RefreshCw style={{ width: 14, height: 14, ...(loading ? { animation: 'spin 1s linear infinite' } : {}) }} />
        </button>
        <button onClick={() => setShowCreate(true)} style={{ ...btnStyle('rgba(52,211,153,0.12)', '#34d399', 'rgba(52,211,153,0.3)'), marginLeft: 'auto', padding: '9px 16px', fontSize: 13 }}>
          <Plus style={{ width: 14, height: 14 }} /> Add Warehouse
        </button>
      </motion.div>

      {/* States */}
      {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px' }}><AlertCircle style={{ width: 14, height: 14 }} />{error}</div>}
      {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: TEXT_DIM }}><Warehouse style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.2 }} /><p style={{ fontWeight: 600 }}>No warehouses found</p></div>}

      {/* Warehouse Cards */}
      <AnimatePresence>
        {filtered.map(wh => {
          const capacityBase = Math.max(wh.total, 1);
          const pct = Math.max(0, Math.min(100, Math.round((wh.available / capacityBase) * 100)));
          const isOpen = expanded === wh.id;
          const stockColor = pct > 70 ? '#34d399' : pct > 30 ? '#fbbf24' : '#f87171';
          const stockLabel = pct > 70 ? 'Well Stocked' : pct > 30 ? 'Limited' : 'Low Stock';

          return (
            <motion.div key={wh.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={cardViewport} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: CARD, border: `1px solid ${CARD_BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
              {/* Color stripe */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${stockColor}, ${stockColor}88)` }} />

              <div style={{ padding: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'rgba(52,211,153,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Warehouse style={{ width: 20, height: 20, color: '#34d399' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{wh.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>
                        <Hash style={{ width: 10, height: 10 }} />
                        <span>Code: {wh.code || '—'}</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                        <span>ID: {wh.id}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: stockColor, background: `${stockColor}18`, border: `1px solid ${stockColor}33` }}>{stockLabel}</span>
                    <button onClick={() => setExpanded(isOpen ? null : wh.id)} style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${CARD_BORDER}`, cursor: 'pointer', color: TEXT_DIM, display: 'flex', alignItems: 'center' }}>
                      {isOpen ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Total', value: wh.total, color: 'white' },
                    { label: 'Sold', value: wh.sold, color: '#34d399' },
                    { label: 'Available', value: wh.available, color: '#60a5fa' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: ROW_BG, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                      <p style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{formatNumber(s.value)}</p>
                      <p style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2 }}>{s.label} units</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: TEXT_DIM, marginBottom: 6 }}>
                    <span>Availability</span><span>{pct}% available</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 6 }}>
                    <div style={{ height: 6, borderRadius: 100, width: `${pct}%`, background: stockColor, transition: 'width 0.4s ease', boxShadow: `0 0 8px ${stockColor}66` }} />
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setAddStockTarget(wh)} style={btnStyle('rgba(52,211,153,0.12)', '#34d399', 'rgba(52,211,153,0.3)')}>
                    <PackagePlus style={{ width: 13, height: 13 }} /> Add Stock
                  </button>
                  <button onClick={() => setStockTarget(wh)} style={btnStyle('rgba(96,165,250,0.1)', '#60a5fa', 'rgba(96,165,250,0.25)')}>
                    <Package style={{ width: 13, height: 13 }} /> View Stock
                  </button>
                  <button onClick={() => setEditTarget(wh)} style={btnStyle(CARD, TEXT_MID, CARD_BORDER)}>
                    <Pencil style={{ width: 13, height: 13 }} /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(wh)} style={{ ...btnStyle('rgba(248,113,113,0.08)', '#f87171', 'rgba(248,113,113,0.2)'), marginLeft: 'auto' }}>
                    <Trash2 style={{ width: 13, height: 13 }} /> Delete
                  </button>
                </div>
              </div>

              {/* Expanded: Quick Info */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                    <div style={{ borderTop: `1px solid ${CARD_BORDER}`, padding: '16px 20px 20px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: TEXT_DIM, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Info</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          { label: 'Warehouse ID', value: String(wh.id) },
                          { label: 'Code', value: wh.code || '—' },
                          { label: 'Lot Stock ID', value: String(wh.lot_stock_id ?? '—') },
                          { label: 'Availability %', value: `${pct}%` },
                        ].map((item, i) => (
                          <div key={i} style={{ background: ROW_BG, borderRadius: 10, padding: 12 }}>
                            <p style={{ fontSize: 10, color: TEXT_DIM }}>{item.label}</p>
                            <p style={{ fontFamily: 'monospace', fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }}>{item.value}</p>
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

      {/* Modals */}
      <AnimatePresence>
        {showCreate && <WarehouseFormModal onSave={handleCreate} onClose={() => setShowCreate(false)} />}
        {editTarget && <WarehouseFormModal warehouse={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />}
        {deleteTarget && <DeleteModal warehouse={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} loading={deleting} />}
        {stockTarget && <StockDrawer warehouse={stockTarget} onClose={() => setStockTarget(null)} />}
        {addStockTarget && <AddStockModal warehouse={addStockTarget} onClose={() => setAddStockTarget(null)} onSuccess={handleAddStockSuccess} />}
      </AnimatePresence>
    </motion.div>
  );
}
