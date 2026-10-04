# Sisi pilot feedback: Google Form pack (v2: 20 questions, all multiple choice)

Status: draft for PPS review. Generated from `questions.json`, which is the source of truth for wording.

## Read this first

**What changed.** The feedback form now has **20 items in total: consent, participant ID and 18 questions**. Every question is **multiple choice** (one answer, or tick all that apply). Each one has an **optional "Want to tell us more?" box** underneath, so people can expand on an answer without having to. Those boxes are optional add-ons and are not counted in the 20. Taking part needs about **3.3 minutes** of tapping; the optional boxes add time only for people who choose to write.

**About the SDGs.** The brief calls this the "PPS Investments SDG Challenge" but **never names the specific Sustainable Development Goals**, so I do not know which ones your challenge targets. Every question is tagged with an *evidence area* and the table in section 2 maps each area to SDG targets I think fit a money-confidence app for young women. Those targets are **proposals to confirm**. Tell me the real goals and only that table changes.

## 1. What this pack contains

| File | What it is |
|---|---|
| `FEEDBACK_FORM.md` / `.pdf` | This document: every question, why it is asked |
| `create-forms.gs` | A Google Apps Script that **builds all three forms for you**. Paste into script.google.com and press Run |
| `codebook.csv` | One row per question for analysis (id, type, options, evidence area, SDG target, source) |
| `questions.json` | The single source of truth. Edit it and run `node scripts/build-pilot-form.mjs` |

Three forms, on purpose:

1. **Pilot feedback form**: consent, participant ID, 18 multiple-choice questions (18 with the optional expansion box). Given straight after the session.
2. **Day-7 follow-up**: participant ID and 9 multiple-choice questions, about 1.5 minutes. Sent a week later. It asks what people did, not just what they know, which is your best evidence of behaviour change.
3. **Contact form** (optional, separate). Names and contact details are collected here so they are never stored next to feedback answers. Contact details have to be typed, so this one is not multiple choice.

## 2. Evidence areas and SDG mapping (candidate targets, to confirm)

| Evidence area | Questions | Candidate SDG targets (**to confirm**) | What it lets us say |
|---|---|---|---|
| Learning and confidence | Q13, D5, D6 | SDG 4.4, 4.6 | People feel more able to handle money decisions |
| Ease of use and understandability | Q5, Q6, Q7, D7 | SDG 4.6 (usability of learning) | The content and tools are clear to the intended reader |
| Access and inclusion | Q18 | SDG 5.b, 10.2, 4.5 | Who is left out by data cost, connection, device, language or accessibility |
| Money behaviour (baseline and change) | Q3, Q4, Q15, D1, D2, D3, D4 | SDG 8.10, 1.4 | Baseline and change in saving, budgeting and account ownership |
| Impact and needs | Q14, D9 | SDG 8, 4.4, 1.4 | Which outcomes people believe Sisi supports |
| Trust, privacy and safety | Q17 | SDG 5, 16.10 (safe, trusted) | Whether Sisi is trusted and safe, a precondition for any impact |
| Preferences, likes and dislikes | Q8, Q9, Q10, Q11, Q12, Q16, D8 | (product design) | What to keep, change, cut and build next |
| Who took part | Q1, Q2 | SDG 10.2 (who benefits) | Whether the pilot reached the women it is meant for |

Concepts for account ownership (Q3) follow the Global Findex survey; the wording is ours. The reduction to 18 questions removed the longer grids and agency items, so women's financial agency (SDG 5.a) is now only covered indirectly (Q13, Q14, Q17). If 5.a is one of your named goals, I would swap one question for a dedicated agency item.

## 3. How it fits with the in-app pilot

The app already measures knowledge change (6 items, two parallel forms), confidence, observed task success and time, **per-task ease**, UMUX-Lite and a recommend score. This form does not repeat those. It adds what the app cannot: understandability of the purpose and the words, likes and dislikes, preferences, who took part, a money-behaviour baseline, perceived benefit, safety and access barriers. The two datasets join on the **participant ID**, which the app shows on its last screen.

## 4. Design choices

- **Multiple choice throughout**, so answers can be counted and compared. The optional box under each question keeps the "why" without making it a chore.
- **Likes and dislikes are separate questions** (Q8, Q9) so negative feedback is not buried, plus two forced choices (Q10 "which ONE part was most useful", Q11 "change ONE thing first") that reveal real priorities.
- **Comprehension is tested, not asked**: Q5 offers four descriptions of Sisi and one is correct, which checks whether people understood "education, not advice".
- **No income amounts, ever.** We only ask whether people have an account or save, never how much.
- **"Prefer not to say"** on every question about the person. Only consent and the participant ID are required in the feedback form.
- **Anonymity**: contact details live in their own form.

