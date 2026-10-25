'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { formatUSD } from '@/lib/utils';
import {
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  AlertOctagon,
  DollarSign,
  PlusCircle,
  Filter,
  CheckCircle,
  Calendar,
  Building2,
  X,
} from 'lucide-react';

export default function BottleLedgerView() {
  const {
    lang,
    customers,
    bottleLedger,
    addBottleMovement,
    updateCustomerBalance,
    inventory,
  } = useAppStore();

  const t = translations[lang];

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [showLogModal, setShowLogModal] = useState(false);

  // Form states
  const [targetCustomerId, setTargetCustomerId] = useState<string>(customers[0]?.id || '');
  const [bottlesOut, setBottlesOut] = useState<number>(0);
  const [bottlesIn, setBottlesIn] = useState<number>(0);
  const [depositCollected, setDepositCollected] = useState<number>(0);
  const [depositRefunded, setDepositRefunded] = useState<number>(0);
  const [breakageQty, setBreakageQty] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Aggregated bottle counts
  const totalHeldByCustomers = customers.reduce(
    (acc, c) => acc + (c.empty_bottles_held || 0),
    0
  );
  const totalDepositsHeld = customers.reduce(
    (acc, c) => acc + (c.deposit_balance || 0),
    0
  );
  const warehouseAssetBottles =
    inventory.find((i) => i.sku === 'AST-EMPTY-20L')?.qty_on_hand || 1400;
  const fullWarehouseGallons =
    inventory.find((i) => i.sku === 'FG-GAL-20L')?.qty_on_hand || 850;
  const totalCirculation =
    totalHeldByCustomers + warehouseAssetBottles + fullWarehouseGallons;

  // Filtered transactions
  const filteredLedger =
    selectedCustomerId === 'all'
      ? bottleLedger
      : bottleLedger.filter((b) => b.customer_id === selectedCustomerId);

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();

    addBottleMovement({
      customer_id: targetCustomerId,
      bottles_out: bottlesOut,
      bottles_in: bottlesIn,
      deposit_collected: depositCollected,
      deposit_refunded: depositRefunded,
      breakage_qty: breakageQty,
      notes,
    });

    // Update customer's held bottles & deposit balance
    const bottleDelta = bottlesOut - bottlesIn - breakageQty;
    const depositDelta = depositCollected - depositRefunded;
    updateCustomerBalance(targetCustomerId, 0, bottleDelta, depositDelta);

    // Reset & close
    setBottlesOut(0);
    setBottlesIn(0);
    setDepositCollected(0);
    setDepositRefunded(0);
    setBreakageQty(0);
    setNotes('');
    setShowLogModal(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            {t.bottles.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {t.bottles.subtitle}
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          {t.bottles.recordMovement}
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Circulation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            {t.bottles.totalCirculation}
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {totalCirculation.toLocaleString()}
            </span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
              20L Gallons
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {lang === 'km' ? 'រួមទាំងធុងពេញ និងសំបក' : 'Full water + Empties combined'}
          </p>
        </div>

        {/* Held By Customers */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            {t.bottles.heldByCustomers}
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">
              {totalHeldByCustomers.toLocaleString()}
            </span>
            <div className="flex items-center text-xs font-bold text-amber-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>Out</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {lang === 'km' ? 'នៅតាមផ្ទះ និងហាងអតិថិជន' : 'Currently with registered clients'}
          </p>
        </div>

        {/* Warehouse Inventory */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            {t.bottles.factoryWarehouse}
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">
              {(warehouseAssetBottles + fullWarehouseGallons).toLocaleString()}
            </span>
            <div className="flex items-center text-xs font-bold text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
              <span>Stock</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {fullWarehouseGallons} Full / {warehouseAssetBottles} Empty
          </p>
        </div>

        {/* Cash Deposit Vault */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            {t.bottles.totalDepositsHeld}
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">
              {formatUSD(totalDepositsHeld)}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
              Vault
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {lang === 'km' ? 'កាតព្វកិច្ចសងត្រឡប់វិញ' : 'Refundable liability in bank'}
          </p>
        </div>
      </div>

      {/* Customer Balances Quick Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            {lang === 'km' ? 'សមតុល្យធុងតាមអតិថិជន' : 'Customer Bottle & Deposit Ledger Balance'}
          </h3>
          {/* Customer filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">{t.common.all} ({customers.length})</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {customers.map((cust) => (
            <div
              key={cust.id}
              className={`rounded-xl border p-3.5 transition-all ${
                selectedCustomerId === cust.id
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                  {cust.name}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {cust.price_tier}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {cust.business_name || cust.phone}
              </p>

              <div className="mt-3 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">{t.pos.bottlesHeld}:</span>
                  <span className="font-bold text-amber-700">
                    {cust.empty_bottles_held} ធុង
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Deposit:</span>
                  <span className="font-bold text-blue-700">
                    {formatUSD(cust.deposit_balance)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottle Movement History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-y border-slate-200">
              <tr>
                <th className="py-3 px-3">{t.common.date}</th>
                <th className="py-3 px-3">{lang === 'km' ? 'អតិថិជន' : 'Customer'}</th>
                <th className="py-3 px-3 text-center">{t.bottles.bottlesOut} (▲)</th>
                <th className="py-3 px-3 text-center">{t.bottles.bottlesIn} (▼)</th>
                <th className="py-3 px-3 text-center">{t.bottles.breakage}</th>
                <th className="py-3 px-3">{t.bottles.depositCollected}</th>
                <th className="py-3 px-3">{t.bottles.depositRefunded}</th>
                <th className="py-3 px-3">{t.bottles.notes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map((row) => {
                const customer = customers.find((c) => c.id === row.customer_id);
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {customer ? customer.name : row.customer_id}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.bottles_out > 0 ? (
                        <span className="rounded-md bg-amber-100 text-amber-800 font-bold px-2 py-0.5">
                          +{row.bottles_out}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.bottles_in > 0 ? (
                        <span className="rounded-md bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5">
                          -{row.bottles_in}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.breakage_qty > 0 ? (
                        <span className="rounded-md bg-rose-100 text-rose-800 font-bold px-2 py-0.5">
                          {row.breakage_qty}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-emerald-700">
                      {row.deposit_collected > 0 ? `+${formatUSD(row.deposit_collected)}` : '-'}
                    </td>
                    <td className="py-3 px-3 font-medium text-rose-700">
                      {row.deposit_refunded > 0 ? `-${formatUSD(row.deposit_refunded)}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-xs">
                      {row.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Bottle Movement */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              {t.bottles.recordMovement}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'km'
                ? 'កត់ត្រាចំនួនធុងចេញ ធុងសំបកត្រឡប់ និងប្រាក់កក់'
                : 'Log returnable bottle exchange and security deposits'}
            </p>

            <form onSubmit={handleSaveMovement} className="mt-4 space-y-4 text-xs">
              {/* Customer Selector */}
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {lang === 'km' ? 'អតិថិជន' : 'Customer'}
                </label>
                <select
                  value={targetCustomerId}
                  onChange={(e) => setTargetCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-800 font-medium focus:border-blue-500"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.business_name || c.phone} (បច្ចុប្បន្ន: {c.empty_bottles_held} ធុង)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantities Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {t.bottles.bottlesOut} (Full)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bottlesOut}
                    onChange={(e) => setBottlesOut(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {t.bottles.bottlesIn} (Empty)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bottlesIn}
                    onChange={(e) => setBottlesIn(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-rose-600 mb-1 block">
                    {t.bottles.breakage}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={breakageQty}
                    onChange={(e) => setBreakageQty(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-rose-300 bg-rose-50/50 p-2 font-bold text-rose-700"
                  />
                </div>
              </div>

              {/* Deposit Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {t.bottles.depositCollected} ($3/ea)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={depositCollected}
                    onChange={(e) => setDepositCollected(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {t.bottles.depositRefunded}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={depositRefunded}
                    onChange={(e) => setDepositRefunded(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-rose-700"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {t.bottles.notes}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Broken during transit, replaced on site"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-800"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md hover:bg-blue-700"
                >
                  {t.common.save}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
