# Design: FEL Invoice Simulation + User Management

**Date:** 2026-06-08
**Status:** Approved

---

## Overview

Two features added to volttech-store:

1. **FEL invoice simulation** — a full checkout flow with simulated card payment that atomically creates the order, decrements stock, generates a DTE number + authorization UUID, and produces a downloadable PDF invoice.
2. **User management** — a new "Usuarios" tab in the admin panel with full CRUD over user profiles and roles.

---

## 1. Database Changes

### `orders` — 4 new columns

| Column | Type | Description |
|---|---|---|
| `nit` | `text` | Buyer's NIT entered at checkout |
| `fiscal_name` | `text` | Buyer's fiscal/legal name |
| `invoice_number` | `text` | Simulated DTE number, e.g. `DTE-000042` |
| `invoice_auth` | `uuid` | Simulated SAT authorization UUID (auto-generated) |

`invoice_number` is generated client-side as `DTE-` + padded timestamp. `invoice_auth` is a `gen_random_uuid()` assigned server-side inside the RPC.

### `profiles` — 1 new column

| Column | Type | Description |
|---|---|---|
| `email` | `text` | Populated by a trigger on `auth.users` INSERT |

A `AFTER INSERT ON auth.users` trigger copies `new.email` into `profiles`. This avoids needing the Supabase service-role key to list user emails in the admin panel.

### Supabase RPC: `checkout_order`

Single-transaction function that:

1. Loops over each cart item and verifies `products.stock >= requested quantity`. Raises an exception naming the out-of-stock product if not.
2. Inserts a row into `orders` with all fields including `nit`, `fiscal_name`, `invoice_number`, `invoice_auth` (= `gen_random_uuid()`), and `status = 'paid'`.
3. Inserts all `order_items`.
4. Decrements `products.stock` for each item (`stock = stock - quantity`).
5. Deletes all `cart_items` for the user.
6. Returns the new `order_id`.

If any step fails, Postgres rolls back the entire transaction.

---

## 2. Checkout & Payment Flow

### Cart page changes

- Remove the current inline "Finalizar pedido" button.
- Replace with a button that opens a `Dialog` (shadcn).

### Payment dialog (inside `Cart.tsx`)

Two sections:

**Billing data (FEL)**
- NIT (text, required, placeholder `12345678-9`)
- Nombre fiscal (text, required)

**Card data (simulation — accepts any value)**
- Card number (16-digit mask)
- Expiry MM/YY
- CVV (3 digits)

Submit button: **"Pagar Q{total}"**

On submit:
1. Client-side validation: all fields non-empty, card number = 16 digits, expiry matches `MM/YY`, CVV = 3 digits.
2. Calls `supabase.rpc('checkout_order', { ... })`.
3. On error: `toast.error` with the server message (e.g. "Sin stock: Cable HDMI 4K").
4. On success: `navigate('/thank-you/' + orderId, { state: { fromCheckout: true } })`.

The `address` field moves into the payment dialog (was already in Cart).

---

## 3. Thank You Page (`/thank-you/:orderId`)

New route. If `location.state.fromCheckout` is falsy, redirects to `/orders` (prevents direct URL access to a random order's thank-you).

**Content:**
- Heading: "¡Gracias por tu compra!"
- Order summary: items × quantities, shipping address, total
- FEL block: Número de autorización, Número DTE, fecha de emisión
- **"Descargar factura PDF"** button — triggers PDF generation and download inline
- **"Ver mis pedidos"** link → `/orders`

---

## 4. FEL PDF Invoice

**Library:** `@react-pdf/renderer`

**Filename:** `factura-{invoice_number}.pdf`

### Document structure

**Header**
- Vendor: VoltTech Store | NIT Emisor: 1234567-8 (hardcoded simulation)
- Dirección: Ciudad de Guatemala
- Serie: `VOLT-2026` | Número DTE: `{invoice_number}`
- Número de Autorización: `{invoice_auth}`
- Fecha y hora de emisión: ISO timestamp formatted as `DD/MM/YYYY HH:mm`

**Recipient block**
- NIT Receptor: `{nit}`
- Nombre: `{fiscal_name}`

**Line items table**

| Cant. | Descripción | Precio unitario | Total |
|---|---|---|---|

**Totals**
- Subtotal (before VAT): `total / 1.12`
- IVA 12%: `total - subtotal`
- **Total: Q{total}**

**Footer**
- *"Documento Tributario Electrónico — Simulación con fines educativos"*
- Régimen: General con IVA

### PDF availability

- Immediately after checkout on the thank-you page.
- From `/orders`: each order card shows a **"Descargar factura"** button if `invoice_auth != null`.

---

## 5. User Management (Admin Panel)

New **"Usuarios"** tab added to `AdminPage` tabs list.

### `UsersAdmin` component

**Data query:** `profiles` joined with `user_roles` (left join), ordered by `created_at` desc. Displays: email, full_name, role (default `user` if no row in `user_roles`), created_at.

### Table columns

| Email | Nombre | Rol | Registrado | Acciones |
|---|---|---|---|---|

### Operations

**Edit (dialog)**
- Change `full_name` in `profiles`
- Change role: select between `admin` / `user`. Uses an upsert (`ON CONFLICT (user_id) DO UPDATE`) on `user_roles`.

**Delete**
- Confirmation dialog before proceeding.
- Sets `profiles.is_active = false` (soft delete). The user can no longer log in because the admin panel filters them out and RLS policies will block access. No service-role Edge Function required.
- Does NOT delete the `auth.users` entry (out of scope).

### Constraints
- Admin cannot edit or delete their own account (checked by comparing row `id` with `user.id` from `useAuth()`).
- Role column shows a badge: `admin` = primary color, `user` = muted.

---

## 6. New Routes

| Route | Component | Guard |
|---|---|---|
| `/thank-you/:orderId` | `ThankYouPage` | Authenticated + `fromCheckout` state |

No new route for user management — it's a tab inside the existing `/admin` page.

---

## 7. New Dependencies

| Package | Purpose |
|---|---|
| `@react-pdf/renderer` | Client-side PDF generation |

---

## 8. Files to Create / Modify

| File | Action |
|---|---|
| `src/pages/ThankYouPage.tsx` | Create |
| `src/components/PaymentDialog.tsx` | Create |
| `src/components/FelInvoicePDF.tsx` | Create |
| `src/pages/Cart.tsx` | Modify — replace checkout button with PaymentDialog |
| `src/pages/Orders.tsx` | Modify — add "Descargar factura" button per order |
| `src/pages/Admin.tsx` | Modify — add "Usuarios" tab + UsersAdmin component |
| `src/App.tsx` | Modify — add `/thank-you/:orderId` route |
| `supabase/migrations/20260608_fel_users.sql` | Create — all DB changes + RPC + trigger |

---

## 9. Out of Scope

- Real FEL provider integration (INFILE, G4S, etc.)
- Real payment gateway (Stripe, Visanet, etc.)
- Email delivery of the invoice
- Invoice voiding / credit notes
