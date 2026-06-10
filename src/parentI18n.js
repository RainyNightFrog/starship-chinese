/** 家長端 UI 雙語文案 — 中文為主，英文並列（體貼英文家長） */

export const STUDENT_TYPE_OPTIONS = [
  {
    id: 'local',
    zh: '本地生',
    en: 'Local HK Student',
    descZh: '繁體 + 粵拼，標準校本節奏',
    descEn: 'Traditional Chinese + Jyutping',
  },
  {
    id: 'sen',
    zh: 'SEN 特殊學習需要',
    en: 'Special Educational Needs',
    descZh: '大字體、加時、字形拆解鷹架',
    descEn: 'Large text, extra time, character scaffolding',
  },
  {
    id: 'mainland',
    zh: '內地生',
    en: 'Mainland Student',
    descZh: '簡體 + 普通話拼音',
    descEn: 'Simplified Chinese + Hanyu Pinyin',
  },
  {
    id: 'ncs',
    zh: '非華語生 (NCS)',
    en: 'Non-Chinese Speaking',
    descZh: '中英雙語對照輔助',
    descEn: 'Bilingual Chinese–English support',
  },
];

export const TASK_OPTIONS = [
  { id: 'dictation', icon: '🎧', zh: '默書特訓', en: 'Dictation Drill' },
  { id: 'quiz', icon: '📝', zh: '單元測驗', en: 'Quick Quiz' },
  { id: 'sspa', icon: '🏆', zh: '呈分試模擬', en: 'SSPA Mock Exam' },
  { id: 'prestudy', icon: '🌱', zh: '課文預習', en: 'Pre-study' },
  { id: 'sentence', icon: '🧩', zh: '重組句子', en: 'Sentence Unscramble' },
  { id: 'reading', icon: '📖', zh: '閱讀理解', en: 'Reading Comprehension' },
];
