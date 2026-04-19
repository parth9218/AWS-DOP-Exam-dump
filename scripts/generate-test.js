#!/usr/bin/env node
/**
 * generate-test.js
 * ─────────────────────────────────────────────────────────
 * Picks N random questions from the source question bank
 * and writes them to exam-app/public/questions.json so a
 * fresh mock exam is ready in the React app.
 *
 * Run from the project root (AWS-DOP/):
 *   node scripts/generate-test.js          → 75 questions (default)
 *   node scripts/generate-test.js 50       → 50 questions
 *   node scripts/generate-test.js 100      → 100 questions
 * ─────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

/* ── Config ─────────────────────────────────────────────── */
const ROOT   = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'questions.json');
const DEST   = path.join(ROOT, 'exam-app', 'public', 'questions.json');
const COUNT  = parseInt(process.argv[2], 10) || 75;

/* ── Load source bank ───────────────────────────────────── */
if (!fs.existsSync(SOURCE)) {
  console.error(`❌  Source not found: ${SOURCE}`);
  process.exit(1);
}

let bank;
try {
  bank = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
} catch (e) {
  console.error('❌  Failed to parse questions.json:', e.message);
  process.exit(1);
}

/* Keep only valid questions (must have title + body) */
const valid = bank.filter(q => q && q.title && q.body);
if (valid.length < COUNT) {
  console.warn(`⚠️   Only ${valid.length} valid questions available; using all of them.`);
}

const sample = Math.min(COUNT, valid.length);

/* ── Fisher-Yates shuffle → take first `sample` items ───── */
const pool = [...valid];
for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [pool[i], pool[j]] = [pool[j], pool[i]];
}
const selected = pool.slice(0, sample);

/* ── Write output ───────────────────────────────────────── */
const destDir = path.dirname(DEST);
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

fs.writeFileSync(DEST, JSON.stringify(selected, null, 2), 'utf8');

console.log(`✅  Generated ${selected.length} random questions`);
console.log(`    Source : ${SOURCE}  (${valid.length} valid)`);
console.log(`    Output : ${DEST}`);
console.log(`\n    Refresh the dev server to start the new test! 🚀`);
