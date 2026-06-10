/**
 * 詞彙字義提示 — 正式書面語（繁/簡）
 * 語音：默認以廣東話朗讀書面語；僅家長選「內地生」時改普通話。
 */
import { applyVocabDecomposition } from './vocabDecomposition.js';
export const VOCAB_HINTS = {
  安慰: { tc: '用言語或行動減輕他人的愁苦與壓力', sc: '用言语或行动减轻他人的愁苦与压力' },
  價值: { tc: '物品所具有的意義與重要程度', sc: '物品所具有的意义与重要程度' },
  傳授: { tc: '把知識或技能教給他人', sc: '把知识或技能教给他人' },
  价值: { tc: '物品所具有的意義與重要程度', sc: '物品所具有的意义与重要程度' },
  传授: { tc: '把知識或技能教給他人', sc: '把知识或技能教给他人' },
  啟發: { tc: '引導思考，使人領悟明白', sc: '引导思考，使人领悟明白' },
  启发: { tc: '引導思考，使人領悟明白', sc: '引导思考，使人领悟明白' },
  珍貴: { tc: '稀有而難得', sc: '稀有而难得' },
  珍贵: { tc: '稀有而難得', sc: '稀有而难得' },
  恍然大悟: { tc: '突然之間徹底明白、豁然開竅', sc: '突然之间彻底明白、豁然开朗' },
  並肩作戰: { tc: '彼此靠在一起，齊心協力共同奮戰', sc: '彼此靠在一起，齐心协力共同奋战' },
  并肩作战: { tc: '彼此靠在一起，齊心協力共同奮戰', sc: '彼此靠在一起，齐心协力共同奋战' },
  團結: { tc: '眾人同心、一致合力', sc: '众人同心、一致合力' },
  团结: { tc: '眾人同心、一致合力', sc: '众人同心、一致合力' },
  沉著: { tc: '鎮定不慌、從容應對', sc: '镇定不慌、从容应对' },
  沉着: { tc: '鎮定不慌、從容應對', sc: '镇定不慌、从容应对' },
  征服: { tc: '戰勝困難、克服挑戰', sc: '战胜困难、克服挑战' },
  悟: { tc: '心裏明白、突然想通', sc: '心里明白、突然想通' },
  语: { tc: '與人溝通時使用的詞句', sc: '与人沟通时使用的词句' },
  語: { tc: '與人溝通時使用的詞句', sc: '与人沟通时使用的词句' },
};

export function withHints(vocab) {
  const hints = VOCAB_HINTS[vocab.tc] ?? VOCAB_HINTS[vocab.sc];
  if (!hints) return { ...vocab };
  return { ...vocab, hintTc: hints.tc, hintSc: hints.sc };
}

export function enrichVocabList(list) {
  return list.map((v) => applyVocabDecomposition(withHints(v)));
}
