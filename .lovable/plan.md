## Migración a Vite SPA (para desplegar en Vercel)

Voy a convertir el proyecto de **TanStack Start + SSR + Cloudflare Workers** a un **Vite SPA con React Router**, igual que tu proyecto "Week Web Wonders". Así podrás desplegarlo en Vercel sin problemas.

### Qué se mantiene igual
- Toda la UI (componentes, estilos, Tailwind, shadcn)
- Lovable Cloud / Supabase (auth, base de datos, RLS)
- Toda la lógica de carrito, productos, pedidos, admin
- Precios en quetzales

### Cambios técnicos

1. **Eliminar capa SSR / Workers**
   - Borrar: `src/server.ts`, `src/start.ts`, `src/router.tsx`, `src/routeTree.gen.ts`, `wrangler.jsonc`, `src/lib/error-capture.ts`, `src/lib/error-page.ts`
   - Borrar `src/integrations/supabase/client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts` (no se usan: el proyecto solo hace llamadas client-side a Supabase)

2. **Reemplazar `vite.config.ts`**
   - Quitar `@lovable.dev/vite-tanstack-config`
   - Usar `@vitejs/plugin-react` + `@tailwindcss/vite` + alias `@`

3. **Migrar routing a React Router DOM**
   - Crear `index.html` (entry HTML estándar de Vite)
   - Crear `src/main.tsx` (entry React con `BrowserRouter`)
   - Crear `src/App.tsx` con `<Routes>` que mapea:
     - `/` → home
     - `/auth` → login
     - `/cart` → carrito
     - `/orders` → pedidos
     - `/admin` → admin
     - `/products/:slug` → detalle de producto
   - Reescribir cada `src/routes/*.tsx`:
     - Quitar `createFileRoute`, `Route.useParams`, `head()`
     - Usar `useParams`, `useNavigate`, `Link` de `react-router-dom`
     - Mover `<title>` y `<meta>` a `index.html` (o agregar `react-helmet-async` si quieres SEO por página)
   - Actualizar `__root.tsx` → convertir en `Layout` normal con `<Outlet />` de react-router

4. **Configurar Vercel**
   - Crear `vercel.json` con rewrite a `index.html` (fallback SPA)

5. **Limpiar package.json**
   - Quitar dependencias TanStack Start / Cloudflare / wrangler
   - Agregar `react-router-dom`

### Resultado
- Comando `vite build` produce un `dist/` estático
- Desplegable directamente en Vercel (mismo flujo que "Week Web Wonders")
- Puedes conectar tu dominio propio en Vercel sin plan Pro de Lovable

¿Procedo con la migración?
