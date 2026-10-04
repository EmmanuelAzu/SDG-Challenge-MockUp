import json
PNS = "Prefer not to say"
SDG = {"ACC": "SDG 5.b, 10.2, 4.5", "KNW": "SDG 4.4, 4.6", "UX": "SDG 4.6 (usability of learning)", "PREF": "(product design)", "TRUST": "SDG 5, 16.10 (safe, trusted)", "BEH": "SDG 8.10, 1.4", "DEM": "SDG 10.2 (who benefits)", "CONT": "(admin)", "IMP": "SDG 8, 4.4, 1.4"}

def q(id, type, title, domain, purpose, options=None, required=False, help="", source="", pattern=None, other=False, expand=True):
    d = dict(id=id, type=type, title=title, domain=domain, purpose=purpose, required=required, help=help, source=source, expand=expand and type in ("choice", "checkbox"))
    if options: d["options"] = options
    if pattern: d["pattern"] = pattern
    if other: d["other"] = True
    return d

main = [
 q("CONSENT", "choice", "Do you agree to take part?", "CONT", "Informed, voluntary, adult consent before any data is collected", required=True, expand=False,
   options=[{"v": "Yes, I am 18 or older and I agree to take part", "go": "continue"}, {"v": "No, I do not agree", "go": "submit"}],
   help="You can stop at any time and skip any question you prefer not to answer.", source="POPIA consent; wording to be confirmed by PPS"),
 q("PID", "text", "Your participant ID", "CONT", "Links this form to the anonymous in-app results without using a name or email", required=True,
   help="You will see it on the last screen of the Sisi pilot. It looks like P-7K3Q9X. Type NONE if you did not get one.", pattern=r"^(P-[A-Z0-9]{6}|NONE)$", source="App participant id"),
 # About you and your money today
 q("Q1", "choice", "How old are you?", "DEM", "Equity: who the pilot reached", options=["18–20", "21–23", "24–26", "27 or older", PNS]),
 q("Q2", "choice", "Which best describes you right now?", "DEM", "Equity and sampling check (students vs first-jobbers)",
   options=["University or college student", "Student who also works", "In my first job (under 2 years)", "Working for 2 years or more", "Not studying or working at the moment", "Something else", PNS]),
 q("Q3", "choice", "Do you have your own account with a bank or a mobile-money service?", "BEH", "Baseline formal financial inclusion (account ownership)",
   options=["Yes, a bank account", "Yes, mobile money only", "Yes, both", "No", PNS], source="Concept follows Global Findex account ownership; wording is ours"),
 q("Q4", "choice", "In the past 3 months, did you put any money aside as savings, even a small amount?", "BEH", "Baseline saving behaviour (compare with the day-7 follow-up)", options=["Yes, regularly", "Yes, sometimes", "No", PNS]),
 # Understanding and ease
 q("Q5", "choice", "What is Sisi mainly for?", "UX", "Understandability: did people grasp the purpose without being told? (Correct answer: the first option.)",
   options=["Learning about money in plain words and practising with simple tools", "Getting personal financial advice", "Opening a bank account or taking out a loan", "Buying and selling investments with real money", "I am not sure"]),
 q("Q6", "choice", "How clear was it what to do next at each step?", "UX", "Navigation clarity", options=["Always clear", "Mostly clear", "Sometimes unclear", "Often unclear", "Never clear"]),
 q("Q7", "choice", "How easy were the words and explanations to understand?", "UX", "Language understandability", options=["Very easy", "Easy", "Okay", "Difficult", "Very difficult"]),
 # Liked / disliked / preferences
 q("Q8", "checkbox", "What did you like? (Tick up to three)", "PREF", "Likes, in structured form", other=True,
   options=["The short, clear lesson", "The budget task", "The community and chat", "The friendly tone", "Points, badges or rewards", "That it felt private and safe", "How simple it looked", "Nothing in particular"]),
 q("Q9", "checkbox", "What did you dislike or find frustrating? (Tick up to three)", "PREF", "Dislikes and friction, in structured form", other=True,
   options=["Words I did not understand", "The lesson was too long", "Too much text on screen", "The budget task was hard", "The community felt unclear or awkward", "It was slow or did not work well on my phone", "Data cost or a weak connection", "Something felt unsafe or uncomfortable", "Nothing"]),
 q("Q10", "choice", "Which ONE part of Sisi was most useful to you?", "PREF", "Forced choice: preferred feature",
   options=["The lesson", "The budget task", "The community chat", "Events", "Money Buddy", "Letterbox (friends)", "Payslip simulator", "Invest HER (simulation)", "Talk to someone", "Rewards", "None of them"]),
 q("Q11", "choice", "If we could change only ONE thing first, what should it be?", "PREF", "Forced choice: top priority to fix", other=True,
   options=["Make the lessons shorter or simpler", "Make the budget tool simpler", "Make the community easier to use", "Add more topics", "Make it faster or work better on my phone", "Make rewards clearer", "Make it feel more like my life"]),
 q("Q12", "choice", "Overall, how satisfied are you with Sisi?", "PREF", "Overall satisfaction (CSAT)", options=["Very satisfied", "Satisfied", "Neither satisfied nor dissatisfied", "Dissatisfied", "Very dissatisfied"]),
 # Learning, intent, impact
 q("Q13", "choice", "Compared with before today, how confident do you feel about making everyday money decisions?", "KNW", "Retrospective self-efficacy change (second estimate beside the in-app before/after)",
   options=["Much more confident", "A bit more confident", "About the same", "A bit less confident", "Much less confident"], source="Retrospective then/now design reduces response-shift bias"),
 q("Q14", "checkbox", "Learning about money like this could help me to… (Tick all that apply)", "IMP", "Perceived benefit by outcome area (maps to SDG outcomes)", other=True,
   options=["Feel less stressed about money", "Make and keep a budget", "Start saving", "Avoid or get out of debt", "Start investing", "Talk about money with my family", "Ask for fair pay or fees", "Start or grow a business or side hustle", "Plan for study or my career", "None of these"]),
 q("Q15", "checkbox", "In the next 7 days, I plan to… (Tick all that apply)", "BEH", "Stated intention, checked against the day-7 follow-up",
   options=["Make or update a budget", "Set a savings goal", "Start or add to an emergency fund", "Talk to someone about money", "Open Sisi again", "Do the lessons with a friend", "Nothing yet"]),
 q("Q16", "checkbox", "What would make you most likely to come back? (Tick up to two)", "PREF", "Retention drivers: reminders, rewards, social, content, language, length", other=True,
   options=["Reminders", "Rewards or prize draws", "Doing it with a friend (Money Buddy)", "More topics that fit my life", "Lessons in my own language", "Shorter lessons", "Live sessions or events", "Nothing would"]),
 # Trust and access
 q("Q17", "choice", "How safe and comfortable did you feel using Sisi, including the community?", "TRUST", "Trust, privacy and safety",
   options=["Very safe and comfortable", "Mostly safe and comfortable", "Neutral", "A bit uneasy", "Not safe or comfortable", "I did not use the community"]),
 q("Q18", "checkbox", "What could stop you using an app like Sisi regularly? (Tick all that apply)", "ACC", "Access and inclusion barriers (SDG 5.b, 10.2)", other=True,
   options=["Data cost", "A weak connection", "Sharing a phone", "The language", "Not having time", "Worry about privacy", "Hard to read or tap (text size, colours, buttons)", "Nothing"]),
]

