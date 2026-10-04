# Sisi pilot feedback: Google Form pack (v2: 20 questions, all multiple choice)

Status: draft for PPS review. Generated from `questions.json`, which is the source of truth for wording.

## Read this first

**What this is.** The feedback form has **20 items in total: consent, participant ID and 18 questions**. Every question is **multiple choice**: single answer, tick-all-that-apply, or a **multiple-choice grid** (Google's name for one question that asks the same choice for several rows, used so we can ask about every feature without 12 separate questions). Each question has an **optional "Want to tell us more?" box** underneath. Those boxes are optional add-ons and are not counted in the 20. Taking part needs about **4.4 minutes** of tapping.

**Feature and experience questions (Q4 to Q6, plus Q11 and Q13).** Q4 covers the six guided features (the lesson and quiz, the coached budget task, progress, the reward choice, the community chat and Money Buddy), Q5 the extras testers peeked at (payslip simulator, Letterbox, Invest HER, events, Talk to someone, Support, points and badges), and Q6 ease of use and understanding for each guided feature plus navigation. Q11 (most useful), Q12 (change first) and Q13 (points and badges) say what people prefer and what puts them off.

**Which SDGs this serves.** Your **primary goals are SDG 4 (Quality Education) and SDG 5 (Gender Equality)**. **SDG 10 (Reduced Inequalities) is a byproduct**: it is not measured with questions of its own but through **equity cuts**, comparing results by age, situation, data cost, shared or monitored phones and language to show whether the women who benefit are the ones usually left out. Age band, situation and budgeting experience come from the optional profile at the start of the in-app pilot, joined by participant ID, so they are not asked twice.

- **SDG 4:** 4.6 literacy and numeracy (Q6, Q7), 4.4 skills applied (Q14), 4.5 equal access (Q8, Q18).
- **SDG 5:** 5.a economic resources and financial services (Q1, Q2, Q3, Q15), 5.b technology (Q18), and safe, relevant participation for women (Q8, Q17).
- **SDG 10 (byproduct):** the in-app age and situation, Q18, and the language and cost answers used as cuts.

## 1. What this pack contains

| File | What it is |
|---|---|
| `FEEDBACK_FORM.md` / `.pdf` | This document: every question, why it is asked |
| `create-forms.gs` | A Google Apps Script that **builds the form for you**. Paste into script.google.com and press Run |
| `codebook.csv` | One row per question for analysis (id, type, options, evidence area, SDG target, source) |
| `questions.json` | The single source of truth. Edit it and run `node scripts/build-pilot-form.mjs` |

There is one form:

1. **Pilot feedback form**: consent, participant ID, 18 questions (single choice, tick-all, or grid), each with the optional expansion box. Given straight after the session.

## 2. Evidence areas and SDG mapping (SDG 4 and 5 primary, SDG 10 byproduct)

| Evidence area | Questions | SDG targets informed | What it lets us say |
|---|---|---|---|
| Learning and confidence | Q14 | SDG 4.4, 4.6 | People feel more able to handle money decisions |
| Ease of use and understandability | Q6, Q7 | SDG 4.6 | The content and tools are clear to the intended reader |
| Feature experience | Q4, Q5 | (product design: feature experience) | Which features people loved, liked, disliked or skipped, so you know what to keep, fix or cut |
| Relevance to women | Q8 | SDG 5, 4.5 (gender-responsive) | Whether the content and tone speak to women, not just to anyone |
| Women’s say over money (agency) | Q3 | SDG 5.a, 5.1 | Whether young women have a say over their money, and whether that grows |
| Money behaviour (baseline and change) | Q1, Q2 | SDG 5.a, 4.4 | Baseline and change in saving, budgeting and account ownership |
| Impact and needs | Q15 | SDG 4.4, 5.a | Which outcomes people believe Sisi supports |
| Trust, privacy and safety | Q17 | SDG 5 (safe participation) | Whether Sisi is trusted and safe, a precondition for any impact |
| Access and inclusion | Q18 | SDG 4.5, 5.b (equity cuts for SDG 10.2) | Who is left out by data cost, connection, device, language or accessibility |
| Preferences, likes and dislikes | Q9, Q10, Q11, Q12, Q13, Q16 | (product design) | What to keep, change, cut and build next |
| Who took part |  | SDG 10.2 (byproduct: who benefits) | Whether the pilot reached the women it is meant for |

Concepts for account ownership (Q3) follow the Global Findex survey; the wording is ours. The agency item (Q5) is a draft, not a validated scale: check it against a validated women's economic empowerment measure before publishing results.

## 3. How it fits with the in-app pilot

The guided pilot records, passively and without interrupting people, what each tester actually did: which chapters they finished, how long each took, their quiz score, whether the budget scenario worked, their weekly target, which reward they chose, whether they said hello and started a Money Buddy, and one optional emoji reaction per chapter. This form does not repeat any of that. It adds what the app cannot: understandability of the purpose and the words, likes and dislikes, preferences, who took part, a money-behaviour baseline, perceived benefit, safety and access barriers. The two datasets join on the **participant ID**, which the app shows on its last screen. **Not measured in the app any more:** a before/after knowledge check. The lesson quiz shows what people knew after the lesson, not how much they gained. If you need evidence of learning gain for SDG 4, either add before/after items to this form (the six parallel-form items are kept in `lib/pilot/instruments.ts`) or accept the self-reported confidence change (Q14) as the proxy.

## 4. Design choices

- **Multiple choice throughout**, so answers can be counted and compared. The optional box under each question keeps the "why" without making it a chore. Three grids (Q4, Q5, Q6) cover every feature in three questions. If you would rather have strictly single-answer questions, ask me and I will split the grids.
- **Triangulated with the app.** The app records what testers actually did and how long each chapter took. Q4 to Q6 add their own judgement of the same features, so you can see where behaviour and opinion disagree.
- **Likes and dislikes are separate questions** (Q9, Q10) so negative feedback is not buried, plus two forced choices (Q11 "which ONE part was most useful", Q12 "change ONE thing first") that reveal real priorities.
- **Comprehension is tested, not asked**: Q7 offers four descriptions of Sisi and one is correct, which checks whether people understood "education, not advice".
- **No income amounts, ever.** We only ask whether people have an account or save, never how much.
- **"Prefer not to say"** on every question about the person. Only consent and the participant ID are required in the feedback form.
- **Women-specific on purpose**: Q3 asks about say over money, Q8 whether Sisi spoke to women like them, Q17 safety, and Q18 includes shared or monitored phones, because these are the SDG 5 conditions the product has to meet.
- **Anonymity**: the form collects no names, emails or phone numbers.

## 5. Before you publish

1. Run `create-forms.gs` and open the form's edit link. Preview on a phone and time it.
2. In the form: Responses → Link to Sheets. Keep "Collect email addresses" **off** (the script does).
3. Replace the opening text with the PPS-approved consent and privacy wording if it differs. Confirm POPIA responsibilities with PPS.
4. Add the PPS logo or a header image through the form theme if you wish.
5. Paste the published feedback link into `FEEDBACK_FORM_URL` in `lib/pilot/instruments.ts`. The pilot's last screen then shows an "Open the feedback form" button.

## 6. The questions

### The pilot feedback form

**Form title:** Sisi pilot feedback

**Opening text:**

> Thank you for testing Sisi, a money-confidence app for young women, made with PPS Investments.

> There are 18 quick questions, about 4 to 5 minutes. Every question is multiple choice, and each has an optional box if you want to say more. It is not a test of you. We are testing Sisi, and honest answers, including critical ones, help most.

> What we collect: your answers here. No name, email, ID number or bank details, and no amounts of your own money. The Sisi pilot team uses them to improve the app and to report anonymised, combined results to PPS Investments. Taking part is voluntary. You can stop at any time and skip any question you prefer not to answer.

> Sisi is education, not financial advice.

#### Welcome and consent

**CONSENT.** Do you agree to take part? *(required)*
- Multiple choice (one answer) · Consent and admin
- Help text: You can stop at any time and skip any question you prefer not to answer.
- Options: Yes, I am 18 or older and I agree to take part · No, I do not agree *(ends the form)*
- Why we ask: Informed, voluntary, adult consent before any data is collected (POPIA consent; wording to be confirmed by PPS)

#### About you
*Everything except your participant ID is optional. Choose Prefer not to say or skip anything you like.*

**PID.** Your participant ID *(required)*
- Short answer · Consent and admin
- Help text: You will see it on the last screen of the Sisi pilot. It looks like 7K3Q. Type NONE if you did not get one.
- Why we ask: Links this form to the anonymous in-app results without using a name or email (App participant id)

**Q1.** Do you have your own account with a bank or a mobile-money service?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Money behaviour (baseline and change)
- Options: Yes, a bank account · Yes, mobile money only · Yes, both · No · Prefer not to say
- Why we ask: SDG 5.a baseline: access to financial services (Concept follows Global Findex account ownership; wording is ours)

**Q2.** In the past 3 months, did you put any money aside as savings, even a small amount?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Money behaviour (baseline and change)
- Options: Yes, regularly · Yes, sometimes · No · Prefer not to say
- Why we ask: SDG 5.a / 4.4 baseline: saving behaviour

**Q3.** How much say do you usually have in big decisions about your money?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Women’s say over money (agency)
- Options: I decide on my own · I decide together with family or a partner · Other people mostly decide for me · It depends · Prefer not to say
- Why we ask: SDG 5.a baseline: women's say over money (Draft item for this pilot; check against a validated women's economic empowerment measure before publishing)

