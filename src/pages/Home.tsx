import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", q, cat],
    queryFn: async () => {
      let qry = supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (cat) qry = qry.eq("category_id", cat);
      if (q) qry = qry.ilike("name", `%${q}%`);
      return (await qry).data ?? [];
    },
  });

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/50" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Zap className="h-3.5 w-3.5" /> Envío gratis en compras +Q500
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.05]">
            La tecnología que <span className="text-gradient">define</span><br/>tu próximo nivel.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Laptops, smartphones, audio y componentes de última generación. Curados para creadores y profesionales.
          </p>
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar productos…" className="pl-9 h-12 bg-card/60 backdrop-blur" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-2 mb-8">
          <Button variant={cat === null ? "default" : "outline"} size="sm" onClick={() => setCat(null)}>Todos</Button>
          {cats?.map((c) => (
            <Button key={c.id} variant={cat === c.id ? "default" : "outline"} size="sm" onClick={() => setCat(c.id)}>{c.name}</Button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Cargando…</p>
        ) : products?.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No se encontraron productos.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products?.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </>
  );
}
