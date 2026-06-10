/**
 * 星航中文 · 本地海量題庫（小五至小六呈分試難度）
 * 六大科目獨立題池，由 useQuestionEngine 洗牌 + 去重驅動。
 */

import { examMethodTemplatesToMockPool } from './readingGoldenTechniquePool.js';
import {
  buildDefaultAdvancedQuestionPool,
  referenceTemplatesToQuizPool,
  SSPA_REFERENCE_TEMPLATES,
} from './sspaReferenceTemplatePool.js';
import { BUILTIN_READING_POOL } from './readingBuiltinPool.js';
import { IDIOM_EXAM_POOL, idiomExamPoolToQuizPool } from './idiomExamPool.js';
import { EXAM_METHOD_TEMPLATES } from './readingGoldenTechniquePool.js';
import {
  buildQuizPoolWithGlobal,
  buildSspaPoolWithGlobal,
  globalIdiomsToVocabPool,
  getGlobalSharedIdioms,
  enrichQuizItemWithContributor,
  enrichPoolItemWithContributor,
  getGlobalPoolStats,
} from './globalSharedPool.js';

/** 基礎 30 題小五/小六呈分試核心詞彙矩陣（答案已完全隔離）— 黃金種子庫 */
export const BASE_IDIOM_POOL = IDIOM_EXAM_POOL;

/** 基礎四大寫作手法題型池 — 黃金種子庫 */
export const BASE_METHOD_TEMPLATES = EXAM_METHOD_TEMPLATES;

export const DICTATION_VOCAB_POOL = [
  { id: 'dict-001', tc: '恍然大悟', sc: '恍然大悟', py: 'huǎng rán dà wù', jp: 'fong2 jin4 daai6 ng6', en: 'Suddenly understand', radical: '忄', body: '𡿺', hintTc: '突然之間徹底明白、豁然開竅', hintSc: '突然之间彻底明白、豁然开朗' },
  { id: 'dict-002', tc: '並肩作戰', sc: '并肩作战', py: 'bìng jiān zuò zhàn', jp: 'bing3 gin1 zok3 zin3', en: 'Fight side by side', radical: '立', body: '並', hintTc: '彼此靠在一起，齊心協力共同奮戰', hintSc: '彼此靠在一起，齐心协力共同奋战' },
  { id: 'dict-003', tc: '中流砥柱', sc: '中流砥柱', py: 'zhōng liú dǐ zhù', jp: 'zung1 lau4 dai2 zyu3', en: 'Pillar of strength', radical: '丨', body: '隹', hintTc: '比喻堅強獨立，能起支柱作用的人', hintSc: '比喻坚强独立，能起支柱作用的人' },
  { id: 'dict-004', tc: '扣人心弦', sc: '扣人心弦', py: 'kòu rén xīn xián', jp: 'kau3 jan4 sam1 jin4', en: 'Touching', radical: '扌', body: '口', hintTc: '形容詩文、表演等十分動人', hintSc: '形容诗文、表演等十分动人' },
  { id: 'dict-005', tc: '不寒而慄', sc: '不寒而栗', py: 'bù hán ér lì', jp: 'bat1 hon4 ji4 leot6', en: 'Shiver without cold', radical: '一', body: '栗', hintTc: '形容非常恐懼害怕', hintSc: '形容非常恐惧害怕' },
  { id: 'dict-006', tc: '安慰', sc: '安慰', py: 'ān wèi', jp: 'on1 wai3', en: 'Comfort', hintTc: '用言語或行動減輕他人的愁苦與壓力', hintSc: '用言语或行动减轻他人的愁苦与压力' },
  { id: 'dict-007', tc: '啟發', sc: '启发', py: 'qǐ fā', jp: 'kai2 faat3', en: 'Inspire', radical: '戶', body: '口攵', hintTc: '引導思考，使人領悟明白', hintSc: '引导思考，使人领悟明白' },
  { id: 'dict-008', tc: '沉著', sc: '沉着', py: 'chén zhuó', jp: 'cam4 zoek3', en: 'Composed', hintTc: '鎮定不慌、從容應對', hintSc: '镇定不慌、从容应对' },
  { id: 'dict-009', tc: '珍貴', sc: '珍贵', py: 'zhēn guì', jp: 'zan1 gwai3', en: 'Precious', hintTc: '稀有而難得', hintSc: '稀有而难得' },
  { id: 'dict-010', tc: '團結', sc: '团结', py: 'tuán jié', jp: 'tyun4 git3', en: 'Unity', hintTc: '眾人同心、一致合力', hintSc: '众人同心、一致合力' },
  { id: 'dict-011', tc: '傳授', sc: '传授', py: 'chuán shòu', jp: 'cyun4 sau6', en: 'Pass on', hintTc: '把知識或技能教給他人', hintSc: '把知识或技能教给他人' },
  { id: 'dict-012', tc: '價值', sc: '价值', py: 'jià zhí', jp: 'gaa3 zik6', en: 'Value', hintTc: '物品所具有的意義與重要程度', hintSc: '物品所具有的意义与重要程度' },
  { id: 'dict-013', tc: '征服', sc: '征服', py: 'zhēng fú', jp: 'zing1 fuk6', en: 'Conquer', hintTc: '戰勝困難、克服挑戰', hintSc: '战胜困难、克服挑战' },
  { id: 'dict-014', tc: '堅毅', sc: '坚毅', py: 'jiān yì', jp: 'gin1 ngai6', en: 'Resolute', hintTc: '堅定而有毅力', hintSc: '坚定而有毅力' },
  { id: 'dict-015', tc: '虛懷若谷', sc: '虚怀若谷', py: 'xū huái ruò gǔ', jp: 'heoi1 waai4 je6 guk1', en: 'Humble', hintTc: '形容胸懷寬廣，像山谷一樣能容納', hintSc: '形容胸怀宽广，像山谷一样能容纳' },
];

