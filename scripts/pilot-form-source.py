import json
PNS = "Prefer not to say"
SDG = {"KNW": "SDG 4.4, 4.6", "UX": "SDG 4.6", "ACC": "SDG 4.5, 5.b (equity cuts for SDG 10.2)", "BEH": "SDG 5.a, 4.4", "AGY": "SDG 5.a, 5.1", "REL": "SDG 5, 4.5 (gender-responsive)", "FEAT": "(product design: feature experience)", "TRUST": "SDG 5 (safe participation)", "IMP": "SDG 4.4, 5.a", "DEM": "SDG 10.2 (byproduct: who benefits)", "PREF": "(product design)", "CONT": "(admin)"}

def q(id, type, title, domain, purpose, options=None, required=False, help="", source="", pattern=None, other=False, expand=True, rows=None, cols=None):
    d = dict(id=id, type=type, title=title, domain=domain, purpose=purpose, required=required, help=help, source=source, expand=expand and type in ("choice", "checkbox", "grid"))
    if rows: d["rows"] = rows
    if cols: d["cols"] = cols
    if options: d["options"] = options
    if pattern: d["pattern"] = pattern
    if other: d["other"] = True
    return d

main = [
 q("CONSENT", "choice", "Do you agree to take part?", "CONT", "Informed, voluntary, adult consent before any data is collected", required=True, expand=False,
   options=[{"v": "Yes, I am 18 or older and I agree to take part", "go": "continue"}, {"v": "No, I do not agree", "go": "submit"}],
   help="You can stop at any time and skip any question you prefer not to answer.", source="POPIA consent; wording to be confirmed by PPS"),
 q("PID", "text", "Your participant ID", "CONT", "Links this form to the anonymous in-app results without using a name or email", required=True,
   help="You will see it on the last screen of the Sisi pilot. It looks like 7K3Q. Type NONE if you did not get one.", pattern=r"^([A-Z0-9]{4}|NONE)$", source="App participant id"),
 # About you (baseline). Age band, situation and experience come from the optional profile in the app, joined by participant ID.
 q("Q1", "choice", "Do you have your own account with a bank or a mobile-money service?", "BEH", "SDG 5.a baseline: access to financial services",
   options=["Yes, a bank account", "Yes, mobile money only", "Yes, both", "No", PNS], source="Concept follows Global Findex account ownership; wording is ours"),
 q("Q2", "choice", "In the past 3 months, did you put any money aside as savings, even a small amount?", "BEH", "SDG 5.a / 4.4 baseline: saving behaviour", options=["Yes, regularly", "Yes, sometimes", "No", PNS]),
 q("Q3", "choice", "How much say do you usually have in big decisions about your money?", "AGY", "SDG 5.a baseline: women's say over money",
   options=["I decide on my own", "I decide together with family or a partner", "Other people mostly decide for me", "It depends", PNS], source="Draft item for this pilot; check against a validated women's economic empowerment measure before publishing"),
 # Features
 q("Q4", "grid", "How was your experience with each of these?", "FEAT", "Experience of the six guided features, side by side (compare with what they actually did and how long each chapter took)",
   rows=["The lesson and its quiz", "The coached budget task", "Your progress (Bloom, badges, weekly target)", "Choosing a reward", "The community chat", "Money Buddy"], cols=["Loved it", "Liked it", "It was okay", "Did not like it", "I did not try this"]),
 q("Q5", "grid", "And the extras you peeked at, if any?", "FEAT", "Experience of the features they peeked at (which to keep, fix or cut)",
   rows=["Payslip simulator", "Letterbox (friends)", "Invest HER (simulation)", "Events and calendar", "Talk to someone", "Support page and Quick exit", "Points and badges"], cols=["Loved it", "Liked it", "It was okay", "Did not like it", "I did not try this"]),
 q("Q6", "grid", "How easy was each of these to use or understand?", "UX", "SDG 4.6: ease and understandability per feature, including the words and navigation",
   rows=["Understanding the lesson and quiz", "Doing the budget task", "Understanding my progress and weekly target", "Choosing a reward", "Using the community chat", "Using Money Buddy", "Finding my way around the app"], cols=["Very easy", "Easy", "Okay", "Difficult", "Very difficult", "I did not try this"]),
 # Understanding
 q("Q7", "choice", "What is Sisi mainly for?", "UX", "SDG 4.6: did people grasp the purpose without being told? (Correct answer: the first option.)",
   options=["Learning about money in plain words and practising with simple tools", "Getting personal financial advice", "Opening a bank account or taking out a loan", "Buying and selling investments with real money", "I am not sure"]),
 q("Q8", "choice", "How well did Sisi speak to women like you?", "REL", "SDG 5 / 4.5: is the content and tone gender-responsive and relevant?", options=["Very well", "Fairly well", "Not very well", "Not at all", "I am not sure"]),
 # Liked / disliked / preferences
 q("Q9", "checkbox", "What did you like? (Tick up to three)", "PREF", "Likes, in structured form", other=True,
   options=["The short, clear lesson and quiz", "The coached budget task", "Seeing my progress", "The community and chat", "The friendly tone", "Points, badges or rewards", "That it felt private and safe", "How simple it looked", "Nothing in particular"]),
 q("Q10", "checkbox", "What did you dislike or find frustrating? (Tick up to three)", "PREF", "Dislikes and friction, in structured form", other=True,
   options=["Words I did not understand", "The lesson was too long", "Too much text on screen", "The budget task was hard", "The community felt unclear or awkward", "It was slow or did not work well on my phone", "Data cost or a weak connection", "Something felt unsafe or uncomfortable", "Nothing"]),
 q("Q11", "choice", "Which ONE part of Sisi was most useful to you?", "PREF", "Forced choice: preferred feature",
   options=["The lesson and quiz", "The coached budget task", "Seeing my progress", "The reward choice", "The community chat", "Money Buddy", "Letterbox (friends)", "Payslip simulator", "Invest HER (simulation)", "None of them"]),
 q("Q12", "choice", "If we could change only ONE thing first, what should it be?", "PREF", "Forced choice: top priority to fix", other=True,
   options=["Make the lessons shorter or simpler", "Make the budget tool simpler", "Make the community easier to use", "Add more topics", "Make it faster or work better on my phone", "Make rewards clearer", "Make it feel more like my life"]),
 q("Q13", "choice", "Points, badges and leaderboards are optional in Sisi. How do you feel about them?", "PREF", "Gamification preference (evidence rule: must stay optional, with Focus mode)",
   options=["They motivate me", "I do not mind them", "They put me off", "I would switch them off", "I did not notice them"]),
 # Learning and what is next
 q("Q14", "choice", "Compared with before today, how confident do you feel about making everyday money decisions?", "KNW", "SDG 4.4 / 5.a: retrospective self-efficacy change (second estimate beside the in-app before/after)",
   options=["Much more confident", "A bit more confident", "About the same", "A bit less confident", "Much less confident"], source="Retrospective then/now design reduces response-shift bias"),
 q("Q15", "checkbox", "Learning about money like this could help me to… (Tick all that apply)", "IMP", "Perceived benefit by outcome area: skills (SDG 4.4) and economic agency (SDG 5.a)", other=True,
   options=["Feel less stressed about money", "Make and keep a budget", "Start saving", "Avoid or get out of debt", "Start investing", "Talk about money with my family", "Say no to money requests I cannot afford", "Ask for fair pay or fees", "Start or grow a business or side hustle", "Plan for study or my career", "None of these"]),
 q("Q16", "checkbox", "What would make you most likely to come back? (Tick up to two)", "PREF", "Retention drivers: reminders, rewards, social, content, language, length", other=True,
   options=["Reminders", "Rewards or prize draws", "Doing it with a friend (Money Buddy)", "More topics that fit my life", "Lessons in my own language", "Shorter lessons", "Live sessions or events", "Nothing would"]),
 # Trust and access
 q("Q17", "choice", "How safe and comfortable did you feel using Sisi, including the community?", "TRUST", "SDG 5: safe participation for women online",
   options=["Very safe and comfortable", "Mostly safe and comfortable", "Neutral", "A bit uneasy", "Not safe or comfortable", "I did not use the community"]),
 q("Q18", "checkbox", "What could stop you using an app like Sisi regularly? (Tick all that apply)", "ACC", "SDG 5.b / 4.5: access barriers, including the gender digital divide (equity cuts for SDG 10.2)", other=True,
   options=["Data cost", "A weak connection", "Sharing a phone", "Someone else controlling or checking my phone", "The language", "Not having time", "Worry about privacy", "Hard to read or tap (text size, colours, buttons)", "Nothing"]),
]

