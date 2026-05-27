import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Cpu, LogOut, User as UserIcon, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();

  const { data: cartCount } = useQuery({
    queryKey: ["cart-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user!.id);
      return data?.reduce((s, x) => s + x.quantity, 0) ?? 0;
    },
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2 group-hover:glow transition-shadow">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">VOLT<span className="text-gradient">TECH</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Catálogo</Link>
          {user && <Link to="/orders" className="text-muted-foreground hover:text-foreground transition-colors">Mis pedidos</Link>}
          {isAdmin && <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"><Shield className="h-4 w-4"/>Admin</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" className="relative">
                <Link to="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {!!cartCount && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{cartCount}</span>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={async () => { await signOut(); nav("/"); }}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/auth"><UserIcon className="h-4 w-4 mr-1"/>Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
