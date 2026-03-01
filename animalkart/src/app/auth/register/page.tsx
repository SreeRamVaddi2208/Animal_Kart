'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChevronRight, ChevronLeft, CheckCircle, User, Building2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/store';
import { registerUser } from '@/lib/api';
import type { UserRole } from '@/lib/types';

const schema = z.object({
  role: z.enum(['agent', 'investor']),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  whatsapp_number: z.string().regex(/^[6-9]\d{9}$/, 'Invalid WhatsApp number'),
  address: z.string().min(10, 'Please enter full address'),
  pan_card: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
  aadhaar_number: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  bank_name: z.string().min(1, 'Please select a bank'),
  account_number: z.string().min(9, 'Invalid account number'),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  account_holder_name: z.string().min(2, 'Enter account holder name'),
  referred_by_code: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, label: 'Role & Personal', icon: User },
  { id: 2, label: 'KYC Details', icon: Building2 },
  { id: 3, label: 'Bank Details', icon: CreditCard },
];

const BANK_OPTIONS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Yes Bank',
  'Federal Bank',
  'Indian Bank',
  'Bank of India',
  'Andhra Bank',
];

function RegisterContent() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'agent' | 'investor'>('investor');
  const [selectedBank, setSelectedBank] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  const defaultRole = (searchParams.get('role') as 'agent' | 'investor') || 'investor';

  const { register, handleSubmit, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const result = await registerUser({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        whatsapp_number: data.whatsapp_number,
        address: data.address,
        pan_card: data.pan_card,
        aadhaar_number: data.aadhaar_number,
        bank_name: data.bank_name,
        account_number: data.account_number,
        ifsc_code: data.ifsc_code,
        account_holder_name: data.account_holder_name,
        role: data.role,
      });
      const role = (result.role as UserRole) === 'agent' ? 'agent' : (result.role as UserRole) === 'admin' ? 'admin' : 'investor';
      setUser(
        {
          id: String(result.partner_id),
          full_name: result.full_name || data.full_name,
          email: result.email || data.email,
          phone: result.phone || data.phone,
          whatsapp_number: result.whatsapp_number || data.whatsapp_number,
          address: result.address || data.address,
          pan_card: result.pan_card || data.pan_card,
          aadhaar_number: result.aadhaar_number || data.aadhaar_number,
          bank_name: result.bank_name || data.bank_name,
          account_number: result.account_number || data.account_number,
          ifsc_code: result.ifsc_code || data.ifsc_code,
          account_holder_name: result.account_holder_name || data.account_holder_name,
          role,
          referral_code: result.referral_code || '',
          kyc_status: (result.kyc_status as 'pending' | 'approved' | 'rejected') || 'pending',
          is_active: true,
          registration_date: result.registration_date || new Date().toISOString(),
          units_owned: result.units_owned || 0,
        },
        result.token
      );
      router.push(role === 'agent' ? '/dashboard/agent' : role === 'admin' ? '/dashboard/admin' : '/dashboard/investor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
    setLoading(false);
  };

  const nextStep = async () => {
    let fields: (keyof FormData)[] = [];
    if (step === 1) fields = ['role', 'full_name', 'email', 'phone', 'whatsapp_number', 'address', 'password', 'confirm_password'];
    if (step === 2) fields = ['pan_card', 'aadhaar_number'];
    const valid = await trigger(fields);
    if (valid) setStep(s => s + 1);
  };

  const FieldError = ({ name }: { name: keyof FormData }) =>
    errors[name] ? <p className="text-xs text-red-500 mt-1">{errors[name]?.message as string}</p> : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold">AK</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">Animal<span className="text-green-600">Kart</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm">Join AnimalKart and start investing today</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${done ? 'bg-green-100 text-green-700' : active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  <span className="hidden sm:block">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-8 h-0.5 mx-1 ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {/* Step 1: Role & Personal */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div>
                    <Label className="mb-2 block">I am registering as</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['investor', 'agent'] as const).map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => { setSelectedRole(role); setValue('role', role); }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${selectedRole === role ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="text-2xl mb-1">{role === 'investor' ? '🧑‍💼' : '🤝'}</div>
                          <div className="font-semibold text-gray-900 capitalize">{role}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {role === 'investor' ? 'Purchase livestock units' : 'Refer investors & earn'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input id="full_name" placeholder="Rajesh Kumar" {...register('full_name')} className="mt-1" />
                      <FieldError name="full_name" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" placeholder="you@example.com" {...register('email')} className="mt-1" />
                      <FieldError name="email" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" placeholder="9876543210" {...register('phone')} className="mt-1" />
                      <FieldError name="phone" />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                      <Input id="whatsapp_number" placeholder="9876543210" {...register('whatsapp_number')} className="mt-1" />
                      <FieldError name="whatsapp_number" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Full Address *</Label>
                    <Input id="address" placeholder="123, Street, City, State, PIN" {...register('address')} className="mt-1" />
                    <FieldError name="address" />
                  </div>
                  <div>
                    <Label htmlFor="referred_by_code">Referral Code (Optional)</Label>
                    <Input id="referred_by_code" placeholder="Enter referral code if you have one" {...register('referred_by_code')} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input id="password" type="password" placeholder="Min 8 characters" {...register('password')} className="mt-1" />
                      <FieldError name="password" />
                    </div>
                    <div>
                      <Label htmlFor="confirm_password">Confirm Password *</Label>
                      <Input id="confirm_password" type="password" placeholder="Re-enter password" {...register('confirm_password')} className="mt-1" />
                      <FieldError name="confirm_password" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: KYC */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <p className="font-semibold mb-1">KYC Verification Required</p>
                    <p>Your documents will be verified by our admin team within 24 hours.</p>
                  </div>
                  <div>
                    <Label htmlFor="pan_card">PAN Card Number *</Label>
                    <Input id="pan_card" placeholder="ABCDE1234F" {...register('pan_card')} className="mt-1 uppercase" />
                    <FieldError name="pan_card" />
                    <p className="text-xs text-gray-400 mt-1">Format: 5 letters + 4 digits + 1 letter</p>
                  </div>
                  <div>
                    <Label htmlFor="aadhaar_number">Aadhaar Number *</Label>
                    <Input id="aadhaar_number" placeholder="123456789012" {...register('aadhaar_number')} className="mt-1" maxLength={12} />
                    <FieldError name="aadhaar_number" />
                    <p className="text-xs text-gray-400 mt-1">12-digit Aadhaar number</p>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <div className="text-3xl mb-2">📎</div>
                    <p className="text-sm font-medium text-gray-700">Upload KYC Documents</p>
                    <p className="text-xs text-gray-400 mt-1">PAN Card + Aadhaar Card (front & back)</p>
                    <Button type="button" variant="outline" size="sm" className="mt-3">Choose Files</Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Bank Details */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div>
                    <Label>Select Bank *</Label>
                    <Select onValueChange={(val) => { setSelectedBank(val); setValue('bank_name', val); }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Search and select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_OPTIONS.map(bank => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError name="bank_name" />
                  </div>
                  <div>
                    <Label htmlFor="account_holder_name">Account Holder Name *</Label>
                    <Input id="account_holder_name" placeholder="As per bank records" {...register('account_holder_name')} className="mt-1" />
                    <FieldError name="account_holder_name" />
                  </div>
                  <div>
                    <Label htmlFor="account_number">Account Number *</Label>
                    <Input id="account_number" placeholder="Enter bank account number" {...register('account_number')} className="mt-1" />
                    <FieldError name="account_number" />
                  </div>
                  <div>
                    <Label htmlFor="ifsc_code">IFSC Code *</Label>
                    <Input id="ifsc_code" placeholder="HDFC0001234" {...register('ifsc_code')} className="mt-1 uppercase" />
                    <FieldError name="ifsc_code" />
                    <p className="text-xs text-gray-400 mt-1">4 letters + 0 + 6 alphanumeric</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                    <p className="font-semibold mb-1">✅ Almost done!</p>
                    <p>Your bank details are used for commission payouts and refunds only. All data is encrypted and secure.</p>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" required className="mt-0.5 rounded border-gray-300" />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <Link href="/terms" className="text-green-600 underline">Terms & Conditions</Link>,{' '}
                      <Link href="/privacy" className="text-green-600 underline">Privacy Policy</Link>, and{' '}
                      <Link href="/refund" className="text-green-600 underline">Refund Policy</Link>
                    </span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={nextStep} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Create Account</span>
                  )}
                </Button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-semibold">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <RegisterContent />
    </Suspense>
  );
}
