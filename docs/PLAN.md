# Sisi mock — plan

Status: draft for review. Everything here is built **without a database or any backend**. The goal of this version is to let the team click through and test the common features end to end, then drop in real content, then decide what a real backend needs to look like.

---

## 0. What "mock" means here

| Real product | In this mock |
|---|---|
| Supabase Auth, Postgres, Realtime | One in-browser **world store** persisted to `localStorage`. No server state at all. |
| Many users on many devices | Seeded fictional members plus **personas** you can switch between. Two browser tabs can be two different people at once and see each other's actions (cross-tab sync). |
| Live chat | Chat is real in the UI (send, reply, react, report, block, pin, mute…). Other members' replies are **simulated** with scripted, keyword-aware responses and typing indicators. |
| Cron jobs (reminders, Circle Cup, Campus Cup) | A **demo clock** you can move forward, plus a "Run daily job" button that runs the exact same logic the cron would. |
| Push notifications | In-app notifications plus the browser Notification API for a local "reminder" demo. |
| Admin approvals, payouts | Admin console works on the same local world. No money moves. |
| Share links | **Stateless**: the badge or takeaway is encoded in the URL, so a shared link works on any device with no server data. |

**Known limits (by design):** state lives in one browser. Clearing site data resets the mock. A link to a friend's buddy invite or a revoked share link cannot work across devices. Passwords are stored in plain text locally (it is a mock). None of this is suitable for real user data.

**What stays exactly as the spec says:** brand, tone, evidence-based design rules, the guardrails (education not advice, never ask for income/ID/account numbers, simulations always labelled, competition optional), the stats rule, points and badge rules, weekly-target streaks, levels, Focus mode, Life Tracks, the safety features.

---

## 1. Architecture

```
app/                 Next.js App Router pages. Thin: they read the world and render.
components/          UI. Client components, no server actions.
content/             All editable content (lessons, glossary, FAQ, copy…). Your drafts go here.
lib/world/           types, seed, store, clock, persistence, cross-tab sync
lib/engine/          pure functions: points, levels, weekly target, badges, journey,
                     leaderboards, cups, bookings/waitlist, buddy, invest/payslip/budget maths,
                     moderation, reminders, analytics aggregation   (all unit-tested)
lib/sim/             simulated people: chat replies, typing, buddy behaviour, friend activity
app/api/og/          edge image routes for share cards (driven only by URL parameters)
```

**World store.** One JSON document, versioned (`sisi.world.v1`). It holds every user's data keyed by user id, plus shared things (communities, circles, messages, events, bookings…). The signed-in user id lives in `sessionStorage`, so each tab can be a different person. Writes go through named **actions** (`awardPoints`, `completeLesson`, `bookEvent`, `sendMessage`…), never ad-hoc mutation, so the logic stays testable and the UI stays simple.

**Hydration safety.** Pages render a skeleton until the store has loaded on the client, so there are no server/client mismatches.

**Demo clock.** Every "now" in the app comes from one `now()` function = real time + a stored offset. Moving the clock forward is how we test weekly targets, streak weeks, Circle Cup on the 1st, session reminders, season end, and the 4-week confidence re-check.

**Personas** (one tap on `/demo`, password `SisiDemo2026!` shown for realism):
- Nomsa Dlamini — member, mid-journey: Bud level, 4-week streak, 3 badges, a budget, two savings goals (one 60% done), a buddy, five friends with Letterbox posts, in Wits "Budget Besties".
- New — fresh account that goes through onboarding live.
- Thandi Mokoena — facilitator of Budget Besties.
- Admin — pps_admin.
- Plus "Create an account" for anyone, any email/password.

**Demo tools** (floating button, bottom-left, only when demo mode is on): switch persona · jump clock +1 day / +1 week / to the 1st of next month · run the daily job · reset world · open the pilot dashboard.

---

## 2. Feature plan

Each feature lists what the user does, how the mock makes it work, the rules, and how we will check it. Priorities: **P0** common path, **P1** finale, **P2** nice to have.

