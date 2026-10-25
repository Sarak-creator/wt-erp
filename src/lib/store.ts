import { create } from 'zustand';
import { Customer, InventoryItem, Order, UserRole, BottleLedger, ProductionBatch } from '@/types/database';
import { Language, translations } from './i18n';
import { createClient } from '@/utils/supabase/client';

export interface CartItem {
  item: InventoryItem;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface AppState {
  // Locale & RBAC
  lang: Language;
  setLang: (lang: Language) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  // Supabase Connection Status
  isSyncing: boolean;
  supabaseConnected: boolean;
  syncError: string | null;
  fetchFromSupabase: () => Promise<void>;

  // Customers
  customers: Customer[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  updateCustomerBalance: (customerId: string, balanceDelta: number, bottleDelta: number, depositDelta: number) => void;

  // Inventory
  inventory: InventoryItem[];
  deductInventory: (sku: string, quantity: number) => void;
  addInventory: (sku: string, quantity: number) => void;

  // POS & Cart
  cart: CartItem[];
  addToCart: (item: InventoryItem, qty?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  depositBottlesCount: number;
  setDepositBottlesCount: (count: number) => void;

  // Orders
  orders: Order[];
  updateOrderStatus: (orderId: string, status: Order['status'], proofUrl?: string, bottlesDelivered?: number, bottlesReturned?: number) => void;
  addOrder: (order: Order) => void;

  // Bottle Ledger
  bottleLedger: BottleLedger[];
  addBottleMovement: (entry: Omit<BottleLedger, 'id' | 'created_at'>) => void;

  // Production Batches
  batches: ProductionBatch[];
  addBatch: (batch: ProductionBatch) => void;
}

// Initial fallback sample data (if Supabase is not yet populated)
const initialCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'លោក សុខ ចិន្តា',
    business_name: 'ហាងកាហ្វេ អាម៉ាហ្សូន បឹងកេងកង',
    phone: '012 889 977',
    address: 'ផ្លូវ 302, សង្កាត់បឹងកេងកង១, ខណ្ឌចំការមន',
    zone_id: 'z1',
    price_tier: 'wholesale',
    credit_limit: 200.0,
    current_balance: 35.0,
    deposit_balance: 60.0,
    empty_bottles_held: 20,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'អ្នកស្រី គង់ ម៉ាលី',
    business_name: 'សាលារៀន អន្តរជាតិ វឌ្ឍនៈ',
    phone: '015 677 822',
    address: 'ផ្លូវ 598, សង្កាត់បឹងកក់២, ខណ្ឌទួលគោក',
    zone_id: 'z2',
    price_tier: 'subscription',
    credit_limit: 500.0,
    current_balance: 480.0,
    deposit_balance: 150.0,
    empty_bottles_held: 50,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c3',
    name: 'លោក ចាន់ រតនា',
    business_name: 'ការដ្ឋានសំណង់ ជីប ម៉ុង',
    phone: '098 443 211',
    address: 'ផ្លូវជាតិលេខ១, សង្កាត់ច្បារអំពៅ១, ខណ្ឌច្បារអំពៅ',
    zone_id: 'z3',
    price_tier: 'wholesale',
    credit_limit: 300.0,
    current_balance: 310.0,
    deposit_balance: 90.0,
    empty_bottles_held: 30,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c4',
    name: 'អ្នកស្រី ហេង ធីតា',
    business_name: 'ផ្ទះលេខ ៤៥A (ផ្ទាល់ខ្លួន)',
    phone: '089 112 344',
    address: 'ផ្លូវ 271, សង្កាត់ទឹកថ្លា, ខណ្ឌសែនសុខ',
    zone_id: 'z4',
    price_tier: 'retail',
    credit_limit: 50.0,
    current_balance: 0.0,
    deposit_balance: 15.0,
    empty_bottles_held: 5,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialInventory: InventoryItem[] = [
  {
    id: 'inv1',
    sku: 'FG-GAL-20L',
    name: '20L Pure Water Gallon',
    name_kh: 'ទឹកបរិសុទ្ធ ២០ លីត្រ',
    type: 'finished_good',
    unit: 'gallon',
    qty_on_hand: 850,
    unit_cost: 0.45,
    retail_price: 1.25,
    wholesale_price: 0.9,
    reorder_level: 100,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv2',
    sku: 'FG-BOT-500ML',
    name: '500ml Bottled Water (Pack 24)',
    name_kh: 'ទឹកដប ៥០០មល (កេស ២៤)',
    type: 'finished_good',
    unit: 'box',
    qty_on_hand: 320,
    unit_cost: 1.8,
    retail_price: 3.5,
    wholesale_price: 2.75,
    reorder_level: 50,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv3',
    sku: 'FG-BOT-350ML',
    name: '350ml Bottled Water (Pack 24)',
    name_kh: 'ទឹកដប ៣៥០មល (កេស ២៤)',
    type: 'finished_good',
    unit: 'box',
    qty_on_hand: 210,
    unit_cost: 1.5,
    retail_price: 3.0,
    wholesale_price: 2.4,
    reorder_level: 40,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv4',
    sku: 'AST-EMPTY-20L',
    name: 'Returnable Empty 20L Gallon',
    name_kh: 'សំបកធុងទទេ ២០ លីត្រ',
    type: 'asset',
    unit: 'gallon',
    qty_on_hand: 1400,
    unit_cost: 3.5,
    retail_price: 3.0,
    wholesale_price: 3.0,
    reorder_level: 300,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv5',
    sku: 'PKG-CAP-20L',
    name: '20L Bottle Cap (Blue)',
    name_kh: 'គម្របធុង ២០លីត្រ',
    type: 'packaging',
    unit: 'piece',
    qty_on_hand: 12500,
    unit_cost: 0.04,
    retail_price: 0.0,
    wholesale_price: 0.0,
    reorder_level: 2000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inv6',
    sku: 'PKG-SEAL-20L',
    name: '20L Heat Shrink Neck Seal',
    name_kh: 'ស្កុតកម្ដៅបិទគម្រប',
    type: 'packaging',
    unit: 'piece',
    qty_on_hand: 16000,
    unit_cost: 0.015,
    retail_price: 0.0,
    wholesale_price: 0.0,
    reorder_level: 3000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialOrders: Order[] = [
  {
    id: 'ord-101',
    invoice_number: 'INV-2026-001',
    customer_id: 'c1',
    status: 'dispatched',
    payment_status: 'unpaid',
    payment_method: 'cash',
    subtotal: 18.0,
    discount: 0,
    total_amount: 18.0,
    paid_amount: 0,
    bottles_delivered: 20,
    bottles_returned: 18,
    deposit_charge: 6.0,
    deposit_refund: 0,
    delivery_date: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ord-102',
    invoice_number: 'INV-2026-002',
    customer_id: 'c2',
    status: 'dispatched',
    payment_status: 'unpaid',
    payment_method: 'credit',
    subtotal: 45.0,
    discount: 0,
    total_amount: 45.0,
    paid_amount: 0,
    bottles_delivered: 50,
    bottles_returned: 45,
    deposit_charge: 15.0,
    deposit_refund: 0,
    delivery_date: new Date().toISOString().split('T')[0],
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ord-103',
    invoice_number: 'INV-2026-003',
    customer_id: 'c4',
    status: 'delivered',
    payment_status: 'paid',
    payment_method: 'khqr',
    subtotal: 6.25,
    discount: 0,
    total_amount: 6.25,
    paid_amount: 6.25,
    bottles_delivered: 5,
    bottles_returned: 5,
    deposit_charge: 0,
    deposit_refund: 0,
    delivery_date: new Date().toISOString().split('T')[0],
    delivered_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialBottleLedger: BottleLedger[] = [
  {
    id: 'bl-1',
    customer_id: 'c1',
    order_id: 'ord-101',
    bottles_out: 20,
    bottles_in: 18,
    deposit_collected: 6.0,
    deposit_refunded: 0,
    breakage_qty: 0,
    notes: '2 bottles extra kept by customer',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'bl-2',
    customer_id: 'c2',
    order_id: 'ord-102',
    bottles_out: 50,
    bottles_in: 45,
    deposit_collected: 15.0,
    deposit_refunded: 0,
    breakage_qty: 1,
    notes: '1 bottle broken on site (written off)',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'bl-3',
    customer_id: 'c4',
    order_id: 'ord-103',
    bottles_out: 5,
    bottles_in: 5,
    deposit_collected: 0,
    deposit_refunded: 0,
    breakage_qty: 0,
    notes: 'Even exchange 5 in / 5 out',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const initialBatches: ProductionBatch[] = [
  {
    id: 'b-001',
    batch_number: 'LOT-20261025-A',
    finished_good_id: 'inv1',
    target_qty: 500,
    actual_qty: 500,
    ph_level: 7.2,
    tds_level: 18.0,
    qc_passed: true,
    notes: 'Ozone sterilization active. Reverse Osmosis 4-stage passed.',
    produced_at: new Date().toISOString(),
  },
  {
    id: 'b-002',
    batch_number: 'LOT-20261024-B',
    finished_good_id: 'inv2',
    target_qty: 200,
    actual_qty: 198,
    ph_level: 7.1,
    tds_level: 16.5,
    qc_passed: true,
    notes: '2 bottles rejected due to cap seal misalignment.',
    produced_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  lang: 'km',
  setLang: (lang) => set({ lang }),
  currentRole: 'admin',
  setCurrentRole: (currentRole) => set({ currentRole }),

  isSyncing: false,
  supabaseConnected: false,
  syncError: null,

  customers: initialCustomers,
  selectedCustomerId: 'c1',
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),

  inventory: initialInventory,
  cart: [
    {
      item: initialInventory[0],
      quantity: 10,
      unitPrice: initialInventory[0].wholesale_price,
      lineTotal: 10 * initialInventory[0].wholesale_price,
    },
  ],
  depositBottlesCount: 0,
  setDepositBottlesCount: (depositBottlesCount) => set({ depositBottlesCount }),
  orders: initialOrders,
  bottleLedger: initialBottleLedger,
  batches: initialBatches,

  // Live Supabase Fetcher
  fetchFromSupabase: async () => {
    set({ isSyncing: true, syncError: null });
    try {
      const supabase = createClient();

      // 1. Fetch Customers
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch Inventory
      const { data: invData, error: invErr } = await supabase
        .from('inventory_items')
        .select('*')
        .order('type');

      // 3. Fetch Orders
      const { data: ordData, error: ordErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // 4. Fetch Bottle Ledger
      const { data: blData, error: blErr } = await supabase
        .from('bottle_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      // 5. Fetch Production Batches
      const { data: batchData, error: batchErr } = await supabase
        .from('production_batches')
        .select('*')
        .order('produced_at', { ascending: false });

      const hasSupabaseData =
        (custData && custData.length > 0) ||
        (invData && invData.length > 0) ||
        (ordData && ordData.length > 0);

      if (hasSupabaseData) {
        set({
          supabaseConnected: true,
          isSyncing: false,
          customers: custData && custData.length > 0 ? (custData as Customer[]) : get().customers,
          selectedCustomerId: custData && custData.length > 0 ? custData[0].id : get().selectedCustomerId,
          inventory: invData && invData.length > 0 ? (invData as InventoryItem[]) : get().inventory,
          orders: ordData && ordData.length > 0 ? (ordData as Order[]) : get().orders,
          bottleLedger: blData && blData.length > 0 ? (blData as BottleLedger[]) : get().bottleLedger,
          batches: batchData && batchData.length > 0 ? (batchData as ProductionBatch[]) : get().batches,
        });
      } else {
        // If query succeeded but tables are empty, mark connected
        if (!custErr && !invErr) {
          set({ supabaseConnected: true, isSyncing: false });
        } else {
          set({
            isSyncing: false,
            syncError: custErr?.message || invErr?.message || 'Using local demo data',
          });
        }
      }
    } catch (err: any) {
      set({
        isSyncing: false,
        syncError: err?.message || 'Unable to connect to Supabase, using local fallback.',
      });
    }
  },

  updateCustomerBalance: async (customerId, balanceDelta, bottleDelta, depositDelta) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              current_balance: Math.max(0, c.current_balance + balanceDelta),
              empty_bottles_held: Math.max(0, c.empty_bottles_held + bottleDelta),
              deposit_balance: Math.max(0, c.deposit_balance + depositDelta),
            }
          : c
      ),
    }));

    // Sync to Supabase
    try {
      const supabase = createClient();
      const currentCust = get().customers.find((c) => c.id === customerId);
      if (currentCust) {
        await supabase
          .from('customers')
          .update({
            current_balance: currentCust.current_balance,
            empty_bottles_held: currentCust.empty_bottles_held,
            deposit_balance: currentCust.deposit_balance,
          })
          .eq('id', customerId);
      }
    } catch {
      // offline fallback
    }
  },

  deductInventory: async (sku, quantity) => {
    set((state) => ({
      inventory: state.inventory.map((item) =>
        item.sku === sku ? { ...item, qty_on_hand: Math.max(0, item.qty_on_hand - quantity) } : item
      ),
    }));

    try {
      const supabase = createClient();
      const updated = get().inventory.find((i) => i.sku === sku);
      if (updated) {
        await supabase.from('inventory_items').update({ qty_on_hand: updated.qty_on_hand }).eq('sku', sku);
      }
    } catch {}
  },

  addInventory: async (sku, quantity) => {
    set((state) => ({
      inventory: state.inventory.map((item) =>
        item.sku === sku ? { ...item, qty_on_hand: item.qty_on_hand + quantity } : item
      ),
    }));

    try {
      const supabase = createClient();
      const updated = get().inventory.find((i) => i.sku === sku);
      if (updated) {
        await supabase.from('inventory_items').update({ qty_on_hand: updated.qty_on_hand }).eq('sku', sku);
      }
    } catch {}
  },

  addToCart: (item, qty = 1) => {
    const { cart, customers, selectedCustomerId } = get();
    const customer = customers.find((c) => c.id === selectedCustomerId);
    const unitPrice =
      customer?.price_tier === 'wholesale' || customer?.price_tier === 'distributor'
        ? item.wholesale_price
        : item.retail_price;

    const existingIndex = cart.findIndex((ci) => ci.item.id === item.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + qty;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].lineTotal = newQty * unitPrice;
      set({ cart: updated });
    } else {
      set({
        cart: [...cart, { item, quantity: qty, unitPrice, lineTotal: qty * unitPrice }],
      });
    }
  },

  removeFromCart: (itemId) =>
    set((state) => ({
      cart: state.cart.filter((ci) => ci.item.id !== itemId),
    })),

  updateCartQty: (itemId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(itemId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((ci) =>
        ci.item.id === itemId
          ? { ...ci, quantity: qty, lineTotal: qty * ci.unitPrice }
          : ci
      ),
    }));
  },

  clearCart: () => set({ cart: [], depositBottlesCount: 0 }),

  updateOrderStatus: async (orderId, status, proofUrl, bottlesDelivered, bottlesReturned) => {
    set((state) => ({
      orders: state.orders.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status,
              proof_of_delivery_url: proofUrl || ord.proof_of_delivery_url,
              bottles_delivered: bottlesDelivered !== undefined ? bottlesDelivered : ord.bottles_delivered,
              bottles_returned: bottlesReturned !== undefined ? bottlesReturned : ord.bottles_returned,
              delivered_at: status === 'delivered' ? new Date().toISOString() : ord.delivered_at,
            }
          : ord
      ),
    }));

    try {
      const supabase = createClient();
      await supabase
        .from('orders')
        .update({
          status,
          proof_of_delivery_url: proofUrl,
          bottles_delivered: bottlesDelivered,
          bottles_returned: bottlesReturned,
          delivered_at: status === 'delivered' ? new Date().toISOString() : undefined,
        })
        .eq('id', orderId);
    } catch {}
  },

