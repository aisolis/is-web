import { Link } from "react-router-dom";

type Product = {
  id: string; name: string; slug: string; price: number; image_url: string | null; stock: number;
};

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      to={`/products/${p.slug}`}
      className="group rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/60 transition-all hover:-translate-y-1 hover:glow"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : <div className="h-full w-full bg-secondary" />}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-medium leading-tight line-clamp-2">{p.name}</h3>
        <div className="flex items-end justify-between">
          <span className="text-xl font-display font-bold text-gradient">Q{Number(p.price).toFixed(2)}</span>
          <span className={`text-xs ${p.stock > 0 ? "text-success" : "text-destructive"}`}>
            {p.stock > 0 ? `${p.stock} en stock` : "Agotado"}
          </span>
        </div>
      </div>
    </Link>
  );
}