#### Your experience of the features
*Think about what you just did in the pilot. Skip a row if you did not try it.*

**Q4.** How was your experience with each of these?
- Multiple-choice grid (one answer per row) + optional “Want to tell us more?” box · Feature experience
- Rows: The lesson and its quiz · The coached budget task · Your progress (Bloom, badges, weekly target) · Choosing a reward · The community chat · Money Buddy
- Columns: Loved it · Liked it · It was okay · Did not like it · I did not try this
- Why we ask: Experience of the six guided features, side by side (compare with what they actually did and how long each chapter took)

**Q5.** And the extras you peeked at, if any?
- Multiple-choice grid (one answer per row) + optional “Want to tell us more?” box · Feature experience
- Rows: Payslip simulator · Letterbox (friends) · Invest HER (simulation) · Events and calendar · Talk to someone · Support page and Quick exit · Points and badges
- Columns: Loved it · Liked it · It was okay · Did not like it · I did not try this
- Why we ask: Experience of the features they peeked at (which to keep, fix or cut)

**Q6.** How easy was each of these to use or understand?
- Multiple-choice grid (one answer per row) + optional “Want to tell us more?” box · Ease of use and understandability
- Rows: Understanding the lesson and quiz · Doing the budget task · Understanding my progress and weekly target · Choosing a reward · Using the community chat · Using Money Buddy · Finding my way around the app
- Columns: Very easy · Easy · Okay · Difficult · Very difficult · I did not try this
- Why we ask: SDG 4.6: ease and understandability per feature, including the words and navigation