### F1. Auth and personas (P0)
- **User flow.** Landing → "Start with Sisi" → create account (email, password, first name) or "Try a demo account" → pick a persona.
- **Mock.** Accounts are records in the world. Sign-in checks email/password locally. No confirmation email, no reset (admin can set a temporary password for a member).
- **Rules.** Passwords ≥ 8 chars. Sign-out clears the tab's session only. Protected routes redirect to `/login` when there is no session.
- **Check.** Create account → onboarding. Sign in as each persona. Two tabs, two personas.

### F2. Onboarding (P0)
Steps: 3 welcome slides → name + optional nickname → join a community (pick, code, QR deep link, or skip) → **Where do I start?** quiz (5 single-tap questions) → result (Life Track, weekly target, first pathway, link to options comparison) → 5-item confidence check → POPIA consent → "Started" badge celebration.
- **Rules.** Track assignment is rule-based and unit-tested (`assignTrack`). Weekly target defaults from the quiz, changeable later. Pre-survey stored for the later "confidence change" metric. First 10 points and the Started badge (plus Founding Member during beta). Referral link `?ref=` stored; when the invited person finishes onboarding the inviter gets Hype Girl (works across tabs in the same browser).
- **Done when.** A fresh account reaches Home with 1–2 badges, ≥ 10 points, a Life Track and (if chosen) a community in under two minutes.

### F3. Home / My Journey (P0)
Greeting, Bloom, level + points + week-streak chips, **weekly target** progress ("1 of 2 days"), **Next action** card, **Real results** card, pathway cards, next session/booking, reward progress bar.
- **Next action** follows the user's Life Track lesson order, else the milestone order. States: start lesson → continue → quiz → do-it action. After the last one: a "you've bloomed" state.
- **Real results.** Lessons done, milestones, confidence change (post minus pre, shown after the 4-week re-check), **saved so far** and **goals reached** from savings goals (private, never shared).
- **Focus mode** hides points, streaks, levels and the weekly bar.
- **4-week check-in.** After 28 days on the clock, or on completing a pathway, a card offers the post confidence check.

### F4. Learn catalogue (P0)
Topic chips in demand order (Building wealth, Investing, Tax, Insurance, Credit & debt, Saving, Retirement, Budgeting, Bank fees & adult accounts, Family & black tax, Spot the scam), Life Track filter, search, level/lesson count/minutes, a **Reels** row (cards marked "Coming soon", scripts viewable), links to Money words, Compare options, Suggest a topic. Empty topics show "coming soon, suggest one".

### F5. Lesson player (P0)
- **Cards** (4–6, swipe or Next/Back, progress bar), plus `video` and `reel` formats supported by the player.
- **Jargon buster.** `[[term]]` renders as a dotted-underline button → bottom sheet with plain definition and "what this means for your money". Opening terms counts toward Word Wise (10 distinct).
- **Cause-and-effect callouts** ("If you…, then…").
- **Credibility.** Sources list; "Reviewed by {name}, {credential}, {date}" only if a review exists in content, otherwise "Review pending". "Spot the scam" card on investing lessons.
- **Quiz.** 2–3 questions, instant feedback with explanation, pass = 2 of 3 (or 2 of 2), unlimited retries, points only on first pass.
- **Do-it action.** I did it / Remind me tomorrow (creates a local reminder) / Skip.
- **After.** 1–5 star rating + "what was confusing?", then **Share takeaway** card (WhatsApp, download image; no points). Ratings/suggestions give 5 points each, max 5 awards a week.
- **Rules.** ≤ 3 minutes, hook in the first card, one takeaway, one action.

### F6. Money words and options (P0)
Searchable glossary (80+ terms, definition + example). "Compare your options" page: savings account vs TFSA vs unit trust vs retirement annuity (what it is, access, tax benefit, typical minimum, who it suits). Figures are never hard-coded: "check current SARS limits".

### F7. Points, levels, weekly target, badges (P0)
- **Points.** lesson 10 · quiz 5 · action 15 · session 25 · event check-in 30 · weekly target 25 · weekly challenge 20 · buddy week 20 · rating/suggestion 5 (max 5/week). Sharing earns nothing. One award per (user, source, id).
- **Levels.** XP = total points. Seed 0 · Sprout 150 · Bud 400 · Bloom 800 · Blossom 1500.
- **Weekly Target Mode.** User picks 1/2/3 active days per week (default 2). An active day = a day (SAST) with effort points. Streak = consecutive weeks hitting the target. Nothing resets on a missed day; only a whole missed week ends the streak. +25 the first time the target is hit in a week.
- **Badges.** All 22, evaluated in one engine after every point-earning action; returns newly earned ones for the celebration.
- **Rewards page.** Level + XP bar, 12-week streak dots, change target, badge wall (earned vs locked with rule, rarity ring), weekly challenge, points history.

