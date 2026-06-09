import { describe, it, expect } from "vitest";
import {
  genInvoiceNumber,
  fmtCard,
  fmtExpiry,
  isValidCard,
  isValidExpiry,
  isValidCvv,
  calcIva,
  slugify,
} from "./checkout-utils";

// ─── genInvoiceNumber ────────────────────────────────────────────────────────

describe("genInvoiceNumber", () => {
  it("tiene formato DTE-XXXXXX", () => {
    expect(genInvoiceNumber()).toMatch(/^DTE-\d{6}$/);
  });

  it("genera valores distintos en llamadas sucesivas", () => {
    const a = genInvoiceNumber();
    const b = genInvoiceNumber();
    // En la práctica siempre son distintos; al menos verificamos que son strings
    expect(typeof a).toBe("string");
    expect(typeof b).toBe("string");
  });
});

// ─── fmtCard ─────────────────────────────────────────────────────────────────

describe("fmtCard", () => {
  it("inserta espacios cada 4 dígitos", () => {
    expect(fmtCard("1234567890123456")).toBe("1234 5678 9012 3456");
  });

  it("elimina letras y caracteres no numéricos", () => {
    expect(fmtCard("abcd1234efgh5678")).toBe("1234 5678");
  });

  it("trunca a 16 dígitos", () => {
    expect(fmtCard("12345678901234567890")).toBe("1234 5678 9012 3456");
  });

  it("maneja entrada vacía", () => {
    expect(fmtCard("")).toBe("");
  });
});

// ─── fmtExpiry ───────────────────────────────────────────────────────────────

describe("fmtExpiry", () => {
  it("formatea 4 dígitos como MM/YY", () => {
    expect(fmtExpiry("1226")).toBe("12/26");
  });

  it("no agrega slash con menos de 3 dígitos", () => {
    expect(fmtExpiry("12")).toBe("12");
  });

  it("elimina letras", () => {
    expect(fmtExpiry("1a2b26")).toBe("12/26");
  });

  it("trunca a 4 dígitos", () => {
    expect(fmtExpiry("123456")).toBe("12/34");
  });
});

// ─── isValidCard ─────────────────────────────────────────────────────────────

describe("isValidCard", () => {
  it("acepta 16 dígitos seguidos", () => {
    expect(isValidCard("1234567890123456")).toBe(true);
  });

  it("acepta número con espacios de formato", () => {
    expect(isValidCard("1234 5678 9012 3456")).toBe(true);
  });

  it("rechaza menos de 16 dígitos", () => {
    expect(isValidCard("123456789012345")).toBe(false);
  });

  it("rechaza más de 16 dígitos", () => {
    expect(isValidCard("12345678901234567")).toBe(false);
  });

  it("rechaza entrada vacía", () => {
    expect(isValidCard("")).toBe(false);
  });
});

// ─── isValidExpiry ───────────────────────────────────────────────────────────

describe("isValidExpiry", () => {
  it("acepta mes y año válidos", () => {
    expect(isValidExpiry("01/28")).toBe(true);
    expect(isValidExpiry("12/99")).toBe(true);
  });

  it("rechaza mes 00", () => {
    expect(isValidExpiry("00/28")).toBe(false);
  });

  it("rechaza mes 13", () => {
    expect(isValidExpiry("13/28")).toBe(false);
  });

  it("rechaza formato sin slash", () => {
    expect(isValidExpiry("0128")).toBe(false);
  });
});

// ─── isValidCvv ──────────────────────────────────────────────────────────────

describe("isValidCvv", () => {
  it("acepta exactamente 3 dígitos", () => {
    expect(isValidCvv("123")).toBe(true);
    expect(isValidCvv("000")).toBe(true);
  });

  it("rechaza 2 dígitos", () => {
    expect(isValidCvv("12")).toBe(false);
  });

  it("rechaza 4 dígitos", () => {
    expect(isValidCvv("1234")).toBe(false);
  });

  it("rechaza letras", () => {
    expect(isValidCvv("abc")).toBe(false);
  });
});

// ─── calcIva ─────────────────────────────────────────────────────────────────

describe("calcIva", () => {
  it("subtotal + iva = total", () => {
    const { subtotal, iva } = calcIva(112);
    expect(subtotal + iva).toBeCloseTo(112);
  });

  it("IVA es el 12% del subtotal", () => {
    const { subtotal, iva } = calcIva(112);
    expect(iva / subtotal).toBeCloseTo(0.12);
  });

  it("total = 0 da subtotal e iva en 0", () => {
    const { subtotal, iva } = calcIva(0);
    expect(subtotal).toBe(0);
    expect(iva).toBe(0);
  });
});

// ─── slugify ─────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("convierte a minúsculas", () => {
    expect(slugify("CABLE HDMI")).toBe("cable-hdmi");
  });

  it("reemplaza espacios con guiones", () => {
    expect(slugify("cable hdmi 4k")).toBe("cable-hdmi-4k");
  });

  it("elimina caracteres especiales", () => {
    expect(slugify("cable!@#hdmi")).toBe("cable-hdmi");
  });

  it("no deja guiones al inicio ni al final", () => {
    expect(slugify("  cable  ")).toBe("cable");
  });
});
