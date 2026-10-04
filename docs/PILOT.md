# Sisi pilot: test plan, evidence framework and instruments

Status: draft v1 for PPS review. Everything here is implemented in the app (see "Where things live" at the end).

## 1. Purpose

Testers spend **about 10 minutes** using Sisi and then tell us what worked. The pilot has to answer four questions with evidence rather than opinion:

| # | Research question | What counts as evidence |
|---|---|---|
| RQ1 | Does a 10-minute session improve what young women know about money? | Matched before/after score on parallel 6-item forms |
| RQ2 | Does it change how confident they feel? | Before/after on 3 self-efficacy statements |
| RQ3 | Can people actually use Sisi, and where do they struggle? | **Observed** task success, time on task, ease rating after each task, UMUX-Lite, observer notes |
| RQ4 | Is it safe, understood and worth coming back to? | Comfort in community, comprehension of "education, not advice", intent to return, day-7 behaviour |

What it is not: a controlled trial. There is no control group, testers are self-selected and the after-test is immediate, so we can describe short-term learning and usability, not lasting behaviour change. Section 9 lists the limits to state whenever results are shown.

### SDG alignment

Primary goals: **SDG 4 (Quality Education)** and **SDG 5 (Gender Equality)**. **SDG 10 (Reduced Inequalities)** is a byproduct, shown through equity cuts rather than its own measures.

| SDG | What the pilot measures |
|---|---|
| 4.6 literacy and numeracy, 4.4 skills | Knowledge gain (6 parallel-form items), confidence change, understandability of purpose and words, skills used in a real decision at day 7 |
| 4.5 equal access | Access barriers: data cost, connection, shared phone, language, accessibility |
| 5.a economic resources and financial services | Account ownership, saving, say over money (baseline and day 7), perceived benefits |
| 5.b technology | Phone access and whether someone else controls or checks the phone |
| 5 safe, relevant participation | Comfort and safety in the community, whether Sisi speaks to women like them |
| 10.2 (byproduct) | Every result cut by age, situation, data cost, language and phone access |

The Google Form pack in `docs/pilot-form/` carries the detail.

## 2. The 10 minutes (run of show)

| Clock | Step | Where | Measured |
|---|---|---|---|
| 0:00 | Open link, read note, tick two boxes (18+, consent) | `/pilot` | consent time |
| 0:30 | Quick start: nickname + pick a community | Mission 1 **Join a community** | success (auto), ease |
| 1:30 | Quick check: 6 knowledge questions + 3 confidence statements | `/pilot` | score, "not sure" count, duration |
| 2:30 | **Learn**: lesson "Now-Now, Stack It, Grow It" (6 cards, quiz skipped) | Mission 2 | success (auto), time, ease |
| 4:30 | **Budget**: fix the R3,500 workshop scenario so it spends ≤ R3,500 and saves ≥ R150 | Mission 3 | success (auto, checks the saved budget), time, ease |
| 6:30 | **Community**: accept the guidelines, send one message (or react to a post) | Mission 4 | success (auto), time, ease |
| 7:30 | Final check: parallel form of the same questions | `/pilot` | score, duration |
| 8:30 | Feedback survey (about 90 seconds), then copy or send the results code | `/pilot` | UMUX-Lite, NPS, comfort, comprehension, open text |
| 10:00 | Done | | total time |

Design choices, and why:

- **Quick start instead of full sign-up.** A real sign-up plus the 13-step welcome flow takes about 3 minutes and would eat a third of the budget. Quick start needs only a nickname (no email, no password). Full sign-up is offered as an alternative path and its time is recorded separately (`signup_min`), so onboarding is still tested.
- **Success is observed, not self-reported.** Each core mission ticks off only when the real action happens (lesson finished, budget saved with the right numbers, a message sent). Support and Rewards are self-confirmed on purpose: Support is never tracked.
- **Seven optional extras** (payslip simulator, Money Buddy, Letterbox, Invest HER, Talk to someone, Support + Quick exit, Rewards), 1 to 2 minutes each, each with its own ease rating. They are outside the 10 minutes and give feature-by-feature coverage.
- **Timer is visible** (purple bar) but never stops anyone: going over is data.
- The pilot link is `/pilot`. A printable tester guide with QR code and a facilitator script is at `/pilot/guide`.

