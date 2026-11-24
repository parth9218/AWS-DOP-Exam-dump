/* parseQuestion — ported from vanilla app.js */

/**
 * Splits a question's raw body into { body, options }
 * Supports options formatted as **A:**, **A.**, A., A), or A:
 */
export function parseQuestion(q) {
  let raw = q.body || '';

  // Defensively strip ExamTopics scrape header banner
  raw = raw.replace(/^Exam question from\s+Amazon's[\s\S]*?\[All [^\]]+\]\s*/i, '').trim();

  // Defensively strip Suggested Answer line if still present
  raw = raw.replace(/\n?\s*Suggested Answer:\s*[A-Z]+\s*🗳️?\s*/gi, '\n\n');

  // Option regex matching **A:**, **A.**, or A., A), A: at line starts
  const optionRegex = /(?:^|\n)\s*(?:\*\*([A-Z])[\.:\)]?\*\*|([A-Z])[\.:\)])\s*/g;
  let match;
  const positions = [];

  while ((match = optionRegex.exec(raw)) !== null) {
    const key = match[1] || match[2];
    positions.push({ key, start: match.index, contentStart: match.index + match[0].length });
  }

  if (positions.length === 0) return { body: raw.trim(), options: [] };

  const body = raw.slice(0, positions[0].start).trim();
  const options = positions.map((pos, i) => {
    const end = i + 1 < positions.length ? positions[i + 1].start : raw.length;
    return { key: pos.key, text: raw.slice(pos.contentStart, end).trim() };
  });

  return { body, options };
}

/** How many answers the question expects */
export function allowedCount(answerStr) {
  return answerStr ? answerStr.length : 1;
}

/** 'single' | 'multiple-2' | 'multiple-3' */
export function questionType(q) {
  const c = allowedCount(q.answer);
  if (c === 1) return 'single';
  if (c === 2) return 'multiple-2';
  return 'multiple-3';
}

/** Correct answer keys array (sorted, uppercase) */
export function correctKeys(q) {
  return (q.answer || '').toUpperCase().split('').sort();
}

/** Render minimal markdown: **bold**, newlines → <br> */
export function renderMarkdown(text) {
  if (!text) return '';

  let out = text
    // Defensively strip banner and suggested answers
    .replace(/^Exam question from\s+Amazon's[\s\S]*?\[All [^\]]+\]\s*/i, '')
    .replace(/\n?\s*Suggested Answer:\s*[A-Z]+\s*🗳️?\s*/gi, '\n\n')
    .trim();

  out = out
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Make line-starting options bold if not already bold (e.g. A. text -> **A:** text)
  out = out.replace(/(?:^|\n)\s*([A-H])\.\s+/g, '\n\n**$1:** ');

  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/\n/g, '<br>');
  out = out.replace(/^(?:<br\s*\/?>)+/, '');

  return out;
}

export function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
