# Frioo Redesign — Backend & Data Dependencies

Design System / Constitution features that **cannot yet be realized** because the frozen backend does not provide the data. Per the Constitution ("Prove, never promise") these are **omitted, never fabricated**. The UI is built so each row appears automatically once its data exists.

Documentation only. No backend work is implied or scheduled here.

## Missing product data

| Feature (DS / Constitution) | Needs | Current state | UI behaviour today |
|---|---|---|---|
| **Freshness proof row** ("Sourced this morning · best within 3 days") | `products.sourced_at` (or a per-batch source date) | No field. `created_at` is the DB row date, not a sourcing date. | Row omitted. |
| **Provenance line** ("From Anitha's farm, 40 km away") | `products.origin` / farm reference | No field. | Row omitted. |
| **Behavioral proof** ("Reordered by 340 families this month") | order aggregates per product | No field / no endpoint. | Omitted. Replaces star ratings — so cards currently show **no** social proof. |
| **Honest stock state** ("In stock" / "Last few" / "Back tomorrow") | reliable `products.stock` | Field exists but is **null** in practice. | No stock claim is shown (the old hardcoded "In stock" was removed as it was unbacked). |
| **Per-100g on non-kg units** | canonical weight per unit | Only `unit` (`kg` / `item`) + unit price. | Per-100g shown **only** for `unit === 'kg'` (honestly derivable: price ÷ 10). Other units show the unit price + unit label only. |
| **Piece count** ("~4 pcs") | weight-per-piece | No field. | Omitted from the measure line. |

## Frozen-engineering dependencies

| Feature (DS) | Needs | Why blocked |
|---|---|---|
| **In-place quantity stepper on the product card** | `makeCartKey` (or a per-product quantity lookup) exposed from `CartContext` | `makeCartKey` is internal to the frozen `CartContext` and not exported; the card cannot reliably find its own line item to render +/- without duplicating cart-key logic. The card keeps the existing Add / "Choose options" → `addToCart` flow instead. |
| **Inline weight pills on the card** (vs. the options sheet) | — (presentation refinement) | Deferred to keep the existing add flow intact; the same shared card gains inline pills when Shop / Product Details are redesigned. Not a separate card. |

## Placeholder content (swap-only)

Not backend, but flagged so replacement is trivial. Each is a single asset reference — replacing the asset is the only change needed.

| Placeholder | Location | Replace with |
|---|---|---|
| Hero image | `Home.jsx` → `HERO_IMAGE` constant | Final Frioo-light hero produce photograph (change the one constant). |
| Category images | `Home.jsx` → `CATEGORIES[].img` | Frioo-light category photography. |
| Card no-image fallback | `ProductCard.jsx` → `FALLBACK_IMAGE` | A branded local paper placeholder asset. |

## Claims policy (Constitution "prove, never promise")

Only statements already established and operationally true in the app are shown on Home:
- Delivery coverage: **"across Vizag, within 6 km"** (also in the nav context strip and welcome dialog).
- Delivery estimate: **"made the same day"** (existing coupon/footer copy).

No new factual claims (e.g. "sourced daily") were introduced.

## Shop — sort options

Sort labels must describe the actual logic (Constitution "prove, never promise"). Two capabilities are **omitted** rather than faked:

| Sort | Needs | Status |
|---|---|---|
| **"Best selling"** | order-volume aggregates per product | No data — **not offered**. The default order is labelled "Featured", not a sales claim. |
| **"Newest"** | sort by `created_at` | `created_at` exists, but adding the sort would modify the frozen `processedProducts` logic — **not offered** for now. Can be added honestly if that logic is later unfrozen. |

Offered sorts (all backed by existing logic): Featured (default order), Price: Low → High, Price: High → Low, A → Z (title).

## Product Details — sparse fields

| Field | State | UI behaviour |
|---|---|---|
| **`nutrition` (calories/protein/carbs/fat)** | Frequently all-zero / unfilled | The Nutrition section shows **only** values that are meaningfully present; if every value is absent/zero, the **whole section is omitted**. No invented defaults (the old `\|\| 120`, `\|\| '2g'`, `\|\| '15g'` fallbacks were removed). |
| **`perfect_for`** | Often null | Shown when present; **omitted** when missing (the old "Any time of day snack or boost." fallback was removed). |

Empty space is preferred over invented content.
