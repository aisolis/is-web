import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToFile } from "@react-pdf/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Estilos ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },

  // Portada
  coverPage: { padding: 60, display: "flex", flexDirection: "column", justifyContent: "center" },
  coverTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  coverSubtitle: { fontSize: 14, color: "#555", marginBottom: 40 },
  coverMeta: { fontSize: 10, color: "#777", marginBottom: 4 },
  coverDivider: { borderBottom: "2pt solid #000", marginBottom: 24, marginTop: 24 },

  // Secciones
  sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 10, marginTop: 20, borderBottom: "1pt solid #ccc", paddingBottom: 4 },
  subsectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 12 },

  // Texto
  p: { marginBottom: 6, lineHeight: 1.5 },
  bold: { fontFamily: "Helvetica-Bold" },

  // Tabla
  table: { marginBottom: 10 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1a1a1a", padding: "4pt 6pt" },
  tableHeaderCell: { color: "#fff", fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", padding: "3pt 6pt", borderBottom: "0.5pt solid #ddd" },
  tableRowAlt: { flexDirection: "row", padding: "3pt 6pt", borderBottom: "0.5pt solid #ddd", backgroundColor: "#f9f9f9" },
  col30: { width: "30%" },
  col40: { width: "40%" },
  col20: { width: "20%" },
  col50: { width: "50%" },
  col25: { width: "25%" },

  // Código
  code: { fontFamily: "Courier", fontSize: 9, backgroundColor: "#f4f4f4", padding: "4pt 6pt", marginBottom: 6, borderLeft: "2pt solid #ccc" },

  // Badge
  badge: { backgroundColor: "#e8e8e8", padding: "1pt 4pt", borderRadius: 2, fontSize: 9 },

  // Bullet list
  li: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 12, fontFamily: "Helvetica-Bold" },
  liText: { flex: 1, lineHeight: 1.5 },

  // Footer
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#aaa", borderTop: "0.5pt solid #ddd", paddingTop: 6 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const Li = ({ children }: { children: string }) => (
  <View style={s.li}>
    <Text style={s.bullet}>•</Text>
    <Text style={s.liText}>{children}</Text>
  </View>
);

const TableRow = ({ cells, alt = false, widths }: { cells: string[]; alt?: boolean; widths: string[] }) => (
  <View style={alt ? s.tableRowAlt : s.tableRow}>
    {cells.map((c, i) => (
      <Text key={i} style={{ width: widths[i] }}>{c}</Text>
    ))}
  </View>
);

const Footer = ({ page }: { page: string }) => (
  <View style={s.footer} fixed>
    <Text>VoltTech Store — Documentación Técnica</Text>
    <Text>{page}</Text>
  </View>
);

// ─── Documento ────────────────────────────────────────────────────────────────