SECT = {"CONSENT": "Welcome and consent", "PID": "About you", "Q1": "About you", "Q2": "About you", "Q3": "About you",
  "Q4": "Your experience of the features", "Q5": "Your experience of the features", "Q6": "Your experience of the features",
  "Q7": "Understanding", "Q8": "Understanding",
  "Q9": "What you liked and prefer", "Q10": "What you liked and prefer", "Q11": "What you liked and prefer", "Q12": "What you liked and prefer", "Q13": "What you liked and prefer",
  "Q14": "Learning and what is next", "Q15": "Learning and what is next", "Q16": "Learning and what is next", "Q17": "Trust and access", "Q18": "Trust and access"}
for it in main: it["section"] = SECT[it["id"]]
SECTION_HELP = {"About you": "Everything except your participant ID is optional. Choose Prefer not to say or skip anything you like.", "Your experience of the features": "Think about what you just did in the pilot. Skip a row if you did not try it.", "Understanding": "Two quick questions about Sisi itself.", "What you liked and prefer": "Be as honest as you like. Critical answers are the most useful.", "Learning and what is next": "A few questions about what changed for you and what would help.", "Trust and access": "Last section. Thank you for sticking with us.", "One week later": "", "Stay in touch": ""}
forms = dict(
  main=dict(title="Sisi pilot feedback", description=("Thank you for testing Sisi, a money-confidence app for young women, made with PPS Investments.\n\nThere are 18 quick questions, about 4 to 5 minutes. Every question is multiple choice, and each has an optional box if you want to say more. It is not a test of you. We are testing Sisi, and honest answers, including critical ones, help most.\n\n"
    "What we collect: your answers here. No name, email, ID number or bank details, and no amounts of your own money. The Sisi pilot team uses them to improve the app and to report anonymised, combined results to PPS Investments.\n"
    "Taking part is voluntary. You can stop at any time and skip any question you prefer not to answer.\n\nSisi is education, not financial advice."),
    confirmation="Thank you! Your feedback helps make Sisi better for other young women."),
)
json.dump(dict(sectionHelp=SECTION_HELP, domains=SDG, forms=forms, main=main, expandLabel="Want to tell us more? (optional)"), open("docs/pilot-form/questions.json", "w"), indent=1, ensure_ascii=False)
print(len(main), "questions in main (incl. consent and ID):", len(main))
