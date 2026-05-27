import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", paid: "Pagado", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado",
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav("/auth"); }, [user, loading, nav]);

  const { data: orders } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
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
          {orders.map((o) => (
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
                {(o.order_items as Array<{ id: string; product_name: string; quantity: number; unit_price: number }>).map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.product_name} × {it.quantity}</span>
                    <span className="text-muted-foreground">Q{(Number(it.unit_price) * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