export const PRESTUDY_VOCAB_POOL = [
  { id: 'pre-001', tc: '恍然大悟', sc: '恍然大悟', py: 'huǎng rán dà wù', jp: 'fong2 jin4 daai6 ng6', en: 'Suddenly understand', radical: '忄', body: '𡿺', hintTc: '意思是突然之間徹底明白、頓悟', hintSc: '意思是突然之间彻底明白、顿悟' },
  { id: 'pre-002', tc: '並肩作戰', sc: '并肩作战', py: 'bìng jiān zuò zhàn', jp: 'bing3 gin1 zok3 zin3', en: 'Fight together', radical: '立', body: '並', hintTc: '意思是並肩協作、共同奮戰', hintSc: '意思是并肩协作、共同奋战' },
  { id: 'pre-003', tc: '扣人心弦', sc: '扣人心弦', py: 'kòu rén xīn xián', jp: 'kau3 jan4 sam1 jin4', en: 'Moving', radical: '扌', body: '口', hintTc: '形容詩文、表演等十分動人', hintSc: '形容诗文、表演等十分动人' },
  { id: 'pre-004', tc: '不寒而慄', sc: '不寒而栗', py: 'bù hán ér lì', jp: 'bat1 hon4 ji4 leot6', en: 'Shiver', hintTc: '形容非常恐懼害怕', hintSc: '形容非常恐惧害怕' },
  { id: 'pre-005', tc: '循序漸進', sc: '循序渐进', py: 'xún xù jiàn jìn', jp: 'ceon4 jik6 jin3 zeon3', en: 'Step by step', hintTc: '指按照一定步驟逐漸深入或提高', hintSc: '指按照一定步骤逐渐深入或提高' },
  { id: 'pre-006', tc: '溫故知新', sc: '温故知新', py: 'wēn gù zhī xīn', jp: 'wan1 gu3 zi1 san1', en: 'Review brings insight', hintTc: '溫習舊知識從而得到新的理解', hintSc: '温习旧知识从而得到新的理解' },
  { id: 'pre-007', tc: '專心致志', sc: '专心致志', py: 'zhuān xīn zhì zhì', jp: 'zyun1 sam1 zi3 zi3', en: 'Concentrate', hintTc: '把心思完全放在一件事上', hintSc: '把心思完全放在一件事上' },
  { id: 'pre-008', tc: '耳濡目染', sc: '耳濡目染', py: 'ěr rú mù rǎn', jp: 'ji5 jyu4 muk6 jim5', en: 'Influenced', hintTc: '形容長期受到環境影響', hintSc: '形容长期受到环境影响' },
  { id: 'pre-009', tc: '一絲不苟', sc: '一丝不苟', py: 'yī sī bù gǒu', jp: 'jat1 si1 bat1 gau2', en: 'Meticulous', hintTc: '形容做事認真細緻，一點不馬虎', hintSc: '形容做事认真细致，一点不马虎' },
  { id: 'pre-010', tc: '實事求是', sc: '实事求是', py: 'shí shì qiú shì', jp: 'sat6 si6 kau4 si6', en: 'Seek truth', hintTc: '指從實際出發，探求真理', hintSc: '指从实际出发，探求真理' },
  { id: 'pre-011', tc: '見義勇為', sc: '见义勇为', py: 'jiàn yì yǒng wéi', jp: 'gin3 ji6 jung5 wai4', en: 'Brave for justice', hintTc: '看到正義的事就勇敢去做', hintSc: '看到正义的事就勇敢去做' },
  { id: 'pre-012', tc: '自告奮勇', sc: '自告奋勇', py: 'zì gào fèn yǒng', jp: 'zi6 gou3 fan5 jung5', en: 'Volunteer', hintTc: '主動要求承擔艱難任務', hintSc: '主动要求承担艰难任务' },
  { id: 'pre-013', tc: '中流砥柱', sc: '中流砥柱', py: 'zhōng liú dǐ zhù', jp: 'zung1 lau4 dai2 zyu3', en: 'Pillar', radical: '丨', body: '隹', hintTc: '比喻堅強獨立，能起支柱作用', hintSc: '比喻坚强独立，能起支柱作用' },
  { id: 'pre-014', tc: '百折不撓', sc: '百折不挠', py: 'bǎi zhé bù náo', jp: 'baak3 zit3 bat1 naau4', en: 'Persevering', hintTc: '比喻意志堅強，無論受多少挫折都不退縮', hintSc: '比喻意志坚强，无论受多少挫折都不退缩' },
  { id: 'pre-015', tc: '精益求精', sc: '精益求精', py: 'jīng yì qiú jīng', jp: 'zing1 jik6 kau4 zing1', en: 'Excellence', hintTc: '已經很好，還要求更好', hintSc: '已经很好，还要求更好' },
];

