/**
 * 各學習需要的詞表池 — 每次上載可輪換不同組合
 */
const VOCAB_MASTER = {
  anwei: { id: 1, tc: '安慰', sc: '安慰', py: 'ān wèi', jp: 'on1 wai3', en: 'Comfort' },
  jiazhi: { id: 2, tc: '價值', sc: '价值', py: 'jià zhí', jp: 'gaa3 zik6', en: 'Value' },
  chuanshou: { id: 3, tc: '傳授', sc: '传授', py: 'chuán shòu', jp: 'cyun4 sau6', en: 'Pass on' },
  qifa: { id: 5, tc: '啟發', sc: '启发', py: 'qǐ fā', jp: 'kai2 faat3', en: 'Inspire', radical: '戶', body: '口攵' },
  zhengui: { id: 8, tc: '珍貴', sc: '珍贵', py: 'zhēn guì', jp: 'zan1 gwai3', en: 'Precious' },
  huangwu: { id: 11, tc: '恍然大悟', sc: '恍然大悟', py: 'huǎng rán dà wù', jp: 'fong2 jin4 daai6 ng6', en: 'Suddenly understand', radical: '忄', body: '𡿺' },
  bingjian: { id: 12, tc: '並肩作戰', sc: '并肩作战', py: 'bìng jiān zuò zhàn', jp: 'bing3 gin1 zok3 zin3', en: 'Fight together', radical: '立', body: '並' },
  tuanjie: { id: 13, tc: '團結', sc: '团结', py: 'tuán jié', jp: 'tyun4 git3', en: 'Unity' },
  chenzhi: { id: 14, tc: '沉著', sc: '沉着', py: 'chén zhuó', jp: 'cam4 zoek3', en: 'Composed' },
  zhengfu: { id: 15, tc: '征服', sc: '征服', py: 'zhēng fú', jp: 'zing1 fuk6', en: 'Conquer' },
};

/** 多組上載方案 — 每次上載輪換，各學習需要詞表不同 */
export const UPLOAD_VARIANTS = [
  {
    label: '校本詞表 A',
    vocabByTask: {
      dictation: [VOCAB_MASTER.anwei, VOCAB_MASTER.chuanshou, VOCAB_MASTER.qifa],
      prestudy: [VOCAB_MASTER.anwei, VOCAB_MASTER.jiazhi, VOCAB_MASTER.chuanshou, VOCAB_MASTER.qifa, VOCAB_MASTER.zhengui],
      quiz: [VOCAB_MASTER.huangwu, VOCAB_MASTER.qifa],
      sspa: [VOCAB_MASTER.bingjian, VOCAB_MASTER.tuanjie],
    },
  },
  {
    label: '校本詞表 B',
    vocabByTask: {
      dictation: [VOCAB_MASTER.zhengui, VOCAB_MASTER.chenzhi, VOCAB_MASTER.tuanjie],
      prestudy: [VOCAB_MASTER.zhengui, VOCAB_MASTER.huangwu, VOCAB_MASTER.bingjian, VOCAB_MASTER.chenzhi],
      quiz: [VOCAB_MASTER.huangwu, VOCAB_MASTER.zhengui],
      sspa: [VOCAB_MASTER.zhengfu, VOCAB_MASTER.chenzhi],
    },
  },
  {
    label: '校本詞表 C（安慰、傳授、啟發）',
    vocabByTask: {
      dictation: [VOCAB_MASTER.anwei, VOCAB_MASTER.chuanshou, VOCAB_MASTER.qifa],
      prestudy: [VOCAB_MASTER.anwei, VOCAB_MASTER.chuanshou, VOCAB_MASTER.qifa],
      quiz: [VOCAB_MASTER.qifa, VOCAB_MASTER.anwei],
      sspa: [VOCAB_MASTER.bingjian, VOCAB_MASTER.qifa],
    },
  },
];

import { enrichVocabList, withHints } from './vocabHints';

export function cloneVocab(list) {
  return enrichVocabList(list.map((v) => ({ ...v })));
}

/** 依 activeTask 取得對應詞表（含字義提示） */
export function getVocabForTask(assignedContent, taskId) {
  const byTask = assignedContent.vocabByTask;
  let list;
  if (byTask?.[taskId]?.length) list = byTask[taskId];
  else if (taskId === 'prestudy' && byTask?.dictation?.length) list = byTask.dictation;
  else list = assignedContent.vocabList ?? [];
  return enrichVocabList(list);
}

/** 合併常錯字到默書詞表（優先復習） */
export function mergeWrongWordsIntoDictation(dictationList, wrongWordEntries) {
  const frequent = wrongWordEntries.filter((w) => w.count >= 1);
  const existing = new Set(dictationList.map((v) => v.tc));
  const extras = frequent
    .filter((w) => !existing.has(w.tc))
    .map((w, i) => withHints({
      id: `wrong-${w.tc}-${i}`,
      tc: w.tc,
      sc: w.sc || w.tc,
      py: w.py || '',
      jp: w.jp || '',
      en: w.en || '',
      radical: w.radical,
      body: w.body,
      isReview: true,
    }));
  return [...extras, ...dictationList];
}

/** 家長模擬上載 — 輪換詞表並按學習需要分配 */
export function applyPhotoUpload(config, wrongWordEntries = []) {
  const nextIndex = ((config.uploadVariantIndex ?? 0) + 1) % UPLOAD_VARIANTS.length;
  const variant = UPLOAD_VARIANTS[nextIndex];
  const vocabByTask = {};

  Object.entries(variant.vocabByTask).forEach(([task, list]) => {
    vocabByTask[task] = cloneVocab(list);
  });

  if (wrongWordEntries.length) {
    vocabByTask.dictation = mergeWrongWordsIntoDictation(vocabByTask.dictation, wrongWordEntries);
  }

  const flat = vocabByTask.prestudy ?? vocabByTask.dictation ?? [];

  return {
    ...config,
    activeTask: 'dictation',
    uploadVariantIndex: nextIndex,
    uploadLabel: variant.label,
    assignedContent: {
      ...config.assignedContent,
      vocabByTask,
      vocabList: cloneVocab(flat),
    },
  };
}

/** 初始化預設詞表（各任務共用初始池） */
export function buildInitialVocabByTask() {
  const base = cloneVocab(UPLOAD_VARIANTS[0].vocabByTask.prestudy);
  return {
    dictation: cloneVocab(UPLOAD_VARIANTS[0].vocabByTask.dictation),
    prestudy: base,
    quiz: cloneVocab(UPLOAD_VARIANTS[0].vocabByTask.quiz),
    sspa: cloneVocab(UPLOAD_VARIANTS[0].vocabByTask.sspa),
  };
}

export { VOCAB_MASTER };
