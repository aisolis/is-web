import { describe, it, expect } from "vitest";
import { validateProductForm, buildProductPayload, formatProductPrice } from "./products-utils";

type ProductForm = {
  name: string; description: string; price: string; stock: string; image_url: string; category_id: string;
};

const base: ProductForm = {
  name: "Cable HDMI 4K",
  description: "Cable de alta velocidad",
  price: "25.50",
  stock: "10",
  image_url: "https://example.com/img.jpg",
  category_id: "cat-uuid",
};

// ─── validateProductForm ──────────────────────────────────────────────────────

describe("validateProductForm", () => {
  it("retorna null para formulario válido", () => {
    expect(validateProductForm(base)).toBeNull();
  });

  it("rechaza nombre vacío", () => {
    expect(validateProductForm({ ...base, name: "" })).not.toBeNull();
  });

  it("rechaza nombre de solo espacios", () => {
    expect(validateProductForm({ ...base, name: "   " })).not.toBeNull();
  });

  it("rechaza precio vacío", () => {
    expect(validateProductForm({ ...base, price: "" })).not.toBeNull();
  });

  it("rechaza precio cero", () => {
    expect(validateProductForm({ ...base, price: "0" })).not.toBeNull();
  });

  it("rechaza precio negativo", () => {
    expect(validateProductForm({ ...base, price: "-5" })).not.toBeNull();
  });

  it("acepta stock en cero (producto agotado)", () => {
    expect(validateProductForm({ ...base, stock: "0" })).toBeNull();
  });

  it("rechaza stock negativo", () => {
    expect(validateProductForm({ ...base, stock: "-1" })).not.toBeNull();
  });

  it("acepta formulario sin imagen y sin categoría", () => {
    expect(validateProductForm({ ...base, image_url: "", category_id: "" })).toBeNull();
  });
});

// ─── buildProductPayload ──────────────────────────────────────────────────────

describe("buildProductPayload", () => {
  it("convierte price a número", () => {
    const { price } = buildProductPayload(base);
    expect(price).toBe(25.5);
  });

  it("convierte stock a número entero", () => {
    const { stock } = buildProductPayload(base);
    expect(stock).toBe(10);
  });

  it("genera slug desde el nombre", () => {
    const { slug } = buildProductPayload(base);
    expect(slug).toBe("cable-hdmi-4k");
  });

  it("slug maneja acentos y mayúsculas", () => {
    const { slug } = buildProductPayload({ ...base, name: "Móvil Óptico Ñoño" });
    expect(slug).toBe("movil-optico-nono");
  });

  it("image_url null cuando viene vacío", () => {
    const { image_url } = buildProductPayload({ ...base, image_url: "" });
    expect(image_url).toBeNull();
  });

  it("category_id null cuando viene vacío", () => {
    const { category_id } = buildProductPayload({ ...base, category_id: "" });
    expect(category_id).toBeNull();
  });

  it("preserva name y description", () => {
    const payload = buildProductPayload(base);
    expect(payload.name).toBe("Cable HDMI 4K");
    expect(payload.description).toBe("Cable de alta velocidad");
  });
});

// ─── formatProductPrice ───────────────────────────────────────────────────────

describe("formatProductPrice", () => {
  it("formatea con 2 decimales", () => {
    expect(formatProductPrice(25.5)).toBe("Q25.50");
  });

  it("formatea precio sin decimales", () => {
    expect(formatProductPrice(100)).toBe("Q100.00");
  });

  it("formatea precio con más de 2 decimales (trunca a 2)", () => {
    expect(formatProductPrice(9.999)).toBe("Q10.00");
  });

  it("formatea precio cero", () => {
    expect(formatProductPrice(0)).toBe("Q0.00");
  });
});