/** 單元測驗靜態核心題（不含 UGC 共享四字詞庫 — 該部分由 getQuizPoolWithGlobal 動態合併） */
export const QUIZ_POOL_CORE = [
  { id: 'quiz-001', text: '這道科學題我想了很久都不懂，直到看見哥哥的提示，我才恍然大____，原來答案這麼簡單！', hint: '突然徹底明白了（注意形近字）', options: [{ key: 'A', word: '物', detail: '指物品。' }, { key: 'B', word: '語', detail: '形近錯字。' }, { key: 'C', word: '悟', detail: '答對了！明白、覺悟。' }, { key: 'D', word: '誤', detail: '指錯誤。' }], correctKey: 'C', explanation: '「恍然大悟」的「悟」指領悟，不可寫成「語」。' },
  { id: 'quiz-002', text: '下列哪一句運用了「擬人」修辭手法？', hint: '把事物當作人來寫', options: [{ key: 'A', word: '春風像母親的手', detail: '比喻。' }, { key: 'B', word: '風兒輕輕地梳理著柳樹的長髮', detail: '答對了！擬人。' }, { key: 'C', word: '他跑得像一陣風', detail: '比喻。' }, { key: 'D', word: '這座山高聳入雲', detail: '誇張。' }], correctKey: 'B', explanation: '「梳理長髮」把風和柳樹當作人來描寫，是擬人。' },
  { id: 'quiz-003', text: '「學而時習之，不亦說乎？」的「之」字是指：', hint: '文言虛詞', options: [{ key: 'A', word: '代詞：它（所學的）', detail: '答對了！' }, { key: 'B', word: '助詞：的', detail: '結構助詞。' }, { key: 'C', word: '動詞：去', detail: '' }, { key: 'D', word: '語氣詞', detail: '' }], correctKey: 'A', explanation: '此處「之」作代詞，指代所學的知識。' },
  { id: 'quiz-004', text: '「他餓得可以吃下一頭牛」運用了哪種修辭？', hint: '誇大形容程度', options: [{ key: 'A', word: '排比', detail: '' }, { key: 'B', word: '誇張', detail: '答對了！' }, { key: 'C', word: '對偶', detail: '' }, { key: 'D', word: '設問', detail: '' }], correctKey: 'B', explanation: '誇大餓的程度，屬誇張修辭。' },
  { id: 'quiz-005', text: '選出「堅」字的反義詞：', hint: '意思相反', options: [{ key: 'A', word: '強', detail: '近義。' }, { key: 'B', word: '軟', detail: '答對了！' }, { key: 'C', word: '硬', detail: '' }, { key: 'D', word: '固', detail: '' }], correctKey: 'B', explanation: '「堅」的反義是「軟」。' },
  { id: 'quiz-006', text: '「難道你不明白嗎？」這句話運用了：', hint: '用疑問形式強調', options: [{ key: 'A', word: '反問', detail: '答對了！' }, { key: 'B', word: '設問', detail: '' }, { key: 'C', word: '疑問', detail: '' }, { key: 'D', word: '感嘆', detail: '' }], correctKey: 'A', explanation: '反問句以疑問形式強調「應該明白」。' },
  { id: 'quiz-007', text: '「者，……的人也」中的「者」表示：', hint: '文言虛詞', options: [{ key: 'A', word: '代詞：……的人', detail: '答對了！' }, { key: 'B', word: '助詞：的', detail: '' }, { key: 'C', word: '連詞', detail: '' }, { key: 'D', word: '語氣詞', detail: '' }], correctKey: 'A', explanation: '「者」在此作名詞性代詞。' },
  { id: 'quiz-008', text: '「有說、有笑、有玩」運用了：', hint: '結構相似的句子並列', options: [{ key: 'A', word: '排比', detail: '答對了！' }, { key: 'B', word: '對偶', detail: '' }, { key: 'C', word: '反復', detail: '' }, { key: 'D', word: '借代', detail: '' }], correctKey: 'A', explanation: '三個結構相似的短語並列，是排比。' },
  { id: 'quiz-009', text: '「美」與「醜」的關係是：', hint: '意義相反', options: [{ key: 'A', word: '近義', detail: '' }, { key: 'B', word: '反義', detail: '答對了！' }, { key: 'C', word: '同義', detail: '' }, { key: 'D', word: '多義', detail: '' }], correctKey: 'B', explanation: '「美」與「醜」意義相反。' },
  { id: 'quiz-010', text: '「也」在「我也去」中的作用是：', hint: '文言語氣', options: [{ key: 'A', word: '句末語氣詞，表示肯定', detail: '答對了！' }, { key: 'B', word: '代詞', detail: '' }, { key: 'C', word: '連詞', detail: '' }, { key: 'D', word: '結構助詞', detail: '' }], correctKey: 'A', explanation: '句末「也」加強肯定語氣。' },
  { id: 'quiz-011', text: '「月亮像銀盤」運用了：', hint: '兩種不同事物相比', options: [{ key: 'A', word: '擬人', detail: '' }, { key: 'B', word: '比喻', detail: '答對了！' }, { key: 'C', word: '誇張', detail: '' }, { key: 'D', word: '設問', detail: '' }], correctKey: 'B', explanation: '用「銀盤」比「月亮」，是比喻。' },
  { id: 'quiz-012', text: '「乎」在「不亦樂乎」中表示：', hint: '文言語氣詞', options: [{ key: 'A', word: '疑問或感嘆語氣', detail: '答對了！' }, { key: 'B', word: '代詞', detail: '' }, { key: 'C', word: '介詞：於', detail: '' }, { key: 'D', word: '連詞', detail: '' }], correctKey: 'A', explanation: '「乎」在此表感嘆、疑問語氣。' },
  ...referenceTemplatesToQuizPool(),
];

