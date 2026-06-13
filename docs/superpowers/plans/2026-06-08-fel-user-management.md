# FEL Invoice Simulation + User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add simulated card payment checkout with atomic stock decrement, FEL PDF invoice generation, a thank-you page, and a full user management tab in the admin panel.

**Architecture:** A Supabase RPC function handles the atomic checkout transaction (stock check → order insert → stock decrement → cart clear). The client generates the PDF on-demand using `@react-pdf/renderer`. User management is a new tab inside the existing `/admin` page querying `profiles` joined with `user_roles`.

**Tech Stack:** React + TypeScript, Supabase (PostgreSQL RPC), @react-pdf/renderer, TanStack Query, shadcn/ui, React Router v6.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260608_fel_users.sql` | Create | DB schema changes + RPC + trigger |
| `src/integrations/supabase/types.ts` | Modify | Add new columns + RPC to TS types |
| `src/components/FelInvoicePDF.tsx` | Create | @react-pdf/renderer PDF document |
| `src/components/PaymentDialog.tsx` | Create | Payment modal (FEL fields + card fields) |
| `src/pages/ThankYouPage.tsx` | Create | Post-checkout confirmation + PDF download |
| `src/pages/Cart.tsx` | Modify | Replace inline checkout with PaymentDialog |
| `src/pages/Orders.tsx` | Modify | Add "Descargar factura" per order |
| `src/pages/Admin.tsx` | Modify | Add "Usuarios" tab + UsersAdmin component |
| `src/App.tsx` | Modify | Register `/thank-you/:orderId` route |

---

## Task 1: Install dependency + DB migration

**Files:**
- Create: `supabase/migrations/20260608_fel_users.sql`

- [ ] **Step 1: Install @react-pdf/renderer**

```bash
npm install @react-pdf/renderer
```

- [ ] **Step 2: Create the migration file**

Create `supabase/migrations/20260608_fel_users.sql` with this content:

```sql
-- orders: FEL columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS nit text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fiscal_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_auth uuid;

-- profiles: email + soft-delete flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Trigger: copy email from auth.users into profiles on new signup
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET email = new.email WHERE id = new.id;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email ON auth.users;
CREATE TRIGGER on_auth_user_email
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();

