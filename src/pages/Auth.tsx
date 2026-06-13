import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error("Error con Google: " + error.message);
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

      </Tabs>
    </div>
  );
}
