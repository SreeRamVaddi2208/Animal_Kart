'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Phone, ArrowRight, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import DashboardShell from '@/components/layout/DashboardShell';
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
    <DashboardShell>
      <div className="max-w-7xl mx-auto py-4">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Select a Warehouse</h1>
          <p className="text-gray-400">Choose your preferred farm location and number of units to purchase</p>
        </motion.div>

        {/* Unit Info Banner */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}
          className="bg-[#0a1811] border border-[#1b3625] rounded-2xl p-6 text-white mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[#10b981] text-sm font-semibold mb-1">Price per Unit</p>
            <p className="text-4xl font-black">{formatCurrency(unitPrice)}</p>
            <p className="text-gray-400 text-sm mt-2">1 Unit = <span className="text-white">2 Buffalos + 2 Calves</span></p>
          </div>
          <div className="flex gap-8 text-center bg-[#030a06] p-4 rounded-xl border border-[#1b3625]">
            <div><p className="text-2xl font-bold text-white">{formatNumber(locationsCount)}</p><p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Locations</p></div>
            <div className="w-px bg-[#1b3625]"></div>
            <div><p className="text-2xl font-bold text-[#10b981]">{formatNumber(totalUnits)}</p><p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Total Units</p></div>
            <div className="w-px bg-[#1b3625]"></div>
            <div><p className="text-2xl font-bold text-[#eab308]">5%</p><p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">Commission</p></div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search warehouses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-[#0a1811] border-[#1b3625] text-white placeholder:text-gray-600 focus-visible:ring-[#10b981]"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2 bg-[#0a1811] border-[#1b3625] text-white hover:bg-[#1b3625] hover:text-white">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </motion.div>

        {loading && <p className="text-sm text-gray-500 mb-4">Loading live Odoo warehouse stock...</p>}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {/* Warehouse Grid */}
        {(!loading && !error && filtered.length === 0) ? (
          <div className="bg-[#0a1811] border border-[#1b3625] rounded-2xl p-6 text-sm text-gray-400 text-center">
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
                  <div className="bg-[#0a1811] rounded-2xl border border-[#1b3625] overflow-hidden group hover:border-[#10b981] transition-colors">
                    {/* Top bar indicator */}
                    <div className={`h-1 w-full ${pct > 70 ? 'bg-[#10b981]' : pct > 30 ? 'bg-[#eab308]' : 'bg-[#ef4444]'}`} />

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-[#10b981] transition-colors">{warehouse.name}</h3>
                          <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-2">
                            <MapPin className="w-4 h-4 text-[#10b981]" />
                            <span>{warehouse.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{warehouse.contact_details}</span>
                          </div>
                        </div>
                        <Badge className={`text-xs font-bold px-3 py-1 border ${pct > 70 ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/20' : pct > 30 ? 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/20' : 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/20'}`}>
                          {pct > 70 ? 'High Availability' : pct > 30 ? 'Limited' : 'Low Stock'}
                        </Badge>
                      </div>

                      {/* Availability */}
                      <div className="bg-[#030a06] rounded-xl p-5 mb-6 border border-[#1b3625]">
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-gray-400">Available Units</span>
                          <span className="font-bold text-white text-lg">{formatNumber(warehouse.available_units)}</span>
                        </div>
                        <div className="w-full bg-[#1b3625] rounded-full h-2 mb-3">
                          <div
                            className={`h-2 rounded-full ${pct > 70 ? 'bg-[#10b981]' : pct > 30 ? 'bg-[#eab308]' : 'bg-[#ef4444]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{pct}% available</span>
                          <span>{formatNumber(warehouse.total_capacity)} total capacity</span>
                        </div>
                      </div>

                      {/* Unit Composition */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-[#030a06] border border-[#1b3625] rounded-xl p-4 text-center">
                          <div className="text-3xl mb-2">🐃</div>
                          <p className="text-sm font-bold text-white">2 Buffalos</p>
                          <p className="text-xs text-gray-500 mt-1">per unit</p>
                        </div>
                        <div className="bg-[#030a06] border border-[#1b3625] rounded-xl p-4 text-center">
                          <div className="text-3xl mb-2">🐄</div>
                          <p className="text-sm font-bold text-white">2 Calves</p>
                          <p className="text-xs text-gray-500 mt-1">per unit</p>
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-sm font-bold text-gray-400">Quantity:</span>
                        <div className="flex items-center border border-[#1b3625] rounded-lg overflow-hidden bg-[#030a06]">
                          <button
                            onClick={() => setQuantities(prev => ({ ...prev, [warehouse.id]: Math.max(1, (prev[warehouse.id] || 1) - 1) }))}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1b3625] font-bold text-lg transition-colors"
                          >−</button>
                          <span className="w-12 text-center font-bold text-white">{qty}</span>
                          <button
                            onClick={() => setQuantities(prev => ({ ...prev, [warehouse.id]: Math.min(Math.max(1, Math.floor(warehouse.available_units)), (prev[warehouse.id] || 1) + 1) }))}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1b3625] font-bold text-lg transition-colors"
                          >+</button>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total</p>
                          <p className="font-black text-[#10b981] text-lg">{formatCurrency(total)}</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAddToCart(warehouse.id, warehouse.name, warehouse.product_id, warehouse.sku, warehouse.unit_price)}
                        className="w-full bg-[#10b981] hover:bg-[#059669] text-[#022c22] h-12 font-bold text-base rounded-xl transition-all"
                      >
                        Add to Cart — {formatCurrency(total)} <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Address info */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-8 bg-[#0a1811] rounded-2xl border border-[#1b3625] p-6">
          <h2 className="font-bold text-white mb-6">Warehouse Addresses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {warehouses.map(w => (
              <div key={w.id} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#030a06] border border-[#1b3625] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-[#10b981]" />
                </div>
                <div>
                  <p className="font-bold text-white text-base">{w.name}</p>
                  <p className="text-sm text-gray-400 mt-1">{w.address}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
