// Builds the Google Form pack from docs/pilot-form/questions.json (the single source of truth):
//   FEEDBACK_FORM.md, codebook.csv, create-forms.gs (Google Apps Script), FEEDBACK_FORM.html (for the PDF)
import fs from 'node:fs';
const dir = 'docs/pilot-form';
const D = JSON.parse(fs.readFileSync(`${dir}/questions.json`, 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const optText = (o) => (typeof o === 'string' ? o : o.v);
const typeLabel = { choice: 'Multiple choice (one answer)', checkbox: 'Multiple choice (tick all that apply)', text: 'Short answer' };
const secs = { choice: 8, checkbox: 14, text: 8 };
const minutes = (items) => Math.round(items.reduce((a, q) => a + (secs[q.type] ?? 8), 0) / 6) / 10;
const pillar = { ACC: 'Access and inclusion', KNW: 'Learning and confidence', UX: 'Ease of use and understandability', PREF: 'Preferences, likes and dislikes', TRUST: 'Trust, privacy and safety', BEH: 'Money behaviour (baseline and change)', DEM: 'Who took part', CONT: 'Consent and admin', IMP: 'Impact and needs', AGY: 'Women’s say over money (agency)', REL: 'Relevance to women' };

/* ---------- codebook ---------- */
const csv = (v) => { const s = Array.isArray(v) ? v.join(' | ') : String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const rowsFor = (form, items) => items.map((q) => [form, q.id, q.section, typeLabel[q.type], q.required ? 'yes' : 'no', q.expand ? 'yes' : 'no', q.domain, D.domains[q.domain] ?? '', q.title, (q.options ?? []).map(optText), q.purpose, q.source ?? ''].map(csv).join(','));
const head = ['form', 'id', 'section', 'type', 'required', 'optional_expansion', 'domain', 'candidate_sdg_targets', 'question', 'options', 'purpose', 'source_or_validation'];
fs.writeFileSync(`${dir}/codebook.csv`, [head.join(','), ...rowsFor('feedback', D.main), ...rowsFor('day7', D.day7), ...rowsFor('contact', D.contact)].join('\n') + '\n');

/* ---------- Apps Script ---------- */
const gs = `/**
 * Creates the three Sisi pilot Google Forms in your Google account.
 * HOW TO RUN: go to script.google.com > New project > paste this whole file > Save >
 * choose "createPilotForms" in the toolbar > Run > approve the permissions.
 * The links to edit and share each form appear in View > Logs (the forms are also in your Drive).
 * Generated from docs/pilot-form/questions.json. Edit that file and regenerate; do not hand-edit this.
 *
 * INCLUDE_EXPANSIONS: true adds an optional "Want to tell us more?" box under every multiple-choice question.
 * Set it to false for the shortest on-screen form (questions that allow "Other" keep their write-in option).
 */
const INCLUDE_EXPANSIONS = true;

const DATA = ${JSON.stringify({ sectionHelp: D.sectionHelp, forms: D.forms, main: D.main, day7: D.day7, contact: D.contact })};

function createPilotForms() {
  const out = {
    feedback: build_(DATA.forms.main, DATA.main),
    day7: build_(DATA.forms.day7, DATA.day7),
    contact: build_(DATA.forms.contact, DATA.contact),
  };
  Logger.log('Feedback form (share this one): ' + out.feedback.publish + '\\n  edit: ' + out.feedback.edit);
  Logger.log('Day-7 follow-up (send a week later): ' + out.day7.publish + '\\n  edit: ' + out.day7.edit);
  Logger.log('Contact form (optional, separate on purpose): ' + out.contact.publish + '\\n  edit: ' + out.contact.edit);
  Logger.log('Tip: in each form open Responses > Link to Sheets so answers collect in one spreadsheet.');
  return out;
}

function build_(meta, items) {
  const form = FormApp.create(meta.title);
  form.setDescription(meta.description)
    .setConfirmationMessage(meta.confirmation)
    .setProgressBar(true)
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setLimitOneResponsePerUser(false)
    .setShowLinkToRespondAgain(false);

  let section = null;
  items.forEach(function (q) {
    if (q.section !== section) {
      if (section !== null) {
        const pb = form.addPageBreakItem().setTitle(q.section);
        if (DATA.sectionHelp[q.section]) pb.setHelpText(DATA.sectionHelp[q.section]);
      }
      section = q.section;
    }
    addQuestion_(form, q);
    if (INCLUDE_EXPANSIONS && q.expand) {
      form.addParagraphTextItem()
        .setTitle(q.id + ' · Want to tell us more? (optional)')
        .setRequired(false);
    }
  });
  return { publish: form.getPublishedUrl(), edit: form.getEditUrl() };
}

function addQuestion_(form, q) {
  const label = /^(Q|D)\\d+$/.test(q.id) ? q.id + '. ' + q.title : q.title;
  let item;
  switch (q.type) {
    case 'choice':
      item = form.addMultipleChoiceItem();
      item.setChoices(q.options.map(function (o) {
        if (typeof o === 'string') return item.createChoice(o);
        return item.createChoice(o.v, o.go === 'submit' ? FormApp.PageNavigationType.SUBMIT : FormApp.PageNavigationType.CONTINUE);
      }));
      if (q.other) item.showOtherOption(true);
      break;
    case 'checkbox':
      item = form.addCheckboxItem();
      item.setChoiceValues(q.options);
      if (q.other) item.showOtherOption(true);
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
  item.setTitle(label).setRequired(!!q.required);
  if (q.help) item.setHelpText(q.help);
  return item;
}
`;
fs.writeFileSync(`${dir}/create-forms.gs`, gs);

/* ---------- Markdown + HTML ---------- */
const groups = (items) => { const m = new Map(); items.forEach((q) => { if (!m.has(q.section)) m.set(q.section, []); m.get(q.section).push(q); }); return [...m.entries()].map(([section, items]) => ({ section, items })); };
const qMd = (q) => {
  const lines = [`**${q.id}.** ${q.title}${q.required ? ' *(required)*' : ''}`, `- ${typeLabel[q.type]}${q.expand ? ' + optional “Want to tell us more?” box' : ''} · ${pillar[q.domain]}`];
  if (q.help) lines.push(`- Help text: ${q.help}`);
  if (q.options) lines.push(`- Options: ${q.options.map((o) => optText(o) + (typeof o === 'object' && o.go === 'submit' ? ' *(ends the form)*' : '')).join(' · ')}${q.other ? ' · *Other (write in)*' : ''}`);
  lines.push(`- Why we ask: ${q.purpose}${q.source ? ` (${q.source})` : ''}`);
  return lines.join('\n');
};
const formMd = (title, meta, items) => `### ${title}\n\n**Form title:** ${meta.title}\n\n**Opening text:**\n\n${meta.description.split('\n\n').map((p) => `> ${p.replace(/\n/g, ' ')}`).join('\n\n')}\n\n` + groups(items).map((g) => `#### ${g.section}${D.sectionHelp[g.section] ? `\n*${D.sectionHelp[g.section]}*` : ''}\n\n` + g.items.map(qMd).join('\n\n')).join('\n\n') + `\n\n**Confirmation message:** ${meta.confirmation}\n`;

const idsByDomain = {};
[...D.main, ...D.day7].forEach((q) => { if (q.domain !== 'CONT') (idsByDomain[q.domain] ??= []).push(q.id); });
const gist = { KNW: 'People feel more able to handle money decisions', UX: 'The content and tools are clear to the intended reader', ACC: 'Who is left out by data cost, connection, device, language or accessibility', BEH: 'Baseline and change in saving, budgeting and account ownership', IMP: 'Which outcomes people believe Sisi supports', TRUST: 'Whether Sisi is trusted and safe, a precondition for any impact', PREF: 'What to keep, change, cut and build next', DEM: 'Whether the pilot reached the women it is meant for', AGY: 'Whether young women have a say over their money, and whether that grows', REL: 'Whether the content and tone speak to women, not just to anyone' };
const sdgTable = ['| Evidence area | Questions | SDG targets informed | What it lets us say |', '|---|---|---|---|', ...['KNW', 'UX', 'REL', 'AGY', 'BEH', 'IMP', 'TRUST', 'ACC', 'PREF', 'DEM'].map((d) => `| ${pillar[d]} | ${(idsByDomain[d] ?? []).join(', ')} | ${D.domains[d]} | ${gist[d]} |`)].join('\n');

const nMain = D.main.length; const nExp = D.main.filter((q) => q.expand).length;
const md = `# Sisi pilot feedback: Google Form pack (v2: 20 questions, all multiple choice)

Status: draft for PPS review. Generated from \`questions.json\`, which is the source of truth for wording.

## Read this first

**What changed.** The feedback form now has **${nMain} items in total: consent, participant ID and 18 questions**. Every question is **multiple choice** (one answer, or tick all that apply). Each one has an **optional "Want to tell us more?" box** underneath, so people can expand on an answer without having to. Those boxes are optional add-ons and are not counted in the 20. Taking part needs about **${minutes(D.main)} minutes** of tapping; the optional boxes add time only for people who choose to write.

**Which SDGs this serves.** Your **primary goals are SDG 4 (Quality Education) and SDG 5 (Gender Equality)**. **SDG 10 (Reduced Inequalities) is a byproduct**: it is not measured with questions of its own but through **equity cuts**, comparing results by age, situation, data cost, shared or monitored phones and language to show whether the women who benefit are the ones usually left out. Every question carries an evidence area and a note of the target it informs (section 2). Targets are from my reading of the SDGs, so confirm the wording against the UN list.

- **SDG 4:** 4.6 (literacy and numeracy: Q6 to Q8), 4.4 (skills applied: Q14, D5, D6), 4.5 (equal access: Q9, Q18).
- **SDG 5:** 5.a (economic resources and financial services: Q3, Q4, Q5, Q15, D2, D3, D6), 5.b (technology: Q18), and safe, relevant participation for women (Q9, Q17).
- **SDG 10 (byproduct):** Q1, Q2, Q18 and the language and cost answers used as cuts.

## 1. What this pack contains

| File | What it is |
|---|---|
| \`FEEDBACK_FORM.md\` / \`.pdf\` | This document: every question, why it is asked |
| \`create-forms.gs\` | A Google Apps Script that **builds all three forms for you**. Paste into script.google.com and press Run |
| \`codebook.csv\` | One row per question for analysis (id, type, options, evidence area, SDG target, source) |
| \`questions.json\` | The single source of truth. Edit it and run \`node scripts/build-pilot-form.mjs\` |

Three forms, on purpose:

1. **Pilot feedback form**: consent, participant ID, 18 multiple-choice questions, each with the optional expansion box. Given straight after the session.
2. **Day-7 follow-up**: participant ID and ${D.day7.length - 1} multiple-choice questions, about ${minutes(D.day7)} minutes. Sent a week later. It asks what people did, not just what they know, which is your best evidence of behaviour change.
3. **Contact form** (optional, separate). Names and contact details are collected here so they are never stored next to feedback answers. Contact details have to be typed, so this one is not multiple choice.

## 2. Evidence areas and SDG mapping (SDG 4 and 5 primary, SDG 10 byproduct)

${sdgTable}

Concepts for account ownership (Q3) follow the Global Findex survey; the wording is ours. The agency item (Q5) is a draft, not a validated scale: check it against a validated women's economic empowerment measure before publishing results.

## 3. How it fits with the in-app pilot

The app already measures knowledge change (6 items, two parallel forms), confidence, observed task success and time, **per-task ease**, UMUX-Lite and a recommend score. This form does not repeat those. It adds what the app cannot: understandability of the purpose and the words, likes and dislikes, preferences, who took part, a money-behaviour baseline, perceived benefit, safety and access barriers. The two datasets join on the **participant ID**, which the app shows on its last screen.

## 4. Design choices

- **Multiple choice throughout**, so answers can be counted and compared. The optional box under each question keeps the "why" without making it a chore.
- **Likes and dislikes are separate questions** (Q10, Q11) so negative feedback is not buried, plus two forced choices (Q12 "which ONE part was most useful", Q13 "change ONE thing first") that reveal real priorities.
- **Comprehension is tested, not asked**: Q6 offers four descriptions of Sisi and one is correct, which checks whether people understood "education, not advice".
- **No income amounts, ever.** We only ask whether people have an account or save, never how much.
- **"Prefer not to say"** on every question about the person. Only consent and the participant ID are required in the feedback form.
- **Women-specific on purpose**: Q5 asks about say over money, Q9 whether Sisi spoke to women like them, Q17 safety, and Q18 includes shared or monitored phones, because these are the SDG 5 conditions the product has to meet.
- **Anonymity**: contact details live in their own form.

## 5. Before you publish

1. Run \`create-forms.gs\` and open each form's edit link. Preview on a phone and time it.
2. In each form: Responses → Link to Sheets. Keep "Collect email addresses" **off** (the script does).
3. Replace the opening text with the PPS-approved consent and privacy wording if it differs. Confirm POPIA responsibilities with PPS.
4. Add the PPS logo or a header image through the form theme if you wish.
5. Paste the published feedback link into \`FEEDBACK_FORM_URL\` in \`lib/pilot/instruments.ts\`. The pilot's last screen then shows an "Open the feedback form" button.
6. Calendar-remind yourself to send the day-7 link.

## 6. The questions

${formMd('Form 1: Pilot feedback form', D.forms.main, D.main)}

${formMd('Form 2: Day-7 follow-up', D.forms.day7, D.day7)}

${formMd('Form 3: Contact form (optional, separate)', D.forms.contact, D.contact)}

## 7. Analysis plan (short)

**SDG 4 evidence (education).** The in-app knowledge gain (6 items, parallel forms) is the headline. Support it with Q6 (percent who choose the correct description of Sisi), Q7 and Q8 (clarity and language), Q14 and D5 (confidence), and D6 (skills used in a real decision at day 7).

**SDG 5 evidence (gender equality).** Baseline: Q3 (account), Q4 (saving), Q5 (say over money). Change at day 7: D2 and D3 (actions and saving), D6 (decided on my own or together). Conditions: Q9 (spoke to women like me), Q17 (safety), Q18 (phone access barriers), Q15 (benefits people expect, including saying no to money requests and asking for fair pay).

**SDG 10 (byproduct).** Cut Q7, Q8, Q9, Q14 and Q17 by Q1, Q2 and the Q18 barriers (data cost, language, shared or monitored phone). Report whether the gaps are small or large. That is the evidence that Sisi is reaching women who are usually left out.

**Product decisions.** Q10 and Q11 (tick-lists), Q12 and Q13 (forced choices) and Q16 (what brings people back). Read the optional boxes and code themes (two people code a sample, agree, then code the rest).

Say plainly that this is a small, self-selected pilot with no control group.
`;
fs.writeFileSync(`${dir}/FEEDBACK_FORM.md`, md);

const mdToHtml = (s) => esc(s)
  .replace(/^# (.*)$/gm, '<h1>$1</h1>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^#### (.*)$/gm, '<h4>$1</h4>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*\n]+)\*/g, '<i>$1</i>').replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>').replace(/^- (.*)$/gm, '<li>$1</li>').replace(/^\d\. (.*)$/gm, '<li>$1</li>');
const tableHtml = (block) => { const rows = block.trim().split('\n').filter((l) => !/^\|[-| ]+\|$/.test(l)); return '<table>' + rows.map((r, i) => `<tr>${r.split('|').slice(1, -1).map((c) => `<${i ? 'td' : 'th'}>${c.trim()}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('') + '</table>'; };
const wrapP = (h) => (/^<(h\d|table|ul|li|blockquote)/.test(h.trim()) ? h : `<p>${h}</p>`);
const parts = md.split(/\n\n/).map((blk) => (blk.trim().startsWith('|') ? tableHtml(esc(blk).replace(/&amp;/g, '&')).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>') : mdToHtml(blk).replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>').replace(/\n/g, '<br>'))).map(wrapP);
fs.writeFileSync(`${dir}/FEEDBACK_FORM.html`, `<!doctype html><html><head><meta charset="utf-8"><title>Sisi pilot feedback: Google Form pack</title><style>
@page{size:A4;margin:16mm 14mm}body{font-family:Arial,Helvetica,sans-serif;font-size:9.8pt;line-height:1.38;color:#2A1433}
h1{font-size:19pt;color:#AD1457;margin:0 0 4mm}h2{font-size:14pt;color:#AD1457;border-bottom:.4mm solid #F48FB1;padding-bottom:1mm;margin:7mm 0 3mm;page-break-after:avoid}h3{font-size:12.5pt;margin:6mm 0 2mm;background:#FCE4EF;padding:2mm 3mm;border-radius:2mm;page-break-after:avoid}h4{font-size:11pt;margin:5mm 0 1.5mm;color:#7E57C2;page-break-after:avoid}
table{border-collapse:collapse;width:100%;margin:2mm 0;font-size:8.8pt}th{background:#FCE4EF;text-align:left}td,th{border:.3mm solid #F48FB1;padding:1.4mm 2mm;vertical-align:top}
blockquote{margin:1mm 0;padding:1mm 3mm;border-left:1mm solid #F48FB1;background:#FFF5F9}code{background:#EFE7FB;padding:0 1mm;border-radius:1mm;font-size:8.8pt}ul{margin:1mm 0 2mm 5mm;padding:0}li{margin:.4mm 0}p{margin:0 0 2mm}
</style></head><body>${parts.join('\n')}</body></html>`);
console.log(JSON.stringify({ items: nMain, questions: nMain - 2, withExpansion: nExp, minMain: minutes(D.main), minDay7: minutes(D.day7) }));
