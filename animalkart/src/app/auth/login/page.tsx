'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store';
import { loginUser, demoAdminLogin } from '@/lib/api';
import type { UserRole } from '@/lib/types';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setUser } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginUser(data.email);
      const role = (result.role as UserRole) === 'agent' ? 'agent' : (result.role as UserRole) === 'admin' ? 'admin' : 'investor';
      setUser(
        {
          id: String(result.partner_id),
          full_name: result.full_name || data.email,
          email: result.email || data.email,
          phone: result.phone || '',
          whatsapp_number: result.whatsapp_number || '',
          address: result.address || '',
          pan_card: result.pan_card || '',
          aadhaar_number: result.aadhaar_number || '',
          bank_name: result.bank_name || '',
          account_number: result.account_number || '',
          ifsc_code: result.ifsc_code || '',
          account_holder_name: result.account_holder_name || '',
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
      setError(err instanceof Error ? err.message : 'Login failed');
    }
    setLoading(false);
  };

  const handleDemoAdminLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await demoAdminLogin();
      setUser(
        {
          id: String(result.partner_id),
          full_name: result.full_name || 'Demo Admin',
          email: result.email || 'admin.demo@animalkart.com',
          phone: '',
          whatsapp_number: '',
          address: '',
          pan_card: '',
          aadhaar_number: '',
          bank_name: '',
          account_number: '',
          ifsc_code: '',
          account_holder_name: '',
          role: 'admin',
          referral_code: '',
          kyc_status: 'approved',
          is_active: true,
          registration_date: result.registration_date || new Date().toISOString(),
          units_owned: 0,
        },
        result.token
      );
      router.push('/dashboard/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo admin login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold">AK</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">Animal<span className="text-green-600">Kart</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm">Sign in to your AnimalKart account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className={errors.email ? 'border-red-400' : ''}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'border-red-400 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-green-600 hover:text-green-700 font-medium">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white h-11 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-green-600 hover:text-green-700 font-semibold">
              Register here
            </Link>
          </p>

          <div className="mt-6 space-y-2">
            <p className="text-xs text-gray-400 text-center">
              Or quickly explore the admin panel with a demo account.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs"
              onClick={handleDemoAdminLogin}
            >
              Continue as Demo Admin
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline">Terms</Link> and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