### F8. Badge celebration and sharing (P0)
Full-screen earn moment (art scales in, brand-colour confetti, bloom gains a petal for milestones; reduced-motion respected). **Share sheet:** WhatsApp, Instagram Story (Web Share with the PNG, else download + toast), LinkedIn, X, Copy link, Download image. **Public page `/b/[payload]`** with correct OG tags and a "Join Sisi" button carrying `?ref=`. **Image routes** render 1200×630 and 1080×1920 from URL parameters (no server data). Cards never show money. Name shown follows the user's setting (first name by default). Sharing earns no points.

### F9. Focus mode (P0)
Profile toggle. Hides points, streaks, levels, leaderboards, and celebrations (a quiet toast instead). The badge wall becomes a milestone list. Points still accrue silently. Content, tools, milestones and reward eligibility are unchanged.

### F10. Money Milestones and quick tools (P0)
Five ordered milestones (Cash-flow check → First budget → Saving habit → Investing readiness → Wealth milestone), each = lessons + actions, fills a Bloom petal, awards its badge (Budget Builder at 2, Wealth Builder at all 5). **Cash-flow check** and **50/30/20 builder**: values stay in component state, nothing stored.

### F11. Budget builder and savings goals (P0)
- **Budget.** Templates (Allowance, NSFAS/bursary, Part-time, First salary), categories (rent, transport, groceries, electricity & data, family support, emergency savings, investing, fun), donut chart, "left to allocate". Save as current budget (stored locally, private). Completing it completes the Budget Builder action.
- **Goals.** Name, emoji, target, optional date; log deposits; progress ring; reaching a goal gives Goal Getter. Amounts are private: never in leaderboards, share cards, or analytics payloads.

### F12. First Payslip simulator (P1)
Presets R8 000 / 12 000 / 18 000 / 25 000 / 40 000 or custom gross. Illustrative PAYE (from `config/tax-za.ts`, `verified: false` → shown as "Illustrative figures"), UIF 1% with ceiling, retirement contribution slider 0–15%. Allocate net pay across categories until "left to allocate" is R0. Save scenario. Banner: "SIMULATION. Illustrative tax figures, not tax advice." Completing once = an action, awards Payslip Pro.

### F13. Invest HER (P0 shell, P1 simulator)
Affordability check (no amounts stored) → amount slider R50–R500 (default R200) → one explainer screen each for TFSA, unit trust, retirement annuity → **compound growth simulator** (years 1–20 default 10; presets 6/8/10% default 8%; monthly compounding; Recharts chart of contributions vs growth) → "First step" checklist (compare TFSA providers, check fees, set a debit-order date) with progress. Persistent banner: "SIMULATION — no real money. Illustrative returns, not a forecast. Education, not financial advice." Finishing awards Investor Ready.

### F14. Money Buddy (P1)
Invite link `/buddy/invite/[code]` with WhatsApp text. Accepting (in another tab/persona) activates the pair. If nobody accepts, the user can pick a **simulated buddy** (Lerato) so the whole flow is testable alone. Shared weekly plan of 3 actions picked from the pair's current milestone; each sees the other's **completion status only**. Nudge (max 1 per buddy per day). Private 1:1 chat (same chat component). Joint milestone when both complete the plan 2 weeks running → Better Together + joint reward eligibility. Simulated buddy completes tasks at believable times as the clock advances.

### F15. Communities and Circles (P0)
Community switcher. **Circles tab**: topic, facilitator, weekday + time, seats left x/8, Join / Request (if approval required) / Join with a friend. **Circle page**: facilitator, this week's topic, agenda block (LEARN 10 · DO 10 · TALK 10 · CHALLENGE 5), linked lesson, weekly challenge (+20, community-tied points), **group progress ring** ("5 of 7 completed this week's action", never lists who hasn't). Circle agreement must be accepted before the first message.

