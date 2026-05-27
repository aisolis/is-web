import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type ProductForm = {
  id?: string; name: string; description: string; price: string; stock: string; image_url: string; category_id: string;
};

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) nav("/");
  }, [user, isAdmin, loading, nav]);

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShieldOff className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Acceso restringido. Solo administradores.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-display font-bold mb-8">Panel administrativo</h1>
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6"><ProductsAdmin /></TabsContent>
        <TabsContent value="categories" className="mt-6"><CategoriesAdmin /></TabsContent>
        <TabsContent value="orders" className="mt-6"><OrdersAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProductsAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>({ name: "", description: "", price: "", stock: "0", image_url: "", category_id: "" });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, description: form.description, price: Number(form.price), stock: Number(form.stock),
        image_url: form.image_url || null, category_id: form.category_id || null, slug: slugify(form.name),
      };
      if (form.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Producto guardado"); qc.invalidateQueries(); setOpen(false); setForm({ name: "", description: "", price: "", stock: "0", image_url: "", category_id: "" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("products").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Eliminado"); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => setForm({ name: "", description: "", price: "", stock: "0", image_url: "", category_id: "" })}><Plus className="h-4 w-4 mr-1"/>Nuevo producto</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{form.id ? "Editar" : "Nuevo"} producto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Precio</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <div><Label>URL imagen</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
              <div><Label>Categoría</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                  <SelectContent>{cats?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left"><tr><th className="p-3">Producto</th><th className="p-3">Categoría</th><th className="p-3">Precio</th><th className="p-3">Stock</th><th className="p-3"></th></tr></thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-muted-foreground">{(p.categories as { name: string } | null)?.name ?? "—"}</td>
                <td className="p-3">Q{Number(p.price).toFixed(2)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => { setForm({ id: p.id, name: p.name, description: p.description ?? "", price: String(p.price), stock: String(p.stock), image_url: p.image_url ?? "", category_id: p.category_id ?? "" }); setOpen(true); }}><Edit2 className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4"/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [] });
  const add = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("categories").insert({ name, slug: slugify(name) }); if (error) throw error; },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Categoría añadida"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Eliminada"); },
  });
  return (
    <div className="max-w-xl">
      <div className="flex gap-2 mb-4">
        <Input placeholder="Nombre de la categoría" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={() => name && add.mutate()}><Plus className="h-4 w-4 mr-1"/>Añadir</Button>
      </div>
      <div className="rounded-xl border border-border/60 bg-card divide-y divide-border">
        {cats?.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3">
            <span>{c.name}</span>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4"/></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersAdmin() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status: status as "pending" | "paid" | "shipped" | "delivered" | "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Estado actualizado"); },
  });
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-left"><tr><th className="p-3">ID</th><th className="p-3">Fecha</th><th className="p-3">Total</th><th className="p-3">Estado</th></tr></thead>
        <tbody>
          {orders?.map((o) => (
            <tr key={o.id} className="border-t border-border">
              <td className="p-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
              <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
              <td className="p-3">Q{Number(o.total).toFixed(2)}</td>
              <td className="p-3">
                <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending","paid","shipped","delivered","cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
