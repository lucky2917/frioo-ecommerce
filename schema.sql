-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.coupons (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  discount_type text CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  value numeric NOT NULL,
  min_order_value numeric DEFAULT 0,
  description text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone DEFAULT (now() + '1 year'::interval),
  usage_limit integer DEFAULT NULL,
  used_count integer DEFAULT 0,
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
);
-- Migration required in Supabase:
-- ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_limit integer DEFAULT NULL;
-- ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count integer DEFAULT 0;
CREATE TABLE public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  total_amount numeric NOT NULL,
  items jsonb NOT NULL,
  status text DEFAULT 'Pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  address text,
  distance numeric,
  order_type text,
  discount_code text,
  coupon_code text,
  guest_id uuid,
  subtotal numeric,
  discount numeric DEFAULT 0,
  customer_lat double precision,
  customer_lng double precision,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.products (
  id bigint NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT ''::text,
  category text,
  price_cents integer NOT NULL,
  unit text DEFAULT 'piece'::text,
  stock integer DEFAULT 0,
  featured boolean DEFAULT false,
  nutrition jsonb DEFAULT '{}'::jsonb,
  images ARRAY DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone DEFAULT now(),
  video_url text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  phone_number text,
  address text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'customer'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);