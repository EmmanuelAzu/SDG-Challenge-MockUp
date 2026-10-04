# Decisions log

**Pivot (Oct 4):** the Supabase/Vercel-backend build was dropped in favour of a fully client-side mock (see docs/PLAN.md). The entries below about Supabase, migrations, seeding and cron describe the abandoned approach and are kept for history.

## Mock build
- World = one JSON document in `localStorage` (`sisi.world.v1`), changed only through `update()`; session id per tab in `sessionStorage`; cross-tab sync via the `storage` event.
- Demo clock = real time + a stored offset; every engine function takes `now` so time-dependent rules are testable.
- Share links are stateless (payload in the URL). Revoking a link is local-only: a mock limit.
- OG share-card routes use the Node runtime and read fonts from `assets/fonts` (file URL fetch is unsupported by `next start`'s edge sandbox); `outputFileTracingIncludes` ships the fonts.
- satori (OG images) only allows intrinsic elements inside `<svg>` and requires `display:flex` on divs with several children, so `BadgeArt` calls emblem functions directly and card text is built as single strings.
- Passwords are stored in plain text in the browser (mock only, never for real data).

- GitHub repo is `emmanuelazu/sdg-challenge-mockup` (session scope), not `sisi`; Vercel project still `sisi-pps`.
- Tailwind v3 (not v4) for stable shadcn-style tokens via tailwind.config.
- Zod v4 installed (latest); use `z.string()` APIs compatible with both.
- No Supabase MCP/CLI/credentials available in the build sandbox: schema, RLS and seed are written as migrations + `pnpm seed`, to be applied once credentials exist.
- Pinned TypeScript 6 (Next 15 can't load TS 7; it also silently broke the @/ path alias).
- Pinned ESLint 8 (eslint-config-next 15 legacy config).
- lucide-react no longer ships brand icons; share sheet uses generic icons (Camera/Briefcase/Share2).
- `no-explicit-any` is off until `lib/database.types.ts` can be generated from a live Supabase project; Supabase rows are untyped meanwhile.
- Quiz answers (correct_index) are readable by the client for instant feedback; grading and points are re-checked server-side.
- Phase 2 ships 5 milestone courses / 10 lessons; the remaining courses (TFSA deep-dive, student-to-professional, O-Week Starter, etc.) land in Phase 3/4.
- savings-streak badge = actions in 4 different ISO weeks (no separate 'saving' action type exists yet).
- SQL verified against a local Postgres 16 with a stubbed auth schema (booking/waitlist, leaderboards, RLS smoke tests) because no Supabase project is available.
- Spec v2 applied: weekly-target streaks (computed from effort days in `point_events`, no `streaks` table), levels from `profiles.xp` (kept by a DB trigger), no points for sharing, Focus mode (profile flag + `sisi_focus` cookie so client-side celebrations can honour it), 22 badges, single daily cron `/api/cron/daily`.
- Weekly target uses the user's *current* target for the whole 12-week history (targets are not versioned).
- An "active day" = a SAST day with any effort point event except weekly_target, onboarding and feedback. Re-opening a finished lesson earns nothing, so it does not count as an active day.
- Life Track is assigned by explicit rules in `lib/content/life-tracks.ts` (unit-tested); the user can change it in Profile.
- Glossary terms are marked `[[term]]` automatically when seeding (first occurrence per card) rather than hand-tagged.
- Lesson sources use publisher home pages only (SARS, FSCA, Treasury, NCR, Labour, Banking Association) since deep links could not be verified here. No reviews are seeded: every lesson shows "Review pending".
- Feedback points: 5 per rating or topic suggestion, at most 5 awards in any rolling 7 days.
- Circle Cup / Campus Cup winners are chosen by `lib/jobs/winners.ts`; the 0-point `circle_cup` / `campus_cup` flag events drive the badge rules.
- Courses: 5 courses / 10 lessons seeded so far (spec target is 11 courses / 30 lessons plus 6 reels); the rest is Phase 3/4 content work.
- `SISI_PREVIEW=1 pnpm dev` swaps Supabase for an in-memory fixture backend (lib/preview/*) so every screen can be reviewed without a project. Dev-only: disabled when NODE_ENV=production.
- Community build: 12 seeded communities (campus, workplace, interest) with tags; search is client-side over name, description, tags and kind; "Suggested for you" scores tag overlap with the user's Life Track and goals plus peers from shared communities.
- Approval-only communities (PPS Young Professionals, Debt-Free Starters) show "Request pending"; staff approve or decline in the community's Manage tab.
- Chat is real in the UI; other members are simulated (`lib/sim/chat.ts`): 1–2 keyword-aware replies per message, typing indicator, occasional reactions. Two tabs on different personas get genuine cross-tab chat.
- Shared milestones = the community Feed. Auto-posts are created only when the author opted in (`shareMilestones`); never amounts. The friends-only Letterbox will reuse the same posts later.
- The demo clock advances day by day (`advanceClock`): simulated members earn points and chat, the daily job runs each day (reminders, Circle Cup on the 1st, Campus Cup at season end).
- Seeded sessions are relative to "now"; "today's" session may already be underway when the world is created.
- Unread counts: before first opening a chat only messages since joining count; all personas start caught up.
- Money tools: budget, goals and Invest HER state live in the world but are only ever read for the signed-in user; analytics events for them carry no amounts (unit-tested).
- Saving a budget completes the `budget-50-30-20` lesson action (+15, once), which is what completes the First budget milestone and earns Budget Builder.
- Goal Getter = a 0-point `goal_reached` flag event, like the other badge flags. Reaching a goal never earns points.
- Invest HER completes when: readiness answered, all 3 explainers opened, the simulator saved, and at least 3 of 4 checklist items ticked. The readiness check is a guide with friendly tips, never advice, and stores no amounts.
- Compound maths: monthly compounding, contributions at month end (R200/month, 10 years, 8% = R36,589). Template incomes in the budget builder are examples only.

## Payslip simulator, Money Buddy, rewards
- Tax figures live in `config/tax-za.ts` and are marked `verified: false`; the UI shows "Illustrative figures" until someone confirms them against SARS.
- Money Buddy: invite links are stateless-per-browser (the mock world is shared across tabs of one browser), so a "second device" is a second tab signed in as another demo persona. A practice (simulated) buddy is available and always labelled; it answers a nudge after ~2.5s and ticks off one item.
- Buddy invite hand-off uses a `next` query param stashed in sessionStorage so sign-up/onboarding returns to the invite page.
- Rewards: claims are reviewed only by `pps_admin`; facilitators see the console but not claims. Approving or paying moves no money. Weekly-draw winners are deterministic per set of entrants. All reward UI carries "Pilot reward — subject to PPS approval."

## Talk to someone, Support, FAQ
- Help pages live outside the app shell (`/help/*`) so Support works signed-out and carries no nav. Support is entered with `replace` links, has a sticky Quick exit (also Esc twice) that `location.replace`s to a neutral site, and page-view analytics are dropped on that route via `SafeAnalytics`.
- Safety numbers are well-known South African lines but ship **unverified** (visible flag) until a PPS admin ticks "verified" in `/admin/safety`. I could not verify them from here; please check each before any real use.
- Added a demo persona "Ayanda" (role `professional`) who answers help requests; PPS admins can too. Max 3 open requests, 48 h target shown, general-education notice on every answer.
- FAQ is `lib/content/faq.ts` (searchable accordion); figures in it match the spec's points table only. WORLD_VERSION is now 5 (stored demo data resets once).

## Letterbox, O-Week and the QR poster
- Letterbox friends: request by nickname/first name (2+ letters, members only) or by invite link/QR (`/friends/[code]`, the link is the inviter's consent so it befriends immediately). Simulated members accept straight away; Nomsa is seeded with five friends and one pending request. Friends' wins are existing milestone posts (only exist if the author opted in), shown with the same 💗👏🔥🌱 reactions and notes (presets or ≤140 chars, profanity-masked). Blocking also removes the friendship. There is no separate "report a post" flow yet (reports are message-based); block is the safety valve for now.
- Simulated friends react to a person's new posts during the daily job.
- O-Week Starter is a real 3-lesson course (`oweek-starter`: first-month plan, scam-smart, student accounts) with no statistics. Finishing all three records a 0-point `oweek_done` flag that drives the badge. `/join/[slug]` is the O-Week landing for campus communities (auto-joins after sign-up through the existing `community` param).
- QR poster: `/admin/poster` renders an A4 (1240×1754, 150 dpi) PNG in the browser using the current site origin, so download it from the deployed site for a correct link. `public/qr/wits.png` is a static QR for `https://sdg-challenge-mock-up.vercel.app/join/wits`; regenerate it if the domain changes. WORLD_VERSION is now 6.

## Pilot (10-minute test, evidence plan)
- Built from the three PPS Money Matters PDFs. Full plan, instruments, decision rules, logistics and a log of errors found in the source material are in `docs/PILOT.md`. Errors fixed in-app: payslip net (R9,819.25, not R10,319.25), Sipho's compounding figure (about R295,000, not R349,101), "R60k more" (R120,000), "5×" (about 6×). No TFSA limits are quoted until PPS checks SARS.
- Knowledge change is measured with six concepts × two parallel forms, counterbalanced by participant, with "I'm not sure". Task success is observed from real actions. Results travel as an anonymous code the facilitator pastes into Staff console → Pilot results (no backend). Quick start (nickname only) replaces full sign-up inside the 10 minutes; full sign-up is an alternative path timed separately.
- WORLD_VERSION is 7. Do not bump it during the pilot: it resets every tester's stored data.
- Fixed a real bug in simulated chat (`>>` on an unsigned hash could give a negative index and crash a reply) and made simulated friend reactions guarantee at least one reaction.

## SDG framing for the pilot
- Primary goals are SDG 4 and SDG 5; SDG 10 is a byproduct (equity cuts, no separate measures). SDG 1 and 8 mapping removed from the feedback form. Added a say-over-money question (Q5) and a "spoke to women like me" question (Q9), swapped out satisfaction (the app already has UMUX-Lite and recommend) and the 7-day-intention question (the day-7 form covers actual actions). Q18 now includes "someone else controlling or checking my phone". Day-7 D6 asks whether they decided alone or with someone.
- Feature and experience questions added to the Google Form (Q4 core-feature experience, Q5 extras experience, Q6 ease per feature, Q13 points/badges preference) using three multiple-choice grids, so every feature is covered inside the 20-item cap. Age band, situation and experience now come from the in-app optional profile (joined by participant ID) instead of being asked twice. Dropped the separate clarity/words questions (covered by Q6) and the "pick a language" style items.

## Pilot v2: guided story (replaces the mission checklist)
- Per the team's direction: about 15 minutes, five chapters (LEARN, DO, PROGRESS, REWARD, CONNECT) with Sisi as the guide, the lesson quiz is back, the budget task is coached live, the reward chapter is a simulated claim (cash vs credit choice, nothing real), and Money Buddy sits inside CONNECT. Measurement inside the app was removed (no before/after check, ease ratings, survey, timer or in-app follow-up); the app now records what testers did passively and the Google Form carries opinions. Trade-off: no measured knowledge gain in the app (see docs/PILOT.md section 3). WORLD_VERSION is 8; results codes are now SISI3 (SISI2 codes from the checklist pilot are not accepted).
- Feedback form Q4 to Q6 and options updated to match the guided features; extras (payslip, Letterbox, Invest HER, events, Talk to someone, Support) are a "peek" shelf at the end.

## Pilot tweak: communities, extra features, tracking and ID
- **Community picker removed from onboarding.** The communities are made up, so asking "which feels most like you" produced meaningless data. `quickStart` no longer takes a community; the CONNECT chapter now starts with a `join` step (detected from a real membership created after the chapter began), then the hello message, buddy and nudge.
- **More features in the guided path.** DO gained a bonus `payslip` step (detected by the `payslip_sim_saved` event; never stores amounts). CONNECT gained `join`. Guided length is now about 18 minutes (`GUIDED_MINUTES`), time target updated.
- **Do we need to track usage?** Passive, on-device tracking stays: it is free, anonymous, and is the only source of timing, quiz and observed-behaviour evidence that surveys cannot give. But it no longer asks anything of testers: the participant ID is now 4 characters (e.g. 7K3Q, was P-XXXXXX), and the long results code is behind a facilitator-only fold on the last screen. If the team prefers, the pilot works with only the Google Form plus observation, using the ID as the join key.

## One feedback form only
- The day-7 follow-up form is dropped; the pilot has one Google feedback form (20 items) plus the optional separate contact form. Baseline items (saving, say over money) are now a snapshot, not a measured change, and the analysis plan says so. Removed from the Apps Script, codebook, form pack, tester PDF, the facilitator guide page and PILOT.md.
