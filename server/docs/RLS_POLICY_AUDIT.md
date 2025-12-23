# Supabase RLS Policy Audit & Documentation

**Date:** December 21, 2025  
**Objective:** Ensure all database tables have Row Level Security enabled with appropriate policies

---

## Database Schema Overview

Based on the codebase, Frioo uses the following Supabase tables:

### Core Tables
1. **`products`** - Product catalog
2. **`orders`** - Customer orders
3. **`coupons`** - Discount coupons
4. **`profiles`** - User profile data (extends Supabase auth.users)
5. **`users`** (auth.users) - Supabase authentication

---

## RLS Policy Audit Checklist

### ✅ Required for Production

#### 1. Products Table (`products`)
- [ ] **RLS Enabled:** `ALTER TABLE products ENABLE ROW LEVEL SECURITY;`
- [ ] **Anonymous/Public Read:** All users can view products
  ```sql
  CREATE POLICY "Public products are viewable by everyone"
  ON products FOR SELECT
  USING (true);
  ```
- [ ] **Admin-Only Write:** Only admins can insert/update/delete
  ```sql
  CREATE POLICY "Only admins can insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
  
  CREATE POLICY "Only admins can update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
  
  CREATE POLICY "Only admins can delete products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
  ```

---

#### 2. Orders Table (`orders`)
- [ ] **RLS Enabled:** `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;`
- [ ] **User Can View Own Orders:**
  ```sql
  CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);
  ```
- [ ] **User Can Insert Own Orders:**
  ```sql
  CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  ```
- [ ] **Admin Can View All Orders:**
  ```sql
  CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
  ```
- [ ] **Admin Can Update Orders (status changes):**
  ```sql
  CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
  ```

---

#### 3. Coupons Table (`coupons`)
- [ ] **RLS Enabled:** `ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;`
- [ ] **Public Read (for validation):**
  ```sql
  CREATE POLICY "Coupons are viewable by everyone for validation"
  ON coupons FOR SELECT
  USING (true);
  ```
- [ ] **Admin-Only Write:**
  ```sql
  CREATE POLICY "Only admins can manage coupons"
  ON coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
  ```

---

#### 4. Profiles Table (`profiles`)
- [ ] **RLS Enabled:** `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`
- [ ] **User Can View Own Profile:**
  ```sql
  CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
  ```
- [ ] **User Can Update Own Profile:**
  ```sql
  CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
  ```
- [ ] **User Can Insert Own Profile (on signup):**
  ```sql
  CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
  ```
- [ ] **Admin Can View All Profiles:**
  ```sql
  CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
  ```

---

## Security Best Practices

### ✅ Implemented via Server (Service Role Key)
Our server uses `SUPABASE_SERVICE_ROLE_KEY` which **bypasses RLS**. This is acceptable for:
- Admin operations (already protected by `requireAdmin` middleware)
- Server-side order placement (validated before insertion)
- Product management (admin-only routes)

### ⚠️ Critical: Enable RLS on All Tables
Even though server bypasses RLS, **client-side queries use anon key** and respect RLS. This prevents:
- Users viewing other users' orders
- Unauthorized product modifications
- Profile data leaks

---

## Admin Role Detection

Current implementation uses `raw_user_meta_data->>'role' = 'admin'` for admin checks.

### Alternative: Dedicated Admin Table
For better security, consider:
```sql
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Then use:
CREATE POLICY "Only admins..."
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
```

---

## Testing RLS Policies

### Test as Anonymous User
```sql
SET ROLE anon;
SELECT * FROM products; -- Should work
SELECT * FROM orders; -- Should fail (no auth.uid())
RESET ROLE;
```

### Test as Authenticated User
```sql
SET request.jwt.claims.sub = '<user-uuid>';
SELECT * FROM orders WHERE user_id = '<user-uuid>'; -- Should work
SELECT * FROM orders WHERE user_id != '<user-uuid>'; -- Should fail
RESET ROLE;
```

---

## Action Items

1. **Verify RLS is enabled on all tables:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **List all current policies:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

3. **Apply missing policies** - Execute SQL statements above for each table

4. **Test with anon key** - Use Supabase client with anon key to verify access control

---

## Google-Level Security Standards

✅ **Principle of Least Privilege** - Users see only their data  
✅ **Defense in Depth** - Server middleware + RLS  
✅ **Zero Trust** - Verify every request  
⚠️ **Audit Trail** - Consider adding `updated_by` columns

---

**Status:** Audit documented - **requires Supabase dashboard access to verify and implement**

**Next Steps:**
1. Access Supabase dashboard
2. Check RLS status for each table
3. Apply missing policies
4. Test with both anon and service role keys
