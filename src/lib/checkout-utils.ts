export function genInvoiceNumber(): string {
  return `DTE-${String(Date.now()).slice(-6).padStart(6, "0")}`;
}

export function fmtCard(v: string): string {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function fmtExpiry(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function isValidCard(v: string): boolean {
  return /^\d{16}$/.test(v.replace(/\s/g, ""));
}

export function isValidExpiry(v: string): boolean {
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(v);
}

export function isValidCvv(v: string): boolean {
  return /^\d{3}$/.test(v);
}

export function calcIva(total: number): { subtotal: number; iva: number } {
  const subtotal = total / 1.12;
  return { subtotal, iva: total - subtotal };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