## 5. Before you publish

1. Run `create-forms.gs` and open each form's edit link. Preview on a phone and time it.
2. In each form: Responses → Link to Sheets. Keep "Collect email addresses" **off** (the script does).
3. Replace the opening text with the PPS-approved consent and privacy wording if it differs. Confirm POPIA responsibilities with PPS.
4. Add the PPS logo or a header image through the form theme if you wish.
5. Paste the published feedback link into `FEEDBACK_FORM_URL` in `lib/pilot/instruments.ts`. The pilot's last screen then shows an "Open the feedback form" button.
6. Calendar-remind yourself to send the day-7 link.

## 6. The questions

### Form 1: Pilot feedback form

**Form title:** Sisi pilot feedback

**Opening text:**

> Thank you for testing Sisi, a money-confidence app for young women, made with PPS Investments.

> There are 18 quick questions, about 3 minutes. Every question is multiple choice, and each has an optional box if you want to say more. It is not a test of you. We are testing Sisi, and honest answers, including critical ones, help most.

> What we collect: your answers here. No name, email, ID number or bank details, and no amounts of your own money. The Sisi pilot team uses them to improve the app and to report anonymised, combined results to PPS Investments. Taking part is voluntary. You can stop at any time and skip any question you prefer not to answer.

> Sisi is education, not financial advice.

#### Welcome and consent

**CONSENT.** Do you agree to take part? *(required)*
- Multiple choice (one answer) · Consent and admin
- Help text: You can stop at any time and skip any question you prefer not to answer.
- Options: Yes, I am 18 or older and I agree to take part · No, I do not agree *(ends the form)*
- Why we ask: Informed, voluntary, adult consent before any data is collected (POPIA consent; wording to be confirmed by PPS)

#### About you
*These help us see who Sisi works for. Everything except your participant ID is optional. Choose Prefer not to say or skip anything you like.*

**PID.** Your participant ID *(required)*
- Short answer · Consent and admin
- Help text: You will see it on the last screen of the Sisi pilot. It looks like P-7K3Q9X. Type NONE if you did not get one.
- Why we ask: Links this form to the anonymous in-app results without using a name or email (App participant id)

**Q1.** How old are you?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Who took part
- Options: 18–20 · 21–23 · 24–26 · 27 or older · Prefer not to say
- Why we ask: Equity: who the pilot reached

**Q2.** Which best describes you right now?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Who took part
- Options: University or college student · Student who also works · In my first job (under 2 years) · Working for 2 years or more · Not studying or working at the moment · Something else · Prefer not to say
- Why we ask: Equity and sampling check (students vs first-jobbers)

**Q3.** Do you have your own account with a bank or a mobile-money service?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Money behaviour (baseline and change)
- Options: Yes, a bank account · Yes, mobile money only · Yes, both · No · Prefer not to say
- Why we ask: Baseline formal financial inclusion (account ownership) (Concept follows Global Findex account ownership; wording is ours)

**Q4.** In the past 3 months, did you put any money aside as savings, even a small amount?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Money behaviour (baseline and change)
- Options: Yes, regularly · Yes, sometimes · No · Prefer not to say
- Why we ask: Baseline saving behaviour (compare with the day-7 follow-up)

#### Understanding and ease
*Think about what you just did in the pilot.*

**Q5.** What is Sisi mainly for?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Ease of use and understandability
- Options: Learning about money in plain words and practising with simple tools · Getting personal financial advice · Opening a bank account or taking out a loan · Buying and selling investments with real money · I am not sure
- Why we ask: Understandability: did people grasp the purpose without being told? (Correct answer: the first option.)

**Q6.** How clear was it what to do next at each step?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Ease of use and understandability
- Options: Always clear · Mostly clear · Sometimes unclear · Often unclear · Never clear
- Why we ask: Navigation clarity

**Q7.** How easy were the words and explanations to understand?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Ease of use and understandability
- Options: Very easy · Easy · Okay · Difficult · Very difficult
- Why we ask: Language understandability

#### What you liked and prefer
*Be as honest as you like. Critical answers are the most useful.*

**Q8.** What did you like? (Tick up to three)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: The short, clear lesson · The budget task · The community and chat · The friendly tone · Points, badges or rewards · That it felt private and safe · How simple it looked · Nothing in particular · *Other (write in)*
- Why we ask: Likes, in structured form

