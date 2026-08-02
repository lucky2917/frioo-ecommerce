# Frioo API — deployment

Backend runs as a single Vercel serverless function. `src/index.js` exports the
Express app and only calls `listen` when it is not running on Vercel.

## Domains

| Surface  | URL                     |
| -------- | ----------------------- |
| Frontend | https://frioo.in        |
| Admin    | https://admin.frioo.in  |
| API      | https://api.frioo.in    |

`https://frioo.in`, `https://www.frioo.in` and `https://admin.frioo.in` are the
only origins allowed in production. Localhost origins are allowed outside
production only. Add anything else through `EXTRA_ALLOWED_ORIGINS` rather than
editing the list.

## Environment variables

Required, the process exits without them:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended in production, warned at startup if missing:

- `SENTRY_DSN`
- `PRODUCTION_URL`

Optional:

- `LOG_LEVEL` (default `info`)
- `DB_TIMEOUT_MS` (default `8000`)
- `REQUEST_TIMEOUT_MS` (default `25000`, keep under the Vercel `maxDuration`)
- `EXTRA_ALLOWED_ORIGINS` (comma separated)
- `ENABLE_API_DOCS` (`true` re-enables Swagger in production)

The service role key must only ever be set on the backend project. It bypasses
RLS and must never reach the browser.

## Pre-deploy checklist

1. `npm ci` in `server/` and `client/`
2. Client builds with `VITE_API_URL=https://api.frioo.in`
3. Environment variables set on the Vercel backend project
4. Database migrations in `server/migrations/` applied in order
5. `NODE_ENV=production` (set in `vercel.json`)

## Post-deploy verification

```
curl -s https://api.frioo.in/health
curl -s https://api.frioo.in/health/ready
curl -sD- -o /dev/null -H "Origin: https://admin.frioo.in" https://api.frioo.in/api/products | grep -i access-control-allow-origin
curl -s -o /dev/null -w "%{http_code}\n" https://api.frioo.in/api-docs.json   # expect 404
curl -s -o /dev/null -w "%{http_code}\n" https://api.frioo.in/api/admin/system # expect 401
```

Expected: `/health` returns `status: ok` with live metrics, `/health/ready`
confirms the database, the admin origin is echoed back, Swagger is off and the
admin metrics endpoint refuses anonymous callers.

## Health endpoints

- `GET /health` — liveness, build info and request metrics
- `GET /health/ready` — pings the database, 503 when unreachable
- `GET /health/status` — build and metrics without the database call

All three sit above the rate limiter and the HTTPS redirect so uptime monitors
cannot exhaust the request budget or be redirected.

## Metrics

`GET /api/admin/system` (admin token) returns build info, process memory,
request counts, status classes, average and p95 response time, and the busiest
routes.

Counters live in the memory of the instance that serves the request. On
serverless that means they reset on a cold start and differ between concurrent
instances. They are a live sample of one instance, not lifetime totals. Use
Sentry for error history.

## Rate limits

| Scope                   | Limit            |
| ----------------------- | ---------------- |
| General `/api`          | 300 / 15 min     |
| `/api/admin`, `/api/upload` | 20 / 15 min, successful requests not counted |
| `/api/orders` POST      | 10 / 15 min      |
| `/api/coupons/validate` | 30 / 15 min      |
| `/health*`              | exempt           |

## Rollback

Vercel keeps previous deployments. Promote the last known good build from the
dashboard. Database migrations are additive and are not reverted by a rollback,
so a schema change needs its own down migration if it must be undone.
