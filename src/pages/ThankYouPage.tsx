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
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
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