## 3. Instruments

### 3.1 Knowledge check (6 items, two parallel forms)

Each concept has a Form A and a Form B item with different wording and numbers. A tester's form for the first check is assigned by a hash of their anonymous id (about half get A first, half B first) and they get the other form at the end. This reduces memory and practice effects and lets us check whether one form is easier. Option order is shuffled per tester, and every item has "I'm not sure" (scored as not correct, but counted, to separate guessing from not knowing).

| Item | Concept | Form A | Form B | Taught in |
|---|---|---|---|---|
| K1 | Match a goal to spend / save / grow | Money needed in ~6 months → easy-access savings account | Goal 10+ years away → invest for long-term growth | Lesson |
| K2 | Cost of borrowing | R1,000 jacket, 10% interest, 12 months → **R1,100** | R2,000 phone, 20% interest, 12 months → **R2,400** | Lesson (laptop example) |
| K3 | What an emergency fund is for | Unexpected, necessary costs | Laptop breaks and you need it for work or study | Lesson |
| K4 | Needs vs wants | Streaming subscription is a want | Rent is a need | Budget task |
| K5 | Income minus spending | R2,500 in, R2,700 out → R200 short | R4,000 in, R3,750 out → R250 left over | Budget task |
| K6 | A SMART goal | R200 a month for 9 months for an R1,800 fee | R300 a month for 5 months for a R1,500 phone | Lesson |

Every item cites its source page in `lib/pilot/instruments.ts`. The items are **drafts**: item difficulty and discrimination are checked on pilot data (the dashboard shows percent correct per item before and after, and a form-equivalence check).

### 3.2 Confidence (3 statements, 1 to 5)

"I feel confident making everyday money decisions." · "I could build a monthly budget and stick to it." · "I know how to start saving for an emergency." Same wording before and after, and the same wording the 4-week in-app check-in uses.

### 3.3 Task ease and usability

- **Single Ease Question** (1 to 7) after each mission: "Overall, how easy or difficult was that?"
- **UMUX-Lite** (Lewis et al.), 7-point: "Sisi has the features I need to learn about money." / "Sisi is easy to use." Score 0 to 100. Wording adapted to Sisi; a score near 68 is the commonly used "average usability" benchmark.
- **Recommend** 0 to 10 (NPS style). Descriptive only at small n.

### 3.4 Safety, understanding, intent

- "I felt comfortable taking part in the community." (1 to 5, asked only if they used the community)
- "Which best describes Sisi?" (education, not personal financial advice is correct). This is evidence for the guardrail: do people understand Sisi is not advice?
- Most useful part, "use Sisi again next week?" (yes/maybe/no), two optional comments (what got in the way / what they liked), optional age band, status and budgeting experience.

### 3.5 Day-7 follow-up (`/pilot/follow-up`)

Opened Sisi again? Which of: made/updated a budget, set a goal, saved money they would not have otherwise, talked about money with someone, opened Sisi again. Same 3 confidence statements, and "what changed?". This is the only evidence of behaviour, so it matters most for the SDG case. Ask testers to reopen it on the **same phone and browser**.

## 4. Decision rules (proposed, written before any data)

These are proposals for PPS to confirm or change in `lib/pilot/analysis.ts`. Below 5 testers nothing is marked met or not met; below 30 everything is exploratory.

