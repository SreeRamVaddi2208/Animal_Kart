'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Package, Coins, Gift, ArrowRightLeft, CheckCheck,
  ShieldCheck, ShieldAlert, Clock, Wallet,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';
import { fetchWallet, fetchRewards } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

type NotifType = 'kyc' | 'wallet' | 'purchase' | 'reward' | 'transfer' | 'general';

interface LocalNotif {
  id: string;
  title: string;
  message: string;
  type: NotifType;
  read: boolean;
  date: string;
}

const TYPE_CFG: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  kyc: { icon: ShieldCheck, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  wallet: { icon: Wallet, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  purchase: { icon: Package, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  reward: { icon: Gift, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  transfer: { icon: ArrowRightLeft, color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  general: { icon: Bell, color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)' },
};

/* Build smart notifications from available Odoo data */
function buildNotifications(
  user: { full_name?: string; kyc_status?: string; registration_date?: string } | null,
  walletBalance: number,
  hasWalletData: boolean,
  rewardsMilestone: boolean,
): LocalNotif[] {
  const notes: LocalNotif[] = [];
  const now = new Date().toISOString();
  const regDate = user?.registration_date ?? now;

  /* KYC event */
  if (user?.kyc_status === 'approved') {
    notes.push({ id: 'kyc-approved', title: 'KYC Approved ✓', message: 'Your KYC has been verified. You can now purchase units and earn commissions.', type: 'kyc', read: false, date: regDate });
  } else if (user?.kyc_status === 'pending') {
    notes.push({ id: 'kyc-pending', title: 'KYC Under Review', message: 'Your KYC documents are being reviewed by our team. You\'ll be notified once approved.', type: 'kyc', read: false, date: regDate });
  } else if (user?.kyc_status === 'rejected') {
    notes.push({ id: 'kyc-rejected', title: 'KYC Rejected', message: 'Your KYC was rejected. Please contact support to re-submit your documents.', type: 'kyc', read: false, date: regDate });
  }

  /* Wallet balance */
  if (hasWalletData && walletBalance > 0) {
    notes.push({ id: 'wallet-balance', title: 'Wallet Balance Updated', message: `Your wallet has ${walletBalance.toLocaleString('en-IN')} coins. 1 Coin = ₹1.`, type: 'wallet', read: true, date: now });
  }

  if (hasWalletData && walletBalance >= 350000) {
    notes.push({ id: 'wallet-free-unit', title: '🎉 Eligible for Free Unit!', message: 'Your wallet balance has reached ₹3,50,000. You can purchase a unit using coins — no cash needed!', type: 'wallet', read: false, date: now });
  }

  /* Reward milestone */
  if (rewardsMilestone) {
    notes.push({ id: 'reward-milestone', title: 'Reward Milestone Unlocked!', message: 'You\'ve reached a reward milestone. Visit the Rewards page to check your eligibility.', type: 'reward', read: false, date: now });
  }

  /* Welcome */
  notes.push({ id: 'welcome', title: `Welcome to AnimalKart, ${user?.full_name?.split(' ')[0] ?? 'there'}!`, message: 'Your account has been created. Complete your KYC to start investing in premium farm units.', type: 'general', read: true, date: regDate });

  return notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [walletBalance, setWalletBalance] = useState(0);
  const [hasWalletData, setHasWalletData] = useState(false);
  const [rewardsMilestone, setRewardsMilestone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    Promise.allSettled([
      fetchWallet(user.email),
      fetchRewards(user.email),
    ]).then(([walletRes, rewardRes]) => {
      if (walletRes.status === 'fulfilled') {
        setWalletBalance(walletRes.value.balance);
        setHasWalletData(true);
      }
      if (rewardRes.status === 'fulfilled') {
        setRewardsMilestone(rewardRes.value.total_units >= 30);
      }
    }).finally(() => setLoading(false));
  }, [user?.email]);

  const notifications = useMemo(
    () => buildNotifications(user, walletBalance, hasWalletData, rewardsMilestone),
    [user, walletBalance, hasWalletData, rewardsMilestone]
  );

  const unreadCount = notifications.filter(n => !n.read && !readIds.has(n.id)).length;

  const markRead = (id: string) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(notifications.map(n => n.id)));

  return (
    <div style={{ minHeight: '100vh', background: '#030d07', color: 'white' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '88px 24px 48px' }}>
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, background: 'rgba(52,211,153,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={18} style={{ color: '#34d399' }} />
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>Notifications</h1>
                {unreadCount > 0 && (
                  <span style={{ background: '#34d399', color: '#030d07', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Activity feed from your account events</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10, color: '#34d399', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                <CheckCheck size={15} /> Mark all read
              </button>
            )}
          </div>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="ak-glass" style={{ borderRadius: 16, height: 80 }}>
                <div className="shimmer" style={{ height: '100%', borderRadius: 16 }} />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '72px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No notifications yet</p>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(notif => {
              const isRead = notif.read || readIds.has(notif.id);
              const cfg = TYPE_CFG[notif.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notif.id}
                  variants={fadeUp}
                  onClick={() => markRead(notif.id)}
                  style={{
                    background: isRead ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isRead ? 'rgba(255,255,255,0.07)' : 'rgba(52,211,153,0.2)'}`,
                    borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontWeight: isRead ? 500 : 700, color: isRead ? 'rgba(255,255,255,0.7)' : 'white', fontSize: 14 }}>{notif.title}</p>
                      {!isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0, marginTop: 4, boxShadow: '0 0 6px #34d399' }} />}
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 1.6 }}>{notif.message}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>{formatDateTime(notif.date)}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
