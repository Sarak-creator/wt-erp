-- ==============================================================================
-- PURE WATER FACTORY ERP, POS & LOGISTICS MANAGEMENT SYSTEM
-- សហគ្រាសផលិតទឹកបរិសុទ្ធ - ប្រព័ន្ធគ្រប់គ្រងសហគ្រាស ការលក់ និងដឹកជញ្ជូន
-- Complete PostgreSQL Schema, Indexes, Triggers, RLS, and Seed Data
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin', 
        'accountant', 
        'inventory_manager', 
        'driver', 
        'cashier'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE customer_price_tier AS ENUM (
        'retail', 
        'wholesale', 
        'subscription', 
        'distributor'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_item_type AS ENUM (
        'raw_material', 
        'packaging', 
        'finished_good', 
        'asset'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'draft', 
        'confirmed', 
        'dispatched', 
        'delivered', 
        'failed', 
        'rescheduled', 
        'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'unpaid', 
        'partial', 
        'paid'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'cash', 
        'khqr', 
        'bank_transfer', 
        'credit'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLES

-- Table 1: Profiles (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'cashier',
    avatar_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: Delivery Zones
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: Customers (with Bottle & Balance Tracking)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    business_name TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
    price_tier customer_price_tier NOT NULL DEFAULT 'retail',
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Amount customer owes
    deposit_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Total cash deposit held
    empty_bottles_held INT NOT NULL DEFAULT 0, -- 20L returnable bottles held
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: Inventory Items (Raw, Packaging, Finished Goods, Assets)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_kh TEXT,
    type inventory_item_type NOT NULL,
    unit TEXT NOT NULL, -- 'bottle', 'box', 'kg', 'roll', 'pack', 'liter'
    qty_on_hand NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    wholesale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: Bill of Materials (BOM Recipes)
CREATE TABLE IF NOT EXISTS public.bom_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finished_good_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    component_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity_required NUMERIC(12, 4) NOT NULL, -- component needed per 1 finished unit
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 6: Production Batches (Water Manufacturing & Quality Control)
CREATE TABLE IF NOT EXISTS public.production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number TEXT UNIQUE NOT NULL,
    finished_good_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    target_qty NUMERIC(12, 2) NOT NULL,
    actual_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ph_level NUMERIC(4, 2), -- e.g. 7.2 pH
    tds_level NUMERIC(6, 2), -- e.g. 15 ppm
    qc_passed BOOLEAN NOT NULL DEFAULT TRUE,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    produced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 7: Orders (Sales & Delivery Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'draft',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    payment_method payment_method NOT NULL DEFAULT 'cash',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    bottles_delivered INT NOT NULL DEFAULT 0,
    bottles_returned INT NOT NULL DEFAULT 0,
    deposit_charge NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deposit_refund NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    proof_of_delivery_url TEXT,
    signature_url TEXT,
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 8: Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 9: Bottle Ledger (20L Returnable Gallon Tracking)
CREATE TABLE IF NOT EXISTS public.bottle_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    bottles_out INT NOT NULL DEFAULT 0, -- Delivered to customer
    bottles_in INT NOT NULL DEFAULT 0, -- Empty gallons returned by customer
    deposit_collected NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Deposit charged ($3.00/gallon)
    deposit_refunded NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Deposit returned to customer
    breakage_qty INT NOT NULL DEFAULT 0, -- Damaged bottles
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 10: Payments (Cash, Bakong KHQR, Bank Transfer, A/R Settlement)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    reference_no TEXT, -- Transaction ID / Bakong Hash
    received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 11: Expenses (Factory, Fuel, Utilities, Maintenance)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- 'utilities', 'fuel', 'salaries', 'repairs', 'raw_materials'
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    receipt_url TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 12: Truck & Van Bottle Inventories (Driver Trip Accountability)
CREATE TABLE IF NOT EXISTS public.truck_inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    truck_plate TEXT,
    opening_full_bottles INT NOT NULL DEFAULT 0,
    opening_empty_bottles INT NOT NULL DEFAULT 0,
    loaded_full_bottles INT NOT NULL DEFAULT 0,
    delivered_full_bottles INT NOT NULL DEFAULT 0,
    collected_empty_bottles INT NOT NULL DEFAULT 0,
    returned_full_bottles INT NOT NULL DEFAULT 0,
    returned_empty_bottles INT NOT NULL DEFAULT 0,
    damaged_bottles INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'reconciled'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_zone ON public.customers(zone_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_bottle_ledger_customer ON public.bottle_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_bottle_ledger_driver ON public.bottle_ledger(driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);

-- 5. AUTOMATED TRIGGERS & PROCEDURES

-- Trigger 5.1: Automatically Sync Profile on Supabase Auth Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'System User'),
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'cashier')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger 5.2: Sync Customer Bottle & Deposit Balance upon Bottle Ledger Entry
CREATE OR REPLACE FUNCTION public.sync_customer_bottle_ledger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.customers
    SET 
        empty_bottles_held = GREATEST(0, empty_bottles_held + (NEW.bottles_out - NEW.bottles_in - NEW.breakage_qty)),
        deposit_balance = GREATEST(0.00, deposit_balance + (NEW.deposit_collected - NEW.deposit_refunded)),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_customer_bottle_ledger ON public.bottle_ledger;
CREATE TRIGGER trg_sync_customer_bottle_ledger
    AFTER INSERT ON public.bottle_ledger
    FOR EACH ROW EXECUTE FUNCTION public.sync_customer_bottle_ledger();

-- Trigger 5.3: Sync Customer Current Balance & Order Paid Amount on Payment
CREATE OR REPLACE FUNCTION public.sync_payment_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct customer receivable balance
    UPDATE public.customers
    SET 
        current_balance = GREATEST(0.00, current_balance - NEW.amount),
        updated_at = NOW()
    WHERE id = NEW.customer_id;

    -- Update linked order if provided
    IF NEW.order_id IS NOT NULL THEN
        UPDATE public.orders
        SET 
            paid_amount = paid_amount + NEW.amount,
            payment_status = CASE 
                WHEN (paid_amount + NEW.amount) >= total_amount THEN 'paid'::payment_status
                WHEN (paid_amount + NEW.amount) > 0 THEN 'partial'::payment_status
                ELSE 'unpaid'::payment_status
            END,
            updated_at = NOW()
        WHERE id = NEW.order_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_payment_balances ON public.payments;
CREATE TRIGGER trg_sync_payment_balances
    AFTER INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.sync_payment_balances();

-- Trigger 5.4: Deduct Raw Materials based on BOM when a Production Batch is added
CREATE OR REPLACE FUNCTION public.consume_bom_on_production()
RETURNS TRIGGER AS $$
DECLARE
    recipe_record RECORD;
BEGIN
    -- Decrement each component in inventory
    FOR recipe_record IN 
        SELECT component_item_id, quantity_required 
        FROM public.bom_recipes 
        WHERE finished_good_id = NEW.finished_good_id
    LOOP
        UPDATE public.inventory_items
        SET qty_on_hand = qty_on_hand - (recipe_record.quantity_required * NEW.actual_qty),
            updated_at = NOW()
        WHERE id = recipe_record.component_item_id;
    END LOOP;

    -- Increment finished good inventory
    UPDATE public.inventory_items
    SET qty_on_hand = qty_on_hand + NEW.actual_qty,
        updated_at = NOW()
    WHERE id = NEW.finished_good_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_consume_bom_on_production ON public.production_batches;
CREATE TRIGGER trg_consume_bom_on_production
    AFTER INSERT ON public.production_batches
    FOR EACH ROW EXECUTE FUNCTION public.consume_bom_on_production();

-- 6. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bottle_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_inventories ENABLE ROW LEVEL SECURITY;

-- Helper to retrieve current user role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- General Authenticated Access Policies (Configurable per role)
CREATE POLICY "Allow authenticated read on profiles" 
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow user to update own profile" 
    ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Allow all authenticated read on zones" 
    ON public.delivery_zones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow staff write on zones" 
    ON public.delivery_zones FOR ALL TO authenticated 
    USING (public.get_auth_role() IN ('admin', 'inventory_manager'));

CREATE POLICY "Allow authenticated read on customers" 
    ON public.customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow staff write on customers" 
    ON public.customers FOR ALL TO authenticated 
    USING (public.get_auth_role() IN ('admin', 'accountant', 'cashier', 'driver'));

CREATE POLICY "Allow authenticated read on inventory" 
    ON public.inventory_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow manager write on inventory" 
    ON public.inventory_items FOR ALL TO authenticated 
    USING (public.get_auth_role() IN ('admin', 'inventory_manager'));

CREATE POLICY "Allow authenticated read on bom_recipes" 
    ON public.bom_recipes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow manager write on bom_recipes" 
    ON public.bom_recipes FOR ALL TO authenticated 
    USING (public.get_auth_role() IN ('admin', 'inventory_manager'));

CREATE POLICY "Allow authenticated read on production_batches" 
    ON public.production_batches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow production write" 
    ON public.production_batches FOR ALL TO authenticated 
    USING (public.get_auth_role() IN ('admin', 'inventory_manager'));

CREATE POLICY "Allow authenticated read on orders" 
    ON public.orders FOR SELECT TO authenticated 
    USING (
        public.get_auth_role() IN ('admin', 'accountant', 'cashier', 'inventory_manager') 
        OR driver_id = auth.uid()
    );

CREATE POLICY "Allow staff write on orders" 
    ON public.orders FOR ALL TO authenticated 
    USING (
        public.get_auth_role() IN ('admin', 'cashier', 'accountant') 
        OR (public.get_auth_role() = 'driver' AND driver_id = auth.uid())
    );

CREATE POLICY "Allow authenticated read on order_items" 
    ON public.order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow staff write on order_items" 
    ON public.order_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on bottle_ledger" 
    ON public.bottle_ledger FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow staff write on bottle_ledger" 
    ON public.bottle_ledger FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on payments" 
    ON public.payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow cashier/admin write on payments" 
    ON public.payments FOR ALL TO authenticated 
    USING (public.get_auth_role() IN ('admin', 'accountant', 'cashier'));

CREATE POLICY "Allow read on expenses" 
    ON public.expenses FOR SELECT TO authenticated 
    USING (public.get_auth_role() IN ('admin', 'accountant'));

CREATE POLICY "Allow accountant/admin write on expenses" 
    ON public.expenses FOR ALL TO authenticated 
    USING (public.get_auth_role() IN ('admin', 'accountant'));

CREATE POLICY "Allow authenticated read on truck_inventories" 
    ON public.truck_inventories FOR SELECT TO authenticated 
    USING (
        public.get_auth_role() IN ('admin', 'inventory_manager', 'accountant') 
        OR driver_id = auth.uid()
    );

CREATE POLICY "Allow staff write on truck_inventories" 
    ON public.truck_inventories FOR ALL TO authenticated USING (true);

-- 7. INITIAL SEED DATA (For Immediate Demonstration)

-- 7.1 Delivery Zones in Phnom Penh
INSERT INTO public.delivery_zones (id, code, name, description)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'ZONE-CKM', 'ខណ្ឌចំការមន (Chamkarmon)', 'BKK1, BKK2, Tonle Bassac'),
    ('11111111-1111-1111-1111-111111111102', 'ZONE-TK', 'ខណ្ឌទួលគោក (Tuol Kouk)', 'Boeung Kak, Teuk Laak'),
    ('11111111-1111-1111-1111-111111111103', 'ZONE-CBA', 'ខណ្ឌច្បារអំពៅ (Chbar Ampov)', 'Chbar Ampov 1, Nirouth'),
    ('11111111-1111-1111-1111-111111111104', 'ZONE-SS', 'ខណ្ឌសែនសុខ (Sen Sok)', 'Phnom Penh Thmey, Teuk Thla')
ON CONFLICT (code) DO NOTHING;

-- 7.2 Inventory Items (Finished Goods & BOM Components)
INSERT INTO public.inventory_items (id, sku, name, name_kh, type, unit, qty_on_hand, unit_cost, retail_price, wholesale_price, reorder_level)
VALUES
    -- Finished Goods
    ('22222222-2222-2222-2222-222222222201', 'FG-GAL-20L', '20L Pure Water Gallon', 'ទឹកបរិសុទ្ធ ២០ លីត្រ', 'finished_good', 'gallon', 850, 0.45, 1.25, 0.90, 100),
    ('22222222-2222-2222-2222-222222222202', 'FG-BOT-500ML', '500ml Bottled Water (Pack 24)', 'ទឹកដប ៥០០មល (កេស ២៤)', 'finished_good', 'box', 320, 1.80, 3.50, 2.75, 50),
    ('22222222-2222-2222-2222-222222222203', 'FG-BOT-350ML', '350ml Bottled Water (Pack 24)', 'ទឹកដប ៣៥០មល (កេស ២៤)', 'finished_good', 'box', 210, 1.50, 3.00, 2.40, 40),
    -- Packaging & Raw Materials
    ('33333333-3333-3333-3333-333333333301', 'PKG-CAP-20L', '20L Bottle Cap (Blue)', 'គម្របធុង ២០លីត្រ', 'packaging', 'piece', 12000, 0.04, 0.00, 0.00, 2000),
    ('33333333-3333-3333-3333-333333333302', 'PKG-SEAL-20L', '20L Heat Shrink Seal Neck Film', 'ស្កុតកម្ដៅបិទគម្រប', 'packaging', 'piece', 15000, 0.015, 0.00, 0.00, 3000),
    ('33333333-3333-3333-3333-333333333303', 'AST-EMPTY-20L', 'Empty Polycarbonate 20L Gallon', 'សំបកធុងទទេ ២០លីត្រ', 'asset', 'gallon', 1400, 3.50, 3.00, 3.00, 300),
    ('33333333-3333-3333-3333-333333333304', 'RAW-WATER-M3', 'Raw Well/Source Water (Cubic Meter)', 'ទឹកប្រភពដើម (ម៉ែត្រគូប)', 'raw_material', 'm3', 500, 0.20, 0.00, 0.00, 50),
    ('33333333-3333-3333-3333-333333333305', 'RAW-MINERAL-KG', 'Remineralization Mineral Salt', 'សារធាតុរ៉ែបន្ថែម', 'raw_material', 'kg', 250, 4.00, 0.00, 0.00, 25)
ON CONFLICT (sku) DO NOTHING;

-- 7.3 Bill of Materials (BOM Recipe for 1x 20L Gallon)
INSERT INTO public.bom_recipes (finished_good_id, component_item_id, quantity_required, notes)
VALUES
    ('22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333301', 1.0, '1 Cap per Gallon'),
    ('22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333302', 1.0, '1 Neck Shrink Film Seal'),
    ('22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333304', 0.022, '22 Liters treated raw water incl. reverse osmosis flush')
ON CONFLICT DO NOTHING;

-- 7.4 Sample Customers with Credit Limits & Deposits
INSERT INTO public.customers (id, name, business_name, phone, address, zone_id, price_tier, credit_limit, current_balance, deposit_balance, empty_bottles_held)
VALUES
    ('44444444-4444-4444-4444-444444444401', 'លោក សុខ ចិន្តា', 'ហាងកាហ្វេ អាម៉ាហ្សូន បឹងកេងកង', '012 889 977', 'Street 302, BKK1, Phnom Penh', '11111111-1111-1111-1111-111111111101', 'wholesale', 200.00, 35.00, 60.00, 20),
    ('44444444-4444-4444-4444-444444444402', 'អ្នកស្រី គង់ ម៉ាលី', 'សាលារៀន អន្តរជាតិ វឌ្ឍនៈ', '015 677 822', 'Street 598, Tuol Kouk, Phnom Penh', '11111111-1111-1111-1111-111111111102', 'subscription', 500.00, 120.00, 150.00, 50),
    ('44444444-4444-4444-4444-444444444403', 'លោក ចាន់ រតនា', 'ការដ្ឋានសំណង់ ជីប ម៉ុង', '098 443 211', 'National Road 1, Chbar Ampov', '11111111-1111-1111-1111-111111111103', 'wholesale', 300.00, 280.00, 90.00, 30),
    ('44444444-4444-4444-4444-444444444404', 'អ្នកស្រី ហេង ធីតា', 'ផ្ទះលេខ ៤៥A ផ្ទាល់ខ្លួន', '089 112 344', 'Street 271, Sen Sok, Phnom Penh', '11111111-1111-1111-1111-111111111104', 'retail', 50.00, 0.00, 15.00, 5)
ON CONFLICT DO NOTHING;
