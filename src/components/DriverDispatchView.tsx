'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { formatUSD } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/database';
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Camera,
  PenTool,
  Check,
  ChevronRight,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';

export default function DriverDispatchView() {
  const { lang, orders, customers, updateOrderStatus, addBottleMovement } = useAppStore();
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'trips' | 'vanManifest'>('trips');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Delivery confirmation form state
  const [deliveredCount, setDeliveredCount] = useState<number>(0);
  const [returnedEmpties, setReturnedEmpties] = useState<number>(0);
  const [podPhotoUploaded, setPodPhotoUploaded] = useState(false);
  const [podSigned, setPodSigned] = useState(false);

  // Filter orders for delivery
  const dispatchList = orders.filter((o) => o.status !== 'cancelled');

  // Truck bottle reconciliation calculation
  const totalDeliveredOnTruck = orders
    .filter((o) => o.status === 'delivered')
    .reduce((acc, o) => acc + (o.bottles_delivered || 0), 0);

  const totalEmptiesCollected = orders
    .filter((o) => o.status === 'delivered')
    .reduce((acc, o) => acc + (o.bottles_returned || 0), 0);

  const vanOpeningFull = 120; // 120 gallons loaded on truck in morning
  const currentFullOnTruck = Math.max(0, vanOpeningFull - totalDeliveredOnTruck);

  const handleOpenConfirmModal = (order: Order) => {
    setSelectedOrder(order);
    setDeliveredCount(order.bottles_delivered || 10);
    setReturnedEmpties(order.bottles_returned || 10);
    setPodPhotoUploaded(false);
    setPodSigned(false);
  };

  const handleConfirmDelivery = () => {
    if (!selectedOrder) return;

    updateOrderStatus(
      selectedOrder.id,
      'delivered',
      podPhotoUploaded ? 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400' : undefined,
      deliveredCount,
      returnedEmpties
    );

    // Record into bottle ledger
    addBottleMovement({
      customer_id: selectedOrder.customer_id,
      order_id: selectedOrder.id,
      bottles_out: deliveredCount,
      bottles_in: returnedEmpties,
      deposit_collected: 0,
      deposit_refunded: 0,
      breakage_qty: 0,
      notes: `Driver POD delivery confirmed (${deliveredCount} full / ${returnedEmpties} empty)`,
    });

    setSelectedOrder(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-[calc(100vh-4rem)] max-w-5xl mx-auto">
      {/* Header & Sub-nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600" />
            {t.logistics.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {lang === 'km'
              ? 'ផ្ទាំងបញ្ជាសម្រាប់អ្នកបើកបរ ដឹកជញ្ជូន និងផ្ទៀងផ្ទាត់ធុងលើរថយន្ត'
              : 'Driver mobile delivery dispatch manifest & truck reconciliation'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-200 p-1 text-xs font-bold text-slate-700">
          <button
            onClick={() => setActiveTab('trips')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeTab === 'trips'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            {t.logistics.driverView} ({dispatchList.length})
          </button>
          <button
            onClick={() => setActiveTab('vanManifest')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeTab === 'vanManifest'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            {t.logistics.truckManifest}
          </button>
        </div>
      </div>

      {/* TAB 1: Driver Mobile Cards Sequence */}
      {activeTab === 'trips' && (
        <div className="space-y-4">
          {/* Truck Quick Summary Strip */}
          <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-3.5 text-white shadow-md text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">
                {t.logistics.openingCount}
              </span>
              <span className="text-lg font-black text-cyan-300">
                {vanOpeningFull} ធុង
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                {t.logistics.deliveredCount}
              </span>
              <span className="text-lg font-black text-emerald-400">
                {totalDeliveredOnTruck} ធុង
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                {t.logistics.collectedEmpties}
              </span>
              <span className="text-lg font-black text-amber-400">
                {totalEmptiesCollected} ធុង
              </span>
            </div>
          </div>

          {/* Sequence List of Deliveries */}
          <div className="space-y-3">
            {dispatchList.map((order, index) => {
              const customer = customers.find((c) => c.id === order.customer_id);
              const isDelivered = order.status === 'delivered';
              const isDispatched = order.status === 'dispatched';

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border p-4 transition-all bg-white shadow-sm ${
                    isDelivered
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center font-black text-xs ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block">
                          {order.invoice_number}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {customer?.name}
                        </h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDispatched
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.logistics.status[order.status]}
                    </span>
                  </div>

                  {/* Customer business & address */}
                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <div className="font-medium text-slate-800">
                      🏢 {customer?.business_name || 'Retail House'}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{customer?.address || 'Phnom Penh'}</span>
                    </div>
                  </div>

                  {/* Quantity & Amount */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Order: </span>
                      <span className="font-bold text-slate-900">
                        {order.bottles_delivered || 10} ធុង (20L)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total: </span>
                      <span className="font-bold text-blue-600">
                        {formatUSD(order.total_amount)}
                      </span>
                      <span
                        className={`ml-1 text-[10px] font-bold uppercase ${
                          order.payment_status === 'paid'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        ({order.payment_status})
                      </span>
                    </div>
                  </div>

                  {/* Driver Action Buttons: Call, Maps, Confirm */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {/* Call Customer Button */}
                    <a
                      href={`tel:${customer?.phone}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{t.logistics.callCustomer}</span>
                    </a>

                    {/* Google Maps redirect */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        customer?.address || 'Phnom Penh'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                    >
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      <span>{t.logistics.openMaps}</span>
                    </a>

                    {/* Delivery Confirmation */}
                    <button
                      onClick={() => handleOpenConfirmModal(order)}
                      disabled={isDelivered}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-700 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      }`}
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      <span>
                        {isDelivered
                          ? t.logistics.status.delivered
                          : t.logistics.confirmDelivery}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Van Inventory Bottle Reconciliation Sheet */}
      {activeTab === 'vanManifest' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {lang === 'km'
                  ? 'របាយការណ៍ផ្ទៀងផ្ទាត់តុល្យភាពធុងលើរថយន្ត'
                  : 'Daily Driver Van Manifest & Bottle Reconciliation'}
              </h2>
              <p className="text-xs text-slate-500">
                Van Plate: 2B-8899 PP | Driver: ស៊ឹម វិចិត្រ (Sim Vicheth)
              </p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              Trip #01 - Active
            </span>
          </div>

          {/* Formula Verification Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800">
            <span className="font-bold text-blue-600 block mb-1">
              {lang === 'km' ? 'រូបមន្តគណនាធុង:' : 'Accounting Formula:'}
            </span>
            <p>
              [Opening Full ({vanOpeningFull})] - [Delivered ({totalDeliveredOnTruck})] ={' '}
              <span className="font-bold text-slate-900">
                Remaining Full ({currentFullOnTruck})
              </span>
            </p>
            <p className="mt-1">
              [Collected Empties ({totalEmptiesCollected})] ={' '}
              <span className="font-bold text-amber-600">
                Empties to unload at factory
              </span>
            </p>
          </div>

          {/* Trip Stats Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="border border-slate-200 rounded-xl p-3">
              <span className="text-xs text-slate-500 block">Loaded Morning</span>
              <span className="text-xl font-bold text-slate-900">{vanOpeningFull}</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3">
              <span className="text-xs text-slate-500 block">Delivered Full</span>
              <span className="text-xl font-bold text-emerald-600">
                {totalDeliveredOnTruck}
              </span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3">
              <span className="text-xs text-slate-500 block">Empties Loaded</span>
              <span className="text-xl font-bold text-amber-600">
                {totalEmptiesCollected}
              </span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3">
              <span className="text-xs text-slate-500 block">Returning to Factory</span>
              <span className="text-xl font-bold text-blue-600">
                {currentFullOnTruck + totalEmptiesCollected}
              </span>
            </div>
          </div>

          <button
            onClick={() => alert('Van reconciliation signed and synced with warehouse inventory!')}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 shadow-md"
          >
            <Check className="h-4 w-4 text-emerald-400" />
            {t.logistics.reconcile}
          </button>
        </div>
      )}

      {/* MODAL: Proof of Delivery (POD) & Bottle Exchange Counter */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative border border-slate-100 text-xs">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-blue-600" />
              {t.logistics.confirmDelivery}
            </h3>
            <p className="text-slate-500 mt-0.5">
              Invoice #{selectedOrder.invoice_number}
            </p>

            {/* Bottle Exchange Counters */}
            <div className="mt-4 space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <span className="font-bold text-slate-800 block text-xs">
                {lang === 'km' ? 'ចំនួនដោះដូរធុងជាក់ស្តែង:' : 'Bottle Handover Counter:'}
              </span>

              {/* Full Bottles Delivered */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  {t.bottles.bottlesOut} (Full Delivered):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeliveredCount(Math.max(1, deliveredCount - 1))}
                    className="h-7 w-7 rounded-lg bg-white border border-slate-300 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-slate-900">
                    {deliveredCount}
                  </span>
                  <button
                    onClick={() => setDeliveredCount(deliveredCount + 1)}
                    className="h-7 w-7 rounded-lg bg-blue-600 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Empty Bottles Received */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  {t.bottles.bottlesIn} (Empties Received):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReturnedEmpties(Math.max(0, returnedEmpties - 1))}
                    className="h-7 w-7 rounded-lg bg-white border border-slate-300 font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-slate-900">
                    {returnedEmpties}
                  </span>
                  <button
                    onClick={() => setReturnedEmpties(returnedEmpties + 1)}
                    className="h-7 w-7 rounded-lg bg-amber-500 text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Proof of Delivery Options */}
            <div className="mt-4 space-y-2">
              <span className="font-bold text-slate-700 block">
                {t.logistics.pod}:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPodPhotoUploaded(!podPhotoUploaded)}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border font-bold transition-all ${
                    podPhotoUploaded
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span>{podPhotoUploaded ? 'Photo Captured ✓' : 'Take Photo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPodSigned(!podSigned)}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border font-bold transition-all ${
                    podSigned
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                  <span>{podSigned ? 'Signed ✓' : 'Sign On Screen'}</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <button
                onClick={handleConfirmDelivery}
                className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-md hover:bg-emerald-700"
              >
                {t.logistics.confirmDelivery}
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
