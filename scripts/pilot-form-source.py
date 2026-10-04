import json
SD = ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"]
EASE = ["Very difficult", "Difficult", "Okay", "Easy", "Very easy"]
CONF3 = ["I feel confident making everyday money decisions.", "I could build a monthly budget and stick to it.", "I know how to start saving for an emergency."]
CONF_COLS = ["1 Not at all", "2", "3", "4", "5 Completely"]
PNS = "Prefer not to say"

def q(id, part, section, type, title, domain, purpose, priority=2, required=False, options=None, rows=None, cols=None, help="", source="", scale=None, pattern=None, other=False, per_column=False, sdg=""):
    d = dict(id=id, part=part, section=section, type=type, title=title, domain=domain, purpose=purpose, priority=priority, required=required, help=help, source=source, sdg=sdg)
    if options: d["options"] = options
    if rows: d["rows"] = rows
    if cols: d["cols"] = cols
    if scale: d["scale"] = scale
    if pattern: d["pattern"] = pattern
    if other: d["other"] = True
    if per_column: d["perColumn"] = True
    return d

SECTION_PART = {"Welcome and consent": 1, "Your experience today": 2, "What you liked and did not like": 3, "What you learned": 4, "About you": 5, "Your money today": 5, "What you prefer": 6, "Trust, privacy and safety": 7, "Access and inclusion": 8, "Your money confidence and what you need": 9}
SDG = {"ACC": "SDG 5.b, 10.2, 4.5", "KNW": "SDG 4.4, 4.6", "UX": "SDG 4.6 (usability of learning)", "PREF": "(product design)", "TRUST": "SDG 5, 16.10 (safe, trusted)", "BEH": "SDG 8.10, 1.4", "AGY": "SDG 5.a", "DEM": "SDG 10.2 (who benefits)", "CONT": "(admin)", "IMP": "SDG 8, 4.4, 1.4"}

items = []
A = items.append
# ---------- PART 1: consent ----------
A(q("CONSENT", 1, "Welcome and consent", "choice", "Do you agree to take part?", "CONT", "Informed, voluntary, adult consent before any data is collected", 1, True,
    options=[{"v": "Yes, I am 18 or older and I agree to take part", "go": "continue"}, {"v": "No, I do not agree", "go": "submit"}],
    help="You can stop at any time. Skip any question you prefer not to answer (except this one and your ID).", source="POPIA consent; wording to be confirmed by PPS"))
A(q("PID", 2, "Your experience today", "text", "Your participant ID", "CONT", "Links this form to the anonymous in-app results without using a name or email", 1, True,
    help="You will see it on the last screen of the Sisi pilot. It looks like P-7K3Q9X. Type NONE if you did not get one.", pattern=r"^(P-[A-Z0-9]{6}|NONE)$", source="App participant id"))
# ---------- PART 2: about you ----------
S2 = "About you"
A(q("DEM1", 2, S2, "choice", "How old are you?", "DEM", "Equity analysis: who the pilot reached", 1, options=["18–20", "21–23", "24–26", "27 or older", PNS]))
A(q("DEM2", 2, S2, "choice", "Which best describes you right now?", "DEM", "Equity analysis and sampling check (students vs first-jobbers)", 1,
    options=["University or college student", "Student who also works", "In my first job (under 2 years)", "Working for 2 years or more", "Not studying or working at the moment", "Something else", PNS]))
A(q("DEM3", 2, S2, "checkbox", "Where does your money mostly come from? (Tick all that apply)", "DEM", "Context for what advice and tools fit; income source only, never amounts", 2,
    options=["Allowance or support from family", "Bursary or NSFAS", "Part-time or casual work", "A salary", "My own business or side hustle", "Other", PNS]))
A(q("DEM4", 2, S2, "dropdown", "Which province do you mostly live in?", "DEM", "Geographic reach and inequality (SDG 10)", 2,
    options=["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape", "I live outside South Africa", PNS]))