-- Backfill emails for existing users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- RPC: atomic checkout
CREATE OR REPLACE FUNCTION public.checkout_order(
  p_user_id      uuid,
  p_items        jsonb,
  p_total        numeric,
  p_shipping_address text,
  p_nit          text,
  p_fiscal_name  text,
  p_invoice_number text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item         jsonb;
  v_stock        int;
  v_product_name text;
  v_order_id     uuid;
  v_auth         uuid := gen_random_uuid();
BEGIN
  -- 1. Stock check
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT stock, name
      INTO v_stock, v_product_name
      FROM public.products
     WHERE id = (v_item->>'product_id')::uuid;

    IF v_stock < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Sin stock: %', v_product_name;
    END IF;
  END LOOP;

  -- 2. Create order
  INSERT INTO public.orders
    (user_id, total, shipping_address, status,
     nit, fiscal_name, invoice_number, invoice_auth)
  VALUES
    (p_user_id, p_total, p_shipping_address, 'paid',
     p_nit, p_fiscal_name, p_invoice_number, v_auth)
  RETURNING id INTO v_order_id;

  -- 3. Insert line items
  INSERT INTO public.order_items
    (order_id, product_id, product_name, unit_price, quantity)
  SELECT
    v_order_id,
    (item->>'product_id')::uuid,
    item->>'product_name',
    (item->>'unit_price')::numeric,
    (item->>'quantity')::int
  FROM jsonb_array_elements(p_items) AS item;

  -- 4. Decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    UPDATE public.products
       SET stock = stock - (v_item->>'quantity')::int
     WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

  -- 5. Clear cart
  DELETE FROM public.cart_items WHERE user_id = p_user_id;

  RETURN v_order_id;
END;
$$;
```

- [ ] **Step 3: Apply the migration via Supabase MCP**

Use `mcp__supabase__apply_migration` with name `fel_users` and the SQL above.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260608_fel_users.sql package.json package-lock.json
git commit -m "feat: add FEL + user management DB migration and install @react-pdf/renderer"
```

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Add new `orders` columns to the Row, Insert, and Update types**

In the `orders` section, add to `Row`:
```typescript
fiscal_name: string | null
invoice_auth: string | null
invoice_number: string | null
nit: string | null
```
Add to `Insert`:
```typescript
fiscal_name?: string | null
invoice_auth?: string | null
invoice_number?: string | null
nit?: string | null
```
Add to `Update`:
```typescript
fiscal_name?: string | null
invoice_auth?: string | null
invoice_number?: string | null
nit?: string | null
```

- [ ] **Step 2: Add new `profiles` columns to the Row, Insert, and Update types**

In the `profiles` section, add to `Row`:
```typescript
email: string | null
is_active: boolean
```
Add to `Insert`:
```typescript
email?: string | null
is_active?: boolean
```
Add to `Update`:
```typescript
email?: string | null
is_active?: boolean
```

- [ ] **Step 3: Add `checkout_order` to the Functions type**

In `Functions`, after the `has_role` entry add:
```typescript
checkout_order: {
  Args: {
    p_user_id: string
    p_items: Json
    p_total: number
    p_shipping_address: string
    p_nit: string
    p_fiscal_name: string
    p_invoice_number: string
  }
  Returns: string
}
```

- [ ] **Step 4: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "feat: update Supabase types for FEL columns and checkout_order RPC"
```

---

## Task 3: FelInvoicePDF component

**Files:**
- Create: `src/components/FelInvoicePDF.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 16, borderBottom: "1pt solid #000", paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  authBox: { backgroundColor: "#f4f4f4", padding: 6, marginTop: 6 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 4, borderBottom: "0.5pt solid #ccc", paddingBottom: 2 },
  bold: { fontWeight: "bold" },
  tableHeader: { flexDirection: "row", backgroundColor: "#e8e8e8", padding: "4pt 2pt", fontWeight: "bold" },
  tableRow: { flexDirection: "row", padding: "3pt 2pt", borderBottom: "0.5pt solid #eee" },
  c1: { width: "10%" },
  c2: { width: "50%" },
  c3: { width: "20%", textAlign: "right" },
  c4: { width: "20%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 3 },
  totalLabel: { width: "40%", textAlign: "right", paddingRight: 8 },
  totalValue: { width: "22%", textAlign: "right" },
  footer: { marginTop: 24, borderTop: "0.5pt solid #ccc", paddingTop: 6, fontSize: 8, color: "#888", textAlign: "center" },
});

export type FelInvoiceData = {
  invoiceNumber: string;
  invoiceAuth: string;
  issuedAt: string;
  nit: string;
  fiscalName: string;
  shippingAddress: string;
  items: Array<{ product_name: string; quantity: number; unit_price: number }>;
  total: number;
};

