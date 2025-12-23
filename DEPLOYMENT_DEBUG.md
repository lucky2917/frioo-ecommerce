# 🔍 Vercel Deployment Debugging Guide

## Quick Diagnosis

Run these tests IN ORDER:

### Test 1: Backend Health
```bash
curl https://frioo-backend.vercel.app/health
```
**Expected:** `{"status":"ok"...}`  
**If fails:** Backend deployment issue

### Test 2: Backend Can Fetch Products
```bash
curl https://frioo-backend.vercel.app/api/products
```
**Expected:** JSON array with products  
**If empty `[]`:** Database connection issue  
**If error:** Check Vercel backend logs

### Test 3: Frontend Env Var
Open browser console on https://frioo-shop.vercel.app:
```javascript
console.log(import.meta.env.VITE_API_URL)
```
**Expected:** `"https://frioo-backend.vercel.app"`  
**If undefined:** Environment variable not set

### Test 4: Frontend Network Request
1. Open https://frioo-shop.vercel.app
2. F12 → Network tab
3. Refresh page
4. Find `/api/products` request
5. Check URL and response

---

## Common Issues & Fixes

### Issue 1: Empty Array `[]` from Backend

**Cause:** Supabase credentials not set in Vercel

**Fix:**
```
1. Go to Vercel frioo-backend project
2. Settings → Environment Variables
3. Add:
   SUPABASE_URL=https://qxeoywdfozfwoaksyfyh.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your key)
   NODE_ENV=production
   PRODUCTION_URL=https://frioo-shop.vercel.app

4. Redeploy:
   Deployments → Latest → Redeploy
```

### Issue 2: CORS Error

**Cause:** Backend doesn't allow frontend domain

**Fix:**
```
In Vercel frioo-backend:
- Add env var: PRODUCTION_URL=https://frioo-shop.vercel.app
- Redeploy
```

### Issue 3: Frontend Shows Error

**Cause:** VITE_API_URL not set

**Fix:**
```
1. Go to Vercel frioo-shop project
2. Settings → Environment Variables
3. Add: VITE_API_URL=https://frioo-backend.vercel.app
4. ✅ Check ALL boxes: Production, Preview, Development
5. Deployments → Redeploy
```

### Issue 4: Calls Wrong URL

**Symptom:** Frontend calls `https://frioo-shop.vercel.app/api/products`

**Fix:**
```bash
# Your constants.js is correct, just need env var set
# After setting VITE_API_URL, do:
git commit --allow-empty -m "Trigger rebuild"
git push
```

---

## Vercel Environment Variable Checklist

### Backend (frioo-backend)
- [ ] NODE_ENV=production
- [ ] PORT=4000
- [ ] SUPABASE_URL=https://qxeoywdfozfwoaksyfyh.supabase.co
- [ ] SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
- [ ] PRODUCTION_URL=https://frioo-shop.vercel.app

### Frontend (frioo-shop)
- [ ] VITE_SUPABASE_URL=https://qxeoywdfozfwoaksyfyh.supabase.co
- [ ] VITE_SUPABASE_ANON_KEY=eyJhbGc...
- [ ] VITE_API_URL=https://frioo-backend.vercel.app

**CRITICAL:** Each variable must have ALL 3 boxes checked:
- ☑ Production
- ☑ Preview
- ☑ Development

---

## Step-by-Step Fix Process

1. **Verify Backend Env Vars**
   ```
   Vercel → frioo-backend → Settings → Environment Variables
   Check all 5 variables exist
   ```

2. **Test Backend Directly**
   ```bash
   curl https://frioo-backend.vercel.app/api/products
   ```
   Should return 73 products

3. **Verify Frontend Env Vars**
   ```
   Vercel → frioo-shop → Settings → Environment Variables
   Check VITE_API_URL exists and ALL boxes checked
   ```

4. **Force Rebuild Both**
   ```bash
   git commit --allow-empty -m "Force rebuild for env vars"
   git push
   ```

5. **Clear Browser Cache**
   ```
   Ctrl+Shift+Delete → Clear cache
   Hard refresh: Ctrl+Shift+R
   ```

6. **Test Frontend**
   ```
   Visit: https://frioo-shop.vercel.app
   Should see products
   ```

---

## Get Deployment Logs

If still not working:

### Backend Logs
```
1. Vercel → frioo-backend → Deployments
2. Click latest deployment
3. Click "View Function Logs"
4. Look for errors
```

### Frontend Logs
```
1. Vercel → frioo-shop → Deployments
2. Click latest deployment  
3. Click "Build Logs"
4. Search for: VITE_API_URL
   Should see: VITE_API_URL=https://frioo-backend.vercel.app
```

---

## Manual Test Script

Save as `test-deployment.sh`:
```bash
#!/bin/bash
echo "Testing Frioo Deployment..."

echo "\n1. Backend Health:"
curl -s https://frioo-backend.vercel.app/health | jq

echo "\n2. Backend Products:"
curl -s https://frioo-backend.vercel.app/api/products | jq 'length'

echo "\n3. Frontend (manual check):"
echo "Open browser console on https://frioo-shop.vercel.app"
echo "Run: console.log(import.meta.env.VITE_API_URL)"
```

Run: `chmod +x test-deployment.sh && ./test-deployment.sh`