**Q9.** What did you dislike or find frustrating? (Tick up to three)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: Words I did not understand · The lesson was too long · Too much text on screen · The budget task was hard · The community felt unclear or awkward · It was slow or did not work well on my phone · Data cost or a weak connection · Something felt unsafe or uncomfortable · Nothing · *Other (write in)*
- Why we ask: Dislikes and friction, in structured form

**Q10.** Which ONE part of Sisi was most useful to you?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: The lesson · The budget task · The community chat · Events · Money Buddy · Letterbox (friends) · Payslip simulator · Invest HER (simulation) · Talk to someone · Rewards · None of them
- Why we ask: Forced choice: preferred feature

**Q11.** If we could change only ONE thing first, what should it be?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: Make the lessons shorter or simpler · Make the budget tool simpler · Make the community easier to use · Add more topics · Make it faster or work better on my phone · Make rewards clearer · Make it feel more like my life · *Other (write in)*
- Why we ask: Forced choice: top priority to fix

**Q12.** Overall, how satisfied are you with Sisi?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: Very satisfied · Satisfied · Neither satisfied nor dissatisfied · Dissatisfied · Very dissatisfied
- Why we ask: Overall satisfaction (CSAT)

#### Learning and what is next
*A few questions about what changed for you and what would help.*

**Q13.** Compared with before today, how confident do you feel about making everyday money decisions?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Learning and confidence
- Options: Much more confident · A bit more confident · About the same · A bit less confident · Much less confident
- Why we ask: Retrospective self-efficacy change (second estimate beside the in-app before/after) (Retrospective then/now design reduces response-shift bias)

**Q14.** Learning about money like this could help me to… (Tick all that apply)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Impact and needs
- Options: Feel less stressed about money · Make and keep a budget · Start saving · Avoid or get out of debt · Start investing · Talk about money with my family · Ask for fair pay or fees · Start or grow a business or side hustle · Plan for study or my career · None of these · *Other (write in)*
- Why we ask: Perceived benefit by outcome area (maps to SDG outcomes)

**Q15.** In the next 7 days, I plan to… (Tick all that apply)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Money behaviour (baseline and change)
- Options: Make or update a budget · Set a savings goal · Start or add to an emergency fund · Talk to someone about money · Open Sisi again · Do the lessons with a friend · Nothing yet
- Why we ask: Stated intention, checked against the day-7 follow-up

**Q16.** What would make you most likely to come back? (Tick up to two)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: Reminders · Rewards or prize draws · Doing it with a friend (Money Buddy) · More topics that fit my life · Lessons in my own language · Shorter lessons · Live sessions or events · Nothing would · *Other (write in)*
- Why we ask: Retention drivers: reminders, rewards, social, content, language, length

#### Trust and access
*Last section. Thank you for sticking with us.*

**Q17.** How safe and comfortable did you feel using Sisi, including the community?
- Multiple choice (one answer) + optional “Want to tell us more?” box · Trust, privacy and safety
- Options: Very safe and comfortable · Mostly safe and comfortable · Neutral · A bit uneasy · Not safe or comfortable · I did not use the community
- Why we ask: Trust, privacy and safety

**Q18.** What could stop you using an app like Sisi regularly? (Tick all that apply)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Access and inclusion
- Options: Data cost · A weak connection · Sharing a phone · The language · Not having time · Worry about privacy · Hard to read or tap (text size, colours, buttons) · Nothing · *Other (write in)*
- Why we ask: Access and inclusion barriers (SDG 5.b, 10.2)

**Confirmation message:** Thank you! Your feedback helps make Sisi better for other young women.


### Form 2: Day-7 follow-up

**Form title:** Sisi pilot: one week later

**Opening text:**

> Thanks for testing Sisi last week. There are 9 quick multiple-choice questions, about 2 minutes, to see whether anything changed for you. Each has an optional box if you want to say more. Please do not include names or amounts. Taking part is voluntary and you can skip any question.

#### One week later

**PID.** Your participant ID *(required)*
- Short answer · Consent and admin
- Help text: The same ID as before (looks like P-7K3Q9X). Type NONE if you do not have it.
- Why we ask: Join to the session data

**D1.** Since the session, how many times have you opened Sisi? *(required)*
- Multiple choice (one answer) + optional “Want to tell us more?” box · Money behaviour (baseline and change)
- Options: Not at all · Once · 2 to 3 times · 4 or more times
- Why we ask: Return use

