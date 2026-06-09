-- orders: FEL columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS nit text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fiscal_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_auth uuid;

-- profiles: email + soft-delete flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Trigger: copy email from auth.users into profiles on new signup
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET email = new.email WHERE id = new.id;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email ON auth.users;
CREATE TRIGGER on_auth_user_email
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();

-- Backfill emails for existing users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- RPC: atomic checkout
CREATE OR REPLACE FUNCTION public.checkout_order(
  p_user_id         uuid,
  p_items           jsonb,
  p_total           numeric,
  p_shipping_address text,
  p_nit             text,
  p_fiscal_name     text,
  p_invoice_number  text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item         jsonb;
  v_stock        int;
  v_product_name text;
  v_order_id     uuid;
  v_auth         uuid := gen_random_uuid();
BEGIN
  -- 1. Stock check
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT stock, name
      INTO v_stock, v_product_name
      FROM public.products
     WHERE id = (v_item->>'product_id')::uuid;

    IF v_stock < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Sin stock: %', v_product_name;
    END IF;
  END LOOP;

  -- 2. Create order
  INSERT INTO public.orders
    (user_id, total, shipping_address, status,
     nit, fiscal_name, invoice_number, invoice_auth)
  VALUES
    (p_user_id, p_total, p_shipping_address, 'paid',
     p_nit, p_fiscal_name, p_invoice_number, v_auth)
  RETURNING id INTO v_order_id;

  -- 3. Insert line items
  INSERT INTO public.order_items
    (order_id, product_id, product_name, unit_price, quantity)
  SELECT
    v_order_id,
    (item->>'product_id')::uuid,
    item->>'product_name',
    (item->>'unit_price')::numeric,
    (item->>'quantity')::int
  FROM jsonb_array_elements(p_items) AS item;

  -- 4. Decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    UPDATE public.products
       SET stock = stock - (v_item->>'quantity')::int
     WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

  -- 5. Clear cart
  DELETE FROM public.cart_items WHERE user_id = p_user_id;

  RETURN v_order_id;
END;
$$;
