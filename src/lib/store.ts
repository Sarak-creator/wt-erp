import { create } from 'zustand';
import { Customer, InventoryItem, Order, UserRole, BottleLedger, ProductionBatch } from '@/types/database';
import { Language, translations } from './i18n';

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

// Initial sample data grounded in Cambodian pure water factory operations
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
    deposit_balance: 60.0, // 20 bottles deposit @ $3 = $60
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
    current_balance: 480.0, // Near limit test case
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
    current_balance: 310.0, // Over limit test case!
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
    retail_price: 3.0, // standard deposit rate
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

  customers: initialCustomers,
  selectedCustomerId: 'c1',
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  updateCustomerBalance: (customerId, balanceDelta, bottleDelta, depositDelta) =>
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
    })),

  inventory: initialInventory,
  deductInventory: (sku, quantity) =>
    set((state) => ({
      inventory: state.inventory.map((item) =>
        item.sku === sku ? { ...item, qty_on_hand: Math.max(0, item.qty_on_hand - quantity) } : item
      ),
    })),
  addInventory: (sku, quantity) =>
    set((state) => ({
      inventory: state.inventory.map((item) =>
        item.sku === sku ? { ...item, qty_on_hand: item.qty_on_hand + quantity } : item
      ),
    })),

  cart: [
    {
      item: initialInventory[0], // 20L Gallon
      quantity: 10,
      unitPrice: initialInventory[0].wholesale_price,
      lineTotal: 10 * initialInventory[0].wholesale_price,
    },
  ],
  depositBottlesCount: 0,
  setDepositBottlesCount: (depositBottlesCount) => set({ depositBottlesCount }),

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

  orders: initialOrders,
  updateOrderStatus: (orderId, status, proofUrl, bottlesDelivered, bottlesReturned) =>
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
    })),

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),

  bottleLedger: initialBottleLedger,
  addBottleMovement: (entry) =>
    set((state) => {
      const newEntry: BottleLedger = {
        ...entry,
        id: 'bl-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
      };
      return { bottleLedger: [newEntry, ...state.bottleLedger] };
    }),

  batches: initialBatches,
  addBatch: (batch) =>
    set((state) => ({
      batches: [batch, ...state.batches],
    })),
}));
