'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();

  const isLanding = pathname === '/';

  useEffect(() => {
    if (!isLanding) return;
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, [isLanding]);

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

  /* Nav appearance: dark glass on landing hero, solid light elsewhere */
  const darkMode = isLanding;
  const navBg = darkMode
    ? scrolled
      ? 'rgba(6,20,15,0.92)'
      : 'rgba(0,0,0,0.15)'
    : 'rgba(255,255,255,0.97)';
  const navBorder = darkMode
    ? scrolled
      ? '1px solid rgba(52,211,153,0.25)'
      : '1px solid rgba(255,255,255,0.08)'
    : '1px solid rgba(52,211,153,0.12)';
  const textColor = darkMode ? 'rgba(255,255,255,0.8)' : '#374151';
  const logoColor = darkMode ? '#34d399' : '#16a34a';
  const logoTextColor = darkMode ? 'white' : '#111827';

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: navBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: navBorder,
        boxShadow: scrolled && darkMode ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div
              style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#34d399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(52,211,153,0.3)', flexShrink: 0 }}
            >
              <span style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>AK</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, color: logoTextColor }}>
              Animal<span style={{ color: logoColor }}>Kart</span>
            </span>
          </Link>

          {/* Desktop auth nav links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                      transition: 'all 0.2s',
                      color: active ? '#34d399' : textColor,
                      background: active ? 'rgba(52,211,153,0.1)' : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = darkMode ? 'rgba(255,255,255,0.07)' : '#f9fafb';
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <Icon size={15} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Public nav links */}
          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-6">
              {['/#how-it-works', '/#warehouses', '/#rewards'].map((href, i) => {
                const labels = ['How It Works', 'Warehouses', 'Rewards'];
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{ fontSize: 14, fontWeight: 500, color: textColor, transition: 'color 0.2s', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#34d399'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = textColor; }}
                  >
                    {labels[i]}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative" style={{ color: textColor }}>
                    <ShoppingCart size={19} />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-green-600">{cartCount}</Badge>
                    )}
                  </Button>
                </Link>

                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="relative" style={{ color: textColor }}>
                    <Bell size={19} />
                    {unreadNotifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500">{unreadNotifications}</Badge>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2" style={{ color: textColor }}>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-green-600/20 text-green-400 text-xs font-semibold">
                          {user ? getInitials(user.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                        {user?.full_name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <p className="font-semibold">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2"><User size={15} /> Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 flex items-center gap-2">
                      <LogOut size={15} /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <button
                    style={{
                      background: 'transparent',
                      border: darkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(52,211,153,0.3)',
                      color: darkMode ? 'rgba(255,255,255,0.8)' : '#16a34a',
                      borderRadius: 10,
                      padding: '7px 18px',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Login
                  </button>
                </Link>
                <Link href="/auth/register">
                  <button
                    style={{
                      background: 'linear-gradient(135deg,#34d399,#059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      padding: '7px 18px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(52,211,153,0.3)',
                      transition: 'all 0.2s',
                    }}
                  >
                    Get Started
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              style={{ color: textColor }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
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
            className="md:hidden"
            style={{ borderTop: navBorder, background: darkMode ? 'rgba(4,15,9,0.97)' : 'white', backdropFilter: 'blur(20px)' }}
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
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: textColor, textDecoration: 'none' }}
                      >
                        <Icon size={16} /> {link.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <>
                  {[['/#how-it-works', 'How It Works'], ['/#warehouses', 'Warehouses'], ['/#rewards', 'Rewards']].map(([href, label]) => (
                    <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                      style={{ display: 'block', padding: '10px 12px', fontSize: 14, fontWeight: 500, color: textColor, textDecoration: 'none' }}
                    >
                      {label}
                    </Link>
                  ))}
                  <div className="pt-2 flex flex-col gap-2">
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                      <button style={{ width: '100%', background: 'transparent', border: '1px solid rgba(52,211,153,0.3)', color: darkMode ? 'white' : '#16a34a', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Login</button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                      <button style={{ width: '100%', background: 'linear-gradient(135deg,#34d399,#059669)', color: 'white', border: 'none', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Get Started</button>
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
