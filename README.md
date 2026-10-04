# Sisi — money confidence, together (mock)

Clickable mock of the Sisi beta for the PPS Investments SDG Challenge. **No backend, no database, no env vars.** Everything runs in the browser and is stored in `localStorage`. Plan: [`docs/PLAN.md`](docs/PLAN.md).

## Run
```
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # engine unit tests
pnpm build
```

## Try it
- `/demo` — one tap into a persona: **Nomsa** (mid-journey), **New member** (live onboarding), **Thandi** (facilitator), **Admin**. Password for all: `SisiDemo2026!`.
- Open a second tab and pick a different persona: each tab is a different person on the same shared mock world.
- Bottom-left flask button = **Demo tools**: switch persona, move the demo clock (+1 day, +1 week, next 1st), reset the world.
- Share links are stateless (the card lives in the URL), so `/b/<code>` works on any device.

## Deploy (Vercel)
Import the GitHub repo at vercel.com/new. Framework is auto-detected; there is nothing to configure.

## Layout
`app/` pages · `components/` UI · `content/`-style data in `lib/content/` · `lib/world/` store, seed, hooks · `lib/engine/` pure rules (points, levels, weekly target, badges, journey) · `tests/`.
