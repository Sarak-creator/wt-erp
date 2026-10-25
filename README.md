# Pure Water Factory ERP, POS & Logistics Management System
### សហគ្រាសផលិតទឹកបរិសុទ្ធ - ប្រព័ន្ធគ្រប់គ្រងសហគ្រាស ការលក់ និងដឹកជញ្ជូន

An enterprise-grade, mobile-responsive Web Application & Progressive Web App (PWA) tailored specifically for pure drinking water manufacturing, 20L returnable bottle deposit tracking, point of sale (POS) with Bakong KHQR, driver dispatch logistics, Bill of Materials (BOM) manufacturing, and financial cost accounting.

---

## 🏗️ System Architecture & Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4, Lucide React icons
- **State Management:** Zustand (for POS Cart, Ledger, Locale, RBAC Simulation)
- **Database & Auth:** Supabase (PostgreSQL 15+, Row-Level Security, Realtime, Triggers)
- **SSR Client:** `@supabase/ssr` with cookie-based session management
- **Localization:** Bilingual support (Khmer `km` default, English `en`) with Google Font `Kantumruy Pro`
- **PWA:** Web App Manifest for mobile installation on driver phones and cashier tablets

---

## 🗄️ Database Schema Summary (`supabase/migrations/`)
The PostgreSQL schema includes full enums, relational tables, constraints, indexes, triggers, and Row-Level Security (RLS) policies:

1. **`profiles`**: User profiles linked to `auth.users` with roles (`admin`, `accountant`, `inventory_manager`, `driver`, `cashier`).
2. **`delivery_zones`**: Delivery sectors (e.g., Chamkarmon, Tuol Kouk, Sen Sok, Chbar Ampov).
3. **`customers`**: Customer profiles with dynamic price tiers (`retail`, `wholesale`, `subscription`, `distributor`), credit limit, current debt, deposit balance, and 20L returnable empty bottles held.
4. **`inventory_items`**: Finished goods (20L Gallons, 500ml packs, 350ml packs) and raw materials (Caps, Neck shrink seals, Polycarbonate empty bottles, Raw water).
5. **`bom_recipes`**: Bill of Materials (BOM) linking finished products to components.
6. **`production_batches`**: Batch/lot tracking with water testing compliance (pH level, TDS ppm, Ozone sterilization).
7. **`orders` & `order_items`**: Sales invoices with delivery date, driver assignments, discount, and status.
8. **`bottle_ledger`**: Returnable 20L bottle ledger tracking bottles out (+), empties returned (-), deposits collected/refunded ($3.00/bottle), and breakages.
9. **`payments`**: Payment records (Cash, Bakong KHQR, Bank Transfer, On-Account Credit).
10. **`expenses`**: Factory overhead expenses (Electricity, fuel, salaries, maintenance).
11. **`truck_inventories`**: Driver van trip loading sheets and bottle reconciliation.

---

## 🚀 Core Features & Business Logic

### 1. Bottle Deposit & Asset Tracking (20L Returnable Gallon Vault)
- Tracks physical bottles in circulation across warehouse stock and client premises.
- Automatically updates customer held bottle count and cash deposit balance ($3.00/bottle).
- Handles bottle damage/breakage write-offs.

### 2. Point of Sale (POS) & Wholesale Terminal
- Fast touch-screen catalog with real-time customer search.
- Instant customer credit badge showing remaining credit limit.
- Automatic credit limit block if overdue debt exceeds allowed limit.
- Bakong KHQR modal with scan simulation.
- ESC/POS 80mm/58mm thermal receipt printable format.

### 3. Driver Dispatch & Van Manifest (Mobile PWA)
- Optimized mobile interface for drivers on delivery routes.
- Sequence trip sheet with one-click phone dialer (`tel:`) and Google Maps navigation.
- Handover counter (+/- full bottles delivered, +/- empties collected).
- Proof of Delivery (POD) with digital signature and photo upload simulation.
- Van bottle reconciliation formula: `[Opening Full] - [Delivered] = [Remaining Full]` and `[Empties Loaded] = [Return to Factory]`.

### 4. Manufacturing & Bill of Materials (BOM)
- Automated recipe execution: producing 1x 20L gallon decrements 1 cap and 1 neck seal wrap.
- Reverse Osmosis (RO) water compliance monitoring (pH 6.8–7.5, TDS < 30 ppm).

### 5. Financial & Cost Accounting
- Accounts Receivable (A/R) Aging Schedule: Current (<30 days), 31–60 days, Overdue (>60 days).
- Delivery lock alert for overdue accounts.
- Direct unit production cost breakdown (COGS per gallon: electricity, RO filtration, cap, seal, labor, bottle wear & tear).

---

## 🛠️ Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/water-erp.git
cd water-erp
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Apply Supabase Database Migrations
Run the SQL script located in `supabase/migrations/20261025000000_pure_water_erp_schema.sql` via the Supabase Dashboard SQL Editor or Supabase CLI:
```bash
supabase db push
# or copy and execute in Supabase SQL editor
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Vercel Deployment Instructions
1. Push your repository to GitHub.
2. In the Vercel dashboard, click **Add New Project** and select your `water-erp` repository.
3. In **Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Vercel will automatically build the Next.js App Router application.
