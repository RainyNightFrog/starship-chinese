/**
 * 默書字義提示 — 不得包含默書詞本身（繁/簡、逐字皆剔除）
 */

function escapeRegex(ch) {
  return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 默書詞的所有書寫形式（繁/簡，長詞優先） */
export function getTargetWordForms(vocab) {
  const forms = new Set();
  if (vocab?.tc) forms.add(vocab.tc);
  if (vocab?.sc) forms.add(vocab.sc);
  return [...forms].filter(Boolean).sort((a, b) => b.length - a.length);
}

/** 默書詞所含逐字（用於剔除提示內殘留的同字） */
export function getTargetChars(vocab) {
  const chars = new Set();
  for (const form of getTargetWordForms(vocab)) {
    for (const ch of form) chars.add(ch);
  }
  return [...chars];
}

export function hintContainsTargetWord(hint, vocab) {
  if (!hint || !vocab) return false;
  const forms = getTargetWordForms(vocab);
  if (forms.some((form) => hint.includes(form))) return true;
  if (shouldStripTargetChars(vocab)) {
    return getTargetChars(vocab).some((ch) => hint.includes(ch));
  }
  return false;
}

function cleanHintPunctuation(text) {
  return text
    .replace(/意思是\s*[、，,]\s*/g, '意思是')
    .replace(/[、，]{2,}/g, '、')
    .replace(/[、，]\s*$/g, '')
    .replace(/^\s*[、，]\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildDictationFallbackHint(vocab, displaySc) {
  if (vocab.en) {
    return displaySc ? `可理解為 ${vocab.en}` : `可理解為 ${vocab.en}`;
  }
  if (vocab.radical) {
    const radical = displaySc && vocab.sc ? vocab.sc[0] : vocab.radical;
    return `注意部首「${radical}」的字形`;
  }
  return '請根據語境想想詞語的意思';
}

/** 短詞（單字或雙字）須剔除所含各字，避免「撫慰」洩漏「慰」 */
function shouldStripTargetChars(vocab) {
  const forms = getTargetWordForms(vocab);
  if (!forms.length) return false;
  const maxLen = Math.max(...forms.map((form) => form.length));
  return maxLen <= 2;
}

/**
 * 從提示中剔除默書詞（整詞；單字則再剔除各字出現），並整理標點
 */
export function sanitizeDictationHint(hint, vocab, { displaySc = false } = {}) {
  if (!vocab) return hint || '';

  let result = hint || '';

  for (const form of getTargetWordForms(vocab)) {
    result = result.split(form).join('');
  }

  if (shouldStripTargetChars(vocab)) {
    for (const ch of getTargetChars(vocab)) {
      result = result.replace(new RegExp(escapeRegex(ch), 'g'), '');
    }
  }

  result = cleanHintPunctuation(result);

  if (!result || result === '意思是' || result.length < 4) {
    return buildDictationFallbackHint(vocab, displaySc);
  }

  return result;
}
