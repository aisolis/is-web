import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 16, borderBottom: "1pt solid #000", paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  authBox: { backgroundColor: "#f4f4f4", padding: 6, marginTop: 6 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 4, borderBottom: "0.5pt solid #ccc", paddingBottom: 2 },
  bold: { fontWeight: "bold" },
  tableHeader: { flexDirection: "row", backgroundColor: "#e8e8e8", padding: "4pt 2pt", fontWeight: "bold" },
  tableRow: { flexDirection: "row", padding: "3pt 2pt", borderBottom: "0.5pt solid #eee" },
  c1: { width: "10%" },
  c2: { width: "50%" },
  c3: { width: "20%", textAlign: "right" },
  c4: { width: "20%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 3 },
  totalLabel: { width: "40%", textAlign: "right", paddingRight: 8 },
  totalValue: { width: "22%", textAlign: "right" },
  footer: { marginTop: 24, borderTop: "0.5pt solid #ccc", paddingTop: 6, fontSize: 8, color: "#888", textAlign: "center" },
});

export type FelInvoiceData = {
  invoiceNumber: string;
  invoiceAuth: string;
  issuedAt: string;
  nit: string;
  fiscalName: string;
  shippingAddress: string;
  items: Array<{ product_name: string; quantity: number; unit_price: number }>;
  total: number;
};

export function FelInvoicePDF({ data }: { data: FelInvoiceData }) {
  const subtotal = data.total / 1.12;
  const iva = data.total - subtotal;
  const date = new Date(data.issuedAt);
  const dateStr = `${date.toLocaleDateString("es-GT")} ${date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>VoltTech Store</Text>
          <View style={s.row}>
            <Text>NIT Emisor: 1234567-8</Text>
            <Text>Ciudad de Guatemala</Text>
          </View>
          <View style={s.authBox}>
            <View style={s.row}>
              <Text>
                <Text style={s.bold}>Serie:</Text> VOLT-2026{"  "}
                <Text style={s.bold}>No. DTE:</Text> {data.invoiceNumber}
              </Text>
            </View>
            <Text style={{ marginTop: 3 }}>
              <Text style={s.bold}>No. Autorización:</Text> {data.invoiceAuth}
            </Text>
            <Text style={{ marginTop: 3 }}>
              <Text style={s.bold}>Fecha:</Text> {dateStr}
            </Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Datos del Receptor</Text>
          <View style={s.row}><Text style={s.bold}>NIT:</Text><Text>{data.nit}</Text></View>
          <View style={s.row}><Text style={s.bold}>Nombre:</Text><Text>{data.fiscalName}</Text></View>
          <View style={s.row}><Text style={s.bold}>Dirección:</Text><Text>{data.shippingAddress}</Text></View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalle</Text>
          <View style={s.tableHeader}>
            <Text style={s.c1}>Cant.</Text>
            <Text style={s.c2}>Descripción</Text>
            <Text style={s.c3}>Precio Unit.</Text>
            <Text style={s.c4}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={s.c1}>{item.quantity}</Text>
              <Text style={s.c2}>{item.product_name}</Text>
              <Text style={s.c3}>Q{Number(item.unit_price).toFixed(2)}</Text>
              <Text style={s.c4}>Q{(item.quantity * Number(item.unit_price)).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal:</Text>
            <Text style={s.totalValue}>Q{subtotal.toFixed(2)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>IVA (12%):</Text>
            <Text style={s.totalValue}>Q{iva.toFixed(2)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, s.bold]}>Total:</Text>
            <Text style={[s.totalValue, s.bold]}>Q{Number(data.total).toFixed(2)}</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text>Documento Tributario Electrónico — Simulación con fines educativos</Text>
          <Text>Régimen: General con IVA</Text>
        </View>
      </Page>
    </Document>
  );
}
