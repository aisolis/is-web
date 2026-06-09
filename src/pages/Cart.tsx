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
