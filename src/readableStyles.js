/**
 * 深夜 / 日間可讀性樣式 — 各科目選擇題／詞卡／閱讀共用
 */

/** 選擇題選項（quiz / sspa / reading）— 含答題後反饋與 hover 過渡 */
export function getChoiceOptionClasses(isNight, { completed, isCorrect, isSelected, showShield }) {
  const revealCorrect = completed || showShield;
  const transition = 'transition-[background-color,border-color,transform,box-shadow,ring-color] duration-300 ease-out';

  if (revealCorrect && isCorrect) {
    return `${transition} animate-[correctOptionPop_0.45s_ease-out] ${isNight
      ? 'bg-emerald-900/55 border-emerald-400 text-emerald-100 shadow-md ring-2 ring-emerald-500/40'
      : 'bg-emerald-100 border-emerald-500 text-emerald-800 shadow-md ring-2 ring-emerald-300/60'}`;
  }
  if (isSelected && showShield) {
    return `${transition} animate-[wrongOptionPulse_0.5s_ease-out] ${isNight
      ? 'bg-sky-900/45 border-sky-400 text-sky-100 ring-2 ring-sky-600/50 shadow-md'
      : 'bg-sky-50 border-sky-300 text-slate-900 ring-2 ring-sky-200 shadow-sm'}`;
  }
  if (isSelected && isCorrect) {
    return `${transition} animate-[correctOptionPop_0.45s_ease-out] ${isNight
      ? 'bg-emerald-900/55 border-emerald-400 text-emerald-100 shadow-md'
      : 'bg-emerald-100 border-emerald-500 text-emerald-800 shadow-md'}`;
  }
  return `${transition} ${isNight
    ? 'bg-stone-800 border-stone-500 text-stone-50 hover:border-amber-500 hover:bg-stone-700 hover:shadow-md'
    : 'bg-[#FFFCF7] border-orange-200 text-stone-700 hover:border-orange-300 hover:bg-orange-50/60 hover:shadow-sm'}`;
}

/**
 * 測驗選項文字 — 短字放大；中等長度縮字單行；超長才允許兩行
 * @param {number} [maxLines=1] — 1 盡量單行，2 允許折成兩行
 */
export function getQuizOptionWordClasses(isNight, isSEN, word, maxLines = 1) {
  const len = word.length;
  const color = isNight ? 'text-amber-100' : 'text-amber-950';
  const base = `block w-full font-black mb-2 text-center ${color}`;

  if (len <= 4) {
    return `${base} leading-snug ${isSEN ? 'text-4xl' : 'text-3xl'}`;
  }
  if (maxLines >= 2 || len > 16) {
    return `${base} leading-snug ${isSEN ? 'text-xl' : 'text-lg'} line-clamp-2`;
  }
  return `${base} leading-snug ${isSEN ? 'text-2xl' : 'text-xl'}`;
}

/** 依選項字數決定按鈕最小高度 */
export function getQuizOptionButtonSize(isSEN, word) {
  const len = word.length;
  if (len <= 4) return isSEN ? 'p-5 min-h-[112px]' : 'p-4 min-h-[96px]';
  if (len <= 16) return isSEN ? 'p-5 min-h-[100px]' : 'p-4 min-h-[92px]';
  return isSEN ? 'p-5 min-h-[108px]' : 'p-4 min-h-[96px]';
}

/** 選項字數 tier：short | medium | long */
export function getQuizOptionLengthTier(word) {
  const len = word.length;
  if (len <= 4) return 'short';
  if (len <= 16) return 'medium';
  return 'long';
}

/** 重組句子 — 待選詞語 chip */
export function getSentencePoolChipClasses(isNight, isSEN) {
  const size = isSEN ? 'px-6 py-3 text-lg border-amber-500' : 'px-5 py-2.5 text-sm border-amber-400';
  return isNight
    ? `font-black rounded-xl shadow-sm transition active:scale-95 bg-stone-800 border-2 text-amber-100 hover:bg-stone-700 ${size}`
    : `font-black rounded-xl shadow-sm transition active:scale-95 bg-white border-2 text-stone-900 hover:bg-stone-50 ${isSEN ? 'px-6 py-3 text-lg border-stone-300' : 'px-5 py-2.5 text-sm border-stone-200'}`;
}

/** 閱讀理解 — 段落逐行聚焦 */
export function getReadingLineClasses(isNight, activeLine, idx) {
  if (activeLine === null) {
    return isNight ? 'text-stone-100' : 'text-slate-800';
  }
  if (activeLine === idx) {
    return isNight
      ? 'bg-amber-900/50 font-extrabold text-amber-50 border border-amber-500/80 shadow-sm'
      : 'bg-amber-100 font-extrabold text-amber-950 border border-amber-300 shadow-sm';
  }
  return isNight ? 'opacity-60 text-stone-400' : 'opacity-55 text-slate-600';
}

/** 題幹文字 */
export function getQuestionBodyClass(isNight, isSEN) {
  return `font-bold ${isNight ? 'text-stone-100' : 'text-slate-800'} ${isSEN ? 'text-xl leading-loose' : 'text-base leading-relaxed'}`;
}

/** 次要說明文字 */
export function getMutedTextClass(isNight, extra = '') {
  return `${isNight ? 'text-stone-400' : 'opacity-60'} ${extra}`.trim();
}

/** 文字連結按鈕（如「重設句子」） */
export function getTextLinkClass(isNight) {
  return isNight ? 'text-sky-300 hover:text-sky-200' : 'text-sky-600 hover:text-sky-700';
}