A(q("DEM5", 2, S2, "choice", "What kind of area do you mostly live in?", "DEM", "Urban-rural reach", 2, options=["City", "Town", "Township or the outskirts of a city", "Rural area", PNS]))
A(q("DEM6", 2, S2, "choice", "How do you usually get online?", "ACC", "Digital access: phone ownership and shared access (SDG 5.b)", 2,
    options=["My own smartphone", "A smartphone I share with someone", "A computer or laptop", "Mostly at campus, work or a library", "Other"], other=True))
# ---------- PART 3: baseline ----------
S3 = "Your money today"
A(q("BEH1", 3, S3, "choice", "Do you have your own account with a bank or a mobile-money service?", "BEH", "Baseline for formal financial inclusion (account ownership)", 1,
    options=["Yes, a bank account", "Yes, mobile money only", "Yes, both", "No", PNS], source="Concept follows Global Findex account ownership; wording is ours"))
A(q("BEH2", 3, S3, "choice", "In the past 3 months, did you put any money aside as savings, even a small amount?", "BEH", "Baseline saving behaviour", 1, options=["Yes, regularly", "Yes, sometimes", "No", PNS]))
A(q("BEH3", 3, S3, "choice", "Which best describes how you plan your money?", "BEH", "Baseline budgeting behaviour (the Sisi budget task targets this)", 2,
    options=["I keep a written or app budget", "I plan it in my head", "I do not really plan it", PNS]))
A(q("BEH4", 3, S3, "choice", "Imagine an unexpected expense as big as a month of your usual spending. How possible is it that you could find that money within 30 days?", "BEH", "Baseline financial resilience", 2,
    options=["Very possible", "Somewhat possible", "Not very possible", "Not at all possible", PNS], source="Concept follows Global Findex emergency-funds item; wording is ours"))
# ---------- PART 4: experience ----------
S4 = "Your experience today"
A(q("UX1", 4, S4, "paragraph", "In one sentence, what is Sisi for? (Write it in your own words.)", "UX", "Understandability: did people grasp the purpose without being told?", 1, True))
A(q("UX2", 4, S4, "grid", "How much do you agree with each statement?", "UX", "Understandability, relevance, trust and belonging in one grid (the community and safety are covered again in the optional Trust section)", 1, True,
    rows=["It was always clear what to do next.", "The words used were easy to understand.", "The examples fit my life.", "The budget task was easy to follow.", "I trusted the information I saw.", "Sisi feels like it was made for women like me."],
    cols=SD + ["I did not try this"], per_column=False, source="Likert; items drafted for this pilot"))
A(q("UX3", 4, S4, "choice", "How was the length of the lesson?", "UX", "Pacing", 2, options=["Too short", "Just right", "Too long", "I did not do the lesson"]))
A(q("UX4", 4, S4, "choice", "How much text was on each screen?", "UX", "Readability and density", 2, options=["Too little", "About right", "Too much"]))
A(q("UX5", 4, S4, "paragraph", "Was anything confusing? Tell us which words, screens or steps.", "UX", "Pinpoints specific comprehension and navigation problems", 1))
A(q("UX6", 4, S4, "choice", "Did you ever feel like giving up?", "UX", "Drop-off risk", 2, options=["No, never", "Yes, a little", "Yes, I nearly stopped"]))
A(q("UX7", 4, S4, "paragraph", "If yes, where was that and what made you feel that way?", "UX", "Locates the drop-off point", 3))
A(q("UX8", 4, S4, "grid", "How easy was each part?", "UX", "Comparative ease across the four core tasks (compare with the in-app Single Ease Question)", 1, True,
    rows=["Choosing and joining a community", "The lesson", "The budget task", "Chatting in the community"], cols=EASE + ["I did not try this"]))
# ---------- PART 5: liked / not ----------
S5 = "What you liked and did not like"
A(q("LK1", 5, S5, "paragraph", "What did you like most? Up to three things.", "PREF", "Open likes, in their words", 1, True))
A(q("LK2", 5, S5, "paragraph", "What did you like least or find frustrating? Up to three things.", "PREF", "Open dislikes, in their words", 1, True))
A(q("LK3", 5, S5, "choice", "Which ONE part of Sisi was most useful to you?", "PREF", "Forced choice: preferred feature", 1, True,
    options=["The lesson", "The budget task", "The community chat", "Events", "Money Buddy", "Letterbox (friends)", "Payslip simulator", "Invest HER (simulation)", "Talk to someone", "Rewards", "None of them"]))
