export type UserRole = 'admin' | 'accountant' | 'inventory_manager' | 'driver' | 'cashier';
export type CustomerPriceTier = 'retail' | 'wholesale' | 'subscription' | 'distributor';
export type InventoryItemType = 'raw_material' | 'packaging' | 'finished_good' | 'asset';
export type OrderStatus = 'draft' | 'confirmed' | 'dispatched' | 'delivered' | 'failed' | 'rescheduled' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentMethod = 'cash' | 'khqr' | 'bank_transfer' | 'credit';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  code: string;
  name: string;
  description?: string;
  driver_id?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  business_name?: string;
  phone: string;
  address?: string;
  lat?: number;
  lng?: number;
  zone_id?: string;
  price_tier: CustomerPriceTier;
  credit_limit: number;
  current_balance: number;
  deposit_balance: number;
  empty_bottles_held: number;
  active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  name_kh?: string;
  type: InventoryItemType;
  unit: string;
  qty_on_hand: number;
  unit_cost: number;
  retail_price: number;
  wholesale_price: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BomRecipe {
  id: string;
  finished_good_id: string;
  component_item_id: string;
  quantity_required: number;
  notes?: string;
  created_at: string;
}

export interface ProductionBatch {
  id: string;
  batch_number: string;
  finished_good_id: string;
  target_qty: number;
  actual_qty: number;
  ph_level?: number;
  tds_level?: number;
  qc_passed: boolean;
  operator_id?: string;
  notes?: string;
  produced_at: string;
}

export interface Order {
  id: string;
  invoice_number: string;
  customer_id: string;
  driver_id?: string;
  zone_id?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  bottles_delivered: number;
  bottles_returned: number;
  deposit_charge: number;
  deposit_refund: number;
  proof_of_delivery_url?: string;
  signature_url?: string;
  delivery_date: string;
  delivered_at?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface BottleLedger {
  id: string;
  customer_id: string;
  order_id?: string;
  driver_id?: string;
  bottles_out: number;
  bottles_in: number;
  deposit_collected: number;
  deposit_refunded: number;
  breakage_qty: number;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  receipt_no: string;
  order_id?: string;
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_no?: string;
  received_by?: string;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_number: string;
  category: string;
  amount: number;
  description: string;
  receipt_url?: string;
  approved_by?: string;
  expense_date: string;
  created_at: string;
}

export interface TruckInventory {
  id: string;
  driver_id: string;
  date: string;
  truck_plate?: string;
  opening_full_bottles: number;
  opening_empty_bottles: number;
  loaded_full_bottles: number;
  delivered_full_bottles: number;
  collected_empty_bottles: number;
  returned_full_bottles: number;
  returned_empty_bottles: number;
  damaged_bottles: number;
  status: 'open' | 'reconciled';
  notes?: string;
  created_at: string;
}
