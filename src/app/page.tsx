'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import PosView from '@/components/PosView';
import BottleLedgerView from '@/components/BottleLedgerView';
import DriverDispatchView from '@/components/DriverDispatchView';
import FinancialDashboardView from '@/components/FinancialDashboardView';
import ManufacturingView from '@/components/ManufacturingView';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const { currentRole, fetchFromSupabase } = useAppStore();
  const [currentTab, setCurrentTab] = useState<string>('pos');

  // Fetch live data directly from Supabase on mount
  useEffect(() => {
    fetchFromSupabase();
  }, [fetchFromSupabase]);

  // Adjust default tab when switching role
  useEffect(() => {
    if (currentRole === 'driver') {
      setCurrentTab('logistics');
    } else if (currentRole === 'accountant') {
      setCurrentTab('finance');
    } else if (currentRole === 'inventory_manager') {
      setCurrentTab('manufacturing');
    }
  }, [currentRole]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 pb-16 md:pb-0">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'pos' && <PosView />}
          {currentTab === 'bottles' && <BottleLedgerView />}
          {currentTab === 'logistics' && <DriverDispatchView />}
          {currentTab === 'finance' && <FinancialDashboardView />}
          {currentTab === 'manufacturing' && <ManufacturingView />}
        </main>
      </div>

      <MobileNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
}
