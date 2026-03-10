'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Package, MapPin, FileText } from 'lucide-react';
import DashboardShell, { DashCard, StatusBadge } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchOrders, type LiveOrder } from '@/lib/api';
import { formatCurrency, formatDate, exportCSV } from '@/lib/utils';

/* ── Status filter config ── */
const STATUS_FILTERS = [
  { key: 'all', label: 'All Orders', color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  { key: 'confirmed', label: 'Confirmed', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { key: 'draft', label: 'Draft', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  { key: 'cancelled', label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
] as const;
type FilterKey = typeof STATUS_FILTERS[number]['key'];

/* ── Skeleton ── */
function OrdersSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="ak-glass" style={{ borderRadius: 14, height: 52 }}>
            <div className="shimmer" style={{ height: '100%', borderRadius: 14 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
        {[1, 2].map(i => (
          <div key={i} className="ak-glass" style={{ borderRadius: 16, height: 88 }}>
            <div className="shimmer" style={{ height: '100%', borderRadius: 16 }} />
          </div>
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="ak-glass" style={{ borderRadius: 16, height: 100 }}>
          <div className="shimmer" style={{ height: '100%', borderRadius: 16 }} />
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    if (!user?.id) { setLoading(false); setError('Please login to view orders.'); return; }
    const customerId = Number(user.id);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      setLoading(false); setError('Invalid customer profile. Please login again.'); return;
    }
    setLoading(true);
    fetchOrders(customerId)
      .then(setOrders)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = useMemo(() =>
    filter === 'all' ? orders : orders.filter(o => o.status.toLowerCase().includes(filter)),
    [orders, filter]
  );

  const counts = useMemo(() => ({
    all: orders.length,
    confirmed: orders.filter(o => o.status.toLowerCase().includes('confirmed') || o.status.toLowerCase() === 'done').length,
    draft: orders.filter(o => o.status.toLowerCase().includes('draft')).length,
    cancelled: orders.filter(o => o.status.toLowerCase().includes('cancel')).length,
  }), [orders]);

  const handleExport = () => {
    exportCSV('orders.csv', filtered.map(o => ({
      'Order Ref': o.order_reference,
      'Warehouse': o.warehouse_name ?? '',
      'Amount (₹)': o.total_amount,
      'Payment': o.payment_method,
      'Status': o.status,
      'Date': o.created_at ? formatDate(o.created_at) : '',
    })));
  };

  return (
    <DashboardShell>
      <div className="mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>Purchase History</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>All your unit purchase orders from Odoo.</p>
        </div>
        {!loading && orders.length > 0 && (
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, color: '#60a5fa', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            ↓ Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <OrdersSkeleton />
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : (
        <>
          {/* ── Status Filter Tabs ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer',
                    background: active ? f.bg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? f.color + '44' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? f.color : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {f.label}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 99,
                    background: active ? f.color + '22' : 'rgba(255,255,255,0.06)',
                    color: active ? f.color : 'rgba(255,255,255,0.4)',
                  }}>
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <DashCard label="Total Orders" value={orders.length} icon={<Package size={18} />} loading={false} />
            <DashCard label="Total Invested" value={formatCurrency(orders.reduce((s, o) => s + o.total_amount, 0))} icon={<Package size={18} />} iconColor="#60a5fa" loading={false} />
          </div>

          {filtered.length === 0 ? (
            <div className="ak-glass" style={{ padding: 40, borderRadius: 16, fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
              No {filter === 'all' ? '' : filter} orders yet.
              {filter === 'all' && <> <Link href="/warehouses" style={{ color: '#34d399' }}>Browse available units →</Link></>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(order => (
                <div key={order.order_id} className="ak-glass ak-glass-hover" style={{ borderRadius: 16, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, background: 'rgba(52,211,153,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={20} style={{ color: '#34d399' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>{order.order_reference}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                          <MapPin size={11} /> <span>{order.warehouse_name || 'Warehouse N/A'}</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                          {order.created_at ? formatDate(order.created_at) : '—'} · {order.payment_method?.replace('_', ' ') || '—'}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: '#34d399' }}>{formatCurrency(order.total_amount)}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Order #{order.order_id}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Link href="/dashboard/investor/invoices" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#34d399', textDecoration: 'none', fontWeight: 500 }}>
                      <FileText size={13} /> View Invoice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
