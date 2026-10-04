# Sisi pilot feedback: Google Form pack

Status: draft v1 for PPS review. Generated from `questions.json`. Source of truth for wording is that file.

## Read this first

**About the SDGs.** The project brief I was given calls this the "PPS Investments SDG Challenge" but **never names the specific Sustainable Development Goals**, so I do not know which ones your challenge targets. I have not guessed silently. Every question carries an *evidence domain* (such as "money behaviour" or "access and inclusion"), and the table in section 3 maps each domain to the SDG targets that fit a money-confidence app for young women. Those SDG targets are **proposals to confirm**. When you tell me the real goals, only that table changes, not the questions.

## 1. What this pack contains

| File | What it is |
|---|---|
| `FEEDBACK_FORM.md` / `.pdf` | This document: every question, why it is asked, how it maps to evidence |
| `create-forms.gs` | A Google Apps Script that **builds all three forms for you** (sections, validation, the optional-questions gate). Paste into script.google.com and press Run |
| `codebook.csv` | One row per question for analysis (id, type, options, domain, SDG target, source) |
| `questions.json` | The single source of truth. Edit this and regenerate with `node scripts/build-pilot-form.mjs` |

Three forms, on purpose:

1. **Pilot feedback form** (54 questions in full). Given straight after the session. *Core part* (Parts 1–5, 33 questions, about **8.8 minutes**) is the evidence you need. *Optional part* (Parts 6–9, 21 questions, about **5.9 minutes**) sits behind a "continue?" question so tired testers can stop without losing the core data. Estimated times by priority (core / optional part): Priority 1 only **5.3 / 2.8 min**; priorities 1–2 **7.8 / 5.7 min**; everything **8.8 / 5.9 min**. Set `MAX_PRIORITY` at the top of the script to 1, 2 or 3 to choose. Times are estimates (about 8 seconds per tap question, 4 per grid row, 30 per written answer); time a real tester before you commit.
2. **Day-7 follow-up** (10 questions, about **2.4 minutes**). Sent a week later. Asks what people did, not just what they know. This is your strongest evidence of behaviour change.
3. **Contact form** (optional, separate). Names and contact details are collected here so they are never stored next to feedback answers. Needed only for the follow-up and any prize draw.

## 2. How this fits with the in-app pilot

The app already measures: knowledge change (6 items, 2 parallel forms), confidence, observed task success and time, per-task ease, UMUX-Lite and a recommend score. The Google Form does **not repeat those**. It adds what the app cannot: preferences, likes and dislikes, understandability in their own words, access and inclusion, who took part, money-behaviour baseline, and impact on SDG-relevant outcomes. The two datasets join on the **participant ID** (the app shows it on the last screen; Q "PID" asks for it). The ID is random and anonymous.

## 3. Evidence domains and SDG mapping (candidate targets, to confirm)

| Evidence domain | Questions | Candidate SDG targets (**to confirm**) | What it lets us say |
|---|---|---|---|
| Learning and understanding | LC1–LC4, W5, W6 | SDG 4.4 (relevant skills for decent work), 4.6 (literacy and numeracy) | People understand money concepts better and feel more able to act |
| Ease of use and understandability | UX1–UX9 | SDG 4.6 | Learning content is clear and usable for the intended reader |
| Access and inclusion | DEM6, PF8, AC1–AC3 | SDG 5.b (enabling technology for women), 10.2 (inclusion of all), 4.5 (equal access to learning) | Who is left out by data cost, device, language or accessibility |
| Money behaviour | BEH1–BEH5, LC5, W1–W4 | SDG 8.10 (access to financial services; indicator 8.10.2 account ownership), 1.4 (access to financial services and economic resources) | Baseline and change in saving, budgeting, resilience and account ownership |
| Women’s financial agency | AG1 | SDG 5.a (equal rights to economic resources and financial services), 5.1 | Whether young women feel they have a say over their money |
| Impact and needs | IM1, IM2, W9 | SDG 8, 4.4, 1.4 | Which outcomes people believe Sisi supports and what to build next |
| Trust, privacy and safety | TR1–TR3 | SDG 5 (safe participation), 16.10 (access to information) | Whether Sisi is trusted and safe, a precondition for any impact |
| Preferences, likes and dislikes | LK1–LK6, PF1–PF9, IM3 | (product design, not an SDG outcome) | What to keep, change, cut and build next |
| Who took part | DEM1–DEM5 | SDG 10.2 | Whether the pilot reached the women it is meant for |

