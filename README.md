# Sisi — money confidence, together

Beta web app for the PPS Investments SDG Challenge. Next.js 15 · Supabase · Vercel (lhr1).

## Setup
1. `pnpm install`
2. Create a Supabase project `sisi-pps` (eu-west-2) and turn **Confirm email off**; leave only the Email provider on.
3. Apply `supabase/migrations/*.sql` in order (SQL editor or `supabase db push`).
4. Copy `.env.example` to `.env.local` and fill in the Supabase keys, `CRON_SECRET` and VAPID keys (`npx web-push generate-vapid-keys`).
5. `pnpm seed` (idempotent; creates demo users, communities, Circles, chat, content, Campus Cup season).
6. `pnpm dev`

## Demo logins (`/demo`, when `NEXT_PUBLIC_DEMO_MODE=true`)
Password for all: `SisiDemo2026!` — `nomsa@`, `new@`, `thandi@`, `admin@` `demo.sisi.app`.

## Checks
`pnpm lint` · `pnpm exec tsc --noEmit` · `pnpm test` · `pnpm build`

## Status
See `DECISIONS.md` for judgement calls.