  addOrder: async (order) => {
    set((state) => ({
      orders: [order, ...state.orders],
    }));

    try {
      const supabase = createClient();
      await supabase.from('orders').insert({
        invoice_number: order.invoice_number,
        customer_id: order.customer_id,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        subtotal: order.subtotal,
        discount: order.discount,
        total_amount: order.total_amount,
        paid_amount: order.paid_amount,
        bottles_delivered: order.bottles_delivered,
        bottles_returned: order.bottles_returned,
        deposit_charge: order.deposit_charge,
        deposit_refund: order.deposit_refund,
        delivery_date: order.delivery_date,
      });
    } catch {}
  },

  addBottleMovement: async (entry) => {
    const newEntry: BottleLedger = {
      ...entry,
      id: 'bl-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      bottleLedger: [newEntry, ...state.bottleLedger],
    }));

    try {
      const supabase = createClient();
      await supabase.from('bottle_ledger').insert({
        customer_id: entry.customer_id,
        order_id: entry.order_id,
        bottles_out: entry.bottles_out,
        bottles_in: entry.bottles_in,
        deposit_collected: entry.deposit_collected,
        deposit_refunded: entry.deposit_refunded,
        breakage_qty: entry.breakage_qty,
        notes: entry.notes,
      });
    } catch {}
  },

  addBatch: async (batch) => {
    set((state) => ({
      batches: [batch, ...state.batches],
    }));

    try {
      const supabase = createClient();
      await supabase.from('production_batches').insert({
        batch_number: batch.batch_number,
        finished_good_id: batch.finished_good_id,
        target_qty: batch.target_qty,
        actual_qty: batch.actual_qty,
        ph_level: batch.ph_level,
        tds_level: batch.tds_level,
        qc_passed: batch.qc_passed,
        notes: batch.notes,
      });
    } catch {}
  },
}));