A(q("LK4", 5, S5, "choice", "If we could change only ONE thing first, what should it be?", "PREF", "Forced choice: top priority to fix", 1, True,
    options=["Make the lessons shorter or simpler", "Make the budget tool simpler", "Make the community easier to use", "Add more topics", "Make it faster or work better on my phone", "Make rewards clearer", "Make it feel more like my life", "Something else"], other=True))
A(q("LK5", 5, S5, "paragraph", "Was there something you expected to find that was not there?", "PREF", "Unmet expectations and missing features", 2))
A(q("LK6", 5, S5, "scale", "Overall, how satisfied are you with Sisi?", "PREF", "Overall satisfaction (CSAT)", 1, True, scale=dict(min=1, max=5, low="Very dissatisfied", high="Very satisfied")))
# ---------- PART 6: learning ----------
S6 = "What you learned"
A(q("LC1", 6, S6, "grid", "BEFORE today, how much did you agree with each statement? (Think back.)", "KNW", "Retrospective baseline for self-efficacy (then-test)", 1, True, rows=CONF3, cols=CONF_COLS,
    source="Same three statements as the in-app check. Then/now design reduces response-shift bias"))
A(q("LC2", 6, S6, "grid", "NOW, after using Sisi, how much do you agree?", "KNW", "Self-efficacy after the session", 1, True, rows=CONF3, cols=CONF_COLS))
A(q("LC3", 6, S6, "paragraph", "What is one thing you learned or understood better today?", "KNW", "Unprompted learning, in their words", 2))
A(q("LC4", 6, S6, "checkbox", "Which of these ideas were new to you? (Tick all that apply)", "KNW", "Which content is genuinely new vs already known (guides what to keep)", 2,
    options=["Borrowing costs more than saving up", "An emergency fund of 3 to 6 months of basic costs", "Needs versus wants", "Spend, save, grow (Now-Now, Stack It, Grow It)", "SMART goals", "Why starting early matters", "None. I already knew all of these"]))
A(q("LC5", 6, S6, "checkbox", "In the next 7 days, I plan to… (Tick all that apply)", "BEH", "Stated intention, checked against the day-7 follow-up", 1,
    options=["Make or update a budget", "Set a savings goal", "Start or add to an emergency fund", "Talk to someone about money", "Open Sisi again", "Do the lessons with a friend", "Nothing yet"]))
A(q("LC6", 6, S6, "scale", "How likely are you to open Sisi again next week?", "PREF", "Behavioural intent (retention proxy)", 1, True, scale=dict(min=1, max=5, low="Not at all likely", high="Extremely likely")))
A(q("Z1", 6, S6, "paragraph", "Anything else you would like to tell us?", "PREF", "Catch-all", 3))
# ---------- PART 7: preferences (deep) ----------
S7 = "What you prefer"
A(q("UX9", 7, S7, "grid", "If you tried the extras, how easy were they?", "UX", "Ease of the optional features", 2,
    rows=["Payslip simulator", "Money Buddy", "Letterbox (friends)", "Invest HER (simulation)", "Talk to someone", "Support page and Quick exit", "Rewards"], cols=EASE + ["I did not try this"]))
A(q("PF1", 7, S7, "grid", "How do you like to learn about money?", "PREF", "Preferred vs not preferred learning formats", 1,
    rows=["Short text cards (like Sisi's lessons)", "Short videos", "Voice notes or audio", "Live sessions with a facilitator", "Quizzes and games", "Worked examples with real rand amounts", "Chatting with a person", "Learning with friends"], cols=["Love it", "Like it", "Not for me"]))
A(q("PF2", 7, S7, "grid", "Sisi's tone felt…", "PREF", "Brand voice check ('a smart older sister'): respectful, simple, engaging, supportive", 1,
    rows=["Patronising (1) to Respectful (5)", "Complicated (1) to Simple (5)", "Boring (1) to Engaging (5)", "Judgemental (1) to Supportive (5)"], cols=["1", "2", "3", "4", "5"]))