### F16. Circle chat (P0)
Send (optimistic), reply-to, reactions 👍💗🔥👏😂, pinned messages, system messages (member joined, badge earned, session reminder), day separators, paginate older messages (50), auto-scroll, share cards (lesson / event / badge) into chat, image upload (P1, stored as data URL locally), typing indicator and presence (simulated), unread counts.
- **Safety.** Circle agreement gate; report → moderation queue; block (hides that person for you); facilitator delete + 24 h mute; profanity masked with `***` (obscenity + editable blocklist); banner "Don't share account numbers, ID numbers or exact amounts."; harm-keyword detection shows the sender a private, gentle link to Support (nothing reported, nothing shown to others); 10 messages/minute rate limit.
- **Simulation.** After you post, seeded members reply (keyword-aware: budget, TFSA, rent, NSFAS, payslip…) with typing indicators; some react. Two tabs as two personas get real cross-tab chat.

### F17. Leaderboards and cups (P0)
- **Circle Cup** (default): Circles in the community ranked by *average* points per member, this week / all time. **Individuals**: opt-in only (default off), by nickname else first name, effort points only, never money. Top 10 + your row + "34 pts to pass #6". Recomputes on load and on focus and after earning points.
- **Points scope.** Community-tied points (session, event check-in, community challenge) count only in that community; personal points count in every community you belong to.
- **Circle Cup Champion.** On the 1st (SAST) the daily job awards the previous month's best Circle (ties: more completed weekly challenges, then alphabetical). Admin has "Award now".
- **Campus Cup (P1).** 4-week seasons between opted-in communities, ranked by average weekly points per active member; board shows entrants; winners get Campus Cup Champion. Seeded: "Spring Season 2026" (5 Oct – 1 Nov), Wits vs UJ vs PPS YP.
- **Focus mode** hides all of it.

### F18. Calendar and sessions (P0)
Month and agenda views, colour by type (circle session pink, workshop lavender, expert Q&A mint, O-Week gold). Session detail: host, time (SAST), venue/online link, RSVP Going/Maybe/Can't, attendee count, **Add to Google Calendar**, **Download .ics**. Facilitators/admins create one-off or weekly sessions (recurring = 8 concrete rows with a shared series id; edit/cancel "this one" or "all future"), cancel notifies RSVPs, **take attendance** → points + Circle Starter / Show-Up Sisi. Post-session 1–5 rating. `/calendar` merges sessions and event bookings.

### F19. Events, booking, waitlist, tickets (P0)
List (upcoming/past) and detail (cover, host, agenda, capacity, location, type). **Book my seat** → booked or waitlisted (capacity enforced in the engine). Cancelling promotes the first waitlisted person in the same step and notifies them. **QR ticket** with a 10-character code. Host **check-in** by camera scan (html5-qrcode) or manual tick → points + Workshop Goer. Free events only. One seeded event is nearly full to demo the waitlist.

### F20. Announcements (P1)
Admin/facilitator-only posting channel; members react with the same emoji set.

### F21. Rewards and claims (P0 view, P1 flow)
Four rewards: R50 cash (3 milestones), R500 investment credit + R100 cash (all three pathways), R25 weekly prize draw, joint R100 for a buddy pair. Status Locked → Eligible → Claimed → Approved → Paid. **Cash or investment credit +10%** choice on each cash reward ("vouchers expire, investments don't"). Prize draws show entrants and number of prizes. Everything labelled "Pilot reward — subject to PPS approval." Admin approves/rejects/marks paid. No money moves.

### F22. Letterbox (P1)
Friends by invite link, QR or nickname search; accept/decline/remove. Feed of friends' milestone posts (badge earned, module finished, weekly target hit, level up), created only if the author has opted in (default off; offered once after the first badge; toggle in Profile > Privacy). Never includes amounts. Reactions 💗 👏 🔥 🌱 and short notes (8 presets or custom ≤ 140). Same report/block/profanity rules.

