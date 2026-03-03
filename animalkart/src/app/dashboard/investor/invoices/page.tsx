'use client';

import { useEffect, useState } from 'react';
import { FileText, RefreshCw, Mail, MessageCircle } from 'lucide-react';
import DashboardShell, { DashCard, StatusBadge } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { fetchInvoices, type LiveInvoice } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<LiveInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id && !user?.email) { setLoading(false); setError('Please login to view invoices.'); return; }
    setLoading(true);
    const customerId = user?.id ? Number(user.id) : undefined;
    fetchInvoices({
      customerId: customerId && Number.isFinite(customerId) && customerId > 0 ? customerId : undefined,
      email: user?.email || undefined,
    })
      .then(setInvoices)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, [user?.id, user?.email]);

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>My Invoices</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>GST-compliant tax invoices from Odoo — sent automatically to WhatsApp & Email.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <DashCard label="Total Invoices" value={loading ? null : invoices.length} icon={<FileText size={18} />} loading={loading} />
        <DashCard label="Total Invoiced Amount" value={loading ? null : formatCurrency(invoices.reduce((s, inv) => s + inv.amount, 0))} icon={<FileText size={18} />} iconColor="#60a5fa" loading={loading} />
      </div>

      {/* Info banner */}
      <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <FileText size={16} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          Invoices are generated automatically in Odoo after payment confirmation and delivered to your WhatsApp and Email.
        </div>
      </div>

      {loading ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, display: 'flex', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 14, alignItems: 'center' }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading invoices from Odoo…
        </div>
      ) : error ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, color: '#f87171', fontSize: 14 }}>{error}</div>
      ) : invoices.length === 0 ? (
        <div className="ak-glass" style={{ padding: 24, borderRadius: 16, fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>No invoices found yet. Invoices appear here after a purchase is confirmed.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {invoices.map(invoice => (
            <div key={invoice.invoice_id} className="ak-glass" style={{ borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(52,211,153,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} style={{ color: '#34d399' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>{invoice.invoice_number}</span>
                      <StatusBadge status={invoice.payment_state || 'posted'} />
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                      {invoice.order_reference ? `Order: ${invoice.order_reference} · ` : ''}{formatDate(invoice.invoice_date)}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#34d399' }}>{formatCurrency(invoice.amount)}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Invoice #{invoice.invoice_id}</p>
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#34d399' }}>
                  <MessageCircle size={12} /> WhatsApp Sent
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#34d399' }}>
                  <Mail size={12} /> Email Sent
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
