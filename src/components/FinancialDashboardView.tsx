'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { formatUSD, formatKHR } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  PieChart,
  BarChart3,
  Receipt,
  Wallet,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';

export default function FinancialDashboardView() {
  const { lang, customers, orders, inventory } = useAppStore();
  const t = translations[lang];

  // Accounts Receivable (A/R) Aging calculations
  const totalReceivables = customers.reduce((acc, c) => acc + c.current_balance, 0);

  // Simulated Aging brackets for Cambodian water distributor credit terms
  const current30Days = totalReceivables * 0.62; // 62% current
  const aging31to60 = totalReceivables * 0.25; // 25% 31-60 days
  const overdueOver60 = totalReceivables * 0.13; // 13% high risk overdue

  // Customers exceeding or near credit limit
  const highRiskCustomers = customers.filter(
    (c) => c.current_balance >= c.credit_limit * 0.9
  );

  // Revenue & Cash Flow
  const todayRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((acc, o) => acc + o.total_amount, 0);

  const monthlyEstRevenue = 14850.0;
  const estimatedCogs = 5820.0; // 39.2% COGS (Water treatment, caps, electricity, labor)
  const monthlyExpenses = 3450.0; // Fuel, maintenance, rent
  const netProfit = monthlyEstRevenue - estimatedCogs - monthlyExpenses;
  const netMarginPercent = ((netProfit / monthlyEstRevenue) * 100).toFixed(1);

  // Unit Cost breakdown for 1x 20L Gallon Water
  const unitCostBreakdown = [
    { name: lang === 'km' ? 'អគ្គិសនី & ចម្រោះ RO' : 'Electricity & RO Treatment', cost: 0.14, pct: 31 },
    { name: lang === 'km' ? 'គម្រប & ស្កុតកម្ដៅ' : 'Cap & Heat Shrink Seal', cost: 0.055, pct: 12 },
    { name: lang === 'km' ? 'ពលកម្មផលិតកម្ម' : 'Direct Production Labor', cost: 0.12, pct: 27 },
    { name: lang === 'km' ? 'ការរំលោះសំបកធុង' : 'Bottle Wear & Tear Depreciation', cost: 0.08, pct: 18 },
    { name: lang === 'km' ? 'ទឹកប្រភពដើម & សារធាតុរ៉ែ' : 'Raw Water & Minerals', cost: 0.055, pct: 12 },
  ];

  const totalCogsPerGallon = unitCostBreakdown.reduce((acc, item) => acc + item.cost, 0);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-emerald-600" />
          {t.finance.title}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          {lang === 'km'
            ? 'វិភាគថ្លៃដើមផលិតកម្ម តុល្យភាពបំណុល A/R និងប្រាក់ចំណេញសុទ្ធ'
            : 'Production unit costing, Accounts Receivable aging, and Cash flow reconciliation'}
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Cash Collected */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            {t.finance.dailyCash}
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">
              {formatUSD(todayRevenue)}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
              Today
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ≈ {formatKHR(todayRevenue)}
          </span>
        </div>

        {/* Total Accounts Receivable (A/R) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            {t.finance.arTotal}
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">
              {formatUSD(totalReceivables)}
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
              {customers.length} Clients
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {lang === 'km' ? 'ប្រាក់អតិថិជនជំពាក់សរុប' : 'Total uncollected invoices'}
          </span>
        </div>

        {/* Estimated Monthly Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            {t.finance.monthlyRevenue}
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {formatUSD(monthlyEstRevenue)}
            </span>
            <span className="flex items-center text-xs font-bold text-emerald-600">
              <ArrowUpRight className="h-4 w-4" /> +14.2%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {lang === 'km' ? 'ប៉ាន់ស្មានខែនេះ' : 'Projected for current month'}
          </span>
        </div>

        {/* Net Profit Margin */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">
            {t.finance.netMargin}
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">
              {formatUSD(netProfit)}
            </span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-black text-blue-700">
              {netMarginPercent}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {lang === 'km' ? 'បន្ទាប់ពីកាត់ COGS & បន្ទុក' : 'After COGS & operational overhead'}
          </span>
        </div>
      </div>

      {/* SECTION 2: A/R Aging Analysis & Credit Enforcement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* A/R Aging Bar Chart Breakdown (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                {lang === 'km' ? 'វិភាគអាយុកាលបំណុល (A/R Aging Schedule)' : 'Accounts Receivable (A/R) Aging Schedule'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'km'
                  ? 'ការបែងចែកបំណុលតាមកាលកំណត់ ៣០ / ៦០ / ៩០ ថ្ងៃ'
                  : 'Aging schedule according to Cambodia standard trade credit policies'}
              </p>
            </div>
            <span className="font-bold text-slate-900 text-sm">
              {formatUSD(totalReceivables)}
            </span>
          </div>

          {/* Aging Visual Progress Bars */}
          <div className="space-y-3 pt-2">
            {/* Current (<30 days) */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-emerald-700 font-semibold">{t.finance.aging30}</span>
                <span className="text-slate-800 font-bold">
                  {formatUSD(current30Days)} (62%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '62%' }} />
              </div>
            </div>

            {/* 31-60 days */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-700 font-semibold">{t.finance.aging60}</span>
                <span className="text-slate-800 font-bold">
                  {formatUSD(aging31to60)} (25%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: '25%' }} />
              </div>
            </div>

            {/* Over 60 days */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-rose-700 font-semibold">{t.finance.aging90}</span>
                <span className="text-slate-800 font-bold">
                  {formatUSD(overdueOver60)} (13%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-rose-500" style={{ width: '13%' }} />
              </div>
            </div>
          </div>

          {/* Credit Lock Alert Warning */}
          <div className="mt-4 rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold block">
                {lang === 'km'
                  ? 'គោលការណ៍ចាក់សោការដឹកជញ្ជូន (Credit Limit Enforcement):'
                  : 'Automatic Delivery Dispatch Block Policy:'}
              </span>
              <p className="mt-0.5">
                {lang === 'km'
                  ? 'អតិថិជនដែលជំពាក់លើសពីកម្រិតកំណត់ ឬលើស ៦០ថ្ងៃ ប្រព័ន្ធនឹងបិទមិនឱ្យអ្នកបើកបរប្រគល់ទំនិញឡើយរហូតដល់មានការទូទាត់'
                  : 'Clients with overdue >60 days or exceeding 100% credit limit will be blocked at Driver Dispatch until partial settlement.'}
              </p>
            </div>
          </div>
        </div>

        {/* High Risk / Near Limit Customers (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            {lang === 'km' ? 'បញ្ជីអតិថិជនជិតដល់កម្រិតកំណត់' : 'Credit Limit Watchlist'}
          </h3>

          <div className="space-y-3">
            {highRiskCustomers.map((cust) => {
              const usagePct = Math.min(
                100,
                Math.round((cust.current_balance / cust.credit_limit) * 100)
              );
              const isLocked = cust.current_balance >= cust.credit_limit;

              return (
                <div
                  key={cust.id}
                  className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 block">{cust.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {cust.business_name} ({cust.phone})
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isLocked
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isLocked ? 'LOCKED' : `${usagePct}% Used`}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-[11px]">
                    <span className="text-slate-500">
                      Debt: <b className="text-slate-800">{formatUSD(cust.current_balance)}</b>
                    </span>
                    <span className="text-slate-500">
                      Limit: <b className="text-slate-800">{formatUSD(cust.credit_limit)}</b>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: Manufacturing Cost Allocation & COGS per 20L Gallon */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              {lang === 'km'
                ? 'ថ្លៃដើមផលិតកម្មក្នុង ១ ធុង ២០លីត្រ (Unit COGS Allocation)'
                : 'Direct Unit Production Cost (COGS) Breakdown (1x 20L Gallon)'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'km'
                ? 'ការវិភាគថ្លៃដើមរួមបញ្ចូល អគ្គិសនី ចម្រោះ RO គម្រប ពលកម្ម និងរំលោះសំបកធុង'
                : 'Detailed allocation including electricity, Reverse Osmosis consumables, packaging, labor, and gallon amortization'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total Unit Cost:</span>
            <span className="text-lg font-black text-blue-700">
              {formatUSD(totalCogsPerGallon)} / Gallon
            </span>
          </div>
        </div>

        {/* Cost Elements Table */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {unitCostBreakdown.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs"
            >
              <span className="font-semibold text-slate-700 block truncate">
                {item.name}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900">
                  {formatUSD(item.cost)}
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  {item.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Margin Analysis at Tiers */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
            <span className="text-emerald-800 font-semibold block">Retail Sale ($1.25)</span>
            <span className="text-lg font-bold text-emerald-700">
              +{formatUSD(1.25 - totalCogsPerGallon)} Margin
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">
              64% Gross Profit Margin
            </span>
          </div>

          <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
            <span className="text-blue-800 font-semibold block">Wholesale Sale ($0.90)</span>
            <span className="text-lg font-bold text-blue-700">
              +{formatUSD(0.90 - totalCogsPerGallon)} Margin
            </span>
            <span className="text-[10px] text-blue-600 block mt-0.5">
              50% Gross Profit Margin
            </span>
          </div>

          <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-100">
            <span className="text-purple-800 font-semibold block">Distributor Sale ($0.75)</span>
            <span className="text-lg font-bold text-purple-700">
              +{formatUSD(0.75 - totalCogsPerGallon)} Margin
            </span>
            <span className="text-[10px] text-purple-600 block mt-0.5">
              40% Gross Profit Margin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
