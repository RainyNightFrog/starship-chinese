/**
 * 從 CCD 資料集產生校本字詞表字形拆解（僅含 WORKSHEET 用字）
 * 執行：node scripts/generate-worksheet-decomposition.mjs
 */
import ccd from 'chinese-characters-decomposition';
import { WORKSHEET_ORDERED_WORDS } from '../src/worksheetVocabLexicon.js';
import { writeFileSync } from 'fs';

const ccdMap = new Map(ccd.rows.map((r) => [r[0], r]));
const chars = new Set();
for (const w of WORKSHEET_ORDERED_WORDS) {
  for (const c of w) chars.add(c);
}

function cleanPart(s) {
  if (!s) return '';
  return String(s).replace(/\*+$/, '').trim();
}

/** CCD 列 → 部首 + 部件（對齊課堂「偏旁 + 形旁」展示） */
export function ccdRowToDecomposition(row) {
  const [, , type, left, , right, , , , section] = row;
  const L = cleanPart(left);
  const R = cleanPart(right);
  if (!L && !R) return { radical: row[0], body: '—' };
  if (!R) return { radical: L || row[0], body: '—' };

  const sec = cleanPart(section);
  if (sec && sec !== row[0]) {
    if (R === sec) return { radical: sec, body: L };
    if (L === sec) return { radical: sec, body: R };
  }
  if (type === '吕' && sec === R) return { radical: R, body: L };
  if (type === '回') return { radical: L, body: R };
  return { radical: L, body: R };
}

const out = {};
for (const c of [...chars].sort()) {
  const row = ccdMap.get(c);
  out[c] = row ? ccdRowToDecomposition(row) : { radical: c, body: '—' };
}

const lines = Object.entries(out).map(
  ([k, v]) => `  ${JSON.stringify(k)}: { radical: ${JSON.stringify(v.radical)}, body: ${JSON.stringify(v.body)} },`,
);
const content = `/** 校本字詞表字形拆解 — 由 scripts/generate-worksheet-decomposition.mjs 產生 */\nexport const WORKSHEET_CHAR_DECOMPOSITION = {\n${lines.join('\n')}\n};\n`;
writeFileSync(new URL('../src/worksheetCharDecomposition.js', import.meta.url), content);
console.log(`Wrote ${Object.keys(out).length} chars → src/worksheetCharDecomposition.js`);