A(q("PF3", 7, S7, "choice", "How do you feel about points, badges and levels?", "PREF", "Gamification preference (evidence rule: optional, with Focus mode)", 1, options=["They motivate me", "I do not mind them", "They put me off", "I would switch them off"]))
A(q("PF4", 7, S7, "choice", "How do you feel about leaderboards and friendly competition?", "PREF", "Competition preference (must stay optional)", 1, options=["Motivating", "Fine, if it is optional", "Uncomfortable", "I would avoid it"]))
A(q("PF5", 7, S7, "choice", "If you earned a reward, which would you prefer?", "PREF", "Reward design: cash vs data vs investment credit vs draw", 1,
    options=["Cash (for example R100)", "An airtime or data voucher", "Investment credit worth 10% more (for example R110)", "An entry into a prize draw", "No reward. I would use Sisi anyway"],
    help="Any pilot reward is subject to PPS approval.", source="Matches the app's reward options"))
A(q("PF6", 7, S7, "choice", "Would rewards change how often you use Sisi?", "PREF", "Motivation effect of rewards", 2, options=["Yes, a lot", "A little", "No", "Not sure"]))
A(q("PF7", 7, S7, "choice", "How would you most like to learn with others?", "PREF", "Social learning preference (Money Buddy, Circles, community)", 2,
    options=["On my own", "With one friend (a Money Buddy)", "In a small group (a Circle)", "In a bigger community", "It depends"]))
A(q("PF8", 7, S7, "dropdown", "In which language would you most like to learn about money?", "ACC", "Language inclusion and localisation priority (SDG 4.5, 10.2)", 1,
    options=["English", "isiZulu", "isiXhosa", "Afrikaans", "Sesotho", "Setswana", "Sepedi", "Xitsonga", "siSwati", "Tshivenda", "isiNdebele", "Another language"]))
A(q("PF9", 7, S7, "checkbox", "How would you like Sisi to remind you? (Tick all that apply)", "PREF", "Reminder channel preference", 3, options=["In the app", "WhatsApp", "SMS", "Email", "I do not want reminders"]))
# ---------- PART 8: trust ----------
S8 = "Trust, privacy and safety"
A(q("TR1", 8, S8, "grid", "How much do you agree with each statement?", "TRUST", "Understanding of 'education, not advice', privacy comfort and safety in one grid", 1,
    rows=["I understood that Sisi teaches about money but does not give personal financial advice.", "I would be comfortable entering my real numbers in the budget tool.", "I am comfortable that the amounts I enter stay private to me.", "I felt safe taking part in the community.", "I would know where to find help if something felt unsafe."],
    cols=SD + ["I did not try this"]))
A(q("TR2", 8, S8, "checkbox", "Did anything make you uncomfortable? (Tick all that apply)", "TRUST", "Safety and harm signals", 1,
    options=["No, nothing", "Yes, something in the community chat", "Yes, something in a lesson", "Yes, something about privacy or my data", "Yes, something else"]))
A(q("TR3", 8, S8, "paragraph", "If yes, tell us more. Please do not include names or personal details.", "TRUST", "Detail on harm or discomfort", 2))
# ---------- PART 9: access ----------
S9 = "Access and inclusion"
A(q("AC1", 9, S9, "choice", "How often do data costs or a weak connection stop you from using apps like Sisi?", "ACC", "Connectivity and cost barrier (SDG 10.2)", 1, options=["Never", "Sometimes", "Often", "Almost always"]))
A(q("AC2", 9, S9, "checkbox", "Was anything hard to see, read or tap? (Tick all that apply)", "ACC", "Accessibility barriers", 2,
    options=["No problems", "Text was hard to read", "Buttons were hard to tap", "Colours were hard to see", "A screen reader or assistive tool did not work", "Something else"]))
