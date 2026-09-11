# Security Review Checklist

Use this checklist before staging or production deployment.

## Authentication and authorization

- [ ] Supabase Auth email verification is enabled for customer flows
- [ ] RLS is enabled on every user-facing table (`profiles`, `bookings`, `payments`, `housing_requests`, `audit_logs`, etc.)
- [ ] Integration tests pass: `pnpm test:integration`
- [ ] Admin routes are role-gated in the SPA and enforced again in Postgres (`is_admin()`)
- [ ] Host-only actions use `is_host_of_property` / `is_host_of_booking` helpers

## Payments

- [ ] Payment amounts always come from `booking_price_snapshots` on the server
- [ ] `confirm-payment` rejects amount mismatches and replays idempotently
- [ ] Toss webhook verification remains enabled in hosted environments
- [ ] `TOSS_SECRET_KEY` and service role keys are stored only in Supabase secrets / CI

## Data protection

- [ ] Channel.io `memberHash` is generated only in Edge Functions
- [ ] No secret keys (`CHANNEL_SECRET`, service role, Toss secret) are exposed via `VITE_*` env vars
- [ ] Audit logs capture admin publish/approve actions
- [ ] Uploaded images are restricted to allowed buckets and host-owned property paths

## Abuse prevention

- [ ] Booking quote/hold RPC rate limits are enabled (`assert_rate_limit`)
- [ ] Payment Edge Functions enforce per-IP rate limits
- [ ] Channel boot endpoint is rate limited

## Observability

- [ ] `VITE_SENTRY_DSN` configured for staging/production frontend
- [ ] `SENTRY_DSN` configured for Edge Functions when deployed
- [ ] Edge Functions emit structured JSON logs with booking/payment identifiers

## Operational readiness

- [ ] `supabase db reset` succeeds locally and in CI
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass
- [ ] Smoke test a full instant-book → checkout → confirm flow
- [ ] Smoke test host submit-for-review → admin publish flow
- [ ] `robots.txt` blocks private routes (`/admin`, `/host`, `/account`)
