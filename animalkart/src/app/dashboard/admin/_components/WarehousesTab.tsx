'use client';

import { motion } from 'framer-motion';
import { Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WarehouseRecord } from './types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

const WAREHOUSES: WarehouseRecord[] = [
  { id: 1, name: 'Pune Central Warehouse',   location: 'Pune, Maharashtra',       total: 500, sold: 320, available: 180 },
  { id: 2, name: 'Mumbai North Warehouse',   location: 'Mumbai, Maharashtra',     total: 400, sold: 210, available: 190 },
  { id: 3, name: 'Nashik Warehouse',         location: 'Nashik, Maharashtra',     total: 300, sold: 180, available: 120 },
  { id: 4, name: 'Aurangabad Warehouse',     location: 'Aurangabad, Maharashtra', total: 350, sold: 350, available: 0   },
  { id: 5, name: 'Nagpur East Warehouse',    location: 'Nagpur, Maharashtra',     total: 250, sold: 90,  available: 160 },
];

export default function WarehousesTab() {
  const totalCapacity = WAREHOUSES.reduce((s, w) => s + w.total, 0);
  const totalSold     = WAREHOUSES.reduce((s, w) => s + w.sold,  0);
  const totalAvail    = WAREHOUSES.reduce((s, w) => s + w.available, 0);

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">

      {/* Summary row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Capacity', value: totalCapacity.toLocaleString() + ' units', color: 'text-gray-900' },
          { label: 'Total Sold',     value: totalSold.toLocaleString()     + ' units', color: 'text-green-700' },
          { label: 'Available',      value: totalAvail.toLocaleString()    + ' units', color: 'text-blue-700'  },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Warehouse cards */}
      {WAREHOUSES.map(wh => {
        const soldPct = Math.min((wh.sold / wh.total) * 100, 100);
        const isFull  = wh.available === 0;

        return (
          <motion.div key={wh.id} variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Warehouse className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{wh.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{wh.location}</p>
                </div>
              </div>
              <Badge className={isFull ? 'bg-red-100 text-red-700' : soldPct > 70 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>
                {isFull ? 'Full' : `${wh.available} available`}
              </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{wh.total}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-700">{wh.sold}</p>
                <p className="text-xs text-gray-400">Sold</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-700">{wh.available}</p>
                <p className="text-xs text-gray-400">Available</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Occupancy</span>
                <span>{soldPct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    isFull ? 'bg-red-500' : soldPct > 70 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${soldPct}%` }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