A(q("AC3", 9, S9, "paragraph", "Who do you think Sisi would work best for? Who might it not work for?", "ACC", "Who is left out, in their words", 2))
# ---------- PART 10: confidence, agency, needs ----------
S10 = "Your money confidence and what you need"
A(q("BEH5", 10, S10, "grid", "How much do you agree with each statement about you today?", "BEH", "Financial behaviour and attitude items (OECD/INFE-style)", 2,
    rows=["Before I buy something, I carefully consider whether I can afford it.", "I set long-term financial goals and strive to achieve them.", "I keep a close watch on my own money."], cols=SD,
    source="Adapted from the OECD/INFE financial literacy toolkit's behaviour and attitude items; confirm wording against the current toolkit"))
A(q("AG1", 10, S10, "grid", "How much do you agree with each statement about you today?", "AGY", "Women's financial agency (draft scale, not yet validated)", 2,
    rows=["I have a say in big decisions about my money.", "I feel able to say no to a request for money that I cannot afford.", "I feel I can learn what I need to manage my money.", "I know where to find trustworthy money information."], cols=SD + [PNS],
    source="Draft items for this pilot. Check the item wording against a validated women's economic empowerment measure before publishing results"))
A(q("IM1", 10, S10, "checkbox", "Learning about money like this could help me to… (Tick all that apply)", "IMP", "Perceived benefit by outcome area (maps to SDG outcomes)", 1,
    options=["Feel less stressed about money", "Make and keep a budget", "Start saving", "Avoid or get out of debt", "Start investing", "Talk about money with my family", "Ask for fair pay or fees", "Start or grow a business or side hustle", "Plan for study or my career", "None of these"]))
A(q("IM2", 10, S10, "checkbox", "Which money situations do you most need help with right now? (Pick up to three)", "IMP", "Needs assessment: what to build next", 1,
    options=["Making my allowance or bursary last", "Understanding my first payslip", "Store cards and debt", "Supporting family", "Saving for my studies", "Starting a business", "Starting to invest", "Spotting scams and fraud", "Something else", "None of these"]))
A(q("IM3", 10, S10, "choice", "Would you recommend Sisi to a friend?", "PREF", "Advocacy and reach (ripple effect)", 2, options=["Yes", "Maybe", "No"]))

# ---------- FORM 2: day 7 ----------
d7 = []
B = d7.append
S = "One week later"
B(q("PID", 1, S, "text", "Your participant ID", "CONT", "Join to the session data", 1, True, help="The same ID as before (looks like P-7K3Q9X). Type NONE if you do not have it.", pattern=r"^(P-[A-Z0-9]{6}|NONE)$"))
B(q("W1", 1, S, "choice", "Since the session, how many times have you opened Sisi?", "BEH", "Return use", 1, True, options=["Not at all", "Once", "2 to 3 times", "4 or more times"]))
B(q("W2", 1, S, "checkbox", "Since the session, have you… (Tick all that apply)", "BEH", "Behaviour change versus the stated intentions (LC5)", 1, True,
    options=["Made or updated a budget", "Set a savings goal", "Put money aside that I would not have saved otherwise", "Started or added to an emergency fund", "Talked about money with someone", "Done a Sisi lesson with a friend", "None of these"]))
B(q("W3", 1, S, "choice", "In the past 7 days, did you put any money aside as savings, even a small amount?", "BEH", "Savings behaviour (compare with BEH2)", 1, True, options=["Yes", "No", PNS]))
B(q("W4", 1, S, "choice", "Which best describes how you planned your money this week?", "BEH", "Budgeting behaviour (compare with BEH3)", 1, True, options=["I kept a written or app budget", "I planned it in my head", "I did not really plan it", PNS]))
B(q("W5", 1, S, "grid", "How much do you agree with each statement NOW?", "KNW", "Self-efficacy at day 7 (compare with LC1 and LC2)", 1, True, rows=CONF3, cols=CONF_COLS))
B(q("W6", 1, S, "paragraph", "Have you used anything you learned in a real money decision? Tell us what, without amounts or names.", "KNW", "Transfer to real decisions", 2))
B(q("W7", 1, S, "checkbox", "If you did not use Sisi again, what got in the way? (Tick all that apply)", "UX", "Barriers to return", 1,
    options=["I forgot", "I did not have time", "Data costs or connection", "I did not find it useful", "I did not feel safe or comfortable", "Technical problems", "I did use it again", "Something else"]))