export function FelInvoicePDF({ data }: { data: FelInvoiceData }) {
  const subtotal = data.total / 1.12;
  const iva = data.total - subtotal;
  const date = new Date(data.issuedAt);
  const dateStr = `${date.toLocaleDateString("es-GT")} ${date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>VoltTech Store</Text>
          <View style={s.row}>
            <Text>NIT Emisor: 1234567-8</Text>
            <Text>Ciudad de Guatemala</Text>
          </View>
          <View style={s.authBox}>
            <View style={s.row}>
              <Text><Text style={s.bold}>Serie:</Text> VOLT-2026  <Text style={s.bold}>No. DTE:</Text> {data.invoiceNumber}</Text>
            </View>
            <Text style={{ marginTop: 3 }}><Text style={s.bold}>No. Autorización:</Text> {data.invoiceAuth}</Text>
            <Text style={{ marginTop: 3 }}><Text style={s.bold}>Fecha:</Text> {dateStr}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Datos del Receptor</Text>
          <View style={s.row}><Text style={s.bold}>NIT:</Text><Text>{data.nit}</Text></View>
          <View style={s.row}><Text style={s.bold}>Nombre:</Text><Text>{data.fiscalName}</Text></View>
          <View style={s.row}><Text style={s.bold}>Dirección:</Text><Text>{data.shippingAddress}</Text></View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalle</Text>
          <View style={s.tableHeader}>
            <Text style={s.c1}>Cant.</Text>
            <Text style={s.c2}>Descripción</Text>
            <Text style={s.c3}>Precio Unit.</Text>
            <Text style={s.c4}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={s.c1}>{item.quantity}</Text>
              <Text style={s.c2}>{item.product_name}</Text>
              <Text style={s.c3}>Q{Number(item.unit_price).toFixed(2)}</Text>
              <Text style={s.c4}>Q{(item.quantity * Number(item.unit_price)).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal:</Text>
            <Text style={s.totalValue}>Q{subtotal.toFixed(2)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>IVA (12%):</Text>
            <Text style={s.totalValue}>Q{iva.toFixed(2)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, s.bold]}>Total:</Text>
            <Text style={[s.totalValue, s.bold]}>Q{Number(data.total).toFixed(2)}</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text>Documento Tributario Electrónico — Simulación con fines educativos</Text>
          <Text>Régimen: General con IVA</Text>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FelInvoicePDF.tsx
git commit -m "feat: add FelInvoicePDF component using @react-pdf/renderer"
```

---

## Task 4: PaymentDialog component

**Files:**
- Create: `src/components/PaymentDialog.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type CartItem = {
  id: string;
  quantity: number;
  product_id: string;
  products: { name: string; price: number; image_url: string | null; slug: string } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  total: number;
};

function genInvoiceNumber() {
  return `DTE-${String(Date.now()).slice(-6).padStart(6, "0")}`;
}

export function PaymentDialog({ open, onOpenChange, items, total }: Props) {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);

  const [nit, setNit] = useState("");
  const [fiscalName, setFiscalName] = useState("");
  const [address, setAddress] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  function fmtCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function fmtExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  async function handlePay() {
    if (!nit.trim()) return toast.error("Ingresa tu NIT");
    if (!fiscalName.trim()) return toast.error("Ingresa tu nombre fiscal");
    if (!address.trim()) return toast.error("Ingresa una dirección de envío");
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ""))) return toast.error("Número de tarjeta inválido (16 dígitos)");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return toast.error("Expiración inválida (MM/AA)");
    if (!/^\d{3}$/.test(cvv)) return toast.error("CVV inválido (3 dígitos)");

    setPending(true);
    try {
      const rpcItems = items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        product_name: i.products!.name,
        unit_price: i.products!.price,
      }));

      const { data: orderId, error } = await supabase.rpc("checkout_order", {
        p_user_id: user!.id,
        p_items: rpcItems,
        p_total: total,
        p_shipping_address: address,
        p_nit: nit,
        p_fiscal_name: fiscalName,
        p_invoice_number: genInvoiceNumber(),
      });

      if (error) throw new Error(error.message);
      qc.invalidateQueries();
      nav(`/thank-you/${orderId}`, { state: { fromCheckout: true } });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al procesar el pago");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Finalizar compra
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Datos de facturación (FEL)
            </p>
            <div className="space-y-3">
              <div><Label>NIT</Label><Input value={nit} onChange={(e) => setNit(e.target.value)} placeholder="12345678-9" /></div>
              <div><Label>Nombre fiscal</Label><Input value={fiscalName} onChange={(e) => setFiscalName(e.target.value)} placeholder="Juan López" /></div>
              <div><Label>Dirección de envío</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, ciudad, código postal" /></div>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Datos de tarjeta
            </p>
            <div className="space-y-3">
              <div>
                <Label>Número de tarjeta</Label>
                <Input value={cardNumber} onChange={(e) => setCardNumber(fmtCard(e.target.value))} placeholder="0000 0000 0000 0000" maxLength={19} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Expiración</Label><Input value={expiry} onChange={(e) => setExpiry(fmtExpiry(e.target.value))} placeholder="MM/AA" maxLength={5} /></div>
                <div><Label>CVV</Label><Input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="123" maxLength={3} /></div>
              </div>
            </div>
          </div>
          <Button className="w-full glow" size="lg" disabled={pending} onClick={handlePay}>
            {pending ? "Procesando…" : `Pagar Q${total.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PaymentDialog.tsx
git commit -m "feat: add PaymentDialog with FEL billing fields and simulated card input"
```

---

## Task 5: ThankYouPage

**Files:**
- Create: `src/pages/ThankYouPage.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { CheckCircle, Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { FelInvoicePDF, type FelInvoiceData } from "@/components/FelInvoicePDF";

export default function ThankYouPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const nav = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [user, loading, nav]);

  useEffect(() => {
    if (!location.state?.fromCheckout) nav("/orders");
  }, [location.state, nav]);

  const { data: order } = useQuery({
    queryKey: ["order-thankyou", orderId],
    enabled: !!orderId && !!user,
    queryFn: async () =>
      (await supabase.from("orders").select("*, order_items(*)").eq("id", orderId!).single()).data,
  });

  async function downloadInvoice() {
    if (!order) return;
    const data: FelInvoiceData = {
      invoiceNumber: order.invoice_number!,
      invoiceAuth: order.invoice_auth!,
      issuedAt: order.created_at,
      nit: order.nit!,
      fiscalName: order.fiscal_name!,
      shippingAddress: order.shipping_address ?? "",
      items: order.order_items as Array<{ product_name: string; quantity: number; unit_price: number }>,
      total: Number(order.total),
    };
    const blob = await pdf(<FelInvoicePDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura-${order.invoice_number}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!order) return <div className="container mx-auto px-4 py-12 text-center">Cargando…</div>;

  const items = order.order_items as Array<{
    id: string; product_name: string; quantity: number; unit_price: number;
  }>;

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
      <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
      <h1 className="text-4xl font-display font-bold mb-2">¡Gracias por tu compra!</h1>
      <p className="text-muted-foreground mb-8">Tu pedido ha sido registrado exitosamente.</p>

      <div className="rounded-xl border border-border/60 bg-card p-6 text-left space-y-4 mb-6">
        <h2 className="font-display font-bold text-lg">Resumen del pedido</h2>
        <div className="space-y-2 text-sm">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between">
              <span>{it.product_name} × {it.quantity}</span>
              <span className="text-muted-foreground">Q{(Number(it.unit_price) * it.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-gradient">Q{Number(order.total).toFixed(2)}</span>
        </div>
        <p className="text-sm text-muted-foreground">Envío a: {order.shipping_address}</p>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-left text-sm mb-8 space-y-1">
        <p className="font-semibold text-primary mb-2">Factura Electrónica (FEL)</p>
        <p><span className="text-muted-foreground">No. DTE:</span> {order.invoice_number}</p>
        <p className="break-all"><span className="text-muted-foreground">Autorización:</span> {order.invoice_auth}</p>
        <p><span className="text-muted-foreground">Fecha:</span> {new Date(order.created_at).toLocaleString("es-GT")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" className="glow" onClick={downloadInvoice}>
          <Download className="h-4 w-4 mr-2" />
          Descargar factura PDF
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/orders">Ver mis pedidos</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ThankYouPage.tsx
git commit -m "feat: add ThankYouPage with order summary and FEL PDF download"
```

---

## Task 6: Update Cart.tsx

**Files:**
- Modify: `src/pages/Cart.tsx`

- [ ] **Step 1: Replace checkout logic with PaymentDialog**

Replace the entire file content with:

```tsx
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/PaymentDialog";

export default function CartPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => { if (!loading && !user) nav("/auth"); }, [user, loading, nav]);

  const { data: items } = useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("cart_items").select("*, products(*)").eq("user_id", user!.id)).data ?? [],
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      if (qty <= 0) await supabase.from("cart_items").delete().eq("id", id);
      else await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["cart-count"] });
    },
  });

  const total = items?.reduce(
    (s, i) => s + i.quantity * Number((i.products as { price: number } | null)?.price ?? 0),
    0
  ) ?? 0;

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-display font-bold mb-8">Tu carrito</h1>
      {!items?.length ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Tu carrito está vacío.</p>
          <Button asChild><Link to="/">Explorar productos</Link></Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map((i) => {
              const p = i.products as { name: string; price: number; image_url: string | null; slug: string } | null;
              if (!p) return null;
              return (
                <div key={i.id} className="flex gap-4 p-4 rounded-xl bg-card border border-border/60">
                  <img src={p.image_url ?? ""} alt={p.name} className="h-20 w-20 rounded-lg object-cover bg-muted" />
                  <div className="flex-1">
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="text-gradient font-bold">Q{Number(p.price).toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty.mutate({ id: i.id, qty: i.quantity - 1 })}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center">{i.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty.mutate({ id: i.id, qty: i.quantity + 1 })}><Plus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 ml-2 text-destructive" onClick={() => updateQty.mutate({ id: i.id, qty: 0 })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl bg-card border border-border/60 p-6 h-fit space-y-4">
            <h2 className="font-display text-xl font-bold">Resumen</h2>
            <div className="flex justify-between"><span>Subtotal</span><span>Q{total.toFixed(2)}</span></div>
            <div className="flex justify-between text-success"><span>Envío</span><span>Gratis</span></div>
            <div className="flex justify-between text-xl font-bold border-t border-border pt-3">
              <span>Total</span>
              <span className="text-gradient">Q{total.toFixed(2)}</span>
            </div>
            <Button className="w-full glow" size="lg" onClick={() => setPayOpen(true)}>
              Finalizar pedido
            </Button>
          </div>
        </div>
      )}
      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        items={items ?? []}
        total={total}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Cart.tsx
git commit -m "feat: replace Cart checkout with PaymentDialog"
```

---

## Task 7: Update Orders.tsx — add "Descargar factura" button

**Files:**
- Modify: `src/pages/Orders.tsx`

- [ ] **Step 1: Add PDF download to each order card**

Replace the entire file with:

```tsx
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Package, Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { FelInvoicePDF, type FelInvoiceData } from "@/components/FelInvoicePDF";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", paid: "Pagado", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado",
};

async function downloadFel(order: {
  invoice_number: string | null; invoice_auth: string | null; created_at: string;
  nit: string | null; fiscal_name: string | null; shipping_address: string | null; total: number;
  order_items: Array<{ product_name: string; quantity: number; unit_price: number }>;
}) {
  const data: FelInvoiceData = {
    invoiceNumber: order.invoice_number!,
    invoiceAuth: order.invoice_auth!,
    issuedAt: order.created_at,
    nit: order.nit!,
    fiscalName: order.fiscal_name!,
    shippingAddress: order.shipping_address ?? "",
    items: order.order_items,
    total: Number(order.total),
  };
  const blob = await pdf(<FelInvoicePDF data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `factura-${order.invoice_number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav("/auth"); }, [user, loading, nav]);

  const { data: orders } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("orders").select("*, order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-display font-bold mb-8">Mis pedidos</h1>
      {!orders?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          Aún no tienes pedidos.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const items = o.order_items as Array<{ id: string; product_name: string; quantity: number; unit_price: number }>;
            return (
              <div key={o.id} className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Pedido #{o.id.slice(0, 8)}</p>
                    <p className="text-sm">{new Date(o.created_at).toLocaleDateString("es", { dateStyle: "long" })}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs bg-primary/15 text-primary">{STATUS_LABEL[o.status]}</span>
                    <p className="text-xl font-display font-bold text-gradient mt-1">Q{Number(o.total).toFixed(2)}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-1 text-sm">
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between">
                      <span>{it.product_name} × {it.quantity}</span>
                      <span className="text-muted-foreground">Q{(Number(it.unit_price) * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {o.invoice_auth && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => downloadFel({ ...o, order_items: items })}>
                      <Download className="h-3 w-3 mr-1" />
                      Descargar factura
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Orders.tsx
git commit -m "feat: add FEL invoice download button to Orders page"
```

---

## Task 8: UsersAdmin tab in Admin.tsx

**Files:**
- Modify: `src/pages/Admin.tsx`

- [ ] **Step 1: Add "Usuarios" tab trigger and content**

In the `Tabs` component inside `AdminPage`, add `<TabsTrigger value="users">Usuarios</TabsTrigger>` and `<TabsContent value="users" className="mt-6"><UsersAdmin /></TabsContent>`.

- [ ] **Step 2: Add UsersAdmin component at the bottom of Admin.tsx**

Append this component to the file:

```tsx
function UsersAdmin() {
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: "", email: "", full_name: "", role: "user" as "admin" | "user" });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () =>
      (await supabase.from("profiles").select("id, email, full_name, is_active, created_at, user_roles(role)").eq("is_active", true).order("created_at", { ascending: false })).data ?? [],
  });

  const saveUser = useMutation({
    mutationFn: async () => {
      const { error: pe } = await supabase.from("profiles").update({ full_name: form.full_name }).eq("id", form.id);
      if (pe) throw pe;
      await supabase.from("user_roles").delete().eq("user_id", form.id);
      const { error: re } = await supabase.from("user_roles").insert({ user_id: form.id, role: form.role });
      if (re) throw re;
    },
    onSuccess: () => { toast.success("Usuario actualizado"); qc.invalidateQueries({ queryKey: ["admin-users"] }); setEditOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Usuario desactivado"); qc.invalidateQueries({ queryKey: ["admin-users"] }); setDeleteId(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Registrado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => {
              const roles = u.user_roles as Array<{ role: string }> | null;
              const role = roles?.[0]?.role ?? "user";
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="p-3 font-medium">{u.full_name ?? "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${role === "admin" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {role}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right space-x-1">
                    <Button
                      size="icon" variant="ghost"
                      disabled={isSelf}
                      onClick={() => { setForm({ id: u.id, email: u.email ?? "", full_name: u.full_name ?? "", role: role as "admin" | "user" }); setEditOpen(true); }}
                    ><Edit2 className="h-4 w-4" /></Button>
                    <Button
                      size="icon" variant="ghost" className="text-destructive"
                      disabled={isSelf}
                      onClick={() => setDeleteId(u.id)}
                    ><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Email</Label><Input value={form.email} disabled className="opacity-60" /></div>
            <div><Label>Nombre completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "user" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={saveUser.isPending} onClick={() => saveUser.mutate()}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar este usuario?</AlertDialogTitle>
            <AlertDialogDescription>El usuario perderá acceso a su cuenta. Esta acción se puede revertir desde la base de datos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && deleteUser.mutate(deleteId)}>Desactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 3: Update Admin.tsx imports**

Add to the import block at the top:
```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: add UsersAdmin tab with edit/soft-delete to admin panel"
```

---

## Task 9: Register route + final commit

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add ThankYouPage import and route**

In `src/App.tsx`, add the import:
```tsx
import ThankYouPage from "@/pages/ThankYouPage";
```

Add the route inside `<Routes>`:
```tsx
<Route path="/thank-you/:orderId" element={<ThankYouPage />} />
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: register /thank-you/:orderId route"
```

---

## Self-Review Checklist

- [x] DB migration covers all 4 new `orders` columns, `profiles.email`, `profiles.is_active`, trigger, and RPC
- [x] TypeScript types updated for all new fields and the RPC
- [x] PDF component receives `FelInvoiceData` — same shape used in ThankYouPage and Orders
- [x] PaymentDialog calls `checkout_order` RPC with all required params
- [x] ThankYouPage redirects to `/orders` if `fromCheckout` state is missing
- [x] Cart.tsx no longer has inline checkout mutation or address field
- [x] Orders.tsx shows download button only when `invoice_auth != null`
- [x] UsersAdmin blocks edit/delete on current user's own row
- [x] Soft delete uses `is_active = false` — no service-role key needed
