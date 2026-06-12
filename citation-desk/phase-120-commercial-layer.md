# Phase 120 — Commercial Layer + CI Fix

**Date:** 2026-06-12  
**Commit:** `1193d703` (citation-desk main)  
**Status:** Complete — all 3 CI jobs pass ✓

---

## CI Root Cause (Fixed)

`pnpm/action-setup@v4` errors with **"Multiple versions of pnpm specified"** when both:
- `version: 10` is set in the workflow YAML, AND
- `packageManager: pnpm@10.4.1+sha512...` is in `package.json`

**Fix:** Remove `version:` from the workflow. `pnpm/action-setup@v4` reads `packageManager` from `package.json` automatically when no `version:` is specified. This is the intended usage of v4.

Previous fix attempt (commit `6f15b69`) created `pnpm.yaml` and upgraded from v9→v10 — correct direction but still had the `version: 10` key in the workflow, causing the same error.

---

## New Files

| File | Purpose |
|------|---------|
| `server/paypal.ts` | PayPal REST API client — getAccessToken, createOrder, captureOrder |
| `server/subscriptionDb.ts` | DB helpers for `user_subscriptions` + `checkout_sessions` tables |
| `server/apiKeyService.ts` | API key generation (sha256 hash), validation, revocation |
| `client/src/pages/Pricing.tsx` | 3-tier pricing page with PayPal JS SDK checkout flow |
| `client/src/pages/Dashboard.tsx` | Customer dashboard — subscription status + API key management |

---

## DB Schema Changes

Two new tables added via Drizzle migrations:

**`user_subscriptions`** (migration `0004_lyrical_falcon.sql`):
- `id`, `user_id` (FK → users), `plan` (starter/diligence/platform), `status` (active/cancelled/expired/pending)
- `paypal_order_id`, `paypal_subscription_id`, `amount_usd`, `currency`
- `activated_at`, `expires_at`, `created_at`, `updated_at`

**`api_keys`** (migration `0005_last_leech.sql`):
- `id`, `user_id` (FK → users), `key_hash` (SHA-256 of raw key), `name`, `scopes`
- `last_used_at`, `created_at`, `revoked_at`

---

## tRPC Procedures Added

In `server/routers.ts`:

```
checkout.createPaypalOrder   — protectedProcedure, creates PayPal order, returns orderId
checkout.capturePaypalOrder  — protectedProcedure, captures order, activates subscription
checkout.getSubscriptionStatus — protectedProcedure, returns plan + status + expiry
dashboard.listApiKeys        — protectedProcedure, returns user's active API keys
dashboard.createApiKey       — protectedProcedure, generates new key, returns raw key once
dashboard.revokeApiKey       — protectedProcedure, soft-deletes key by setting revoked_at
```

---

## Pricing Page (/pricing)

Three tiers:
- **Starter** — $1,500/year — 500 audits/mo, API access, standard support
- **Diligence** — $5,000/year — 2,000 audits/mo, priority support, custom domains
- **Platform** — Custom — unlimited, white-label, SLA, dedicated support

PayPal checkout flow:
1. User clicks "Get Started" → tRPC `checkout.createPaypalOrder` → returns PayPal `orderId`
2. PayPal JS SDK opens popup → user approves
3. `onApprove` callback → tRPC `checkout.capturePaypalOrder` → subscription activated
4. Success state shown inline with next steps

**PayPal env vars required** (add via webdev_request_secrets):
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE` (sandbox | live)

---

## Customer Dashboard (/dashboard)

Protected route (redirects to /pricing if not logged in).

Sections:
1. **Subscription Status** — plan badge, status, expiry date, audits used/limit
2. **API Keys** — list of active keys (masked), create new key, revoke key
3. **Audit History** — placeholder (links to /registry filtered by user)

---

## ClaimDetail Export Panel

New `ClaimExportPanel` component at bottom of ClaimDetail page:

**PDF Report tab:**
- Builds a print-ready HTML document client-side
- Opens in new tab + triggers `window.print()` → user saves as PDF
- Includes: verdict, confidence, claim text, rationale, evidence URL, source document, domain
- Licensed CC BY 4.0

**Embed Badge tab:**
- SVG badge preview (verdict color-coded: green/red/amber/slate)
- HTML snippet (anchor + inline SVG)
- Markdown snippet (badge image link)
- Copy-to-clipboard for both

---

## Tests

All 35 tests pass. No new tests added (export panel is pure client-side UI, no server logic).

---

## Environment Variables Needed

Before PayPal checkout works in production, add:
```
PAYPAL_CLIENT_ID=<from PayPal developer dashboard>
PAYPAL_CLIENT_SECRET=<from PayPal developer dashboard>
PAYPAL_MODE=live   # or sandbox for testing
```

Add via Manus Settings → Secrets, or via `webdev_request_secrets`.