**D2.** Since the session, have you… (Tick all that apply) *(required)*
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Money behaviour (baseline and change)
- Options: Made or updated a budget · Set a savings goal · Put money aside that I would not have saved otherwise · Started or added to an emergency fund · Talked about money with someone · Done a Sisi lesson with a friend · None of these · *Other (write in)*
- Why we ask: Behaviour change vs the stated intentions (Q15)

**D3.** In the past 7 days, did you put any money aside as savings, even a small amount? *(required)*
- Multiple choice (one answer) + optional “Want to tell us more?” box · Money behaviour (baseline and change)
- Options: Yes · No · Prefer not to say
- Why we ask: Savings behaviour (compare with Q4)

**D4.** Which best describes how you planned your money this week? *(required)*
- Multiple choice (one answer) + optional “Want to tell us more?” box · Money behaviour (baseline and change)
- Options: I kept a written or app budget · I planned it in my head · I did not really plan it · Prefer not to say
- Why we ask: Budgeting behaviour

**D5.** Compared with before the session, how confident do you feel now about everyday money decisions? *(required)*
- Multiple choice (one answer) + optional “Want to tell us more?” box · Learning and confidence
- Options: Much more confident · A bit more confident · About the same · A bit less confident · Much less confident
- Why we ask: Self-efficacy at day 7 (compare with Q13)

**D6.** Have you used something you learned in a real money decision? *(required)*
- Multiple choice (one answer) + optional “Want to tell us more?” box · Learning and confidence
- Options: Yes · Not yet · Not sure
- Why we ask: Transfer to real decisions (ask them not to include amounts or names)

**D7.** If you did not use Sisi again, what got in the way? (Tick all that apply)
- Multiple choice (tick all that apply) + optional “Want to tell us more?” box · Ease of use and understandability
- Options: I forgot · I did not have time · Data costs or connection · I did not find it useful · I did not feel safe or comfortable · Technical problems · I did use it again · *Other (write in)*
- Why we ask: Barriers to return

**D8.** Have you told anyone else about Sisi? *(required)*
- Multiple choice (one answer) + optional “Want to tell us more?” box · Preferences, likes and dislikes
- Options: Yes, one person · Yes, more than one person · No
- Why we ask: Word of mouth (ripple effect)

**D9.** Since the session, does money feel… *(required)*
- Multiple choice (one answer) + optional “Want to tell us more?” box · Impact and needs
- Options: More manageable · About the same · Less manageable · Not sure
- Why we ask: Self-reported change in how manageable money feels

**Confirmation message:** Thank you! This helps us see whether Sisi makes a real difference after the session.


### Form 3: Contact form (optional, separate)

**Form title:** Sisi pilot: stay in touch (optional)

**Opening text:**

> This is a separate form on purpose, so your contact details are never stored with your feedback answers. Only fill it in if you would like to be contacted about the 4-week follow-up or the pilot prize draw. Pilot reward: subject to PPS approval.

#### Stay in touch

**C1.** Your first name or nickname *(required)*
- Short answer · Consent and admin
- Why we ask: Contact

**C2.** Your email address or WhatsApp number *(required)*
- Short answer · Consent and admin
- Help text: Use only one.
- Why we ask: Contact channel

**C3.** What may we contact you about? (Tick all that apply) *(required)*
- Multiple choice (tick all that apply) · Consent and admin
- Options: The 4-week follow-up · The pilot prize draw · Future Sisi testing
- Why we ask: Purpose limitation

**C4.** Do you agree that we store your contact details only for the reasons you ticked, and delete them when the pilot ends? *(required)*
- Multiple choice (one answer) · Consent and admin
- Options: Yes, I agree · No *(ends the form)*
- Why we ask: POPIA purpose and retention

**Confirmation message:** Thank you! We will only use your details for what you ticked.


## 7. Analysis plan (short)

- **Preferences:** Q8 and Q9 (tick-lists), Q10 and Q11 (forced choices), Q16 (what brings people back), cut by Q1 and Q2. Read the optional boxes and code themes (two people code a sample, agree, then code the rest).
- **Understandability and ease:** Q5 (percent who choose the correct description), Q6, Q7, with the in-app per-task ease to locate the hard parts.
- **Satisfaction and confidence:** Q12, Q13, alongside the in-app knowledge gain.
- **SDG outcomes:** Q3 and Q4 as the baseline profile, D2 to D4 and D9 at day 7 as change, Q14 as perceived benefit, Q15 against D2 (intention versus action).
- **Equity:** compare Q6, Q7, Q12 and Q17 for Q18 barriers (data cost, language, shared phone) to see who is being left behind.
- Say plainly that this is a small, self-selected pilot with no control group.
