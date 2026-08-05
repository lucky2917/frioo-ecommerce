# Migrations

Applied in order. Every file here has been run against production.

| File | Purpose |
|---|---|
| 001-007 | Orders, stock, profiles, RLS lockdown, store settings, notifications |
| 008_order_nutrition | Per-order nutrition snapshot |
| 009_order_payment_foundation | Integer paise on orders, channel, order_payments tender log |
| 010_credit_core_schema | Credit plans, accounts, lots, ledger, allocations |
| 011_credit_rpc_core | Activation, grant, order debit, account status |
| 012_credit_rpc_lifecycle | Refund, adjust, extend, reverse, expiry, reconcile |
| 013_credit_read_access_hardening | Revoke anon execute, caller checks on read functions |

## Rules for the credit system

The ledger is append only. Triggers block UPDATE and DELETE on `credit_ledger`
and `order_payments`. Corrections are new reversing entries, never edits.

No application code writes to a credit table directly. Every mutation goes
through a `SECURITY DEFINER` function granted to `service_role` only.
`credit_available_paise` and `credit_account_summary` are the only functions
`authenticated` may call, and both check the caller is the owner or an admin.

Spendable balance is derived from unexpired lots, not read from a column, so
expiry is correct the instant it happens and never depends on a scheduled job
having run. `credit_expire_due_lots` materialises EXPIRY entries for reporting.

Lot consumption order is deterministic: earliest expiry, then oldest issue,
then smallest remaining, then lowest id.

`credit_reconcile()` returns any account where the cached balance, the ledger
sum, and the lot remaining sum disagree. It should always return zero rows.