/** @deprecated 請改用 getQuizPoolWithGlobal() — 保留相容 export */
export const QUIZ_POOL = [...QUIZ_POOL_CORE, ...idiomExamPoolToQuizPool()];

export const SSPA_POOL = [
  { id: 'sspa-001', text: '在對抗這次嚴重水災的過程中，消防員、武警部隊和志願者們________，沒日沒夜地搬運沙袋，終於保住了大堤。', hint: '肩膀靠著肩膀，團結一致共同戰鬥', hintEn: 'Shoulder to shoulder', options: ['並肩作戰', '不知不覺', '惟利是圖', '大方得體'], optionsPinyin: ['bìng jiān zuò zhàn', 'bù zhī bù jué', 'wéi lì shì tú', 'dà fāng dé tǐ'], correctIndex: 0, explanation: '並肩作戰：比喻團結合作、共同奮鬥。' },
  { id: 'sspa-002', text: '在國家危難之際，他挺身而出，成為民族________，支撐著大家渡過難關。', hint: '比喻堅強獨立、能起支柱作用的人', options: ['中流砥柱', '曇花一現', '紙上談兵', '無動於衷'], optionsPinyin: ['zhōng liú dǐ zhù', 'tán huā yī xiàn', 'zhǐ shàng tán bīng', 'wú dòng yú zhōng'], correctIndex: 0, explanation: '中流砥柱：比喻能起核心支柱作用的力量。' },
  { id: 'sspa-003', text: '這場慈善晚會的演出________，觀眾無不感動落淚。', hint: '形容表演、詩文十分動人', options: ['扣人心弦', '馬馬虎虎', '無精打采', '漫不經心'], optionsPinyin: ['kòu rén xīn xián', 'mǎ mǎ hǔ hǔ', 'wú jīng dǎ cǎi', 'màn bù jīng xīn'], correctIndex: 0, explanation: '扣人心弦：形容事物十分動人。' },
  { id: 'sspa-004', text: '聽到那驚悚的故事，他________，渾身發抖。', hint: '沒有寒冷卻發抖，形容非常恐懼', options: ['不寒而慄', '歡天喜地', '心滿意足', '悠然自得'], optionsPinyin: ['bù hán ér lì', 'huān tiān xǐ dì', 'xīn mǎn yì zú', 'yōu rán zì dé'], correctIndex: 0, explanation: '不寒而慄：形容非常恐懼。' },
  { id: 'sspa-005', text: '經過老師的開導，我________，終於明白這道難題的解法。', hint: '突然徹底明白', options: ['恍然大悟', '一窍不通', '糊裡糊塗', '莫名其妙'], optionsPinyin: ['huǎng rán dà wù', 'yī qiào bù tōng', 'hú lǐ hú tú', 'mò míng qí miào'], correctIndex: 0, explanation: '恍然大悟：形容突然徹底明白。' },
  { id: 'sspa-006', text: '學習不能________，必須一步一腳印，由淺入深。', hint: '按照一定步驟逐漸提高', options: ['循序漸進', '一蹴而就', '一步登天', '急功近利'], optionsPinyin: ['xún xù jiàn jìn', 'yī cù ér jiù', 'yī bù dēng tiān', 'jí gōng jìn lì'], correctIndex: 0, explanation: '循序漸進：指按照步驟逐漸深入。' },
  { id: 'sspa-007', text: '他做事________，從不馬虎，因此備受老師稱讚。', hint: '認真細緻，一點不馬虎', options: ['一絲不苟', '草草了事', '敷衍塞責', '得過且過'], optionsPinyin: ['yī sī bù gǒu', 'cǎo cǎo liǎo shì', 'fū yǎn sè zé', 'dé guò qiě guò'], correctIndex: 0, explanation: '一絲不苟：形容做事認真細緻。' },
  { id: 'sspa-008', text: '在關鍵時刻，他________，第一個衝上前去幫助同學。', hint: '主動要求承擔艱難任務', options: ['自告奮勇', '畏縮不前', '退避三舍', '袖手旁觀'], optionsPinyin: ['zì gào fèn yǒng', 'wèi suō bù qián', 'tuì bì sān shè', 'xiù shǒu páng guān'], correctIndex: 0, explanation: '自告奮勇：主動要求承擔任務。' },
  { id: 'sspa-009', text: '科學家經過________，終於研發出有效的新疫苗。', hint: '無數次實驗，意志堅定', options: ['百折不撓', '半途而廢', '知難而退', '一觸即潰'], optionsPinyin: ['bǎi zhé bù náo', 'bàn tú ér fèi', 'zhī nán ér tuì', 'yī chù jí kuì'], correctIndex: 0, explanation: '百折不撓：比喻意志堅強，不受挫折。' },
  { id: 'sspa-010', text: '他________，願意聽取同學的意見。', hint: '胸懷寬廣像山谷', options: ['虛懷若谷', '驕傲自滿', '剛愎自用', '夜郎自大'], optionsPinyin: ['xū huái ruò gǔ', 'jiāo ào zì mǎn', 'gāng bì zì yòng', 'yè láng zì dà'], correctIndex: 0, explanation: '虛懷若谷：形容胸懷寬廣謙虛。' },
  { id: 'sspa-011', text: '這篇文章論證嚴密，________，令人信服。', hint: '從實際出發探求真理', options: ['實事求是', '空穴來風', '無中生有', '捕風捉影'], optionsPinyin: ['shí shì qiú shì', 'kōng xué lái fēng', 'wú zhōng shēng yǒu', 'bǔ fēng zhuō yǐng'], correctIndex: 0, explanation: '實事求是：從實際出發，探求真理。' },
  { id: 'sspa-012', text: '看到有人落水，他________，立刻跳下水救人。', hint: '看到正義的事就勇敢去做', options: ['見義勇為', '見死不救', '視而不見', '袖手旁观'], optionsPinyin: ['jiàn yì yǒng wéi', 'jiàn sǐ bù jiù', 'shì ér bù jiàn', 'xiù shǒu páng guān'], correctIndex: 0, explanation: '見義勇為：看到正義的事勇敢去做。' },
];

