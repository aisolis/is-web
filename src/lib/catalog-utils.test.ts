import { describe, it, expect } from "vitest";
import { validateCategoryName, buildCategoryPayload } from "./catalog-utils";

// ─── validateCategoryName ─────────────────────────────────────────────────────

describe("validateCategoryName", () => {
  it("acepta un nombre válido", () => {
    expect(validateCategoryName("Electrónica")).toBeNull();
  });

  it("rechaza nombre vacío", () => {
    expect(validateCategoryName("")).not.toBeNull();
  });

  it("rechaza nombre de solo espacios", () => {
    expect(validateCategoryName("   ")).not.toBeNull();
  });

  it("acepta nombre con espacios al inicio y al final (trimmed)", () => {
    expect(validateCategoryName("  Audio  ")).toBeNull();
  });
});

// ─── buildCategoryPayload ─────────────────────────────────────────────────────

describe("buildCategoryPayload", () => {
  it("genera slug en minúsculas con guiones", () => {
    const { slug } = buildCategoryPayload("Audio y Video");
    expect(slug).toBe("audio-y-video");
  });

  it("recorta espacios del nombre", () => {
    const { name } = buildCategoryPayload("  Laptops  ");
    expect(name).toBe("Laptops");
  });

  it("genera slug sin caracteres especiales", () => {
    const { slug } = buildCategoryPayload("Cámaras & Drones");
    expect(slug).toBe("camaras-drones");
  });

  it("nombre y slug son correctos para caso simple", () => {
    const payload = buildCategoryPayload("Smartphones");
    expect(payload).toEqual({ name: "Smartphones", slug: "smartphones" });
  });
});