#### Understanding
*Two quick questions about Sisi itself.*

**Q7.** What is Sisi mainly for?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Ease of use and understandability
- Options: Learning about money in plain words and practising with simple tools · Getting personal financial advice · Opening a bank account or taking out a loan · Buying and selling investments with real money · I am not sure
- Why we ask: SDG 4.6: did people grasp the purpose without being told? (Correct answer: the first option.)

**Q8.** How well did Sisi speak to women like you?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Relevance to women
- Options: Very well · Fairly well · Not very well · Not at all · I am not sure
- Why we ask: SDG 5 / 4.5: is the content and tone gender-responsive and relevant?

#### What you liked and prefer
*Be as honest as you like. Critical answers are the most useful.*

**Q9.** What did you like? (Tick up to three)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: The short, clear lesson and quiz · The coached budget task · Seeing my progress · The community and chat · The friendly tone · Points, badges or rewards · That it felt private and safe · How simple it looked · Nothing in particular · *Other (write in)*
- Why we ask: Likes, in structured form

**Q10.** What did you dislike or find frustrating? (Tick up to three)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: Words I did not understand · The lesson was too long · Too much text on screen · The budget task was hard · The community felt unclear or awkward · It was slow or did not work well on my phone · Data cost or a weak connection · Something felt unsafe or uncomfortable · Nothing · *Other (write in)*
- Why we ask: Dislikes and friction, in structured form

**Q11.** Which ONE part of Sisi was most useful to you?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: The lesson and quiz · The coached budget task · Seeing my progress · The reward choice · The community chat · Money Buddy · Letterbox (friends) · Payslip simulator · Invest HER (simulation) · None of them
- Why we ask: Forced choice: preferred feature

