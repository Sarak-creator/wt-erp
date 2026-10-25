'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { UserRole } from '@/types/database';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Factory,
  DollarSign,
  Users,
  Boxes,
  Shield,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const { lang, currentRole, orders } = useAppStore();
  const t = translations[lang];

  // RBAC permission matrix
  const isAccessible = (allowedRoles: UserRole[]) => {
    return allowedRoles.includes(currentRole);
  };

  const navItems = [
    {
      id: 'pos',
      label: t.nav.pos,
      icon: ShoppingCart,
      allowed: ['admin', 'cashier', 'accountant'] as UserRole[],
      badge: 'Touch',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'bottles',
      label: t.nav.bottles,
      icon: Package,
      allowed: ['admin', 'cashier', 'accountant', 'inventory_manager'] as UserRole[],
      badge: '20L',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'logistics',
      label: t.nav.logistics,
      icon: Truck,
      allowed: ['admin', 'driver', 'inventory_manager'] as UserRole[],
      badge: orders.filter((o) => o.status === 'dispatched').length.toString(),
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'manufacturing',
      label: t.nav.manufacturing,
      icon: Factory,
      allowed: ['admin', 'inventory_manager'] as UserRole[],
      badge: 'BOM',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'finance',
      label: t.nav.finance,
      icon: DollarSign,
      allowed: ['admin', 'accountant'] as UserRole[],
      badge: 'A/R',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {lang === 'km' ? 'ម៉ូឌុលគ្រប់គ្រងសហគ្រាស' : 'Enterprise Modules'}
        </div>

        {navItems.map((item) => {
          if (!isAccessible(item.allowed)) return null;

          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* RBAC notice footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl border border-slate-200/60 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold mb-1">
          <Shield className="h-3.5 w-3.5 text-blue-600" />
          <span>RBAC Security Active</span>
        </div>
        <p className="text-[11px] text-slate-500">
          {lang === 'km'
            ? `អ្នកកំពុងប្រើប្រាស់ក្នុងនាម ${t.roles[currentRole]}`
            : `Logged in as ${t.roles[currentRole]}`}
        </p>
      </div>
    </aside>
  );
}
