'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Phone, ArrowRight, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useCartStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { fetchWarehouseStock } from '@/lib/api';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function WarehousesPage() {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockRows, setStockRows] = useState<Awaited<ReturnType<typeof fetchWarehouseStock>>>([]);
  const { addItem } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await fetchWarehouseStock();
        setStockRows(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Odoo stock');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const warehouses = useMemo(() => {
    const byWarehouse = new Map<number, {
      id: number;
      name: string;
      location: string;
      total_capacity: number;
      available_units: number;
      contact_details: string;
      address: string;
      product_id: number;
      sku: string;
      unit_price: number;
    }>();

    for (const row of stockRows) {
      const existing = byWarehouse.get(row.warehouse_id);
      if (existing) {
        existing.available_units += Number(row.qty_available || 0);
        existing.total_capacity += Number(row.qty_available || 0);
      } else {
        byWarehouse.set(row.warehouse_id, {
          id: row.warehouse_id,
          name: row.warehouse_name,
          location: `${row.warehouse_name}, Andhra Pradesh`,
          total_capacity: Number(row.qty_available || 0),
          available_units: Number(row.qty_available || 0),
          contact_details: 'Contact via AnimalKart support',
          address: `${row.warehouse_name}, Andhra Pradesh`,
          product_id: row.product_id,
          sku: row.sku || 'AK-BUF-INV-001',
          unit_price: Number(row.unit_price || 0),
        });
      }
    }

    return Array.from(byWarehouse.values());
  }, [stockRows]);

  const filtered = warehouses.filter(w =>
    (w.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.location || '').toLowerCase().includes(search.toLowerCase())
  );

  const locationsCount = warehouses.length;
  const totalUnits = warehouses.reduce((sum, w) => sum + Number(w.available_units || 0), 0);
  const unitPrice = warehouses[0]?.unit_price || 0;

  const handleAddToCart = (warehouseId: number, warehouseName: string, productId: number, sku: string, unitPrice: number) => {
    const qty = quantities[warehouseId] || 1;
    addItem({
      warehouse_id: warehouseId,
      warehouse_name: warehouseName,
      product_id: productId,
      sku,
      quantity: qty,
      unit_price: unitPrice,
      total: qty * unitPrice,
    });
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Select a Warehouse</h1>
          <p className="text-gray-500">Choose your preferred farm location and number of units to purchase</p>
        </motion.div>

        {/* Unit Info Banner */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-5 text-white mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-green-100 text-sm">Price per Unit</p>
            <p className="text-3xl font-bold">{formatCurrency(unitPrice)}</p>
            <p className="text-green-100 text-sm mt-1">1 Unit = 2 Buffalos + 2 Calves</p>
          </div>
          <div className="flex gap-6 text-center">
            <div><p className="text-2xl font-bold">{formatNumber(locationsCount)}</p><p className="text-green-100 text-sm">Locations</p></div>
            <div><p className="text-2xl font-bold">{formatNumber(totalUnits)}</p><p className="text-green-100 text-sm">Total Units</p></div>
            <div><p className="text-2xl font-bold">5%</p><p className="text-green-100 text-sm">Commission</p></div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search warehouses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </motion.div>

        {loading && <p className="text-sm text-gray-500 mb-4">Loading live Odoo warehouse stock...</p>}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Warehouse Grid */}
        {(!loading && !error && filtered.length === 0) ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
            No warehouse stock available from Odoo right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(warehouse => {
            const capacityBase = Math.max(Number(warehouse.total_capacity || 0), 1);
            const pctRaw = Math.round((Number(warehouse.available_units || 0) / capacityBase) * 100);
            const pct = Math.max(0, Math.min(100, pctRaw));
            const qty = quantities[warehouse.id] || 1;
            const total = qty * warehouse.unit_price;

            return (
              <div key={warehouse.id}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  {/* Top bar */}
                  <div className={`h-2 ${pct > 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : pct > 30 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{warehouse.name}</h3>
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span>{warehouse.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{warehouse.contact_details}</span>
                        </div>
                      </div>
                      <Badge className={`text-sm px-3 py-1 ${pct > 70 ? 'bg-green-100 text-green-700' : pct > 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {pct > 70 ? 'High Availability' : pct > 30 ? 'Limited' : 'Low Stock'}
                      </Badge>
                    </div>

                    {/* Availability */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Available Units</span>
                        <span className="font-bold text-gray-900">{formatNumber(warehouse.available_units)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                          className={`h-2.5 rounded-full ${pct > 70 ? 'bg-green-500' : pct > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{pct}% available</span>
                        <span>{formatNumber(warehouse.total_capacity)} total capacity</span>
                      </div>
                    </div>

                    {/* Unit Composition */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-1">🐃</div>
                        <p className="text-sm font-semibold text-gray-900">2 Buffalos</p>
                        <p className="text-xs text-gray-500">per unit</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-1">🐄</div>
                        <p className="text-sm font-semibold text-gray-900">2 Calves</p>
                        <p className="text-xs text-gray-500">per unit</p>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Quantity:</span>
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setQuantities(prev => ({ ...prev, [warehouse.id]: Math.max(1, (prev[warehouse.id] || 1) - 1) }))}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
                        >−</button>
                        <span className="w-12 text-center font-bold text-gray-900">{qty}</span>
                        <button
                          onClick={() => setQuantities(prev => ({ ...prev, [warehouse.id]: Math.min(Math.max(1, Math.floor(warehouse.available_units)), (prev[warehouse.id] || 1) + 1) }))}
                          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
                        >+</button>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="font-bold text-gray-900">{formatCurrency(total)}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAddToCart(warehouse.id, warehouse.name, warehouse.product_id, warehouse.sku, warehouse.unit_price)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-11 font-semibold"
                    >
                      Add to Cart — {formatCurrency(total)} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {/* Address info */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Warehouse Addresses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {warehouses.map(w => (
              <div key={w.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{w.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{w.address}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