day7 = [
 q("PID", "text", "Your participant ID", "CONT", "Join to the session data", required=True, help="The same ID as before (looks like P-7K3Q9X). Type NONE if you do not have it.", pattern=r"^(P-[A-Z0-9]{6}|NONE)$"),
 q("D1", "choice", "Since the session, how many times have you opened Sisi?", "BEH", "Return use", options=["Not at all", "Once", "2 to 3 times", "4 or more times"], required=True),
 q("D2", "checkbox", "Since the session, have you… (Tick all that apply)", "BEH", "Behaviour change vs the stated intentions (Q15)", required=True, other=True,
   options=["Made or updated a budget", "Set a savings goal", "Put money aside that I would not have saved otherwise", "Started or added to an emergency fund", "Talked about money with someone", "Done a Sisi lesson with a friend", "None of these"]),
 q("D3", "choice", "In the past 7 days, did you put any money aside as savings, even a small amount?", "BEH", "Savings behaviour (compare with Q4)", options=["Yes", "No", PNS], required=True),
 q("D4", "choice", "Which best describes how you planned your money this week?", "BEH", "Budgeting behaviour", options=["I kept a written or app budget", "I planned it in my head", "I did not really plan it", PNS], required=True),
 q("D5", "choice", "Compared with before the session, how confident do you feel now about everyday money decisions?", "KNW", "Self-efficacy at day 7 (compare with Q13)", required=True,
   options=["Much more confident", "A bit more confident", "About the same", "A bit less confident", "Much less confident"]),
 q("D6", "choice", "Have you used something you learned in a real money decision?", "KNW", "Transfer to real decisions (ask them not to include amounts or names)", options=["Yes", "Not yet", "Not sure"], required=True),
 q("D7", "checkbox", "If you did not use Sisi again, what got in the way? (Tick all that apply)", "UX", "Barriers to return", other=True,
   options=["I forgot", "I did not have time", "Data costs or connection", "I did not find it useful", "I did not feel safe or comfortable", "Technical problems", "I did use it again"]),
 q("D8", "choice", "Have you told anyone else about Sisi?", "PREF", "Word of mouth (ripple effect)", options=["Yes, one person", "Yes, more than one person", "No"], required=True),
 q("D9", "choice", "Since the session, does money feel…", "IMP", "Self-reported change in how manageable money feels", required=True,
   options=["More manageable", "About the same", "Less manageable", "Not sure"]),
]
contact = [
 q("C1", "text", "Your first name or nickname", "CONT", "Contact", required=True, expand=False),
 q("C2", "text", "Your email address or WhatsApp number", "CONT", "Contact channel", required=True, help="Use only one.", expand=False),
 q("C3", "checkbox", "What may we contact you about? (Tick all that apply)", "CONT", "Purpose limitation", required=True, expand=False, options=["The 4-week follow-up", "The pilot prize draw", "Future Sisi testing"]),
 q("C4", "choice", "Do you agree that we store your contact details only for the reasons you ticked, and delete them when the pilot ends?", "CONT", "POPIA purpose and retention", required=True, expand=False, options=[{"v": "Yes, I agree", "go": "continue"}, {"v": "No", "go": "submit"}]),
]
SECT = {"CONSENT": "Welcome and consent", "PID": "About you", "Q1": "About you", "Q2": "About you", "Q3": "About you", "Q4": "About you", "Q5": "Understanding and ease", "Q6": "Understanding and ease", "Q7": "Understanding and ease",
  "Q8": "What you liked and prefer", "Q9": "What you liked and prefer", "Q10": "What you liked and prefer", "Q11": "What you liked and prefer", "Q12": "What you liked and prefer",
  "Q13": "Learning and what is next", "Q14": "Learning and what is next", "Q15": "Learning and what is next", "Q16": "Learning and what is next", "Q17": "Trust and access", "Q18": "Trust and access"}