export const SENTENCE_POOL = [
  { id: 'sent-001', words: ['科學家', '經過', '無數次', '實驗', '終於', '研發出', '新疫苗'], correctOrder: ['科學家', '經過', '無數次', '實驗', '終於', '研發出', '新疫苗'], hint: '主語 + 經過 + 賓語 + 副詞 + 動詞 + 賓語', explanation: '科學家經過無數次實驗，終於研發出新疫苗。' },
  { id: 'sent-002', words: ['老師', '常常', '啟發', '我們', '努力', '學習'], correctOrder: ['老師', '常常', '啟發', '我們', '努力', '學習'], explanation: '老師常常啟發我們努力學習。' },
  { id: 'sent-003', words: ['只要', '我們', '團結', '一致', '就', '能', '克服', '困難'], correctOrder: ['只要', '我們', '團結', '一致', '就', '能', '克服', '困難'], explanation: '只要我們團結一致，就能克服困難。' },
  { id: 'sent-004', words: ['他', '雖然', '遇到', '挫折', '但', '仍', '堅毅', '地', '前進'], correctOrder: ['他', '雖然', '遇到', '挫折', '但', '仍', '堅毅', '地', '前進'], explanation: '他雖然遇到挫折，但仍堅毅地前進。' },
  { id: 'sent-005', words: ['這次', '活動', '不僅', '增長', '了', '見識', '也', '增進', '了', '友誼'], correctOrder: ['這次', '活動', '不僅', '增長', '了', '見識', '也', '增進', '了', '友誼'], explanation: '這次活動不僅增長了見識，也增進了友誼。' },
  { id: 'sent-006', words: ['為了', '呈分試', '同學們', '每天', '認真', '溫習'], correctOrder: ['為了', '呈分試', '同學們', '每天', '認真', '溫習'], explanation: '為了呈分試，同學們每天認真溫習。' },
  { id: 'sent-007', words: ['我', '把', '這本', '珍貴的', '書', '借', '給', '了', '他'], correctOrder: ['我', '把', '這本', '珍貴的', '書', '借', '給', '了', '他'], explanation: '我把這本珍貴的書借給了他。' },
  { id: 'sent-008', words: ['如果', '不', '專心', '聽講', '就', '難以', '明白', '重點'], correctOrder: ['如果', '不', '專心', '聽講', '就', '難以', '明白', '重點'], explanation: '如果不專心聽講，就難以明白重點。' },
  { id: 'sent-009', words: ['父母', '用', '愛', '安慰', '受傷', '的', '孩子'], correctOrder: ['父母', '用', '愛', '安慰', '受傷', '的', '孩子'], explanation: '父母用愛安慰受傷的孩子。' },
  { id: 'sent-010', words: ['他', '虛心', '地', '向', '前輩', '請教', '問題'], correctOrder: ['他', '虛心', '地', '向', '前輩', '請教', '問題'], explanation: '他虛心地向前輩請教問題。' },
  { id: 'sent-011', words: ['這', '段', '描寫', '扣人心弦', '的', '文字', '打動', '了', '讀者'], correctOrder: ['這', '段', '描寫', '扣人心弦', '的', '文字', '打動', '了', '讀者'], explanation: '這段描寫扣人心弦的文字打動了讀者。' },
  { id: 'sent-012', words: ['我們', '應該', '實事求是', '地', '分析', '問題'], correctOrder: ['我們', '應該', '實事求是', '地', '分析', '問題'], explanation: '我們應該實事求是地分析問題。' },
];