### F23. Notifications centre and reminders (P0)
Bell with unread count. Sources: booking confirmation, waitlist promotion, session/event reminders (next 24 h), rewards status, help-request answers, buddy nudges, new friend, referral joined. **Smart reminders (P1):** the user picks reminder days (default two, matching the target); on those days, at 18:00 SAST, if the week's target isn't hit and fewer than 3 have been sent that week, a local reminder appears (in-app, plus a browser notification if the user allowed it after tapping "Remind me"). Messages are short and kind.

### F24. Talk to someone (P1)
Ask a question (text + topic) or request a 15-minute call (3 preferred windows). Max 3 open requests, 48-hour answer target shown. A professional/admin persona answers in the console; the user sees status and the written answer. Notice: "Answers are general financial education from a PPS-approved professional, not personalised advice." No chatbot.

### F25. Support and FAQ (P0, discreet)
"Support" lives inside the Help sheet, never on Home. Resources are editable in the admin console (emergency numbers with tap-to-call, GBV support, counselling, student wellness, "If you feel unsafe"). Every number seeded as **unverified** with a visible flag until the team verifies it. Sticky **Quick exit** (replaces the page and leaves no history). No analytics events on this route. FAQ is a content file.

### F26. O-Week entry (P1)
`/join/[slug]`: hero, what Sisi is, "Join Wits on Sisi", auto-join after sign-up, **O-Week Starter** mini-course (3 lessons) and badge. Admin downloads a printable A4 QR poster (PNG, 150 dpi) generated in the browser. QR image for `/join/wits` also saved in `public/qr/`.

### F27. Profile (P0)
Bloom, name/nickname, Life Track, weekly target, reminder days, name on shares, leaderboard opt-in, Focus mode, milestone sharing, invite-a-friend link, share links (managed locally), export my data (JSON), delete my account / reset my data, sign out.

### F28. Staff console `/admin` (P0 minimal, P1 full)
Role-gated. Communities and Circles (create/edit, assign facilitators), Sessions (one-off/recurring, attendance), Events (CRUD, bookings, check-in scanner), Moderation queue (dismiss / delete / mute), Members (roles, temporary password), Content (read-only viewer of loaded content plus reviewer entry for the "Reviewed by" line), Badges and challenges, Reward claims, Help requests, Safety resources (edit + verified flag), Topic suggestions and lesson feedback, **Pilot dashboard**, Reset demo data.

### F29. Pilot dashboard (P1)
Recharts cards with a 7 / 30 days / all filter, driven by locally recorded events (seeded for 4 weeks so charts are alive, plus everything you do): lesson completion, median drop-off, action completion; weekly active and completions (buddy/circle vs solo); pre vs post confidence; post-session ratings and repeat attendance; Invest HER funnel; leaderboard opt-in, Focus mode usage, Campus Cup participation, average lesson rating, weekly-target hit rate by chosen target, top "what was confusing" notes.

### F30. Marketing landing, PWA, accessibility (P0)
Landing with the hero, three pathways, how it works, CTA. Any number shown in copy must come from the evidence table in the spec (the statistics rule). Installable PWA (manifest, icons, offline shell). WCAG AA contrast, visible focus, reduced motion, alt text on badge art, footer disclaimer "Sisi provides financial education, not financial advice." Mobile first (360×800, 390×844).

---

## 3. Build order and checkpoints

| # | Milestone | You can click… |
|---|---|---|
| M1 | **Foundation swap.** Remove Supabase, world store, demo clock, personas, auth, route guard, demo tools, seed world | `/demo` → each persona → empty-but-working shell; clock jumps; reset |
| M2 | **Core loop.** Onboarding + quiz, Home, Learn, lesson player, glossary, options, points/levels/weekly target/badges, Rewards, celebration + share links + OG, Focus mode, Profile | New → onboard → lesson → quiz → action → badge → share link opens |
| M3 | **Money tools.** Milestones + quick tools, budget builder, savings goals, payslip, Invest HER | Budget saved → goal funded → Real results updates |
| M4 | **Community.** Circles, chat with simulated people, leaderboards, Circle/Campus Cup, buddy, announcements, Letterbox | Join Circle → agree → chat gets replies → leaderboard moves → jump to the 1st → cup awarded |
| M5 | **Time and money-ish.** Calendar, sessions, events, waitlist, QR tickets, check-in, notifications + reminders, rewards claims, Talk to someone, Support + Quick exit, FAQ, O-Week + poster | Book the nearly-full event → waitlisted → cancel as another persona → promoted |
| M6 | **Staff and wrap.** Admin console, pilot dashboard, content loader for your drafts, Playwright smoke test, a11y/perf pass, README + demo script | Admin approves a claim; dashboard charts move |

