// Builds the Google Form pack from docs/pilot-form/questions.json (the single source of truth):
//   FEEDBACK_FORM.md, codebook.csv, create-forms.gs (Google Apps Script), FEEDBACK_FORM.html (for the PDF)
import fs from 'node:fs';
const dir = 'docs/pilot-form';
const D = JSON.parse(fs.readFileSync(`${dir}/questions.json`, 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const optText = (o) => (typeof o === 'string' ? o : o.v);
const secs = { choice: 8, checkbox: 14, dropdown: 8, scale: 6, text: 8, paragraph: 30 };
const est = (q) => (q.type === 'grid' ? 6 + q.rows.length * 4 : secs[q.type] ?? 8) * (q.required && q.type === 'paragraph' ? 1.2 : 1);
const minutes = (items, pred) => Math.round(items.filter(pred).reduce((a, q) => a + est(q), 0) / 60 * 10) / 10;
const typeLabel = { choice: 'Multiple choice', checkbox: 'Checkboxes', dropdown: 'Dropdown', scale: 'Linear scale', text: 'Short answer', paragraph: 'Paragraph', grid: 'Multiple-choice grid' };

/* ---------- codebook ---------- */
const csv = (v) => { const s = Array.isArray(v) ? v.join(' | ') : String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const rowsFor = (form, items) => items.map((q) => [form, q.id, `Part ${q.part}`, q.section, typeLabel[q.type], q.required ? 'yes' : 'no', q.priority, q.domain, D.domains[q.domain] ?? '', q.title, (q.options ?? []).map(optText), q.rows ?? '', q.cols ?? (q.scale ? `${q.scale.min} ${q.scale.low} … ${q.scale.max} ${q.scale.high}` : ''), q.purpose, q.source ?? ''].map(csv).join(','));
const head = ['form', 'id', 'part', 'section', 'type', 'required', 'priority', 'domain', 'candidate_sdg_targets', 'question', 'options', 'grid_rows', 'grid_columns_or_scale', 'purpose', 'source_or_validation'];
fs.writeFileSync(`${dir}/codebook.csv`, [head.join(','), ...rowsFor('feedback', D.main), ...rowsFor('day7', D.day7), ...rowsFor('contact', D.contact)].join('\n') + '\n');

/* ---------- Apps Script ---------- */
const gs = `/**
 * Creates the three Sisi pilot Google Forms in your Google account.
 * HOW TO RUN: go to script.google.com > New project > paste this whole file > Save >
 * choose "createPilotForms" in the toolbar > Run > approve the permissions.
 * The links to edit and share each form appear in View > Logs (also written to your Drive as forms).
 * Generated from docs/pilot-form/questions.json. Edit that file and regenerate; do not hand-edit this.
 *
 * MAX_PRIORITY shortens the feedback form: 1 = must-have questions only, 2 = recommended, 3 = everything.
 */
const MAX_PRIORITY = 3;
const GATE_PART = 6; // questions from this part on are optional and sit behind a "continue?" question

const DATA = ${JSON.stringify({ sectionHelp: D.sectionHelp, forms: D.forms, main: D.main, day7: D.day7, contact: D.contact })};

function createPilotForms() {
  const out = {
    feedback: build_(DATA.forms.main, DATA.main, true),
    day7: build_(DATA.forms.day7, DATA.day7, false),
    contact: build_(DATA.forms.contact, DATA.contact, false),
  };
  Logger.log('Feedback form (share this one): ' + out.feedback.publish + '\\n  edit: ' + out.feedback.edit);
  Logger.log('Day-7 follow-up (send a week later): ' + out.day7.publish + '\\n  edit: ' + out.day7.edit);
  Logger.log('Contact form (optional, separate on purpose): ' + out.contact.publish + '\\n  edit: ' + out.contact.edit);
  Logger.log('Tip: in each form open Responses > Link to Sheets so answers collect in one spreadsheet.');
  return out;
}

function build_(meta, items, withGate) {
  const form = FormApp.create(meta.title);
  form.setDescription(meta.description)
    .setConfirmationMessage(meta.confirmation)
    .setProgressBar(true)
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setLimitOneResponsePerUser(false)
    .setShowLinkToRespondAgain(false);

  const keep = items.filter(function (q) { return q.priority <= MAX_PRIORITY; });
  let section = null;
  let gateDone = false;
  const hasDeep = withGate && keep.some(function (q) { return q.part >= GATE_PART; });

  keep.forEach(function (q) {
    if (hasDeep && !gateDone && q.part >= GATE_PART) {
      addGate_(form);
      gateDone = true;
      section = null; // force a fresh page for the first optional section
    }
    if (q.section !== section) {
      if (section !== null || q.part >= GATE_PART) {
        const pb = form.addPageBreakItem().setTitle(q.section);
        if (DATA.sectionHelp[q.section]) pb.setHelpText(DATA.sectionHelp[q.section]);
      } else if (DATA.sectionHelp[q.section]) {
        form.addSectionHeaderItem().setTitle(q.section).setHelpText(DATA.sectionHelp[q.section]);
      }
      section = q.section;
    }
    addQuestion_(form, q);
  });
  return { publish: form.getPublishedUrl(), edit: form.getEditUrl() };
}

function addGate_(form) {
  form.addPageBreakItem()
    .setTitle('Core feedback done: thank you!')
    .setHelpText('The next questions are optional. They help us decide what to build next.');
  const gate = form.addMultipleChoiceItem();
  gate.setTitle('Would you like to answer a few more optional questions (about 5 minutes)?')
    .setRequired(true)
    .setChoices([
      gate.createChoice('Yes, I will answer more', FormApp.PageNavigationType.CONTINUE),
      gate.createChoice('No, submit my answers now', FormApp.PageNavigationType.SUBMIT),
    ]);
}

function addQuestion_(form, q) {
  let item;
  switch (q.type) {
    case 'choice': {
      item = form.addMultipleChoiceItem();
      item.setChoices(q.options.map(function (o) {
        if (typeof o === 'string') return item.createChoice(o);
        return item.createChoice(o.v, o.go === 'submit' ? FormApp.PageNavigationType.SUBMIT : FormApp.PageNavigationType.CONTINUE);
      }));
      if (q.other) item.showOtherOption(true);
      break;
    }
    case 'checkbox':
      item = form.addCheckboxItem();
      item.setChoiceValues(q.options);
      break;
    case 'dropdown':
      item = form.addListItem();
      item.setChoiceValues(q.options);
      break;
    case 'scale':
      item = form.addScaleItem();
      item.setBounds(q.scale.min, q.scale.max).setLabels(q.scale.low, q.scale.high);
      break;
    case 'grid':
      item = form.addGridItem();
      item.setRows(q.rows).setColumns(q.cols);
      break;
    case 'paragraph':
      item = form.addParagraphTextItem();
      break;
    case 'text':
      item = form.addTextItem();
      if (q.pattern) {
        item.setValidation(FormApp.createTextValidation()
          .setHelpText('Please enter your ID exactly as shown (for example P-7K3Q9X), or type NONE.')
          .requireTextMatchesPattern(q.pattern)
          .build());
      }
      break;
    default:
      throw new Error('Unknown question type: ' + q.type);
  }
  item.setTitle(q.title).setRequired(!!q.required);
  if (q.help) item.setHelpText(q.help);
  return item;
}
`;
fs.writeFileSync(`${dir}/create-forms.gs`, gs);

/* ---------- Markdown + HTML ---------- */
const groups = (items) => { const m = new Map(); items.forEach((q) => { const k = `${q.part}|${q.section}`; if (!m.has(k)) m.set(k, []); m.get(k).push(q); }); return [...m.entries()].map(([k, v]) => ({ part: Number(k.split('|')[0]), section: k.split('|').slice(1).join('|'), items: v })); };
const coreMin = minutes(D.main, (q) => q.part < 6); const deepMin = minutes(D.main, (q) => q.part >= 6);
const p1 = (pr) => D.main.filter((q) => q.priority <= pr);
const short = minutes(D.main, (q) => q.part < 6 && q.priority <= 1);
const d7min = minutes(D.day7, () => true);
const counts = { all: D.main.length, core: D.main.filter((q) => q.part < 6).length, deep: D.main.filter((q) => q.part >= 6).length, p1: p1(1).length, p2: p1(2).length };

const pillar = {
  ACC: 'Access and inclusion', KNW: 'Learning and understanding', UX: 'Ease of use and understandability', PREF: 'Preferences, likes and dislikes', TRUST: 'Trust, privacy and safety', BEH: 'Money behaviour (baseline and change)', AGY: 'Women’s financial agency', DEM: 'Who took part', CONT: 'Consent and admin', IMP: 'Impact and needs',
};

function qMd(q) {
  const lines = [`**${q.id}.** ${q.title}${q.required ? ' *(required)*' : ''}`, `- Type: ${typeLabel[q.type]} · Priority ${q.priority} · Domain: ${pillar[q.domain]}`];
  if (q.help) lines.push(`- Help text: ${q.help}`);
  if (q.options) lines.push(`- Options: ${q.options.map((o) => optText(o) + (typeof o === 'object' && o.go === 'submit' ? ' *(ends the form)*' : '')).join(' · ')}${q.other ? ' · *Other (write in)*' : ''}`);
  if (q.rows) lines.push(`- Rows: ${q.rows.join(' · ')}`);
  if (q.cols) lines.push(`- Columns: ${q.cols.join(' · ')}`);
  if (q.scale) lines.push(`- Scale: ${q.scale.min} (${q.scale.low}) to ${q.scale.max} (${q.scale.high})`);
  lines.push(`- Why we ask: ${q.purpose}`);
  if (q.source) lines.push(`- Source or validity: ${q.source}`);
  return lines.join('\n');
}
const formMd = (title, meta, items) => `### ${title}\n\n**Form title:** ${meta.title}\n\n**Opening text:**\n\n> ${meta.description.replace(/\n/g, '\n> ')}\n\n` + groups(items).map((g) => `#### Part ${g.part}: ${g.section}${D.sectionHelp[g.section] ? `\n*${D.sectionHelp[g.section]}*` : ''}\n\n` + g.items.map(qMd).join('\n\n')).join('\n\n') + `\n\n**Confirmation message:** ${meta.confirmation}\n`;

const sdgTable = `| Evidence domain | Questions | Candidate SDG targets (**to confirm**) | What it lets us say |
|---|---|---|---|
| Learning and understanding | LC1–LC4, W5, W6 | SDG 4.4 (relevant skills for decent work), 4.6 (literacy and numeracy) | People understand money concepts better and feel more able to act |
| Ease of use and understandability | UX1–UX9 | SDG 4.6 | Learning content is clear and usable for the intended reader |
| Access and inclusion | DEM6, PF8, AC1–AC3 | SDG 5.b (enabling technology for women), 10.2 (inclusion of all), 4.5 (equal access to learning) | Who is left out by data cost, device, language or accessibility |
| Money behaviour | BEH1–BEH5, LC5, W1–W4 | SDG 8.10 (access to financial services; indicator 8.10.2 account ownership), 1.4 (access to financial services and economic resources) | Baseline and change in saving, budgeting, resilience and account ownership |
| Women’s financial agency | AG1 | SDG 5.a (equal rights to economic resources and financial services), 5.1 | Whether young women feel they have a say over their money |
| Impact and needs | IM1, IM2, W9 | SDG 8, 4.4, 1.4 | Which outcomes people believe Sisi supports and what to build next |
| Trust, privacy and safety | TR1–TR3 | SDG 5 (safe participation), 16.10 (access to information) | Whether Sisi is trusted and safe, a precondition for any impact |
| Preferences, likes and dislikes | LK1–LK6, PF1–PF9, IM3 | (product design, not an SDG outcome) | What to keep, change, cut and build next |
| Who took part | DEM1–DEM5 | SDG 10.2 | Whether the pilot reached the women it is meant for |`;

const md = `# Sisi pilot feedback: Google Form pack

Status: draft v1 for PPS review. Generated from \`questions.json\`. Source of truth for wording is that file.

## Read this first

**About the SDGs.** The project brief I was given calls this the "PPS Investments SDG Challenge" but **never names the specific Sustainable Development Goals**, so I do not know which ones your challenge targets. I have not guessed silently. Every question carries an *evidence domain* (such as "money behaviour" or "access and inclusion"), and the table in section 3 maps each domain to the SDG targets that fit a money-confidence app for young women. Those SDG targets are **proposals to confirm**. When you tell me the real goals, only that table changes, not the questions.

## 1. What this pack contains

| File | What it is |
|---|---|
| \`FEEDBACK_FORM.md\` / \`.pdf\` | This document: every question, why it is asked, how it maps to evidence |
| \`create-forms.gs\` | A Google Apps Script that **builds all three forms for you** (sections, validation, the optional-questions gate). Paste into script.google.com and press Run |
| \`codebook.csv\` | One row per question for analysis (id, type, options, domain, SDG target, source) |
| \`questions.json\` | The single source of truth. Edit this and regenerate with \`node scripts/build-pilot-form.mjs\` |

Three forms, on purpose:

1. **Pilot feedback form** (${counts.all} questions in full). Given straight after the session. *Core part* (Parts 1–5, ${counts.core} questions, about **${coreMin} minutes**) is the evidence you need. *Optional part* (Parts 6–9, ${counts.deep} questions, about **${deepMin} minutes**) sits behind a "continue?" question so tired testers can stop without losing the core data. Estimated times by priority (core / optional part): Priority 1 only **${minutes(D.main, (q) => q.part < 6 && q.priority <= 1)} / ${minutes(D.main, (q) => q.part >= 6 && q.priority <= 1)} min**; priorities 1–2 **${minutes(D.main, (q) => q.part < 6 && q.priority <= 2)} / ${minutes(D.main, (q) => q.part >= 6 && q.priority <= 2)} min**; everything **${coreMin} / ${deepMin} min**. Set \`MAX_PRIORITY\` at the top of the script to 1, 2 or 3 to choose. Times are estimates (about 8 seconds per tap question, 4 per grid row, 30 per written answer); time a real tester before you commit.
2. **Day-7 follow-up** (${D.day7.length} questions, about **${d7min} minutes**). Sent a week later. Asks what people did, not just what they know. This is your strongest evidence of behaviour change.
3. **Contact form** (optional, separate). Names and contact details are collected here so they are never stored next to feedback answers. Needed only for the follow-up and any prize draw.

## 2. How this fits with the in-app pilot

The app already measures: knowledge change (6 items, 2 parallel forms), confidence, observed task success and time, per-task ease, UMUX-Lite and a recommend score. The Google Form does **not repeat those**. It adds what the app cannot: preferences, likes and dislikes, understandability in their own words, access and inclusion, who took part, money-behaviour baseline, and impact on SDG-relevant outcomes. The two datasets join on the **participant ID** (the app shows it on the last screen; Q "PID" asks for it). The ID is random and anonymous.

## 3. Evidence domains and SDG mapping (candidate targets, to confirm)

${sdgTable}

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

1. Run \`create-forms.gs\` and open each form's edit link. Check the order and the "continue?" branch by previewing.
2. Add the PPS logo and a header image if you like (Form theme).
3. In each form: Responses → Link to Sheets. Turn **off** "Collect email addresses" (the script already does).
4. Paste the PPS-approved consent and privacy wording over the opening text if it differs. Confirm POPIA responsibilities with PPS.
5. Give testers the feedback link right after the session (and put it on the tester guide). Put the **day-7 link** in a calendar reminder.
6. Test the whole thing yourself on a phone. Time it.

## 6. The questions

${formMd('Form 1: Pilot feedback form', D.forms.main, D.main)}

${formMd('Form 2: Day-7 follow-up', D.forms.day7, D.day7)}

${formMd('Form 3: Contact form (optional, separate)', D.forms.contact, D.contact)}

## 7. Analysis plan (short)

- **Preference vs non-preference:** LK3 and LK4 (forced choices), PF1 (format), PF3–PF7 (gamification, rewards, social), cross-tabbed by DEM1/DEM2. Read LK1/LK2 open text and code themes (two people code a sample, agree, then code the rest).
- **Ease and understandability:** UX2 and UX8 against the in-app Single Ease Question; UX1 coded as "correct purpose / partly / wrong".
- **Learning and confidence:** LC1 vs LC2 (paired), LC4 for new-vs-known content, then the in-app knowledge gain.
- **SDG outcomes:** BEH1–BEH4 and BEH5 as the baseline profile of who the pilot reached; W2–W4 and W5 at day 7 as change; IM1/IM2 as perceived benefit and need; AG1 as agency. Report descriptively, by subgroup where n allows, and be clear that this is a small, self-selected pilot with no control group.
- **Equity cut:** compare ease, satisfaction and intent for DEM4/DEM5 (province, area), AC1 (data cost) and PF8 (language) to see who is being left behind.
`;
fs.writeFileSync(`${dir}/FEEDBACK_FORM.md`, md);

// HTML for the PDF (simple, print-friendly)
const mdToHtml = (s) => esc(s)
  .replace(/^# (.*)$/gm, '<h1>$1</h1>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^#### (.*)$/gm, '<h4>$1</h4>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*\n]+)\*/g, '<i>$1</i>').replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>').replace(/^- (.*)$/gm, '<li>$1</li>').replace(/^\d\. (.*)$/gm, '<li>$1</li>');
function tableHtml(block) { const rows = block.trim().split('\n').filter((l) => !/^\|[-| ]+\|$/.test(l)); return '<table>' + rows.map((r, i) => `<tr>${r.split('|').slice(1, -1).map((c) => `<${i ? 'td' : 'th'}>${c.trim()}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('') + '</table>'; }
const wrapP = (h) => (/^<(h\d|table|ul|li|blockquote)/.test(h.trim()) ? h : `<p>${h}</p>`);
const parts = md.split(/\n\n/).map((blk) => (blk.trim().startsWith('|') ? tableHtml(esc(blk).replace(/&amp;/g, '&')) .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>') : mdToHtml(blk).replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>').replace(/\n/g, '<br>')).replace(/<blockquote><\/blockquote>/g, '<br>').replace(/<\/blockquote><br>(<br>)?<blockquote>/g, '<br><br>')).map(wrapP);
fs.writeFileSync(`${dir}/FEEDBACK_FORM.html`, `<!doctype html><html><head><meta charset="utf-8"><title>Sisi pilot feedback: Google Form pack</title><style>
@page{size:A4;margin:16mm 14mm}body{font-family:Arial,Helvetica,sans-serif;font-size:9.6pt;line-height:1.38;color:#2A1433}
h1{font-size:20pt;color:#AD1457;margin:0 0 4mm}h2{font-size:14pt;color:#AD1457;border-bottom:.4mm solid #F48FB1;padding-bottom:1mm;margin:7mm 0 3mm;page-break-after:avoid}h3{font-size:12.5pt;margin:6mm 0 2mm;background:#FCE4EF;padding:2mm 3mm;border-radius:2mm;page-break-after:avoid}h4{font-size:11pt;margin:5mm 0 1.5mm;color:#7E57C2;page-break-after:avoid}
table{border-collapse:collapse;width:100%;margin:2mm 0;font-size:8.6pt}th{background:#FCE4EF;text-align:left}td,th{border:.3mm solid #F48FB1;padding:1.4mm 2mm;vertical-align:top}
blockquote{margin:1mm 0;padding:1mm 3mm;border-left:1mm solid #F48FB1;background:#FFF5F9}code{background:#EFE7FB;padding:0 1mm;border-radius:1mm;font-size:8.6pt}ul{margin:1mm 0 2mm 5mm;padding:0}li{margin:.4mm 0}p{margin:0 0 2mm}
</style></head><body>${parts.join('\n')}</body></html>`);
console.log(JSON.stringify({ counts, coreMin, deepMin, short, d7min }));