/**
 * 呈分試閱讀理解 — 自訂隨機題型池（由 /admin-editor 匯出貼上）
 * 內建：四大黃金寫作手法 + 標點符號 + 語文知識 + 固定閱讀題（25 道可匯入樣版）
 */
export const ADVANCED_QUESTION_POOL = buildDefaultAdvancedQuestionPool(
  examMethodTemplatesToMockPool(),
);

/** 呈分試參考樣版（標點／語文知識／固定閱讀）— 供外部直接 import */
export { SSPA_REFERENCE_TEMPLATES } from './sspaReferenceTemplatePool.js';

/** 內建閱讀理解 — 18 篇文章、54 道題（見 readingBuiltinPool.js） */
export const READING_POOL = BUILTIN_READING_POOL;

/** 四字詞語語意池 — 供外部直接 import / 管理員編輯器 */
export { IDIOM_EXAM_POOL } from './idiomExamPool.js';
export { EXAM_METHOD_TEMPLATES } from './readingGoldenTechniquePool.js';

// ═══════════════════════════════════════════════════════════════════════════
// 🌐 全港家長拍照共享題庫 —  re-export 自 globalSharedPool.js
// ═══════════════════════════════════════════════════════════════════════════
export {
  LS_GLOBAL_IDIOMS,
  LS_GLOBAL_METHODS,
  LS_GLOBAL_STUDY_STATS,
  GLOBAL_SHARED_IDIOMS,
  GLOBAL_SHARED_METHODS,
  getGlobalSharedIdioms,
  getGlobalSharedMethods,
  reloadGlobalSharedPools,
  syncAndExpandSharedPool,
  saveToGlobalPool,
  saveMethodToGlobalPool,
  scanIdiomCandidatesFromText,
  wrapIdiomAsStandardQuestion,
  ingestFromOcrText,
  ingestNewItemsToSharedPool,
  ingestFromExamPatterns,
  globalIdiomsToVocabPool,
  idiomPoolItemToQuestion,
  methodPoolItemToQuestion,
  pickRandomSharedIdiomQuestions,
  pickRandomSharedMethodQuestions,
  shuffleGlobalIdiomPool,
  generateContributorLabel,
  recordSharedItemStudy,
  getSharedItemStudyCount,
  getContributorBadgeForItem,
  enrichQuizItemWithContributor,
  enrichPoolItemWithContributor,
  buildQuizPoolWithGlobal,
  buildSspaPoolWithGlobal,
  methodPoolItemToSspaQuestion,
  getGlobalPoolStats,
} from './globalSharedPool.js';