function TechDocs() {
  return (
    <Document title="VoltTech Store — Documentación Técnica" author="VoltTech Team">

      {/* ── Portada ── */}
      <Page size="A4" style={[s.page, s.coverPage]}>
        <Text style={s.coverTitle}>VoltTech Store</Text>
        <Text style={s.coverSubtitle}>Documentación Técnica</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverMeta}>Universidad Mariano Gálvez</Text>
        <Text style={s.coverMeta}>Ingeniería en Sistemas de Información</Text>
        <Text style={s.coverMeta}>Fecha: Junio 2026</Text>
        <Text style={s.coverMeta}>Versión: 1.0</Text>
        <View style={{ marginTop: 48 }}>
          <Text style={s.p}>
            VoltTech Store es una aplicación web de comercio electrónico desarrollada con React, TypeScript y Supabase.
            Permite la gestión de un catálogo de productos, carrito de compras, checkout con simulación de pago y
            generación de facturas electrónicas (FEL). Incluye un panel administrativo completo con gestión de
            productos, categorías, pedidos y usuarios.
          </Text>
        </View>
      </Page>

      {/* ── 1. Stack tecnológico ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>1. Stack Tecnológico</Text>

        <Text style={s.subsectionTitle}>Frontend</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.col30]}>Tecnología</Text>
            <Text style={[s.tableHeaderCell, s.col20]}>Versión</Text>
            <Text style={[s.tableHeaderCell, s.col50]}>Uso</Text>
          </View>
          {[
            ["React", "19.x", "Biblioteca principal de UI"],
            ["TypeScript", "5.x", "Tipado estático"],
            ["Vite", "7.x", "Bundler y servidor de desarrollo"],
            ["React Router", "7.x", "Enrutamiento SPA"],
            ["TanStack Query", "5.x", "Fetching y caché de datos del servidor"],
            ["Tailwind CSS", "4.x", "Estilos utilitarios"],
            ["shadcn/ui", "—", "Componentes de interfaz (Radix UI)"],
            ["@react-pdf/renderer", "4.x", "Generación de PDFs en el navegador"],
            ["Sonner", "2.x", "Notificaciones toast"],
          ].map(([t, v, u], i) => (
            <TableRow key={i} cells={[t, v, u]} alt={i % 2 === 1} widths={["30%", "20%", "50%"]} />
          ))}
        </View>

        <Text style={s.subsectionTitle}>Backend y Base de datos</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.col30]}>Tecnología</Text>
            <Text style={[s.tableHeaderCell, s.col20]}>Versión</Text>
            <Text style={[s.tableHeaderCell, s.col50]}>Uso</Text>
          </View>
          {[
            ["Supabase", "2.x SDK", "Backend-as-a-Service (BaaS)"],
            ["PostgreSQL", "15.x", "Base de datos relacional (vía Supabase)"],
            ["Row Level Security", "—", "Control de acceso a datos por fila"],
            ["Supabase Auth", "—", "Autenticación (email + OAuth)"],
          ].map(([t, v, u], i) => (
            <TableRow key={i} cells={[t, v, u]} alt={i % 2 === 1} widths={["30%", "20%", "50%"]} />
          ))}
        </View>

        <Text style={s.subsectionTitle}>Testing y Calidad</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.col30]}>Herramienta</Text>
            <Text style={[s.tableHeaderCell, s.col70]}>Uso</Text>
          </View>
          {[
            ["Vitest", "Framework de pruebas unitarias (Vite-nativo)"],
            ["ESLint", "Análisis estático de código"],
            ["Prettier", "Formato de código"],
          ].map(([t, u], i) => (
            <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow}>
              <Text style={{ width: "30%" }}>{t}</Text>
              <Text style={{ width: "70%" }}>{u}</Text>
            </View>
          ))}
        </View>
        <Footer page="2" />
      </Page>

      {/* ── 2. Arquitectura ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>2. Arquitectura del Sistema</Text>

        <Text style={s.p}>
          VoltTech Store es una Single Page Application (SPA) que se comunica directamente con Supabase
          mediante su SDK de JavaScript. No existe un servidor backend intermedio; toda la lógica de negocio
          crítica reside en funciones PostgreSQL (RPCs) ejecutadas dentro de la base de datos.
        </Text>

        <Text style={s.subsectionTitle}>Flujo de datos</Text>
        <View style={s.code}>
          <Text>Navegador (React SPA)</Text>
          <Text>   ↕  supabase-js SDK (HTTPS)</Text>
          <Text>Supabase Platform</Text>
          <Text>   ├── Auth  (JWT, sesiones)</Text>
          <Text>   ├── PostgREST  (CRUD sobre tablas)</Text>
          <Text>   └── RPC  (funciones PL/pgSQL)</Text>
          <Text>         └── checkout_order()  — transacción atómica</Text>
        </View>

        <Text style={s.subsectionTitle}>Patrones de acceso a datos</Text>
        <Li>TanStack Query gestiona todo el fetching, caché e invalidación de queries.</Li>
        <Li>Las mutaciones críticas (checkout) usan supabase.rpc() para ejecutar funciones server-side.</Li>
        <Li>Row Level Security (RLS) en Supabase garantiza que cada usuario solo acceda a sus propios datos.</Li>
        <Li>Los administradores se identifican via la tabla user_roles con rol "admin".</Li>

        <Text style={s.subsectionTitle}>Estructura de carpetas</Text>
        <View style={s.code}>
          <Text>src/</Text>
          <Text>├── components/         Componentes reutilizables</Text>
          <Text>│   ├── ui/             Componentes shadcn/ui (Radix)</Text>
          <Text>│   ├── FelInvoicePDF   Documento PDF de factura FEL</Text>
          <Text>│   ├── Navbar          Barra de navegación</Text>
          <Text>│   └── PaymentDialog   Modal de pago y datos FEL</Text>
          <Text>├── pages/              Vistas por ruta</Text>
          <Text>│   ├── Admin           Panel administrativo</Text>
          <Text>│   ├── Cart            Carrito de compras</Text>
          <Text>│   ├── Home            Catálogo de productos</Text>
          <Text>│   ├── Orders          Historial de pedidos</Text>
          <Text>│   ├── ProductDetail   Detalle de producto</Text>
          <Text>│   └── ThankYouPage    Confirmación de compra</Text>
          <Text>├── lib/</Text>
          <Text>│   ├── auth.tsx        Contexto de autenticación</Text>
          <Text>│   ├── checkout-utils  Funciones puras (testadas)</Text>
          <Text>│   └── utils.ts        Utilidades generales</Text>
          <Text>└── integrations/supabase/</Text>
          <Text>    ├── client.ts       Instancia del cliente Supabase</Text>
          <Text>    └── types.ts        Tipos generados del esquema DB</Text>
        </View>
        <Footer page="3" />
      </Page>

      {/* ── 3. Base de datos ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>3. Esquema de Base de Datos</Text>

        <Text style={s.subsectionTitle}>Tabla: products</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "25%" }]}>Columna</Text>
            <Text style={[s.tableHeaderCell, { width: "20%" }]}>Tipo</Text>
            <Text style={[s.tableHeaderCell, { width: "55%" }]}>Descripción</Text>
          </View>
          {[
            ["id", "uuid PK", "Identificador único"],
            ["name", "text", "Nombre del producto"],
            ["slug", "text UNIQUE", "URL amigable"],
            ["description", "text", "Descripción del producto"],
            ["price", "numeric", "Precio en quetzales"],
            ["stock", "integer", "Unidades disponibles"],
            ["image_url", "text", "URL de imagen"],
            ["category_id", "uuid FK", "Referencia a categories"],
            ["is_active", "boolean", "Si el producto está activo"],
          ].map(([c, t, d], i) => (
            <TableRow key={i} cells={[c, t, d]} alt={i % 2 === 1} widths={["25%", "20%", "55%"]} />
          ))}
        </View>

        <Text style={s.subsectionTitle}>Tabla: orders</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "25%" }]}>Columna</Text>
            <Text style={[s.tableHeaderCell, { width: "20%" }]}>Tipo</Text>
            <Text style={[s.tableHeaderCell, { width: "55%" }]}>Descripción</Text>
          </View>
          {[
            ["id", "uuid PK", "Identificador único"],
            ["user_id", "uuid FK", "Usuario que realizó el pedido"],
            ["total", "numeric", "Monto total en quetzales"],
            ["shipping_address", "text", "Dirección de envío"],
            ["status", "enum", "pending | paid | shipped | delivered | cancelled"],
            ["nit", "text", "NIT del receptor (FEL)"],
            ["fiscal_name", "text", "Nombre fiscal del receptor (FEL)"],
            ["invoice_number", "text", "Número DTE simulado (ej. DTE-123456)"],
            ["invoice_auth", "uuid", "UUID de autorización SAT simulado"],
          ].map(([c, t, d], i) => (
            <TableRow key={i} cells={[c, t, d]} alt={i % 2 === 1} widths={["25%", "20%", "55%"]} />
          ))}
        </View>

        <Text style={s.subsectionTitle}>Tabla: profiles</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "25%" }]}>Columna</Text>
            <Text style={[s.tableHeaderCell, { width: "20%" }]}>Tipo</Text>
            <Text style={[s.tableHeaderCell, { width: "55%" }]}>Descripción</Text>
          </View>
          {[
            ["id", "uuid PK", "Mismo ID que auth.users"],
            ["full_name", "text", "Nombre completo"],
            ["email", "text", "Email (copiado por trigger de auth.users)"],
            ["is_active", "boolean", "Soft-delete: false = cuenta desactivada"],
          ].map(([c, t, d], i) => (
            <TableRow key={i} cells={[c, t, d]} alt={i % 2 === 1} widths={["25%", "20%", "55%"]} />
          ))}
        </View>

        <Text style={s.subsectionTitle}>Otras tablas</Text>
        <Li>categories — id, name, slug, description</Li>
        <Li>cart_items — id, user_id, product_id, quantity</Li>
        <Li>order_items — id, order_id, product_id, product_name, unit_price, quantity</Li>
        <Li>user_roles — id, user_id, role (admin | user)</Li>
        <Footer page="4" />
      </Page>

      {/* ── 4. Funcionalidades ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>4. Funcionalidades del Sistema</Text>

        <Text style={s.subsectionTitle}>4.1 Catálogo de productos</Text>
        <Li>Listado de productos con nombre, precio, imagen y disponibilidad de stock.</Li>
        <Li>Filtrado por categorías. Navegación a detalle por slug amigable (/products/:slug).</Li>
        <Li>Productos con stock = 0 muestran etiqueta "Agotado" y no pueden añadirse al carrito.</Li>

        <Text style={s.subsectionTitle}>4.2 Carrito de compras</Text>
        <Li>Añadir, incrementar, decrementar y eliminar productos.</Li>
        <Li>Cálculo de total en tiempo real. Persistido en la tabla cart_items.</Li>
        <Li>Botón "Finalizar pedido" abre el modal de pago.</Li>

        <Text style={s.subsectionTitle}>4.3 Checkout y pago simulado</Text>
        <Li>Modal con datos de facturación FEL (NIT y nombre fiscal) y tarjeta simulada.</Li>
        <Li>Validación de formato: tarjeta 16 dígitos, expiración MM/AA, CVV 3 dígitos.</Li>
        <Li>Llama a la RPC checkout_order que ejecuta todo en una transacción atómica.</Li>
        <Li>Redirige a /thank-you/:orderId al confirmar el pago.</Li>

        <Text style={s.subsectionTitle}>4.4 Factura Electrónica FEL (simulación)</Text>
        <Li>Generada automáticamente al realizar el checkout.</Li>
        <Li>Número DTE: DTE-XXXXXX. Número de autorización: UUID generado por PostgreSQL.</Li>
        <Li>PDF descargable desde la página de gracias y desde "Mis pedidos".</Li>
        <Li>Incluye: emisor, receptor (NIT + nombre fiscal), detalle de ítems, subtotal, IVA 12% y total.</Li>
        <Li>Pie de página: "Simulación con fines educativos — Régimen General con IVA".</Li>

        <Text style={s.subsectionTitle}>4.5 Panel administrativo (/admin)</Text>
        <Li>Acceso restringido a usuarios con rol "admin" (validado en useAuth + RLS).</Li>
        <Li>Pestaña Productos: CRUD completo con imagen, precio, stock y categoría.</Li>
        <Li>Pestaña Categorías: crear y eliminar categorías.</Li>
        <Li>Pestaña Pedidos: ver todos los pedidos y cambiar estado.</Li>
        <Li>Pestaña Usuarios: ver, editar nombre/rol y desactivar cuentas (soft-delete).</Li>

        <Text style={s.subsectionTitle}>4.6 Gestión de usuarios (admin)</Text>
        <Li>Listado de perfiles activos con email, nombre, rol y fecha de registro.</Li>
        <Li>Edición de nombre completo y cambio de rol (admin ↔ user).</Li>
        <Li>Desactivación con confirmación: sets is_active = false (reversible desde la DB).</Li>
        <Li>El admin no puede editar ni desactivar su propia cuenta.</Li>
        <Footer page="5" />
      </Page>

      {/* ── 5. RPC y lógica de servidor ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>5. Función RPC: checkout_order</Text>

        <Text style={s.p}>
          Función PL/pgSQL ejecutada dentro de PostgreSQL que garantiza atomicidad total del proceso de compra.
          Si cualquier paso falla, Postgres revierte la transacción completa.
        </Text>

        <Text style={s.subsectionTitle}>Firma</Text>
        <View style={s.code}>
          <Text>checkout_order(</Text>
          <Text>  p_user_id         uuid,</Text>
          <Text>  p_items           jsonb,   -- [{"{"}product_id, quantity, product_name, unit_price{"}"}]</Text>
          <Text>  p_total           numeric,</Text>
          <Text>  p_shipping_address text,</Text>
          <Text>  p_nit             text,</Text>
          <Text>  p_fiscal_name     text,</Text>
          <Text>  p_invoice_number  text</Text>
          <Text>)</Text>
          <Text>RETURNS uuid  -- order_id</Text>
        </View>

        <Text style={s.subsectionTitle}>Pasos internos (en una sola transacción)</Text>
        <Li>1. Verificar stock: para cada ítem, lee products.stock. Si stock {'<'} quantity lanza EXCEPTION 'Sin stock: [nombre]'.</Li>
        <Li>2. Crear orden: INSERT en orders con status = 'paid', invoice_auth = gen_random_uuid().</Li>
        <Li>3. Crear líneas: INSERT en order_items con todos los productos del carrito.</Li>
        <Li>4. Descontar stock: UPDATE products SET stock = stock - quantity para cada ítem.</Li>
        <Li>5. Limpiar carrito: DELETE FROM cart_items WHERE user_id = p_user_id.</Li>
        <Li>6. Retorna el UUID del nuevo pedido.</Li>

        <Text style={s.subsectionTitle}>Trigger: sync_user_email</Text>
        <Text style={s.p}>
          Trigger AFTER INSERT ON auth.users que copia el email del usuario recién registrado
          a la tabla profiles. Esto permite al panel admin listar emails sin necesitar la service-role key.
        </Text>
        <View style={s.code}>
          <Text>CREATE TRIGGER on_auth_user_email</Text>
          <Text>  AFTER INSERT ON auth.users</Text>
          <Text>  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();</Text>
        </View>

        <Text style={s.sectionTitle}>6. Rutas de la Aplicación</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "35%" }]}>Ruta</Text>
            <Text style={[s.tableHeaderCell, { width: "30%" }]}>Componente</Text>
            <Text style={[s.tableHeaderCell, { width: "35%" }]}>Acceso</Text>
          </View>
          {[
            ["/", "Home", "Público"],
            ["/auth", "Auth", "Público"],
            ["/products/:slug", "ProductDetail", "Público"],
            ["/cart", "CartPage", "Autenticado"],
            ["/orders", "OrdersPage", "Autenticado"],
            ["/thank-you/:orderId", "ThankYouPage", "Autenticado + fromCheckout"],
            ["/admin", "AdminPage", "Solo administradores"],
          ].map(([r, c, a], i) => (
            <TableRow key={i} cells={[r, c, a]} alt={i % 2 === 1} widths={["35%", "30%", "35%"]} />
          ))}
        </View>
        <Footer page="6" />
      </Page>

      {/* ── 6. Pruebas unitarias ── */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionTitle}>7. Pruebas Unitarias</Text>

        <Text style={s.p}>
          Las pruebas se implementaron con Vitest sobre funciones puras extraídas en
          src/lib/checkout-utils.ts. Se ejecutan con: npm test
        </Text>

        <Text style={s.subsectionTitle}>Módulo probado: checkout-utils.ts</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "30%" }]}>Función</Text>
            <Text style={[s.tableHeaderCell, { width: "15%" }]}>Casos</Text>
            <Text style={[s.tableHeaderCell, { width: "55%" }]}>Qué se verifica</Text>
          </View>
          {[
            ["genInvoiceNumber()", "2", "Formato DTE-XXXXXX, retorna string"],
            ["fmtCard()", "4", "Espacios c/4 dígitos, elimina letras, trunca a 16"],
            ["fmtExpiry()", "4", "Formato MM/YY, sin slash con < 3 dígitos"],
            ["isValidCard()", "5", "Acepta 16 dígitos, rechaza 15 o 17, acepta con espacios"],
            ["isValidExpiry()", "4", "Meses 01–12, rechaza 00 y 13, sin slash inválido"],
            ["isValidCvv()", "4", "Exactamente 3 dígitos, rechaza letras"],
            ["calcIva()", "3", "subtotal + iva = total, IVA = 12%, total=0 da 0"],
            ["slugify()", "4", "Minúsculas, guiones, sin especiales, sin guiones extremos"],
          ].map(([f, c, v], i) => (
            <TableRow key={i} cells={[f, c, v]} alt={i % 2 === 1} widths={["30%", "15%", "55%"]} />
          ))}
        </View>

        <Text style={{ ...s.p, marginTop: 8, fontFamily: "Helvetica-Bold" }}>Total: 30 pruebas — 30 pasando</Text>

        <Text style={s.subsectionTitle}>Ejecución</Text>
        <View style={s.code}>
          <Text>$ npm test</Text>
          <Text></Text>
          <Text> RUN  v4.1.8</Text>
          <Text></Text>
          <Text> Test Files  1 passed (1)</Text>
          <Text>      Tests  30 passed (30)</Text>
          <Text>   Duration  ~500ms</Text>
        </View>

        <Text style={s.sectionTitle}>8. Instalación y Ejecución</Text>

        <Text style={s.subsectionTitle}>Requisitos</Text>
        <Li>Node.js 18+ y npm</Li>
        <Li>Cuenta en Supabase con el proyecto configurado</Li>
        <Li>Variables de entorno en .env (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)</Li>

        <Text style={s.subsectionTitle}>Comandos</Text>
        <View style={s.code}>
          <Text>npm install          # Instalar dependencias</Text>
          <Text>npm run dev          # Servidor de desarrollo (puerto 8080)</Text>
          <Text>npm run build        # Build de producción</Text>
          <Text>npm test             # Ejecutar pruebas unitarias</Text>
          <Text>npm run lint         # Análisis estático de código</Text>
        </View>

        <Text style={s.subsectionTitle}>Migración de base de datos</Text>
        <Text style={s.p}>
          Ejecutar el archivo supabase/migrations/20260608_fel_users.sql en el SQL Editor
          de Supabase para crear las columnas FEL, el trigger de email y la función checkout_order.
        </Text>
        <Footer page="7" />
      </Page>

    </Document>
  );
}

// ─── Generar PDF ──────────────────────────────────────────────────────────────

const outputPath = path.join(__dirname, "../docs/VoltTech-Documentacion-Tecnica.pdf");

await renderToFile(<TechDocs />, outputPath);
console.log(`✓ PDF generado: ${outputPath}`);
