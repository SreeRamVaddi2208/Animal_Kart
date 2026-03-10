'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Phone, Mail, MapPin, Building2, Shield, CheckCircle,
  Clock, XCircle, Copy, Check, CreditCard,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';
import { getInitials, formatDate } from '@/lib/utils';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const KYC_CFG = {
  approved: { label: 'KYC Approved', icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
  pending: { label: 'KYC Pending', icon: Clock, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  rejected: { label: 'KYC Rejected', icon: XCircle, color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
};

function InfoRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: value ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)', fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? 1 : 'normal' }}>
          {value || '—'}
        </p>
        {value && (
          <button onClick={doCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 2, display: 'flex' }}>
            {copied ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, iconColor, title, children }: {
  icon: React.ElementType; iconColor: string; title: string; children: React.ReactNode;
}) {
  return (
    <motion.div variants={fadeUp}>
      <div className="ak-glass" style={{ borderRadius: 18, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={17} style={{ color: iconColor }} />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>{title}</h2>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  if (!user) return null;

  const kyc = KYC_CFG[user.kyc_status as keyof typeof KYC_CFG] ?? KYC_CFG.pending;
  const KycIcon = kyc.icon;
  const initials = getInitials(user.full_name);

  return (
    <div style={{ minHeight: '100vh', background: '#030d07', color: 'white' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '88px 24px 48px' }}>

        {/* ── Hero Card ── */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ marginBottom: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(52,211,153,0.18), rgba(3,13,7,0.8))',
            border: '1px solid rgba(52,211,153,0.25)',
            borderRadius: 22, padding: '28px 28px 24px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Background glow */}
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(52,211,153,0.08)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
              {/* Avatar */}
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(52,211,153,0.3), rgba(16,185,129,0.15))',
                border: '2px solid rgba(52,211,153,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, color: '#34d399', flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 4 }}>{user.full_name}</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>{user.email}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 99, background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)', color: '#c084fc', fontWeight: 700, textTransform: 'capitalize' }}>
                    {user.role}
                  </span>
                  <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 99, background: kyc.bg, border: `1px solid ${kyc.border}`, color: kyc.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <KycIcon size={10} /> {kyc.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { label: 'Units Owned', value: user.units_owned ?? '—' },
                { label: 'Referral Code', value: user.referral_code || '—' },
                { label: 'Member Since', value: user.registration_date ? formatDate(user.registration_date) : '—' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '0 12px' }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#34d399' }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Sections ── */}
        <motion.div initial="hidden" animate="visible" variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Personal Info */}
          <SectionCard icon={User} iconColor="#60a5fa" title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <InfoRow label="Full Name" value={user.full_name} />
              <InfoRow label="Email Address" value={user.email} />
              <InfoRow label="Phone" value={user.phone} />
              <InfoRow label="WhatsApp" value={user.whatsapp_number} />
            </div>
            {user.address && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={14} style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Address</p>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{user.address}</p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* KYC Details */}
          <SectionCard icon={Shield} iconColor={kyc.color} title="KYC Verification">
            {/* Status banner */}
            <div style={{ background: kyc.bg, border: `1px solid ${kyc.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <KycIcon size={16} style={{ color: kyc.color }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: kyc.color }}>{kyc.label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {user.kyc_status === 'approved' ? 'Your identity is verified. You can invest and earn commissions.' :
                    user.kyc_status === 'pending' ? 'Under review by our compliance team.' :
                      'Please contact support to resubmit your documents.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <InfoRow label="PAN Card" value={user.pan_card} mono />
              <InfoRow label="Aadhaar Number" value={user.aadhaar_number ? 'XXXX XXXX ' + user.aadhaar_number.slice(-4) : null} mono />
            </div>
          </SectionCard>

          {/* Bank Details */}
          <SectionCard icon={Building2} iconColor="#c084fc" title="Bank Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <InfoRow label="Bank Name" value={user.bank_name} />
              <InfoRow label="Account Holder" value={user.account_holder_name} />
              <InfoRow label="Account Number" value={user.account_number ? 'XXXX XXXX ' + user.account_number.slice(-4) : null} mono />
              <InfoRow label="IFSC Code" value={user.ifsc_code} mono />
            </div>
          </SectionCard>

          {/* Referral */}
          {user.referral_code && (
            <SectionCard icon={CreditCard} iconColor="#fbbf24" title="Referral Info">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <InfoRow label="Your Referral Code" value={user.referral_code} mono />
                {(user as { referred_by?: string }).referred_by && (
                  <InfoRow label="Referred By" value={(user as { referred_by?: string }).referred_by} />
                )}
              </div>
            </SectionCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}
