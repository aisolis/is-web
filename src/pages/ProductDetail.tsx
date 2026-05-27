import { useNavigate, Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await supabase.from("products").select("*, categories(name)").eq("slug", slug!).maybeSingle()).data,
  });

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { data: existing } = await supabase.from("cart_items").select("*").eq("user_id", user.id).eq("product_id", p!.id).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: p!.id, quantity: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Añadido al carrito");
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => {
      if (e.message === "auth") { toast.error("Inicia sesión para comprar"); nav("/auth"); }
      else toast.error(e.message);
    },
  });

  if (isLoading) return <div className="container mx-auto px-4 py-12">Cargando…</div>;
  if (!p) return <div className="container mx-auto px-4 py-12">Producto no encontrado.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4"/>Volver al catálogo</Link>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-2xl overflow-hidden bg-card border border-border/60">
          {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
        </div>
        <div className="space-y-6">
          {p.categories && <span className="text-xs uppercase tracking-widest text-primary">{(p.categories as { name: string }).name}</span>}
          <h1 className="text-4xl font-display font-bold">{p.name}</h1>
          <p className="text-5xl font-display font-bold text-gradient">Q{Number(p.price).toFixed(2)}</p>
          <p className="text-muted-foreground leading-relaxed">{p.description}</p>
          <div className="flex items-center gap-4 pt-4">
            <Button size="lg" disabled={p.stock === 0 || addToCart.isPending} onClick={() => addToCart.mutate()} className="glow">
              <ShoppingCart className="h-5 w-5 mr-2" />
              {p.stock === 0 ? "Agotado" : "Añadir al carrito"}
            </Button>
            <span className="text-sm text-muted-foreground">{p.stock} disponibles</span>
          </div>
        </div>
      </div>
    </div>
  );
}
