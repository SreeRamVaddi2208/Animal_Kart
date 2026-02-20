'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import { useCartStore } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/utils';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const router = useRouter();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Browse our farm warehouses and add units to get started.</p>
            <Link href="/warehouses">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 h-11">
                Browse Warehouses <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-green-600" /> Shopping Cart
          </h1>
          <p className="text-gray-500 mt-1">{items.reduce((s, i) => s + i.quantity, 0)} units selected</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <motion.div key={item.warehouse_id} initial="hidden" animate="visible" variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.warehouse_name}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Andhra Pradesh</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className="bg-green-100 text-green-700 text-xs">🐃 2 Buffalos</Badge>
                        <Badge className="bg-blue-100 text-blue-700 text-xs">🐄 2 Calves</Badge>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.warehouse_id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => item.quantity > 1 ? updateQuantity(item.warehouse_id, item.quantity - 1) : removeItem(item.warehouse_id)}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.warehouse_id, item.quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="flex justify-between items-center">
              <Link href="/warehouses">
                <Button variant="outline" size="sm">+ Add More Units</Button>
              </Link>
              <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-medium">
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.warehouse_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.warehouse_name} × {item.quantity}</span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST</span>
                  <span className="text-gray-500">As applicable</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                onClick={() => router.push('/payment')}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold mt-5"
              >
                Proceed to Payment <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              <div className="mt-4 space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span>🔒</span><span>Secure payment processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📄</span><span>GST invoice on WhatsApp & Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✅</span><span>Admin-verified payment confirmation</span>
                </div>
              </div>
            </div>

            {/* Reward Eligibility */}
            {items.reduce((s, i) => s + i.quantity, 0) >= 5 && (
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
                <p className="font-bold text-sm mb-1">🎁 Reward Eligible!</p>
                <p className="text-xs text-amber-100">
                  {items.reduce((s, i) => s + i.quantity, 0) >= 100 ? 'Mahindra Thar Roxx 4x4' :
                    items.reduce((s, i) => s + i.quantity, 0) >= 50 ? '1kg Silver + Thailand Trip (2)' :
                      items.reduce((s, i) => s + i.quantity, 0) >= 10 ? 'Thailand Trip for 2 Persons' :
                        'Thailand Trip for 1 Person'}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
