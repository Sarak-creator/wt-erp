'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { UserRole } from '@/types/database';
import { Droplet, Languages, ShieldCheck, Truck, UserCircle } from 'lucide-react';

export default function Header() {
  const { lang, setLang, currentRole, setCurrentRole } = useAppStore();
  const t = translations[lang];

  const roles: { role: UserRole; label: string }[] = [
    { role: 'admin', label: t.roles.admin },
    { role: 'cashier', label: t.roles.cashier },
    { role: 'driver', label: t.roles.driver },
    { role: 'accountant', label: t.roles.accountant },
    { role: 'inventory_manager', label: t.roles.inventory_manager },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md md:px-6">
      {/* Brand & Factory Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-blue-500/20 text-white">
          <Droplet className="h-6 w-6 fill-current" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 md:text-lg">
              {lang === 'km' ? 'សហគ្រាសទឹកបរិសុទ្ធ ខ្មែរ អង្គរ' : 'Khmer Angkor Pure Water ERP'}
            </span>
            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-800">
              PWA v2.4
            </span>
          </div>
          <p className="hidden text-xs text-slate-500 sm:block">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Right Controls: Role Switcher (RBAC Tester) & Language Selector */}
      <div className="flex items-center gap-3">
        {/* Role Simulator Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span className="hidden font-medium text-slate-500 sm:inline">Role:</span>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
          >
            {roles.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          title="Toggle Language"
        >
          <Languages className="h-3.5 w-3.5 text-slate-500" />
          <span>{lang === 'km' ? 'English' : 'ភាសាខ្មែរ'}</span>
        </button>

        {/* User Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-sm">
          {currentRole[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
}