/** 單元測驗池 = 靜態核心 + 最新 GLOBAL_SHARED_IDIOMS */
export function getQuizPoolWithGlobal() {
  return buildQuizPoolWithGlobal(QUIZ_POOL_CORE);
}

/** 呈分試池 = 靜態核心 + 中央共享 30 題詞彙語意 + 四大寫作手法 + UGC */
export function getSspaPoolWithGlobal() {
  return buildSspaPoolWithGlobal(SSPA_POOL);
}

export function getPoolByTaskId(taskId) {
  switch (taskId) {
    case 'dictation':
      /** 默書特訓 — 直接讀取中央共享四字詞庫 */
      return globalIdiomsToVocabPool(getGlobalSharedIdioms());
    case 'prestudy':
      /** 課文預習 — 直接讀取中央共享四字詞庫 */
      return globalIdiomsToVocabPool(getGlobalSharedIdioms());
    case 'quiz':
      return getQuizPoolWithGlobal().map(enrichQuizItemWithContributor);
    case 'sspa':
      return getSspaPoolWithGlobal().map(enrichPoolItemWithContributor);
    case 'sentence': return SENTENCE_POOL;
    case 'reading': return READING_POOL;
    default: return [];
  }
}

export function getQuestionBankStats() {
  const globalStats = getGlobalPoolStats();
  const quizPool = getQuizPoolWithGlobal();
  const sspaPool = getSspaPoolWithGlobal();
  return {
    dictation: globalStats.globalSharedIdioms,
    prestudy: globalStats.globalSharedIdioms,
    quiz: quizPool.length,
    sspa: sspaPool.length,
    sentence: SENTENCE_POOL.length,
    reading: READING_POOL.length,
    advancedReading: ADVANCED_QUESTION_POOL.length,
    referenceTemplates: SSPA_REFERENCE_TEMPLATES.length,
    idiomExam: IDIOM_EXAM_POOL.length,
    ...globalStats,
  };
}
