import { slugify } from "./checkout-utils";

export function validateCategoryName(name: string): string | null {
  if (!name.trim()) return "El nombre de la categoría es requerido";
  return null;
}

export function buildCategoryPayload(name: string): { name: string; slug: string } {
  const trimmed = name.trim();
  return { name: trimmed, slug: slugify(trimmed) };
}
