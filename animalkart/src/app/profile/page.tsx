'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Mail, MapPin, Building2, Shield, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/store';
import { getInitials, formatDate } from '@/lib/utils';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function ProfilePage() {
  const { user } = useAuthStore();
  if (!user) return null;

  const kycConfig = {
    approved: { label: 'KYC Approved', icon: CheckCircle, bg: 'bg-green-100 text-green-700' },
    pending: { label: 'KYC Pending', icon: Clock, bg: 'bg-amber-100 text-amber-700' },
    rejected: { label: 'KYC Rejected', icon: Shield, bg: 'bg-red-100 text-red-700' },
  }[user.kyc_status];
  const KycIcon = kycConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">View and manage your account details</p>
        </motion.div>

        {/* Header Card */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}
          className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-16 h-16 border-2 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user.full_name}</h2>
              <p className="text-green-100 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-white/20 text-white border-0 capitalize">{user.role}</Badge>
                <Badge className={`border-0 ${kycConfig.bg}`}>
                  <KycIcon className="w-3 h-3 mr-1" /> {kycConfig.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/20 text-center">
            <div><p className="text-xl font-bold">{user.units_owned}</p><p className="text-green-200 text-xs">Units Owned</p></div>
            <div><p className="text-lg font-bold">{user.referral_code}</p><p className="text-green-200 text-xs">Referral Code</p></div>
            <div><p className="text-sm font-bold">{formatDate(user.registration_date)}</p><p className="text-green-200 text-xs">Member Since</p></div>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
          {/* Personal Info */}
          <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-gray-900">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: user.full_name, icon: User },
                { label: 'Email', value: user.email, icon: Mail },
                { label: 'Phone', value: user.phone, icon: Phone },
                { label: 'WhatsApp', value: user.whatsapp_number, icon: Phone },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="font-medium text-gray-900 text-sm">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator className="my-4" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Address</p>
                <p className="font-medium text-gray-900 text-sm">{user.address}</p>
              </div>
            </div>
          </motion.div>

          {/* KYC Details */}
          <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">KYC Details</h2>
              </div>
              <Badge className={kycConfig.bg}><KycIcon className="w-3 h-3 mr-1" /> {kycConfig.label}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">PAN Card</p>
                <p className="font-medium text-gray-900 text-sm font-mono">{user.pan_card}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Aadhaar Number</p>
                <p className="font-medium text-gray-900 text-sm font-mono">
                  XXXX XXXX {user.aadhaar_number.slice(-4)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Bank Details */}
          <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-900">Bank Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Bank Name', value: user.bank_name },
                { label: 'Account Holder', value: user.account_holder_name },
                { label: 'Account Number', value: 'XXXX XXXX ' + user.account_number.slice(-4) },
                { label: 'IFSC Code', value: user.ifsc_code },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="font-medium text-gray-900 text-sm font-mono">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