for it in main: it["section"] = SECT[it["id"]]
for it in day7: it["section"] = "One week later"
for it in contact: it["section"] = "Stay in touch"
SECTION_HELP = {"About you": "These help us see who Sisi works for. Everything except your participant ID is optional. Choose Prefer not to say or skip anything you like.", "Understanding and ease": "Think about what you just did in the pilot.", "What you liked and prefer": "Be as honest as you like. Critical answers are the most useful.", "Learning and what is next": "A few questions about what changed for you and what would help.", "Trust and access": "Last section. Thank you for sticking with us.", "One week later": "", "Stay in touch": ""}
forms = dict(
  main=dict(title="Sisi pilot feedback", description=("Thank you for testing Sisi, a money-confidence app for young women, made with PPS Investments.\n\nThere are 18 quick questions, about 3 minutes. Every question is multiple choice, and each has an optional box if you want to say more. It is not a test of you. We are testing Sisi, and honest answers, including critical ones, help most.\n\n"
    "What we collect: your answers here. No name, email, ID number or bank details, and no amounts of your own money. The Sisi pilot team uses them to improve the app and to report anonymised, combined results to PPS Investments.\n"
    "Taking part is voluntary. You can stop at any time and skip any question you prefer not to answer.\n\nSisi is education, not financial advice."),
    confirmation="Thank you! Your feedback helps make Sisi better for other young women."),
  day7=dict(title="Sisi pilot: one week later", description="Thanks for testing Sisi last week. There are 9 quick multiple-choice questions, about 2 minutes, to see whether anything changed for you. Each has an optional box if you want to say more. Please do not include names or amounts. Taking part is voluntary and you can skip any question.", confirmation="Thank you! This helps us see whether Sisi makes a real difference after the session."),
  contact=dict(title="Sisi pilot: stay in touch (optional)", description="This is a separate form on purpose, so your contact details are never stored with your feedback answers. Only fill it in if you would like to be contacted about the 4-week follow-up or the pilot prize draw. Pilot reward: subject to PPS approval.", confirmation="Thank you! We will only use your details for what you ticked."),
)
json.dump(dict(sectionHelp=SECTION_HELP, domains=SDG, forms=forms, main=main, day7=day7, contact=contact, expandLabel="Want to tell us more? (optional)"), open("docs/pilot-form/questions.json", "w"), indent=1, ensure_ascii=False)
print(len(main), len(day7), len(contact), "questions in main (incl. consent and ID):", len(main))
