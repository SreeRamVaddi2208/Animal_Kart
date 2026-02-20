'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Bell, ShoppingCart, User, LogOut,
  LayoutDashboard, Wallet, Gift, Users, ArrowRightLeft, FileText, ShieldCheck, Warehouse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuthStore, useCartStore } from '@/lib/store';
import { getInitials } from '@/lib/utils';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();

  const unreadNotifications = 0;
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const agentLinks = [
    { href: '/dashboard/agent', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/warehouses', label: 'Warehouses', icon: Warehouse },
    { href: '/dashboard/agent/wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/agent/referrals', label: 'Referrals', icon: Users },
    { href: '/dashboard/agent/transfers', label: 'Transfers', icon: ArrowRightLeft },
  ];

  const investorLinks = [
    { href: '/dashboard/investor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/warehouses', label: 'Warehouses', icon: Warehouse },
    { href: '/dashboard/investor/wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/investor/referrals', label: 'Referrals', icon: Users },
    { href: '/dashboard/investor/rewards', label: 'Rewards', icon: Gift },
    { href: '/dashboard/investor/invoices', label: 'Invoices', icon: FileText },
  ];

  const adminLinks = [
    { href: '/dashboard/admin', label: 'Admin Panel', icon: ShieldCheck },
  ];

  const navLinks = user?.role === 'agent' ? agentLinks : user?.role === 'admin' ? adminLinks : investorLinks;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">AK</span>
            </div>
            <span className="font-bold text-xl text-gray-900">
              Animal<span className="text-green-600">Kart</span>
            </span>
          </Link>

          {/* Desktop Nav Links (authenticated) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Public Nav Links */}
          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-6">
              <Link href="/#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 font-medium">How it Works</Link>
              <Link href="/#warehouses" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Warehouses</Link>
              <Link href="/#rewards" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Rewards</Link>
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Cart */}
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-green-600">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* Notifications */}
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-green-100 text-green-700 text-xs font-semibold">
                          {user ? getInitials(user.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                        {user?.full_name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div>
                        <p className="font-semibold">{user?.full_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {isAuthenticated ? (
                <>
                  {navLinks.map(link => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Icon className="w-4 h-4" /> {link.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/#how-it-works" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700">How it Works</Link>
                  <Link href="/#warehouses" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700">Warehouses</Link>
                  <Link href="/#rewards" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700">Rewards</Link>
                  <div className="pt-2 flex flex-col gap-2">
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-green-600 hover:bg-green-700">Get Started</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
