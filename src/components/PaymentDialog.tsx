import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { genInvoiceNumber, fmtCard, fmtExpiry, isValidCard, isValidExpiry, isValidCvv } from "@/lib/checkout-utils";
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

  async function handlePay() {
    if (!nit.trim()) return toast.error("Ingresa tu NIT");
    if (!fiscalName.trim()) return toast.error("Ingresa tu nombre fiscal");
    if (!address.trim()) return toast.error("Ingresa una dirección de envío");
    if (!isValidCard(cardNumber)) return toast.error("Número de tarjeta inválido (16 dígitos)");
    if (!isValidExpiry(expiry)) return toast.error("Expiración inválida (MM/AA)");
    if (!isValidCvv(cvv)) return toast.error("CVV inválido (3 dígitos)");

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
              <div>
                <Label>NIT</Label>
                <Input value={nit} onChange={(e) => setNit(e.target.value)} placeholder="12345678-9" />
              </div>
              <div>
                <Label>Nombre fiscal</Label>
                <Input value={fiscalName} onChange={(e) => setFiscalName(e.target.value)} placeholder="Juan López" />
              </div>
              <div>
                <Label>Dirección de envío</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, ciudad, código postal" />
              </div>
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
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(fmtCard(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Expiración</Label>
                  <Input
                    value={expiry}
                    onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                    placeholder="MM/AA"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="123"
                    maxLength={3}
                  />
                </div>
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
