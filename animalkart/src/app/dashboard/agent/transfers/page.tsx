'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Plus, Package, CheckCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardShell, { DashCard, StatusBadge } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/lib/store';
import { createTransferRequest, fetchTransfers, type LiveTransfer, type LiveTransfersPayload } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function TransfersPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<LiveTransfersPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [investorEmail, setInvestorEmail] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user?.email) { setLoading(false); setError('Please login to view transfers.'); return; }
    setLoading(true);
    fetchTransfers(user.email)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load transfers'))
      .finally(() => setLoading(false));
  }, [user?.email]);

  const ownedUnits = useMemo(() => data?.owned_units ?? [], [data]);
  const transferHistory = useMemo(() => data?.transfers ?? [], [data]);

  const handleTransfer = async () => {
    if (!investorEmail || !selectedUnit || !user?.email) return;
    try {
      setSubmitting(true); setError(null);
      const item = await createTransferRequest({ agent_email: user.email, investor_email: investorEmail, unit_id: selectedUnit });
      setData(prev => ({ owned_units: prev?.owned_units ?? [], transfers: [item, ...(prev?.transfers ?? [])] }));
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setDialogOpen(false); setInvestorEmail(''); setSelectedUnit(''); }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit transfer');
    } finally { setSubmitting(false); }
  };

  return (
    <DashboardShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>Unit Transfers</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Transfer your owned units to registered investors.</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'linear-gradient(135deg,#34d399,#059669)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          <Plus size={16} /> New Transfer
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>{error}</div>
      )}

      {/* Info banner */}
      <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12 }}>
        <ArrowRightLeft size={16} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          <strong style={{ color: '#60a5fa' }}>Transfer Rules:</strong> You must own a unit (purchased using 3,50,000 wallet coins) to transfer it. Units can only be transferred to registered investors. Transfer requires admin approval. Once transferred, the unit belongs to the investor permanently.
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <DashCard label="Units Available to Transfer" value={loading ? null : ownedUnits.length} icon={<Package size={18} />} loading={loading} />
        <DashCard label="Transfer Requests Made" value={loading ? null : transferHistory.length} icon={<ArrowRightLeft size={18} />} iconColor="#60a5fa" loading={loading} />
      </div>

      {/* Owned units */}
      <div className="ak-glass" style={{ borderRadius: 18, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 16 }}>Your Owned Units</h2>
        </div>
        {loading ? (
          <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</div>
        ) : ownedUnits.length === 0 ? (
          <div style={{ padding: '20px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No owned units available for transfer.</div>
        ) : (
          <div>
            {ownedUnits.map(unit => (
              <div key={unit.unit_id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(52,211,153,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={18} style={{ color: '#34d399' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{unit.unit_id}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{unit.warehouse_name || 'Warehouse'} · {formatDate(unit.purchased_date)}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedUnit(unit.unit_id); setDialogOpen(true); }}
                  style={{ padding: '7px 16px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10, color: '#34d399', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                >
                  Transfer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer history */}
      <div className="ak-glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 16 }}>Transfer History</h2>
        </div>
        {loading ? (
          <div style={{ padding: '20px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Loading…</div>
        ) : transferHistory.length === 0 ? (
          <div style={{ padding: '20px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No transfer records yet.</div>
        ) : (
          <div>
            {transferHistory.map((tx: LiveTransfer) => (
              <div key={tx.transfer_id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{tx.unit_id} → {tx.investor_name || tx.investor_email || 'Investor'}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{formatDate(tx.transfer_date)} · {tx.transfer_id}</p>
                </div>
                <StatusBadge status={tx.transfer_status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" style={{ background: '#0b1a12', border: '1px solid rgba(52,211,153,0.2)', color: 'white' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'white' }}>Transfer Unit to Investor</DialogTitle>
          </DialogHeader>
          {success ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <CheckCircle size={56} color="#34d399" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 700, fontSize: 18 }}>Transfer Submitted!</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 }}>Pending admin approval. You will be notified once approved.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 8 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>SELECT UNIT</p>
                {ownedUnits.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No owned units to transfer.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ownedUnits.map(unit => (
                      <button
                        key={unit.unit_id}
                        onClick={() => setSelectedUnit(unit.unit_id)}
                        style={{ padding: '10px 14px', borderRadius: 12, border: selectedUnit === unit.unit_id ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)', background: selectedUnit === unit.unit_id ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)', color: 'white', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{unit.unit_id}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{unit.warehouse_name || 'Warehouse'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>INVESTOR EMAIL *</label>
                <input
                  placeholder="investor@example.com"
                  value={investorEmail}
                  onChange={e => setInvestorEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>The investor must be registered on AnimalKart</p>
              </div>
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                ⚠️ Once transferred, this unit will permanently belong to the investor. Requires admin approval.
              </div>
              <button
                onClick={handleTransfer}
                disabled={submitting || !investorEmail || !selectedUnit}
                style={{ padding: '12px', background: !investorEmail || !selectedUnit ? 'rgba(52,211,153,0.3)' : 'linear-gradient(135deg,#34d399,#059669)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, cursor: submitting || !investorEmail || !selectedUnit ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Submitting…' : 'Submit Transfer Request'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
