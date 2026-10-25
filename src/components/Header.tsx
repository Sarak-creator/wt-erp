'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { UserRole } from '@/types/database';
import {
  Droplet,
  Languages,
  ShieldCheck,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export default function Header() {
  const {
    lang,
    setLang,
    currentRole,
    setCurrentRole,
    supabaseConnected,
    isSyncing,
    syncError,
    fetchFromSupabase,
    customers,
  } = useAppStore();

  const t = translations[lang];

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');

  const roles: { role: UserRole; label: string }[] = [
    { role: 'admin', label: t.roles.admin },
    { role: 'cashier', label: t.roles.cashier },
    { role: 'driver', label: t.roles.driver },
    { role: 'accountant', label: t.roles.accountant },
    { role: 'inventory_manager', label: t.roles.inventory_manager },
  ];

  const handleOpenConfig = () => {
    if (typeof window !== 'undefined') {
      setSupabaseUrl(localStorage.getItem('supabase_url') || process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      setSupabaseAnonKey(localStorage.getItem('supabase_anon_key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    }
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_url', supabaseUrl.trim());
      localStorage.setItem('supabase_anon_key', supabaseAnonKey.trim());
    }
    setShowConfigModal(false);
    await fetchFromSupabase();
  };

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

      {/* Right Controls: Supabase Sync Badge, Role Switcher & Language Selector */}
      <div className="flex items-center gap-2.5">
        {/* Supabase Status Indicator & Config Launcher */}
        <button
          onClick={handleOpenConfig}
          className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold border transition-all ${
            supabaseConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
          title="Supabase Connection Settings"
        >
          <Database className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden sm:inline">
            {supabaseConnected ? 'Supabase Live' : 'Connect Supabase'}
          </span>
          <RefreshCw
            className={`h-3 w-3 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-400'}`}
          />
        </button>

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

      {/* Supabase Connection Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative border border-slate-100 text-xs text-slate-800">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-600" />
              {lang === 'km' ? 'ភ្ជាប់ជាមួយ Supabase Database' : 'Connect to Supabase Database'}
            </h3>
            <p className="text-slate-500 mt-1">
              {lang === 'km'
                ? 'បញ្ចូល Supabase URL និង Anon Key ដើម្បីទាញទិន្នន័យផ្ទាល់ពី Supabase Project របស់អ្នក'
                : 'Enter your Supabase URL and Anon Key to fetch and sync live data from your Supabase project'}
            </p>

            <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Status:</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    supabaseConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {supabaseConnected ? 'Connected & Synced' : 'Using Local Fallback Data'}
                </span>
              </div>
              {syncError && (
                <p className="text-[10px] text-rose-600 mt-1">Note: {syncError}</p>
              )}
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 font-mono text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-800 font-mono text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-700 shadow-md"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {lang === 'km' ? 'រក្សាទុក & ធ្វើសមកាលកម្ម' : 'Save & Sync Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