Each milestone ends with a short note: what shipped, what is stubbed, known issues, exactly what to click. Vercel deploys from `main` automatically once the project is connected, so every milestone is clickable on a phone.

---

## 4. Content contract (what you will draft)

Everything editable lives in `content/`. I will build a loader so you can write in friendly formats (Markdown with a small header) and the app picks them up at build time. Proposed shapes:

**Lesson** (`content/lessons/<course>/<slug>.md`)
```
---
title: Money in, money out
course: where-your-money-goes
topic: Budgeting            # one of the 11 topics
level: Starter
minutes: 3
tracks: [student, rent-independence]
takeaway: Cash flow is money in minus money out. Know your number.
sources:
  - SARS: https://www.sars.gov.za/
review:                      # leave out until a real review exists
  by: Name, credential
  on: 2026-10-01
---
## Where did your money go last month?        <!-- each ## is one card; first card is the hook -->
Plain text. Mark jargon like [[cash flow]] and it becomes tappable.
> If your money out is higher than your money in, then something has to give.   <!-- callout -->

## Quiz
? Which of these is a fixed cost?
- Takeaways on weekends
- [x] Monthly rent
- Impulse airtime
~ Rent is the same every month.

## Action
Write down every source of money you get in a normal month.
```
**Glossary** (`content/glossary.md`): `## term` then definition, then `Example: …`.
**Reels** (`content/reels/*.md`): title, script (≤ 250 words), cover colour.
**FAQ**, **safety resources**, **Life Track orders**, **badge copy**, **app copy** (button labels, empty states): simple Markdown/YAML files.
**Images:** optional covers per course/event in `public/content/`.

Until your drafts arrive, the app uses the placeholder content already written (5 courses / 10 lessons / 80 terms) and clearly marks anything unwritten as "coming soon".

---

## 5. Deployment

The mock needs **no environment variables and no backend**. Vercel project `sisi-pps` on the GitHub repo, production from `main`, previews per branch. The Vercel connector in this session is currently refused for the `emmanuel-azubuikes-projects` scope, so the one-time step is: either re-authorise the connector for that scope (and I create/deploy the project), or import `EmmanuelAzu/SDG-Challenge-MockUp` at vercel.com/new (framework auto-detected, no settings to change).

---

## 6. Decisions I made so you don't have to (override any)

1. One browser = one world; persona per tab via `sessionStorage`; shared world via `localStorage` with cross-tab sync.
2. Share links are stateless (payload in URL) so they work anywhere; revoking a link is local-only and noted as a mock limit.
3. Dates in seeded data are relative to "now", so calendars and leaderboards always look current.
4. The demo clock is available whenever demo mode is on (default on).
5. Simulated people are scripted, not AI. No external calls anywhere.
6. Images uploaded in chat are kept as small data URLs (size-capped) in the local world.
7. All amounts (budgets, goals, payslip scenarios) are private to the user even in the mock: not shown to other personas, not used in leaderboards, share cards or analytics.
8. Tax tables are labelled illustrative until the team verifies them against SARS.
9. Safety numbers are all marked unverified until the team verifies them.
10. Anything in the spec that needs a real backend (true realtime across devices, real push, real payouts, cross-device invites) is simulated and labelled; the engine/actions layer is written so a backend could replace the store later.

## 7. Test plan

- **Unit (Vitest).** Every engine function: points idempotence, weekly target and streak weeks, levels, all 22 badge rules, track assignment, journey/next action, leaderboard scoping (community vs personal points), cup tie-breaks, booking + waitlist promotion, buddy joint milestone, invest/payslip/budget maths, moderation, reminder eligibility, recurring session generation.
- **End to end (Playwright).** Onboard → lesson → quiz → action → badge → share page renders; book + waitlist + cancel promotion across two personas; chat across two tabs; clock jump to the 1st awards the Circle Cup.
- **Manual.** The click-paths in section 3 on a 390×844 phone.
