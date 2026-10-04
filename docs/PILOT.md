# Sisi pilot: guided experience, evidence framework and plan

Status: draft v2 for PPS review. v2 replaces the earlier 10-minute mission checklist with a **guided story**. Everything here is implemented in the app (see "Where things live" at the end).

## 1. Purpose

Testers get a worthwhile, directed experience of **what Sisi could be**, not a list of buttons to click. Sisi herself guides them through five short chapters that follow the product loop: **LEARN → DO → PROGRESS → REWARD → CONNECT**. We then ask what they thought, in a short Google Form. The pilot answers four questions:

| # | Question | Where the evidence comes from |
|---|---|---|
| RQ1 | Is the experience understandable, usable and worth doing? | What testers actually did and how long it took (recorded in the app), plus the Google Form |
| RQ2 | Which features do women prefer or reject, and why? | Google Form (feature experience, forced choices, likes and dislikes), chapter reactions, reward choice |
| RQ3 | Does it build understanding and confidence? | Lesson quiz score, self-reported confidence change (Google Form) |
| RQ4 | Is it safe, relevant to women, and for whom does it work? | Google Form (safety, relevance, access barriers), cut by age, situation and phone access |

What it is not: a controlled trial. There is no control group, testers are self-selected, and nothing is measured before the session, so we can describe experience and short-term understanding, not lasting behaviour change. Section 7 lists the limits.

### SDG alignment

Primary goals: **SDG 4 (Quality Education)** and **SDG 5 (Gender Equality)**. **SDG 10 (Reduced Inequalities)** is a byproduct, shown through equity cuts rather than its own measures.

| SDG | What the pilot gives you |
|---|---|
| 4.6 literacy and numeracy, 4.4 skills | Quiz score after the lesson, budget scenario success, understandability and confidence (Google Form), skills used in real decisions at day 7 |
| 4.5 equal access | Access barriers: data cost, connection, shared phone, language, accessibility |
| 5.a economic resources and financial services | Account ownership, saving, say over money (baseline and day 7), perceived benefits |
| 5.b technology | Phone access and whether someone else controls or checks the phone |
| 5 safe, relevant participation | Comfort and safety in the community, whether Sisi speaks to women like them |
| 10.2 (byproduct) | Every result cut by age, situation, data cost, language and phone access |

## 2. The guided experience (about 15 minutes, plus the feedback form)

| Part | What happens | Sisi's point | Time |
|---|---|---|---|
| Welcome | Sisi says hello. Consent, a nickname, a community | Set the tone: an older sister, not a bank | 1 min |
| 1. LEARN | Lesson "Now-Now, Stack It, Grow It": six cards, a three-question quiz, one small action. Points and a celebration appear | Learn, check, do. Points only show progress | 4 min |
| 2. DO | Fix a student's budget (R3,500 in, R3,600 out, a R1,500 laptop). Sisi coaches live as the sliders move | Knowing is nice; doing is better. Payoff: "your version saves R150 a month, so the laptop is ten months away, with no interest" | 3 min |
| 3. PROGRESS | Rewards page: Bloom, level, badges. Choose a weekly target of 1 to 3 days | Progress without pressure: nothing resets if you miss a day. Focus mode hides points and badges | 2 min |
| 4. REWARD | See the reward ladder and this week's prize-draw numbers, choose cash (R50) or investment credit (R55, 10% more), watch a simulated claim go Claimed, Approved, Paid | A reward that is yours to choose. Every pilot reward is subject to PPS approval. Nothing is real money | 2 min |
| 5. CONNECT | Say hello in your community's Lounge (simulated women reply), start a practice Money Buddy, send a nudge and see the reply | Money feels easier with people | 3 min |
| Wrap-up | A summary of "your first week", a shelf to peek at more (payslip simulator, Letterbox, Invest HER, events, Talk to someone, Support), then the results code and participant ID | The whole loop in one place | 1 min |

Each chapter has an intro from Sisi, a coaching strip at the top of the screen showing the next step, and a short wrap-up with one optional tap ("Loved it", "It was okay", "Not for me"). The strip's "Story" button always returns to Sisi's guide.

**Directed, not free-form.** Chapters unlock in order, and a step only counts if it happens after the chapter starts, so people experience the loop as designed. After they finish they can explore anything.

**What the app records, passively.** Which chapters were finished and how long each took, the quiz score and number of attempts, whether the budget scenario worked, the weekly target chosen, the reward chosen (cash or credit), whether they sent a message and started a Money Buddy and nudged it, points and level, badges, the optional reaction per chapter, which extras they peeked at, and phone or computer. **Never** message text, names, email, ID, bank details, or any amounts of their own. The budget scenario's numbers are fixed and fictional.

## 3. What was removed, and why

