/* parseQuestion — ported from vanilla app.js */

/**
 * Splits a question's raw body into { body, options }
 * Options are lines starting with **A:** / **B:** etc.
 */
export function parseQuestion(q) {
  const raw = q.body || '';
  const optionRegex = /\*\*([A-Z]):\*\*/g;
  let match;
  const positions = [];

  while ((match = optionRegex.exec(raw)) !== null) {
    positions.push({ key: match[1], start: match.index, contentStart: match.index + match[0].length });
  }

  if (positions.length === 0) return { body: raw, options: [] };

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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\n/g, '<br>');
  return out;
}

export function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