| Rule | Target |
|---|---|
| Completion | ≥ 80% finish the four core missions |
| Time | ≥ 75% of finishers within 10 minutes |
| Knowledge | mean gain ≥ +1.0 of 6 and the 95% interval above 0 |
| Confidence | mean gain ≥ +0.3 on the 1 to 5 scale |
| Usability | UMUX-Lite ≥ 68 |
| Tasks | each core task ≥ 80% success and mean ease ≥ 5.5 of 7 |
| Safety | comfort mean ≥ 4.0 of 5 |
| Understanding | ≥ 90% answer "education, not advice" |
| Intent | ≥ 70% yes or maybe |

## 5. Sample and logistics

- **Target:** 30 or more finished testers for a first read, spread across campus (e.g. Wits, UJ), first-job and out-of-school women aged 18 to 26. Fewer than 10 gives usability findings only. Aim for at least 8 observed in person (facilitator notes) alongside any remote testers.
- **Do not change the app during the pilot.** A new version resets stored demo data on every device (`WORLD_VERSION`). If a fix is essential, collect all codes first.
- **Shared devices:** between testers use Profile → "Delete my account / reset my data".
- Facilitator checklist, spoken script and the observation sheet are on page 2 of `/pilot/guide` (print or save as PDF).

## 6. How results reach the team (no backend)

Sisi is client-side only, so a tester's answers live in their browser. At the end they get a **results code** (about 600 characters, anonymous, no name, email or account id). They copy it, send it by WhatsApp or email, or save it as a file. A staff member pastes codes into **Staff console → Pilot results**, which shows the dashboard and exports a CSV (one row per tester). Duplicates are ignored; an updated code (for example with the day-7 follow-up) replaces the earlier one.

Risks to manage: a tester who clears browser data before sending the code loses their record; ask for the code before they leave. If PPS wants direct collection, the clean option is a small server endpoint that accepts the same code. The data shape would not change.

## 7. Data handling

- Collected: answers, task outcomes and timings, device type (phone/computer), optional age band, status and experience, two optional free-text comments.
- Not collected: name, email, ID number, bank details, any amounts the tester enters in tools, Support page visits (page-view analytics are off on Support).
- Free text can still contain personal details if someone ignores the warning. Read comments before sharing the CSV outside the team.
- This is a research-style exercise with under-26s: PPS should confirm consent wording, POPIA responsibilities and whether an ethics review is needed before recruiting. The in-app consent screen is a starting draft, not legal advice.

## 7a. Rewards during the pilot

Any reward or incentive offered for taking part must carry "Pilot reward — subject to PPS approval." and be offered the same way whether or not the tester gives favourable feedback.

## 8. Content: how the PPS material maps to Sisi

The facilitator guide, learner booklet and slides ("Money Matters") are adapted, not copied, into a new **Money Matters** course (7 lessons of about 3 minutes, plain-words voice, sources and "if you… then…" callouts). The guide is marked restricted internal use, so please confirm PPS is happy for adapted content to sit in the app.

| Workshop section | In Sisi |
|---|---|
| Introduction, R10,000 question | Opens lessons 1 and 2 |
| Financial literacy basics (8 terms, true/false) | Lesson "Money words that matter" + glossary |
| Spending, saving, growing; laptop example | **Pilot lesson** "Now-Now, Stack It, Grow It" |
| What is investing; assets; risk and reward | "Assets, risk and reward" |
| Retirement and compounding (Joshua, Aisha, Sipho); inflation | "Starting early beats starting big" |
| SMART goals | "SMART goals that stick" + Savings goals tool |
| Understanding a payslip | "Read a payslip line by line" + Payslip simulator |
| Creating a budget (R3,500 laptop scenario) | "The R3,500 laptop budget" + **pilot Budget task** (template "Workshop scenario") |
| Recap | Home/rewards recap |

## 9. Problems found in the source material (please read)

I checked the numbers in the guide, booklet and slides. These need a decision from PPS before the material is reused anywhere:

| # | Where | Issue | What Sisi does |
|---|---|---|---|
| 1 | Guide p15 (question prompt) and booklet payslip page | Net salary shown as **R10,319.25**. 11,500 − 1,680.75 = **R9,819.25** (the slide 33 figure). The guide and booklet are R500 too high | Uses R9,819.25. R10,319.25 appears only as a wrong answer option |
| 2 | Slide 25 / booklet / guide p11 compounding table | Sipho (R500 a month, 8%, age 40 to 60) shows **R349,101**. The same method that gives Joshua R1,745,503 and Aisha R745,179 gives **R294,510** | Uses "about R295,000" |
| 3 | Guide p11 | "Joshua invested only R60k more than Sipho". It is **R120,000 more** (R240,000 vs R120,000) | Says R120,000 more |
| 4 | Guide p11 | "5× more wealth". With the corrected figure it is about **6×** | Says about six times |
| 5 | Payslip sample | UIF R120 on a R11,500 salary. UIF is 1% of pay, so R115 (R120 fits R12,000). PAYE R260.75 looks low for R11,500 | Kept as a labelled "sample"; says real amounts depend on SARS tables |
| 6 | Laptop example | "15% interest" is added to the price once (R1,725 total). Repaid monthly, that is about a 27% annual rate | Keeps the example and adds "real loans quote interest differently, ask for the total you will repay" |
| 7 | Booklet TFSA | R36,000 a year and R500,000 lifetime. Please check the current SARS limits (they may have changed in the 2026 Budget) | Sisi quotes **no** TFSA numbers and tells learners to check SARS |
| 8 | Guide §5 | Lists "fixed deposit" as a bond example; a fixed deposit is a bank product, not a bond | Not repeated |
| 9 | Guide §9 "possible solution" | Leaves out the R200 clothing line and leaves R850 unallocated | Sisi gives its own worked example that adds up |
| 10 | Booklet budget pages | First column of the expenses table is headed "Income"; step "4. Add Your SMART Financial Goals" appears twice | Not repeated |
| 11 | Slide: "Historically, equities deliver the strongest long-term growth" | A claim with no source | Sisi says shares tend to grow more over long periods with bigger ups and downs, not guaranteed |

Illustrations that use 8% a year are always labelled "an assumed 8% a year, not a forecast". The "stats rule" holds: Sisi shows no statistic that is not sourced.

## 10. Threats to validity (say these when presenting results)

- **No control group**: we cannot say the lesson caused the change, only that scores moved.
- **Immediate post-test**: shows recall, not retention. The day-7 follow-up starts to address this.
- **Self-selection and the novelty effect**: volunteers are more motivated.
- **Observer effect**: people try harder when watched; remote and observed testers are flagged by `path`/notes, and should be compared.
- **Item quality is unproven**: 6 draft items. Treat per-item results as signals.
- **Parallel forms are not psychometrically validated**: the dashboard's form-equivalence check shows whether one form is easier.
- **Small n**: the dashboard says "exploratory" below 30 and withholds verdicts below 5.
- **Ceiling and floor effects**: if most testers score 5 to 6 before, there is no room to improve; consider harder items.

## 11. Decisions for PPS

1. Confirm or change the decision rules in section 4.
2. Confirm the corrected figures in section 9, and the TFSA limits.
3. Approve the consent wording and POPIA/ethics route before recruiting anyone.
4. Decide how codes reach you (WhatsApp, email, or a small endpoint) and who owns the CSV.
5. Confirm PPS is happy for adapted workshop material to be shown in the app.
6. Agree recruitment: which campuses and groups, and how many observed sessions.

## Where things live

- `lib/pilot/instruments.ts`: every question, mission and its source. `lib/pilot/analysis.ts`: scoring, statistics, decision rules, CSV, results code. `lib/pilot/sample.ts`: simulated sample for previewing the dashboard (never counted as evidence).
- `lib/engine/pilot.ts`: quick start, mission detection, checks, survey, import.
- `app/pilot/*` and `components/pilot/*`: tester flow, banner, printable guide, follow-up. `app/(app)/admin/pilot`: results dashboard.
- `lib/content/courses.ts`: the Money Matters course. `tests/pilot.test.ts`: instrument, arithmetic and analysis tests.