Standards used: concepts for account ownership and emergency resilience follow the Global Findex survey; behaviour and attitude items are adapted from the OECD/INFE financial literacy toolkit. Wording of those items here is **our adaptation**, so verify against the current toolkits before comparing numbers with published benchmarks. The agency items (AG1) are a draft, not a validated scale.

## 4. Design choices

- **Consent first, ID next, nothing sensitive required.** Only consent, the participant ID and a handful of experience questions are required. Everything about the person has "Prefer not to say".
- **No income amounts, ever.** We ask where money comes from, never how much (matches the app's rule).
- **Forced choices for preferences.** "Which ONE part was most useful?" and "Change ONE thing first" force trade-offs, which are more informative than rating everything highly.
- **Likes and dislikes are separate open questions**, each required, so negative feedback is not buried.
- **"I did not try this" columns** stop people rating features they never used.
- **Retrospective then/now confidence** (LC1, LC2) gives a second estimate of change that is robust to people re-calibrating what "confident" means after learning something.
- **Plain language, South African context, one idea per question, balanced scales with labelled ends.**
- **Anonymity preserved** by splitting contact details into their own form.
- **Priorities.** Each question has Priority 1 (must keep), 2 (recommended) or 3 (nice to have).

## 5. Before you publish

1. Run `create-forms.gs` and open each form's edit link. Check the order and the "continue?" branch by previewing.
2. Add the PPS logo and a header image if you like (Form theme).
3. In each form: Responses → Link to Sheets. Turn **off** "Collect email addresses" (the script already does).
4. Paste the PPS-approved consent and privacy wording over the opening text if it differs. Confirm POPIA responsibilities with PPS.
5. Give testers the feedback link right after the session (and put it on the tester guide). Put the **day-7 link** in a calendar reminder.
6. Test the whole thing yourself on a phone. Time it.

## 6. The questions

### Form 1: Pilot feedback form

**Form title:** Sisi pilot feedback

**Opening text:**

> Thank you for testing Sisi, a money-confidence app for young women, made with PPS Investments.
> 
> This form takes about 7 to 9 minutes, plus about 5 optional minutes at the end if you want to tell us more. It is not a test of you. We are testing Sisi, and honest answers, including critical ones, help most.
> 
> What we collect: your answers here. No name, email, ID number or bank details, and no amounts of your own money. Your answers are used by the Sisi pilot team to improve the app and to report anonymised, combined results to PPS Investments.
> Taking part is voluntary. You can stop at any time and skip any question you prefer not to answer.
> 
> Sisi is education, not financial advice.

#### Part 1: Welcome and consent

**CONSENT.** Do you agree to take part? *(required)*
- Type: Multiple choice · Priority 1 · Domain: Consent and admin
- Help text: You can stop at any time. Skip any question you prefer not to answer (except this one and your ID).
- Options: Yes, I am 18 or older and I agree to take part · No, I do not agree *(ends the form)*
- Why we ask: Informed, voluntary, adult consent before any data is collected
- Source or validity: POPIA consent; wording to be confirmed by PPS

#### Part 2: Your experience today
*Think about what you just did in the pilot.*

**PID.** Your participant ID *(required)*
- Type: Short answer · Priority 1 · Domain: Consent and admin
- Help text: You will see it on the last screen of the Sisi pilot. It looks like P-7K3Q9X. Type NONE if you did not get one.
- Why we ask: Links this form to the anonymous in-app results without using a name or email
- Source or validity: App participant id

**UX1.** In one sentence, what is Sisi for? (Write it in your own words.) *(required)*
- Type: Paragraph · Priority 1 · Domain: Ease of use and understandability
- Why we ask: Understandability: did people grasp the purpose without being told?

**UX2.** How much do you agree with each statement? *(required)*
- Type: Multiple-choice grid · Priority 1 · Domain: Ease of use and understandability
- Rows: It was always clear what to do next. · The words used were easy to understand. · The examples fit my life. · The budget task was easy to follow. · I trusted the information I saw. · Sisi feels like it was made for women like me.
- Columns: Strongly disagree · Disagree · Neither agree nor disagree · Agree · Strongly agree · I did not try this
- Why we ask: Understandability, relevance, trust and belonging in one grid (the community and safety are covered again in the optional Trust section)
- Source or validity: Likert; items drafted for this pilot

**UX3.** How was the length of the lesson?
- Type: Multiple choice · Priority 2 · Domain: Ease of use and understandability
- Options: Too short · Just right · Too long · I did not do the lesson
- Why we ask: Pacing

**UX4.** How much text was on each screen?
- Type: Multiple choice · Priority 2 · Domain: Ease of use and understandability
- Options: Too little · About right · Too much
- Why we ask: Readability and density

**UX5.** Was anything confusing? Tell us which words, screens or steps.
- Type: Paragraph · Priority 1 · Domain: Ease of use and understandability
- Why we ask: Pinpoints specific comprehension and navigation problems

**UX6.** Did you ever feel like giving up?
- Type: Multiple choice · Priority 2 · Domain: Ease of use and understandability
- Options: No, never · Yes, a little · Yes, I nearly stopped
- Why we ask: Drop-off risk

**UX7.** If yes, where was that and what made you feel that way?
- Type: Paragraph · Priority 3 · Domain: Ease of use and understandability
- Why we ask: Locates the drop-off point

**UX8.** How easy was each part? *(required)*
- Type: Multiple-choice grid · Priority 1 · Domain: Ease of use and understandability
- Rows: Choosing and joining a community · The lesson · The budget task · Chatting in the community
- Columns: Very difficult · Difficult · Okay · Easy · Very easy · I did not try this
- Why we ask: Comparative ease across the four core tasks (compare with the in-app Single Ease Question)

#### Part 3: What you liked and did not like
*Be as honest as you like. Critical answers are the most useful.*

**LK1.** What did you like most? Up to three things. *(required)*
- Type: Paragraph · Priority 1 · Domain: Preferences, likes and dislikes
- Why we ask: Open likes, in their words

**LK2.** What did you like least or find frustrating? Up to three things. *(required)*
- Type: Paragraph · Priority 1 · Domain: Preferences, likes and dislikes
- Why we ask: Open dislikes, in their words

**LK3.** Which ONE part of Sisi was most useful to you? *(required)*
- Type: Multiple choice · Priority 1 · Domain: Preferences, likes and dislikes
- Options: The lesson · The budget task · The community chat · Events · Money Buddy · Letterbox (friends) · Payslip simulator · Invest HER (simulation) · Talk to someone · Rewards · None of them
- Why we ask: Forced choice: preferred feature

**LK4.** If we could change only ONE thing first, what should it be? *(required)*
- Type: Multiple choice · Priority 1 · Domain: Preferences, likes and dislikes
- Options: Make the lessons shorter or simpler · Make the budget tool simpler · Make the community easier to use · Add more topics · Make it faster or work better on my phone · Make rewards clearer · Make it feel more like my life · Something else · *Other (write in)*
- Why we ask: Forced choice: top priority to fix

**LK5.** Was there something you expected to find that was not there?
- Type: Paragraph · Priority 2 · Domain: Preferences, likes and dislikes
- Why we ask: Unmet expectations and missing features

**LK6.** Overall, how satisfied are you with Sisi? *(required)*
- Type: Linear scale · Priority 1 · Domain: Preferences, likes and dislikes
- Scale: 1 (Very dissatisfied) to 5 (Very satisfied)
- Why we ask: Overall satisfaction (CSAT)

#### Part 4: What you learned
*A few questions about what changed for you today.*

**LC1.** BEFORE today, how much did you agree with each statement? (Think back.) *(required)*
- Type: Multiple-choice grid · Priority 1 · Domain: Learning and understanding
- Rows: I feel confident making everyday money decisions. · I could build a monthly budget and stick to it. · I know how to start saving for an emergency.
- Columns: 1 Not at all · 2 · 3 · 4 · 5 Completely
- Why we ask: Retrospective baseline for self-efficacy (then-test)
- Source or validity: Same three statements as the in-app check. Then/now design reduces response-shift bias

**LC2.** NOW, after using Sisi, how much do you agree? *(required)*
- Type: Multiple-choice grid · Priority 1 · Domain: Learning and understanding
- Rows: I feel confident making everyday money decisions. · I could build a monthly budget and stick to it. · I know how to start saving for an emergency.
- Columns: 1 Not at all · 2 · 3 · 4 · 5 Completely
- Why we ask: Self-efficacy after the session

**LC3.** What is one thing you learned or understood better today?
- Type: Paragraph · Priority 2 · Domain: Learning and understanding
- Why we ask: Unprompted learning, in their words

**LC4.** Which of these ideas were new to you? (Tick all that apply)
- Type: Checkboxes · Priority 2 · Domain: Learning and understanding
- Options: Borrowing costs more than saving up · An emergency fund of 3 to 6 months of basic costs · Needs versus wants · Spend, save, grow (Now-Now, Stack It, Grow It) · SMART goals · Why starting early matters · None. I already knew all of these
- Why we ask: Which content is genuinely new vs already known (guides what to keep)

**LC5.** In the next 7 days, I plan to… (Tick all that apply)
- Type: Checkboxes · Priority 1 · Domain: Money behaviour (baseline and change)
- Options: Make or update a budget · Set a savings goal · Start or add to an emergency fund · Talk to someone about money · Open Sisi again · Do the lessons with a friend · Nothing yet
- Why we ask: Stated intention, checked against the day-7 follow-up

**LC6.** How likely are you to open Sisi again next week? *(required)*
- Type: Linear scale · Priority 1 · Domain: Preferences, likes and dislikes
- Scale: 1 (Not at all likely) to 5 (Extremely likely)
- Why we ask: Behavioural intent (retention proxy)

**Z1.** Anything else you would like to tell us?
- Type: Paragraph · Priority 3 · Domain: Preferences, likes and dislikes
- Why we ask: Catch-all

#### Part 5: About you
*These help us see who Sisi works for. They are all optional. Choose "Prefer not to say" or skip anything you like.*

**DEM1.** How old are you?
- Type: Multiple choice · Priority 1 · Domain: Who took part
- Options: 18–20 · 21–23 · 24–26 · 27 or older · Prefer not to say
- Why we ask: Equity analysis: who the pilot reached

**DEM2.** Which best describes you right now?
- Type: Multiple choice · Priority 1 · Domain: Who took part
- Options: University or college student · Student who also works · In my first job (under 2 years) · Working for 2 years or more · Not studying or working at the moment · Something else · Prefer not to say
- Why we ask: Equity analysis and sampling check (students vs first-jobbers)

**DEM3.** Where does your money mostly come from? (Tick all that apply)
- Type: Checkboxes · Priority 2 · Domain: Who took part
- Options: Allowance or support from family · Bursary or NSFAS · Part-time or casual work · A salary · My own business or side hustle · Other · Prefer not to say
- Why we ask: Context for what advice and tools fit; income source only, never amounts

**DEM4.** Which province do you mostly live in?
- Type: Dropdown · Priority 2 · Domain: Who took part
- Options: Eastern Cape · Free State · Gauteng · KwaZulu-Natal · Limpopo · Mpumalanga · Northern Cape · North West · Western Cape · I live outside South Africa · Prefer not to say
- Why we ask: Geographic reach and inequality (SDG 10)

**DEM5.** What kind of area do you mostly live in?
- Type: Multiple choice · Priority 2 · Domain: Who took part
- Options: City · Town · Township or the outskirts of a city · Rural area · Prefer not to say
- Why we ask: Urban-rural reach

**DEM6.** How do you usually get online?
- Type: Multiple choice · Priority 2 · Domain: Access and inclusion
- Options: My own smartphone · A smartphone I share with someone · A computer or laptop · Mostly at campus, work or a library · Other · *Other (write in)*
- Why we ask: Digital access: phone ownership and shared access (SDG 5.b)

#### Part 5: Your money today
*These questions are about you today, not about Sisi. There are no right or wrong answers.*

**BEH1.** Do you have your own account with a bank or a mobile-money service?
- Type: Multiple choice · Priority 1 · Domain: Money behaviour (baseline and change)
- Options: Yes, a bank account · Yes, mobile money only · Yes, both · No · Prefer not to say
- Why we ask: Baseline for formal financial inclusion (account ownership)
- Source or validity: Concept follows Global Findex account ownership; wording is ours

**BEH2.** In the past 3 months, did you put any money aside as savings, even a small amount?
- Type: Multiple choice · Priority 1 · Domain: Money behaviour (baseline and change)
- Options: Yes, regularly · Yes, sometimes · No · Prefer not to say
- Why we ask: Baseline saving behaviour

**BEH3.** Which best describes how you plan your money?
- Type: Multiple choice · Priority 2 · Domain: Money behaviour (baseline and change)
- Options: I keep a written or app budget · I plan it in my head · I do not really plan it · Prefer not to say
- Why we ask: Baseline budgeting behaviour (the Sisi budget task targets this)

**BEH4.** Imagine an unexpected expense as big as a month of your usual spending. How possible is it that you could find that money within 30 days?
- Type: Multiple choice · Priority 2 · Domain: Money behaviour (baseline and change)
- Options: Very possible · Somewhat possible · Not very possible · Not at all possible · Prefer not to say
- Why we ask: Baseline financial resilience
- Source or validity: Concept follows Global Findex emergency-funds item; wording is ours

#### Part 6: What you prefer
*These help us decide what to build next.*

**UX9.** If you tried the extras, how easy were they?
- Type: Multiple-choice grid · Priority 2 · Domain: Ease of use and understandability
- Rows: Payslip simulator · Money Buddy · Letterbox (friends) · Invest HER (simulation) · Talk to someone · Support page and Quick exit · Rewards
- Columns: Very difficult · Difficult · Okay · Easy · Very easy · I did not try this
- Why we ask: Ease of the optional features

**PF1.** How do you like to learn about money?
- Type: Multiple-choice grid · Priority 1 · Domain: Preferences, likes and dislikes
- Rows: Short text cards (like Sisi's lessons) · Short videos · Voice notes or audio · Live sessions with a facilitator · Quizzes and games · Worked examples with real rand amounts · Chatting with a person · Learning with friends
- Columns: Love it · Like it · Not for me
- Why we ask: Preferred vs not preferred learning formats

**PF2.** Sisi's tone felt…
- Type: Multiple-choice grid · Priority 1 · Domain: Preferences, likes and dislikes
- Rows: Patronising (1) to Respectful (5) · Complicated (1) to Simple (5) · Boring (1) to Engaging (5) · Judgemental (1) to Supportive (5)
- Columns: 1 · 2 · 3 · 4 · 5
- Why we ask: Brand voice check ('a smart older sister'): respectful, simple, engaging, supportive

**PF3.** How do you feel about points, badges and levels?
- Type: Multiple choice · Priority 1 · Domain: Preferences, likes and dislikes
- Options: They motivate me · I do not mind them · They put me off · I would switch them off
- Why we ask: Gamification preference (evidence rule: optional, with Focus mode)

**PF4.** How do you feel about leaderboards and friendly competition?
- Type: Multiple choice · Priority 1 · Domain: Preferences, likes and dislikes
- Options: Motivating · Fine, if it is optional · Uncomfortable · I would avoid it
- Why we ask: Competition preference (must stay optional)

**PF5.** If you earned a reward, which would you prefer?
- Type: Multiple choice · Priority 1 · Domain: Preferences, likes and dislikes
- Help text: Any pilot reward is subject to PPS approval.
- Options: Cash (for example R100) · An airtime or data voucher · Investment credit worth 10% more (for example R110) · An entry into a prize draw · No reward. I would use Sisi anyway
- Why we ask: Reward design: cash vs data vs investment credit vs draw
- Source or validity: Matches the app's reward options

**PF6.** Would rewards change how often you use Sisi?
- Type: Multiple choice · Priority 2 · Domain: Preferences, likes and dislikes
- Options: Yes, a lot · A little · No · Not sure
- Why we ask: Motivation effect of rewards

**PF7.** How would you most like to learn with others?
- Type: Multiple choice · Priority 2 · Domain: Preferences, likes and dislikes
- Options: On my own · With one friend (a Money Buddy) · In a small group (a Circle) · In a bigger community · It depends
- Why we ask: Social learning preference (Money Buddy, Circles, community)

**PF8.** In which language would you most like to learn about money?
- Type: Dropdown · Priority 1 · Domain: Access and inclusion
- Options: English · isiZulu · isiXhosa · Afrikaans · Sesotho · Setswana · Sepedi · Xitsonga · siSwati · Tshivenda · isiNdebele · Another language
- Why we ask: Language inclusion and localisation priority (SDG 4.5, 10.2)

**PF9.** How would you like Sisi to remind you? (Tick all that apply)
- Type: Checkboxes · Priority 3 · Domain: Preferences, likes and dislikes
- Options: In the app · WhatsApp · SMS · Email · I do not want reminders
- Why we ask: Reminder channel preference

#### Part 7: Trust, privacy and safety
*Your honest answers help us keep Sisi safe and trustworthy.*

**TR1.** How much do you agree with each statement?
- Type: Multiple-choice grid · Priority 1 · Domain: Trust, privacy and safety
- Rows: I understood that Sisi teaches about money but does not give personal financial advice. · I would be comfortable entering my real numbers in the budget tool. · I am comfortable that the amounts I enter stay private to me. · I felt safe taking part in the community. · I would know where to find help if something felt unsafe.
- Columns: Strongly disagree · Disagree · Neither agree nor disagree · Agree · Strongly agree · I did not try this
- Why we ask: Understanding of 'education, not advice', privacy comfort and safety in one grid

**TR2.** Did anything make you uncomfortable? (Tick all that apply)
- Type: Checkboxes · Priority 1 · Domain: Trust, privacy and safety
- Options: No, nothing · Yes, something in the community chat · Yes, something in a lesson · Yes, something about privacy or my data · Yes, something else
- Why we ask: Safety and harm signals

**TR3.** If yes, tell us more. Please do not include names or personal details.
- Type: Paragraph · Priority 2 · Domain: Trust, privacy and safety
- Why we ask: Detail on harm or discomfort

#### Part 8: Access and inclusion
*Sisi should work for every young woman. Tell us where it did not.*

**AC1.** How often do data costs or a weak connection stop you from using apps like Sisi?
- Type: Multiple choice · Priority 1 · Domain: Access and inclusion
- Options: Never · Sometimes · Often · Almost always
- Why we ask: Connectivity and cost barrier (SDG 10.2)

**AC2.** Was anything hard to see, read or tap? (Tick all that apply)
- Type: Checkboxes · Priority 2 · Domain: Access and inclusion
- Options: No problems · Text was hard to read · Buttons were hard to tap · Colours were hard to see · A screen reader or assistive tool did not work · Something else
- Why we ask: Accessibility barriers

**AC3.** Who do you think Sisi would work best for? Who might it not work for?
- Type: Paragraph · Priority 2 · Domain: Access and inclusion
- Why we ask: Who is left out, in their words

#### Part 9: Your money confidence and what you need
*Last section. Thank you for sticking with us.*

**BEH5.** How much do you agree with each statement about you today?
- Type: Multiple-choice grid · Priority 2 · Domain: Money behaviour (baseline and change)
- Rows: Before I buy something, I carefully consider whether I can afford it. · I set long-term financial goals and strive to achieve them. · I keep a close watch on my own money.
- Columns: Strongly disagree · Disagree · Neither agree nor disagree · Agree · Strongly agree
- Why we ask: Financial behaviour and attitude items (OECD/INFE-style)
- Source or validity: Adapted from the OECD/INFE financial literacy toolkit's behaviour and attitude items; confirm wording against the current toolkit

**AG1.** How much do you agree with each statement about you today?
- Type: Multiple-choice grid · Priority 2 · Domain: Women’s financial agency
- Rows: I have a say in big decisions about my money. · I feel able to say no to a request for money that I cannot afford. · I feel I can learn what I need to manage my money. · I know where to find trustworthy money information.
- Columns: Strongly disagree · Disagree · Neither agree nor disagree · Agree · Strongly agree · Prefer not to say
- Why we ask: Women's financial agency (draft scale, not yet validated)
- Source or validity: Draft items for this pilot. Check the item wording against a validated women's economic empowerment measure before publishing results

**IM1.** Learning about money like this could help me to… (Tick all that apply)
- Type: Checkboxes · Priority 1 · Domain: Impact and needs
- Options: Feel less stressed about money · Make and keep a budget · Start saving · Avoid or get out of debt · Start investing · Talk about money with my family · Ask for fair pay or fees · Start or grow a business or side hustle · Plan for study or my career · None of these
- Why we ask: Perceived benefit by outcome area (maps to SDG outcomes)

**IM2.** Which money situations do you most need help with right now? (Pick up to three)
- Type: Checkboxes · Priority 1 · Domain: Impact and needs
- Options: Making my allowance or bursary last · Understanding my first payslip · Store cards and debt · Supporting family · Saving for my studies · Starting a business · Starting to invest · Spotting scams and fraud · Something else · None of these
- Why we ask: Needs assessment: what to build next

**IM3.** Would you recommend Sisi to a friend?
- Type: Multiple choice · Priority 2 · Domain: Preferences, likes and dislikes
- Options: Yes · Maybe · No
- Why we ask: Advocacy and reach (ripple effect)

**Confirmation message:** Thank you! Your feedback helps make Sisi better for other young women. If you volunteered for the 4-week follow-up, look out for a message from the pilot team.


### Form 2: Day-7 follow-up

**Form title:** Sisi pilot: one week later

**Opening text:**

> Thanks for testing Sisi last week. This takes about 3 minutes and tells us whether anything changed for you. There are no right or wrong answers. Please do not include names or amounts. Taking part is voluntary and you can skip any question.

#### Part 1: One week later

**PID.** Your participant ID *(required)*
- Type: Short answer · Priority 1 · Domain: Consent and admin
- Help text: The same ID as before (looks like P-7K3Q9X). Type NONE if you do not have it.
- Why we ask: Join to the session data

**W1.** Since the session, how many times have you opened Sisi? *(required)*
- Type: Multiple choice · Priority 1 · Domain: Money behaviour (baseline and change)
- Options: Not at all · Once · 2 to 3 times · 4 or more times
- Why we ask: Return use

**W2.** Since the session, have you… (Tick all that apply) *(required)*
- Type: Checkboxes · Priority 1 · Domain: Money behaviour (baseline and change)
- Options: Made or updated a budget · Set a savings goal · Put money aside that I would not have saved otherwise · Started or added to an emergency fund · Talked about money with someone · Done a Sisi lesson with a friend · None of these
- Why we ask: Behaviour change versus the stated intentions (LC5)

**W3.** In the past 7 days, did you put any money aside as savings, even a small amount? *(required)*
- Type: Multiple choice · Priority 1 · Domain: Money behaviour (baseline and change)
- Options: Yes · No · Prefer not to say
- Why we ask: Savings behaviour (compare with BEH2)

**W4.** Which best describes how you planned your money this week? *(required)*
- Type: Multiple choice · Priority 1 · Domain: Money behaviour (baseline and change)
- Options: I kept a written or app budget · I planned it in my head · I did not really plan it · Prefer not to say
- Why we ask: Budgeting behaviour (compare with BEH3)

**W5.** How much do you agree with each statement NOW? *(required)*
- Type: Multiple-choice grid · Priority 1 · Domain: Learning and understanding
- Rows: I feel confident making everyday money decisions. · I could build a monthly budget and stick to it. · I know how to start saving for an emergency.
- Columns: 1 Not at all · 2 · 3 · 4 · 5 Completely
- Why we ask: Self-efficacy at day 7 (compare with LC1 and LC2)

**W6.** Have you used anything you learned in a real money decision? Tell us what, without amounts or names.
- Type: Paragraph · Priority 2 · Domain: Learning and understanding
- Why we ask: Transfer to real decisions

**W7.** If you did not use Sisi again, what got in the way? (Tick all that apply)
- Type: Checkboxes · Priority 1 · Domain: Ease of use and understandability
- Options: I forgot · I did not have time · Data costs or connection · I did not find it useful · I did not feel safe or comfortable · Technical problems · I did use it again · Something else
- Why we ask: Barriers to return

**W8.** Have you told anyone else about Sisi?
- Type: Multiple choice · Priority 2 · Domain: Preferences, likes and dislikes
- Options: Yes, one person · Yes, more than one person · No
- Why we ask: Word of mouth (ripple effect)

**W9.** What, if anything, has changed for you since the session?
- Type: Paragraph · Priority 1 · Domain: Impact and needs
- Why we ask: Self-reported change in their words

**Confirmation message:** Thank you! This helps us see whether Sisi makes a real difference after the session.


### Form 3: Contact form (optional, separate)

**Form title:** Sisi pilot: stay in touch (optional)

**Opening text:**

> This is a separate form on purpose, so your contact details are never stored with your feedback answers. Only fill it in if you would like to be contacted about the 4-week follow-up or the pilot prize draw. Pilot reward: subject to PPS approval.

#### Part 1: Stay in touch

**C1.** Your first name or nickname *(required)*
- Type: Short answer · Priority 2 · Domain: Consent and admin
- Why we ask: Contact

**C2.** Your email address or WhatsApp number *(required)*
- Type: Short answer · Priority 1 · Domain: Consent and admin
- Help text: Use only one.
- Why we ask: Contact channel

**C3.** What may we contact you about? (Tick all that apply) *(required)*
- Type: Checkboxes · Priority 1 · Domain: Consent and admin
- Options: The 4-week follow-up · The pilot prize draw · Future Sisi testing
- Why we ask: Purpose limitation

**C4.** Do you agree that we store your contact details only for the reasons you ticked, and delete them when the pilot ends? *(required)*
- Type: Multiple choice · Priority 1 · Domain: Consent and admin
- Options: Yes, I agree · No *(ends the form)*
- Why we ask: POPIA purpose and retention

**Confirmation message:** Thank you! We will only use your details for what you ticked.


## 7. Analysis plan (short)

- **Preference vs non-preference:** LK3 and LK4 (forced choices), PF1 (format), PF3–PF7 (gamification, rewards, social), cross-tabbed by DEM1/DEM2. Read LK1/LK2 open text and code themes (two people code a sample, agree, then code the rest).
- **Ease and understandability:** UX2 and UX8 against the in-app Single Ease Question; UX1 coded as "correct purpose / partly / wrong".
- **Learning and confidence:** LC1 vs LC2 (paired), LC4 for new-vs-known content, then the in-app knowledge gain.
- **SDG outcomes:** BEH1–BEH4 and BEH5 as the baseline profile of who the pilot reached; W2–W4 and W5 at day 7 as change; IM1/IM2 as perceived benefit and need; AG1 as agency. Report descriptively, by subgroup where n allows, and be clear that this is a small, self-selected pilot with no control group.
- **Equity cut:** compare ease, satisfaction and intent for DEM4/DEM5 (province, area), AC1 (data cost) and PF8 (language) to see who is being left behind.
