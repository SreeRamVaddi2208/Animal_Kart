'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Bell, Package, Coins, Gift, ArrowRightLeft, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import { formatDateTime } from '@/lib/utils';
import type { Notification } from '@/lib/types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const typeConfig: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  purchase: { icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
  payment: { icon: Coins, color: 'text-blue-600', bg: 'bg-blue-50' },
  commission: { icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
  reward: { icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50' },
  transfer: { icon: ArrowRightLeft, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  general: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-gray-700" /> Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-gray-500 mt-1 text-sm">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} className="flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </Button>
            )}
          </div>
        </motion.div>

        {notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-3">
            {notifications.map(notif => {
              const config = typeConfig[notif.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  variants={fadeUp}
                  onClick={() => markRead(notif.id)}
                  className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${notif.read ? 'border-gray-100' : 'border-green-200'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold text-sm ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</p>
                        {!notif.read && <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{notif.message}</p>
                      <p className="text-gray-400 text-xs mt-2">{formatDateTime(notif.date)}</p>
                    </div>
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