The first version asked a before/after knowledge check, a 1 to 7 ease rating after each task, a survey, a visible timer and a day-7 in-app form. Testers found it busy and mechanical. They are gone from the app. **What this costs:** there is no longer a measured knowledge **gain** inside the app. The quiz shows what people knew after the lesson, and the Google Form asks about confidence change. If PPS needs evidence of learning gain for SDG 4, add before/after items to the Google Form (the six parallel-form items, with sources, are kept in `lib/pilot/instruments.ts`).

## 4. Instruments

- **In the app (passive):** as listed above. Nothing interrupts the experience.
- **Google Form** (`docs/pilot-form/`): 20 items, all multiple choice, each with an optional expansion box: baseline (account, saving, say over money), experience of each guided feature, what they liked and disliked, forced choices on what is most useful and what to change first, understanding of what Sisi is for, whether it spoke to women like them, confidence change, expected benefits, safety, and access barriers.
- **Day-7 follow-up** (Google Form, 10 items): what they did since, savings, confidence, whether they used what they learned and decided alone or with someone.
- The two join on the **participant ID**, which the app shows on its last screen.

## 5. Decision rules (proposed, written before any data)

These are proposals for PPS to confirm or change in `lib/pilot/analysis.ts`. Below 5 testers nothing is marked met or not met; below 30 everything is exploratory.

| Rule | Target |
|---|---|
| Completion | ≥ 80% finish all five chapters |
| Time | ≥ 75% of finishers within 15 minutes |
| Quiz | ≥ 70% pass the lesson quiz (2 of 3 or better) |
| Budget | ≥ 80% of those who try fix the scenario |
| Connect | ≥ 70% of those who try say hello and start a Money Buddy |
| Reactions | each chapter "Loved it" or "It was okay" for ≥ 80% |
| Google Form | satisfaction, understanding of what Sisi is for, safety and intent as set out in `docs/pilot-form` |

## 6. Sample and logistics

- **Target:** 30 or more finished testers for a first read, across campus, first-job and out-of-school women aged 18 to 26. Fewer than 10 gives usability findings only. Observe at least 8 in person (facilitator notes in `/pilot/guide`) alongside remote testers.
- **Do not change the app during the pilot.** A new version resets stored data on every device (`WORLD_VERSION`, now 8). Collect all codes first if a fix is essential.
- **Shared devices:** between testers use Profile → "Delete my account / reset my data".
- **How results reach you (no backend):** at the end each tester gets an anonymous **results code** (about 600 characters) and a **participant ID**. They send the code by WhatsApp, email or file; a staff member pastes codes into **Staff console → Pilot results**, which shows the dashboard and exports a CSV. Join that CSV to the Google Form export on the participant ID. Codes from the earlier checklist pilot (they start with SISI2) are not accepted.
- **Risk:** a tester who clears browser data before sending the code loses their record. Ask for the code before they leave.
- Tester guide: `/pilot/guide` and `docs/Sisi-Pilot-Tester-Guide.pdf`.

## 7. Threats to validity (say these when presenting results)

- **No control group** and **no before measure in the app**: we cannot say the lesson caused a change.
- **Self-selection and novelty:** volunteers are more motivated, and a guided story is more engaging than normal use.
- **Observer effect:** people try harder when watched. Compare observed and remote testers.
- **Simulated community:** the women who reply and the practice buddy are simulated, so the feel of the community is a design preview, not evidence of real peer behaviour.
- **Small n:** the dashboard says "exploratory" below 30 and withholds verdicts below 5.
- **Opinion data is self-reported:** compare it with what people did.

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

## 10. Decisions for PPS

1. Confirm or change the decision rules in section 5.
2. Confirm the corrected figures in section 9, and the TFSA limits.
3. Approve the consent wording and POPIA/ethics route before recruiting anyone.
4. Decide how codes reach you (WhatsApp, email, or a small endpoint) and who owns the CSV.
5. Confirm PPS is happy for adapted workshop material to be shown in the app.
6. Agree recruitment: which campuses and groups, and how many observed sessions.
7. Decide whether you need a measured learning gain for SDG 4 (section 3). If so, add before/after items to the Google Form.

## Where things live

- `lib/pilot/journey.ts`: the five chapters, Sisi's words, the coaching tips. `lib/pilot/analysis.ts`: dashboard maths, decision rules, CSV, results code. `lib/pilot/sample.ts`: simulated sample for previewing the dashboard (never evidence). `lib/pilot/instruments.ts`: the retired knowledge items, kept for reference.
- `lib/engine/pilot.ts`: quick start, chapter detection (what testers really did), reward choice, import.
- `app/pilot/*` and `components/pilot/*`: the story screens, coach strip, printable guide. `app/(app)/admin/pilot`: results dashboard. The budget and rewards pages carry Sisi's live coaching cards when a tester is on that chapter.
- `lib/content/courses.ts`: the Money Matters course. `tests/pilot.test.ts`: tests for the journey, detection, privacy of the export, and the dashboard maths.