**Q12.** If we could change only ONE thing first, what should it be?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: Make the lessons shorter or simpler · Make the budget tool simpler · Make the community easier to use · Add more topics · Make it faster or work better on my phone · Make rewards clearer · Make it feel more like my life · *Other (write in)*
- Why we ask: Forced choice: top priority to fix

**Q13.** Points, badges and leaderboards are optional in Sisi. How do you feel about them?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: They motivate me · I do not mind them · They put me off · I would switch them off · I did not notice them
- Why we ask: Gamification preference (evidence rule: must stay optional, with Focus mode)

#### Learning and what is next
*A few questions about what changed for you and what would help.*

**Q14.** Compared with before today, how confident do you feel about making everyday money decisions?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Learning and confidence
- Options: Much more confident · A bit more confident · About the same · A bit less confident · Much less confident
- Why we ask: SDG 4.4 / 5.a: retrospective self-efficacy change (second estimate beside the in-app before/after) (Retrospective then/now design reduces response-shift bias)

**Q15.** Learning about money like this could help me to… (Tick all that apply)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Impact and needs
- Options: Feel less stressed about money · Make and keep a budget · Start saving · Avoid or get out of debt · Start investing · Talk about money with my family · Say no to money requests I cannot afford · Ask for fair pay or fees · Start or grow a business or side hustle · Plan for study or my career · None of these · *Other (write in)*
- Why we ask: Perceived benefit by outcome area: skills (SDG 4.4) and economic agency (SDG 5.a)

**Q16.** What would make you most likely to come back? (Tick up to two)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: Reminders · Rewards or prize draws · Doing it with a friend (Money Buddy) · More topics that fit my life · Lessons in my own language · Shorter lessons · Live sessions or events · Nothing would · *Other (write in)*
- Why we ask: Retention drivers: reminders, rewards, social, content, language, length

#### Trust and access
*Last section. Thank you for sticking with us.*

**Q17.** How safe and comfortable did you feel using Sisi, including the community?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Trust, privacy and safety
- Options: Very safe and comfortable · Mostly safe and comfortable · Neutral · A bit uneasy · Not safe or comfortable · I did not use the community
- Why we ask: SDG 5: safe participation for women online

**Q18.** What could stop you using an app like Sisi regularly? (Tick all that apply)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Access and inclusion
- Options: Data cost · A weak connection · Sharing a phone · Someone else controlling or checking my phone · The language · Not having time · Worry about privacy · Hard to read or tap (text size, colours, buttons) · Nothing · *Other (write in)*
- Why we ask: SDG 5.b / 4.5: access barriers, including the gender digital divide (equity cuts for SDG 10.2)

**Confirmation message:** Thank you! Your feedback helps make Sisi better for other young women.


## 7. Analysis plan (short)

**Features and experience.** For each feature, put side by side: whether testers finished it and how long it took (from the app), their one-tap reaction after the chapter (from the app), and Q4/Q5 (loved or liked versus did not like) and Q6 (ease). Where they disagree, read the optional boxes: that is usually where the real problem is. Q11 and Q12 rank what to keep and what to fix; Q13 settles whether points and badges stay on by default.

**SDG 4 evidence (education).** The in-app quiz score (what people knew after the lesson) and the self-reported confidence change (Q14) are the evidence of learning, with Q7 (percent who choose the correct description of Sisi), Q6 (understanding the lesson and the words) and Q15 (what people expect learning like this to help them do).

**SDG 5 evidence (gender equality).** Baseline: Q1 (account), Q2 (saving), Q3 (say over money). There is no follow-up survey, so these are a baseline snapshot, not a measured change; say so in the report. Conditions: Q8 (spoke to women like me), Q17 (safety), Q18 (phone access barriers), Q15 (benefits people expect, including saying no to money requests and asking for fair pay).

**SDG 10 (byproduct).** Cut Q4 to Q6, Q8, Q14 and Q17 by the in-app age band and situation and by the Q18 barriers (data cost, language, shared or monitored phone). Report whether the gaps are small or large. That is the evidence that Sisi is reaching women who are usually left out.

**Product decisions.** Q9 and Q10 (tick-lists), Q11 and Q12 (forced choices), Q16 (what brings people back). Code the optional boxes by theme (two people code a sample, agree, then code the rest).

Say plainly that this is a small, self-selected pilot with no control group.
