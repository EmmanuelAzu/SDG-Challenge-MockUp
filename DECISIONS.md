# Decisions log
- GitHub repo is `emmanuelazu/sdg-challenge-mockup` (session scope), not `sisi`; Vercel project still `sisi-pps`.
- Tailwind v3 (not v4) for stable shadcn-style tokens via tailwind.config.
- Zod v4 installed (latest); use `z.string()` APIs compatible with both.
- No Supabase MCP/CLI/credentials available in the build sandbox: schema, RLS and seed are written as migrations + `pnpm seed`, to be applied once credentials exist.
- Pinned TypeScript 6 (Next 15 can't load TS 7; it also silently broke the @/ path alias).
- Pinned ESLint 8 (eslint-config-next 15 legacy config).
