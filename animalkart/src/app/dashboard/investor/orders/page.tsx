'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, RefreshCw, MapPin, FileText } from 'lucide-react';
import DashboardShell, { DashCard, StatusBadge } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchOrders, type LiveOrder } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>Purchase History</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>All your unit purchase orders from Odoo.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <DashCard label="Total Orders" value={loading ? null : orders.length} icon={<Package size={18} />} loading={loading} />
        <DashCard label="Total Invested" value={loading ? null : formatCurrency(orders.reduce((s, o) => s + o.total_amount, 0))} icon={<Package size={18} />} iconColor="#60a5fa" loading={loading} />
      </div>

      {loading ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, display: 'flex', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 14, alignItems: 'center' }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading orders from Odoo…
        </div>
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : orders.length === 0 ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
          No purchase orders found. <Link href="/warehouses" style={{ color: '#34d399' }}>Browse available units →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => (
            <div key={order.order_id} className="ak-glass" style={{ borderRadius: 16, padding: '20px' }}>
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
    </DashboardShell>
  );
}
