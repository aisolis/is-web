import { slugify } from "./checkout-utils";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock: string;
  image_url: string;
  category_id: string;
};

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  slug: string;
  image_url: string | null;
  category_id: string | null;
};

export function validateProductForm(form: ProductForm): string | null {
  if (!form.name.trim()) return "El nombre del producto es requerido";
  if (!form.price || Number(form.price) <= 0) return "El precio debe ser mayor a 0";
  if (Number(form.stock) < 0) return "El stock no puede ser negativo";
  return null;
}

export function buildProductPayload(form: ProductForm): ProductPayload {
  return {
    name: form.name,
    description: form.description,
    price: Number(form.price),
    stock: Number(form.stock),
    slug: slugify(form.name),
    image_url: form.image_url || null,
    category_id: form.category_id || null,
  };
}

export function formatProductPrice(price: number): string {
  return `Q${price.toFixed(2)}`;
}
