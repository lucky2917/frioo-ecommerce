-- ================================================================
-- FRIOO - DATABASE PERFORMANCE INDEXES
-- ================================================================
-- Run this SQL in Supabase SQL Editor to optimize query performance
-- These indexes speed up frequently queried columns
-- ================================================================

-- ===== ORDERS TABLE INDEXES =====
-- Speed up user's order history queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id 
  ON orders(user_id);

-- Speed up order status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders(status);

-- Speed up order sorting by date (most common query)
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON orders(created_at DESC);

-- Composite index for user + status queries
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
  ON orders(user_id, status);

-- ===== PRODUCTS TABLE INDEXES =====
-- Speed up category browsing
CREATE INDEX IF NOT EXISTS idx_products_category 
  ON products(category);

-- Speed up featured products query
CREATE INDEX IF NOT EXISTS idx_products_featured 
  ON products(featured) 
  WHERE featured = true;

-- Speed up product search by title
CREATE INDEX IF NOT EXISTS idx_products_title 
  ON products USING gin(to_tsvector('english', title));

-- ===== COUPONS TABLE INDEXES =====
-- Speed up coupon code lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code 
  ON coupons(code);

-- Speed up active coupons query
CREATE INDEX IF NOT EXISTS idx_coupons_active 
  ON coupons(is_active) 
  WHERE is_active = true;

-- Speed up expiry checks
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at 
  ON coupons(expires_at) 
  WHERE expires_at IS NOT NULL;

-- ===== PROFILES TABLE INDEXES =====
-- Speed up user lookups by email
CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON profiles(email);

-- Speed up admin user queries
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles(role);

-- ================================================================
-- VERIFICATION QUERY
-- ================================================================
-- Run this to see all indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'products', 'orders', 'coupons')
ORDER BY tablename, indexname;

-- ================================================================
-- PERFORMANCE NOTES
-- ================================================================
-- 1. Indexes speed up SELECT queries but slow down INSERT/UPDATE
-- 2. Only index columns used in WHERE, ORDER BY, or JOIN clauses
-- 3. Monitor query performance with EXPLAIN ANALYZE
-- 4. These indexes benefit queries with 1000+ rows
-- 5. Supabase automatically creates indexes on primary keys
-- ================================================================
