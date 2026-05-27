import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav("/"); }, [user, nav]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("¡Bienvenido!"); nav("/"); }
  };

  const signUp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Revisa tu correo para confirmar la cuenta.");
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Error con Google");
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex rounded-2xl bg-gradient-to-br from-primary to-accent p-3 mb-4 glow">
          <Cpu className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold">Bienvenido a <span className="text-gradient">VoltTech</span></h1>
      </div>

      <Tabs defaultValue="signin" className="rounded-xl border border-border/60 bg-card p-6">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
          <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="space-y-4">
          <div><Label>Correo</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Contraseña</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button className="w-full" disabled={busy} onClick={signIn}>Entrar</Button>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4">
          <div><Label>Nombre completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>Correo</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Contraseña</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button className="w-full" disabled={busy} onClick={signUp}>Registrarme</Button>
        </TabsContent>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">o continúa con</span></div>
        </div>
        <Button variant="outline" className="w-full" onClick={google}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google
        </Button>
      </Tabs>
    </div>
  );
}
