'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { ProductionBatch } from '@/types/database';
import {
  Factory,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  FlaskConical,
  Layers,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

export default function ManufacturingView() {
  const { lang, batches, addBatch, inventory, addInventory, deductInventory } =
    useAppStore();
  const t = translations[lang];

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [targetQty, setTargetQty] = useState<number>(500);
  const [actualQty, setActualQty] = useState<number>(500);
  const [phLevel, setPhLevel] = useState<number>(7.2);
  const [tdsLevel, setTdsLevel] = useState<number>(18.0);
  const [qcPassed, setQcPassed] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('Standard 4-stage Reverse Osmosis & UV passed');

  const handleRecordBatch = (e: React.FormEvent) => {
    e.preventDefault();

    const batchNumber =
      'LOT-' +
      new Date().toISOString().slice(0, 10).replace(/-/g, '') +
      '-' +
      Math.floor(10 + Math.random() * 90);

    const newBatch: ProductionBatch = {
      id: 'b-' + Date.now(),
      batch_number: batchNumber,
      finished_good_id: 'inv1', // 20L Gallon
      target_qty: targetQty,
      actual_qty: actualQty,
      ph_level: phLevel,
      tds_level: tdsLevel,
      qc_passed: qcPassed,
      notes,
      produced_at: new Date().toISOString(),
    };

    addBatch(newBatch);

    // Auto-update inventory stocks based on BOM:
    // 1 Gallon = 1 Cap + 1 Seal Wrap
    deductInventory('PKG-CAP-20L', actualQty);
    deductInventory('PKG-SEAL-20L', actualQty);
    addInventory('FG-GAL-20L', actualQty);

    setShowBatchModal(false);
  };

  // Bill of Materials (BOM) Specification for 1x 20L Gallon
  const bomItems = [
    { name: lang === 'km' ? 'ទឹកចម្រោះកម្រិតស្អាត (RO Water)' : 'RO Purified Water', spec: '20 Liters', sku: 'RAW-WATER-M3' },
    { name: lang === 'km' ? 'គម្របធុង ២០លីត្រ (Blue Cap)' : '20L Bottle Cap (Non-spill)', spec: '1 Piece', sku: 'PKG-CAP-20L' },
    { name: lang === 'km' ? 'ស្កុតកម្ដៅបិទគម្រប (Neck Seal)' : 'Tamper-evident Shrink Seal', spec: '1 Piece', sku: 'PKG-SEAL-20L' },
    { name: lang === 'km' ? 'ការសម្លាប់មេរោគដោយអូហ្សូន (Ozone)' : 'Ozone & UV Sterilization', spec: '0.4 mg/L allocation', sku: 'RAW-OZONE' },
    { name: lang === 'km' ? 'សំបកធុងវិលជុំ (Polycarbonate)' : '20L Polycarbonate Gallon', spec: 'Re-washed & disinfected', sku: 'AST-EMPTY-20L' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Factory className="h-6 w-6 text-blue-600" />
            {t.manufacturing.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {lang === 'km'
              ? 'ការគ្រប់គ្រងរូបមន្តផ្សំ BOM បាច់ផលិតកម្ម និងការត្រួតពិនិត្យគុណភាពទឹក (QC)'
              : 'Bill of Materials (BOM), production lot tracking & water QC compliance'}
          </p>
        </div>

        <button
          onClick={() => setShowBatchModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          {lang === 'km' ? 'កត់ត្រាបាច់ផលិតថ្មី' : 'Log New Production Batch'}
        </button>
      </div>

      {/* SECTION 1: Bill of Materials (BOM) Architecture */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">
                {t.manufacturing.bomTitle} - 20L Pure Water Gallon
              </h3>
              <p className="text-xs text-slate-500">
                1 FG Unit = Raw Treated Water + 1 Cap + 1 Seal Wrap + Bottle Amortization
              </p>
            </div>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            Standard BOM v1.2
          </span>
        </div>

        {/* BOM Diagram Chain */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {bomItems.map((bom, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex flex-col justify-between"
            >
              <div>
                <span className="rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 mb-1.5 inline-block">
                  Step 0{index + 1}
                </span>
                <h4 className="font-bold text-slate-900 line-clamp-1">{bom.name}</h4>
                <p className="text-slate-500 text-[11px] mt-1">{bom.spec}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2 block">
                SKU: {bom.sku}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Production Batches & Water Quality Compliance Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-cyan-600" />
            <h3 className="font-bold text-slate-900 text-base">
              {lang === 'km' ? 'ប្រវត្តិនៃការផលិត & លទ្ធផល QC' : 'Batch Production History & Water QC Compliance'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Batches: {batches.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-y border-slate-200">
              <tr>
                <th className="py-3 px-3">{t.manufacturing.batchNumber}</th>
                <th className="py-3 px-3">{t.common.date}</th>
                <th className="py-3 px-3 text-center">{t.manufacturing.targetQty}</th>
                <th className="py-3 px-3 text-center">{t.manufacturing.actualQty}</th>
                <th className="py-3 px-3 text-center">{t.manufacturing.phLevel}</th>
                <th className="py-3 px-3 text-center">{t.manufacturing.tdsLevel}</th>
                <th className="py-3 px-3 text-center">{t.manufacturing.qcStatus}</th>
                <th className="py-3 px-3">{lang === 'km' ? 'កំណត់សម្គាល់ QC' : 'QC Notes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">
                    {batch.batch_number}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(batch.produced_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">
                    {batch.target_qty}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">
                    {batch.actual_qty}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-emerald-700">
                    {batch.ph_level || '7.2'}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-cyan-700">
                    {batch.tds_level || '18'} ppm
                  </td>
                  <td className="py-3 px-3 text-center">
                    {batch.qc_passed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> PASSED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                        <AlertCircle className="h-3 w-3" /> FAILED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                    {batch.notes || 'Normal batch'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Production Batch & Deduct BOM Materials */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl relative border border-slate-100 text-xs">
            <button
              onClick={() => setShowBatchModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-blue-600" />
              {t.manufacturing.completeBatch}
            </h3>
            <p className="text-slate-500 mt-0.5">
              {lang === 'km'
                ? 'កត់ត្រាបាច់ផលិតកម្ម និងកាត់ស្តុកគម្រប/ស្កុតស្វ័យប្រវត្តិ'
                : 'Log completed batch and auto-decrement raw packaging materials from inventory'}
            </p>

            <form onSubmit={handleRecordBatch} className="mt-4 space-y-4">
              {/* Product */}
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {lang === 'km' ? 'ផលិតផលសម្រេច' : 'Finished Good'}
                </label>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900">
                  20L Pure Water Gallon (ទឹកបរិសុទ្ធ ២០ លីត្រ)
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {t.manufacturing.targetQty}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetQty}
                    onChange={(e) => setTargetQty(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {t.manufacturing.actualQty}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={actualQty}
                    onChange={(e) => setActualQty(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-blue-700"
                    required
                  />
                </div>
              </div>

              {/* QC Parameters */}
              <div className="grid grid-cols-2 gap-3 bg-cyan-50/50 p-3 rounded-2xl border border-cyan-100">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {t.manufacturing.phLevel} (Std: 6.8 - 7.5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={phLevel}
                    onChange={(e) => setPhLevel(parseFloat(e.target.value) || 7.0)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {t.manufacturing.tdsLevel} (Std: &lt;30 ppm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={tdsLevel}
                    onChange={(e) => setTdsLevel(parseFloat(e.target.value) || 15.0)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {lang === 'km' ? 'កំណត់សម្គាល់ QC' : 'QC Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-800"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md hover:bg-blue-700"
                >
                  {t.manufacturing.completeBatch}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
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