B(q("W8", 1, S, "choice", "Have you told anyone else about Sisi?", "PREF", "Word of mouth (ripple effect)", 2, options=["Yes, one person", "Yes, more than one person", "No"]))
B(q("W9", 1, S, "paragraph", "What, if anything, has changed for you since the session?", "IMP", "Self-reported change in their words", 1))

form = dict(
  main=dict(title="Sisi pilot feedback", description=("Thank you for testing Sisi, a money-confidence app for young women, made with PPS Investments.\n\nThis form takes about 7 to 9 minutes, plus about 5 optional minutes at the end if you want to tell us more. It is not a test of you. We are testing Sisi, and honest answers, including critical ones, help most.\n\n"
    "What we collect: your answers here. No name, email, ID number or bank details, and no amounts of your own money. Your answers are used by the Sisi pilot team to improve the app and to report anonymised, combined results to PPS Investments.\n"
    "Taking part is voluntary. You can stop at any time and skip any question you prefer not to answer.\n\nSisi is education, not financial advice."),
    confirmation="Thank you! Your feedback helps make Sisi better for other young women. If you volunteered for the 4-week follow-up, look out for a message from the pilot team."),
  day7=dict(title="Sisi pilot: one week later", description="Thanks for testing Sisi last week. This takes about 3 minutes and tells us whether anything changed for you. There are no right or wrong answers. Please do not include names or amounts. Taking part is voluntary and you can skip any question.", confirmation="Thank you! This helps us see whether Sisi makes a real difference after the session."),
  contact=dict(title="Sisi pilot: stay in touch (optional)", description="This is a separate form on purpose, so your contact details are never stored with your feedback answers. Only fill it in if you would like to be contacted about the 4-week follow-up or the pilot prize draw. Pilot reward: subject to PPS approval.", confirmation="Thank you! We will only use your details for what you ticked."),
)
contact = [
  q("C1", 1, "Stay in touch", "text", "Your first name or nickname", "CONT", "Contact", 2, True),
  q("C2", 1, "Stay in touch", "text", "Your email address or WhatsApp number", "CONT", "Contact channel", 1, True, help="Use only one."),
  q("C3", 1, "Stay in touch", "checkbox", "What may we contact you about? (Tick all that apply)", "CONT", "Purpose limitation", 1, True, options=["The 4-week follow-up", "The pilot prize draw", "Future Sisi testing"]),
  q("C4", 1, "Stay in touch", "choice", "Do you agree that we store your contact details only for the reasons you ticked, and delete them when the pilot ends?", "CONT", "POPIA purpose and retention", 1, True, options=[{"v": "Yes, I agree", "go": "continue"}, {"v": "No", "go": "submit"}]),
]
for it in items: it["part"] = SECTION_PART[it["section"]]
items.sort(key=lambda x: (x["part"], 0))
SECTION_HELP = {"About you": "These help us see who Sisi works for. They are all optional. Choose \"Prefer not to say\" or skip anything you like.", "Your money today": "These questions are about you today, not about Sisi. There are no right or wrong answers.", "Your experience today": "Think about what you just did in the pilot.", "What you liked and did not like": "Be as honest as you like. Critical answers are the most useful.", "What you learned": "A few questions about what changed for you today.", "What you prefer": "These help us decide what to build next.", "Trust, privacy and safety": "Your honest answers help us keep Sisi safe and trustworthy.", "Access and inclusion": "Sisi should work for every young woman. Tell us where it did not.", "Your money confidence and what you need": "Last section. Thank you for sticking with us.", "One week later": "", "Stay in touch": ""}
json.dump(dict(sectionHelp=SECTION_HELP, domains=SDG, forms=form, main=items, day7=d7, contact=contact), open("docs/pilot-form/questions.json", "w"), indent=1, ensure_ascii=False)
print(len(items), len(d7), len(contact))
