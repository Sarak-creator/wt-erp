'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { formatUSD, formatKHR } from '@/lib/utils';
import { InventoryItem, PaymentMethod } from '@/types/database';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  Building,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Printer,
  X,
  Search,
  Package,
  Layers,
} from 'lucide-react';

export default function PosView() {
  const {
    lang,
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    inventory,
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    depositBottlesCount,
    setDepositBottlesCount,
    updateCustomerBalance,
    addOrder,
    addBottleMovement,
    deductInventory,
  } = useAppStore();

  const t = translations[lang];
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showKhqrModal, setShowKhqrModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculations
  const subtotal = cart.reduce((acc, ci) => acc + ci.lineTotal, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const depositRate = 3.0; // $3 per returnable 20L bottle
  const totalDeposit = depositBottlesCount * depositRate;
  const grandTotal = subtotal - discountAmount + totalDeposit;

  // Credit limit evaluation
  const remainingCredit = selectedCustomer
    ? selectedCustomer.credit_limit - selectedCustomer.current_balance
    : 0;
  const isCreditExceeded =
    paymentMethod === 'credit' && grandTotal > remainingCredit;

  // Filter finished goods
  const availableItems = inventory.filter(
    (item) =>
      (item.type === 'finished_good' || item.type === 'asset') &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.name_kh && item.name_kh.includes(searchTerm)))
  );

  const handleCheckout = () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage(t.pos.cartEmpty);
      return;
    }

    if (!selectedCustomer) {
      setErrorMessage(t.pos.searchCustomer);
      return;
    }

    if (paymentMethod === 'credit' && grandTotal > remainingCredit) {
      setErrorMessage(t.pos.insufficientCredit);
      return;
    }

    // Process checkout
    const invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const orderData = {
      id: 'ord-' + Date.now(),
      invoice_number: invoiceNumber,
      customer_id: selectedCustomer.id,
      status: 'delivered' as const,
      payment_status: paymentMethod === 'credit' ? ('unpaid' as const) : ('paid' as const),
      payment_method: paymentMethod,
      subtotal,
      discount: discountAmount,
      total_amount: grandTotal,
      paid_amount: paymentMethod === 'credit' ? 0 : grandTotal,
      bottles_delivered: depositBottlesCount,
      bottles_returned: 0,
      deposit_charge: totalDeposit,
      deposit_refund: 0,
      delivery_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addOrder(orderData);

    // Update customer balance & bottle count
    const balanceDelta = paymentMethod === 'credit' ? grandTotal : 0;
    updateCustomerBalance(
      selectedCustomer.id,
      balanceDelta,
      depositBottlesCount,
      totalDeposit
    );

    // If bottles were issued, add to bottle ledger
    if (depositBottlesCount > 0) {
      addBottleMovement({
        customer_id: selectedCustomer.id,
        order_id: orderData.id,
        bottles_out: depositBottlesCount,
        bottles_in: 0,
        deposit_collected: totalDeposit,
        deposit_refunded: 0,
        breakage_qty: 0,
        notes: `POS sale deposit (${depositBottlesCount} bottles)`,
      });
    }

    // Deduct inventory items
    cart.forEach((ci) => {
      deductInventory(ci.item.sku, ci.quantity);
    });

    setReceiptData({
      invoiceNumber,
      customer: selectedCustomer,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      deposit: totalDeposit,
      depositCount: depositBottlesCount,
      grandTotal,
      paymentMethod,
      date: new Date().toLocaleString(),
    });

    clearCart();
    setShowReceiptModal(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* LEFT COLUMN: Product Catalog (7 cols on desktop) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Search & Customer Selection Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Customer Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">
                {t.pos.searchCustomer}
              </label>
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.business_name || c.phone} ({c.price_tier})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Search */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">
                {t.pos.searchProduct}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.pos.searchProduct}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Customer Credit Status Widget */}
          {selectedCustomer && (
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-2">
                <span className="text-slate-500 block">{t.pos.creditLimit}</span>
                <span className="font-bold text-slate-800">
                  {formatUSD(selectedCustomer.credit_limit)}
                </span>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <span className="text-slate-500 block">{t.pos.currentDebt}</span>
                <span className="font-bold text-amber-600">
                  {formatUSD(selectedCustomer.current_balance)}
                </span>
              </div>
              <div
                className={`rounded-lg p-2 ${
                  remainingCredit <= 20
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <span className="block opacity-80">{t.pos.availableCredit}</span>
                <span className="font-bold">{formatUSD(remainingCredit)}</span>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-blue-700">
                <span className="block opacity-80">{t.pos.bottlesHeld}</span>
                <span className="font-bold">
                  {selectedCustomer.empty_bottles_held} {lang === 'km' ? 'ធុង' : 'Bottles'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableItems.map((item) => {
            const customerTier = selectedCustomer?.price_tier || 'retail';
            const price =
              customerTier === 'wholesale' || customerTier === 'distributor'
                ? item.wholesale_price
                : item.retail_price;

            const isLowStock = item.qty_on_hand <= item.reorder_level;

            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                      {item.sku}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isLowStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.qty_on_hand} {item.unit}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 line-clamp-1">
                    {lang === 'km' && item.name_kh ? item.name_kh : item.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {item.name}
                  </p>
                </div>

                <div className="mt-4 flex items-baseline justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-base font-black text-slate-900">
                      {formatUSD(price)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {formatKHR(price)}
                    </span>
                  </div>
                  <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 20L Bottle Deposit Modifier Card */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-4 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-300" />
                <h4 className="font-bold text-sm">
                  {lang === 'km'
                    ? 'ប្រាក់កក់ធុងទឹកថ្មី ($3.00/ធុង)'
                    : 'New 20L Gallon Cash Deposit ($3.00/bottle)'}
                </h4>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                {lang === 'km'
                  ? 'គិតប្រាក់កក់បន្ថែមសម្រាប់អតិថិជនដែលពុំមានសំបកធុងដោះដូរ'
                  : 'Charge refundable deposit if customer has no empty exchange gallon'}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1.5 self-start sm:self-auto">
              <button
                onClick={() => setDepositBottlesCount(Math.max(0, depositBottlesCount - 1))}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-bold text-base">
                {depositBottlesCount}
              </span>
              <button
                onClick={() => setDepositBottlesCount(depositBottlesCount + 1)}
                className="h-8 w-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 flex items-center justify-center font-bold"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold pl-1 text-cyan-200">
                = {formatUSD(totalDeposit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: POS Cart & Checkout Terminal (5 cols on desktop) */}
      <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 justify-between">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">
                {lang === 'km' ? 'កន្ត្រកទំនិញ' : 'Current Sale Cart'}
              </h2>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                {cart.length}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {lang === 'km' ? 'សម្អាត' : 'Clear'}
              </button>
            )}
          </div>

          {/* Cart Line Items */}
          <div className="my-3 max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <ShoppingCart className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <p className="text-sm">{t.pos.cartEmpty}</p>
              </div>
            ) : (
              cart.map((ci) => (
                <div
                  key={ci.item.id}
                  className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 text-xs"
                >
                  <div className="flex-1 pr-2">
                    <span className="font-bold text-slate-800 block">
                      {lang === 'km' && ci.item.name_kh ? ci.item.name_kh : ci.item.name}
                    </span>
                    <span className="text-slate-500">
                      {formatUSD(ci.unitPrice)} / {ci.item.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => updateCartQty(ci.item.id, ci.quantity - 1)}
                        className="px-2 py-1 hover:bg-slate-100 text-slate-700"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-slate-800">
                        {ci.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(ci.item.id, ci.quantity + 1)}
                        className="px-2 py-1 hover:bg-slate-100 text-slate-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="w-16 text-right font-bold text-slate-900">
                      {formatUSD(ci.lineTotal)}
                    </span>

                    <button
                      onClick={() => removeFromCart(ci.item.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cart Bottom Summary & Checkout */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          {/* Subtotal & Deposit summary */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>{t.pos.subtotal}:</span>
              <span className="font-semibold text-slate-800">{formatUSD(subtotal)}</span>
            </div>
            {depositBottlesCount > 0 && (
              <div className="flex justify-between text-blue-600 font-medium">
                <span>
                  {t.pos.depositCharge} ({depositBottlesCount}):
                </span>
                <span>+{formatUSD(totalDeposit)}</span>
              </div>
            )}
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>{t.pos.discount} ({discountPercent}%):</span>
                <span>-{formatUSD(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-base font-black text-slate-900">
              <span>{t.pos.totalPayable}:</span>
              <div className="text-right">
                <span className="text-blue-600">{formatUSD(grandTotal)}</span>
                <span className="text-xs text-slate-400 block font-normal">
                  {formatKHR(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              {lang === 'km' ? 'វិធីសាស្ត្រទូទាត់' : 'Payment Method'}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center gap-1.5 justify-center py-2 px-2.5 rounded-xl border font-semibold transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="h-4 w-4" />
                {t.pos.payCash}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('khqr');
                  setShowKhqrModal(true);
                }}
                className={`flex items-center gap-1.5 justify-center py-2 px-2.5 rounded-xl border font-semibold transition-all ${
                  paymentMethod === 'khqr'
                    ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <QrColorIcon />
                Bakong KHQR
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex items-center gap-1.5 justify-center py-2 px-2.5 rounded-xl border font-semibold transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building className="h-4 w-4" />
                {t.pos.payBank}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`flex items-center gap-1.5 justify-center py-2 px-2.5 rounded-xl border font-semibold transition-all ${
                  paymentMethod === 'credit'
                    ? isCreditExceeded
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                {t.pos.payCredit}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {(errorMessage || isCreditExceeded) && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage || t.pos.insufficientCredit}</span>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCreditExceeded}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]"
          >
            <CheckCircle2 className="h-4 w-4" />
            {t.pos.checkout} ({formatUSD(grandTotal)})
          </button>
        </div>
      </div>

      {/* MODAL 1: Bakong KHQR Payment Screen */}
      {showKhqrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center relative border border-slate-100">
            <button
              onClick={() => setShowKhqrModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Bakong Official Red Header */}
            <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-[#E1251B] px-4 py-2 text-white font-black tracking-wide shadow-md shadow-red-500/30">
              KHQR BAKONG
            </div>

            <h3 className="font-bold text-slate-900 text-base">
              {lang === 'km' ? 'ស្កេនដើម្បីទូទាត់ប្រាក់' : 'Scan to Pay with Bakong / Any Bank'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              សហគ្រាសផលិតទឹកបរិសុទ្ធ ខ្មែរ អង្គរ (Khmer Angkor Water)
            </p>

            {/* Realistic KHQR Code Frame */}
            <div className="my-5 flex justify-center">
              <div className="relative rounded-2xl border-2 border-red-500 p-4 bg-white shadow-inner">
                {/* Simulated QR Code Pattern */}
                <div className="h-48 w-48 bg-slate-900 rounded-lg p-2 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="h-12 w-12 border-4 border-white rounded-md bg-slate-900 flex items-center justify-center">
                      <div className="h-6 w-6 bg-white" />
                    </div>
                    <div className="h-12 w-12 border-4 border-white rounded-md bg-slate-900 flex items-center justify-center">
                      <div className="h-6 w-6 bg-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="rounded bg-red-600 text-white px-2 py-0.5 text-[10px] font-bold">
                      KHQR
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-12 w-12 border-4 border-white rounded-md bg-slate-900 flex items-center justify-center">
                      <div className="h-6 w-6 bg-white" />
                    </div>
                    <div className="h-10 w-10 border-2 border-dashed border-white/50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-5">
              <span className="text-2xl font-black text-slate-900">
                {formatUSD(grandTotal)}
              </span>
              <span className="text-xs text-slate-500 block">
                ≈ {formatKHR(grandTotal)}
              </span>
            </div>

            <button
              onClick={() => {
                setShowKhqrModal(false);
                handleCheckout();
              }}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
            >
              {lang === 'km' ? 'បញ្ជាក់ការទទួលប្រាក់ (Simulate Paid)' : 'Confirm Payment Received'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: ESC/POS Thermal Receipt (80mm/58mm format) */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl relative">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Thermal Receipt Paper Layout */}
            <div className="border border-dashed border-slate-300 p-5 font-mono text-xs text-slate-800 bg-amber-50/30 rounded-lg">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                <h2 className="font-bold text-sm tracking-wider uppercase">
                  សហគ្រាសផលិតទឹកបរិសុទ្ធ ខ្មែរ អង្គរ
                </h2>
                <p className="text-[10px] text-slate-600">
                  KHMER ANGKOR PURE WATER CO., LTD.
                </p>
                <p className="text-[10px] text-slate-500">
                  #128, St 271, Phnom Penh | Tel: 012 334 556
                </p>
                <div className="mt-2 text-[10px]">
                  <span>INV: {receiptData.invoiceNumber}</span> |{' '}
                  <span>{receiptData.date}</span>
                </div>
                <div className="text-[10px] text-slate-600">
                  Cust: {receiptData.customer.name} ({receiptData.customer.phone})
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3">
                <div className="flex justify-between font-bold text-[11px]">
                  <span>ITEM</span>
                  <span>QTY x PRICE</span>
                  <span>TOTAL</span>
                </div>
                {receiptData.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[140px]">{it.item.name}</span>
                    <span>
                      {it.quantity} x {formatUSD(it.unitPrice)}
                    </span>
                    <span>{formatUSD(it.lineTotal)}</span>
                  </div>
                ))}
                {receiptData.depositCount > 0 && (
                  <div className="flex justify-between text-[11px] text-blue-700">
                    <span>20L Gallon Deposit x {receiptData.depositCount}</span>
                    <span>@ $3.00</span>
                    <span>+{formatUSD(receiptData.deposit)}</span>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3 mb-3">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatUSD(receiptData.subtotal)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>DISCOUNT:</span>
                    <span>-{formatUSD(receiptData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                  <span>GRAND TOTAL (USD):</span>
                  <span>{formatUSD(receiptData.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TOTAL (KHR ៛):</span>
                  <span>{formatKHR(receiptData.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PAYMENT METHOD:</span>
                  <span className="uppercase">{receiptData.paymentMethod}</span>
                </div>
              </div>

              {/* Thermal Footer */}
              <div className="text-center text-[10px] text-slate-500 pt-1">
                <p>សូមពិនិត្យទំនិញ និងសំបកធុងមុនចាកចេញ!</p>
                <p>Thank you for choosing Khmer Angkor Pure Water</p>
                <p className="mt-2 text-[8px] text-slate-400">--- ESC/POS 80mm ---</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-md"
              >
                <Printer className="h-4 w-4" />
                {t.pos.printReceipt}
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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

function QrColorIcon() {
  return (
    <div className="h-4 w-4 rounded-sm bg-red-600 flex items-center justify-center text-white text-[9px] font-black">
      QR
    </div>
  );
}
