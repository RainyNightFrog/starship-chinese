/**
 * 詞彙字義提示 — 正式書面語（繁/簡）+ 英文釋義（NCS／外語學生）
 */
import { applyVocabDecomposition } from './vocabDecomposition.js';

export const VOCAB_HINTS = {
  安慰: { tc: '用言語或行動減輕他人的愁苦與壓力', sc: '用言语或行动减轻他人的愁苦与压力', en: 'To ease others\' distress through words or actions' },
  價值: { tc: '物品所具有的意義與重要程度', sc: '物品所具有的意义与重要程度', en: 'The significance and importance of something' },
  价值: { tc: '物品所具有的意義與重要程度', sc: '物品所具有的意义与重要程度', en: 'The significance and importance of something' },
  傳授: { tc: '把知識或技能教給他人', sc: '把知识或技能教给他人', en: 'To pass on knowledge or skills to others' },
  传授: { tc: '把知識或技能教給他人', sc: '把知识或技能教给他人', en: 'To pass on knowledge or skills to others' },
  啟發: { tc: '引導思考，使人領悟明白', sc: '引导思考，使人领悟明白', en: 'To inspire thinking and help someone understand' },
  启发: { tc: '引導思考，使人領悟明白', sc: '引导思考，使人领悟明白', en: 'To inspire thinking and help someone understand' },
  珍貴: { tc: '稀有而難得', sc: '稀有而难得', en: 'Rare and precious' },
  珍贵: { tc: '稀有而難得', sc: '稀有而难得', en: 'Rare and precious' },
  恍然大悟: { tc: '突然之間徹底明白、豁然開竅', sc: '突然之间彻底明白、豁然开朗', en: 'To suddenly understand completely' },
  並肩作戰: { tc: '彼此靠在一起，齊心協力共同奮戰', sc: '彼此靠在一起，齐心协力共同奋战', en: 'To fight side by side in unity' },
  并肩作战: { tc: '彼此靠在一起，齊心協力共同奮戰', sc: '彼此靠在一起，齐心协力共同奋战', en: 'To fight side by side in unity' },
  團結: { tc: '眾人同心、一致合力', sc: '众人同心、一致合力', en: 'People working together with one heart' },
  团结: { tc: '眾人同心、一致合力', sc: '众人同心、一致合力', en: 'People working together with one heart' },
  沉著: { tc: '鎮定不慌、從容應對', sc: '镇定不慌、从容应对', en: 'Calm and composed under pressure' },
  沉着: { tc: '鎮定不慌、從容應對', sc: '镇定不慌、从容应对', en: 'Calm and composed under pressure' },
  征服: { tc: '戰勝困難、克服挑戰', sc: '战胜困难、克服挑战', en: 'To overcome difficulties and challenges' },
  堅毅: { tc: '堅定而有毅力', sc: '坚定而有毅力', en: 'Firm and persevering' },
  坚毅: { tc: '堅定而有毅力', sc: '坚定而有毅力', en: 'Firm and persevering' },
  虛懷若谷: { tc: '形容胸懷寬廣，像山谷一樣能容納', sc: '形容胸怀宽广，像山谷一样能容纳', en: 'Open-minded and humble like a wide valley' },
  虚怀若谷: { tc: '形容胸懷寬廣，像山谷一樣能容納', sc: '形容胸怀宽广，像山谷一样能容纳', en: 'Open-minded and humble like a wide valley' },
  中流砥柱: { tc: '比喻堅強獨立，能起支柱作用的人', sc: '比喻坚强独立，能起支柱作用的人', en: 'A pillar of strength others can rely on' },
  扣人心弦: { tc: '形容詩文、表演等十分動人', sc: '形容诗文、表演等十分动人', en: 'Deeply moving and touching' },
  不寒而慄: { tc: '形容非常恐懼害怕', sc: '形容非常恐惧害怕', en: 'To shiver with fear without being cold' },
  不寒而栗: { tc: '形容非常恐懼害怕', sc: '形容非常恐惧害怕', en: 'To shiver with fear without being cold' },
  悟: { tc: '心裏明白、突然想通', sc: '心里明白、突然想通', en: 'To understand or realize suddenly' },
  语: { tc: '與人溝通時使用的詞句', sc: '与人沟通时使用的词句', en: 'Speech or language' },
  語: { tc: '與人溝通時使用的詞句', sc: '与人沟通时使用的词句', en: 'Speech or language' },
  雀躍萬分: { tc: '形容人因極度興奮、高興而跳躍起來', sc: '形容人因极度兴奋、高兴而跳跃起来', en: 'Extremely excited and overjoyed' },
  落寞: { tc: '形容冷清、孤單、失落的心情', sc: '形容冷清、孤单、失落的心情', en: 'Lonely and desolate; feeling left out' },
  忐忑不安: { tc: '形容心神不定，內心非常膽怯或焦慮', sc: '形容心神不定，内心非常胆怯或焦虑', en: 'Restless and anxious; on edge' },
  熱淚盈眶: { tc: '比喻因極度高興、感激或悲傷，眼眶裡充滿了淚水', sc: '比喻因极度高兴、感激或悲伤，眼眶里充满了泪水', en: 'Eyes filling with tears from strong emotion' },
  自慚形穢: { tc: '因為自己的外貌或才能不如別人，而感到慚愧、自卑', sc: '因为自己的外貌或才能不如别人，而感到惭愧、自卑', en: 'Ashamed of being inferior to others' },
  意氣風發: { tc: '形容精神振奮，氣概豪邁，充滿了朝氣與自信', sc: '形容精神振奋，气概豪迈，充满了朝气与自信', en: 'High-spirited, confident and energetic' },
  廢寢忘食: { tc: '形容人非常專心努力，顧不得睡覺，忘記了吃飯', sc: '形容人非常专心努力，顾不得睡觉，忘记了吃饭', en: 'So absorbed in work that one forgets to eat or sleep' },
  废寝忘食: { tc: '形容人非常專心努力，顧不得睡覺，忘記了吃飯', sc: '形容人非常专心努力，顾不得睡觉，忘记了吃饭', en: 'So absorbed in work that one forgets to eat or sleep' },
  鍥而不捨: { tc: '有恆心、有毅力，堅持到底而不放棄', sc: '有恒心、有毅力，坚持到底而不放弃', en: 'Persistent; never giving up' },
  锲而不舍: { tc: '有恆心、有毅力，堅持到底而不放棄', sc: '有恒心、有毅力，坚持到底而不放弃', en: 'Persistent; never giving up' },
  半途而廢: { tc: '做事做了一半就放棄，不能堅持到底', sc: '做事做了一半就放弃，不能坚持到底', en: 'To give up halfway' },
  半途而废: { tc: '做事做了一半就放棄，不能堅持到底', sc: '做事做了一半就放弃，不能坚持到底', en: 'To give up halfway' },
  破釜沉舟: { tc: '比喻下定決心，做事果斷，不留退路，非取得成功不可', sc: '比喻下定决心，做事果断，不留退路，非取得成功不可', en: 'To burn one\'s boats; determined with no retreat' },
  腳踏實地: { tc: '比喻做事認真、紮實、一步一腳印，不抱不切實際的幻想', sc: '比喻做事认真、扎实、一步一个脚印，不抱不切实际的幻想', en: 'Down-to-earth; steady and practical' },
  脚踏实地: { tc: '比喻做事認真、紮實、一步一腳印，不抱不切實際的幻想', sc: '比喻做事认真、扎实、一步一个脚印，不抱不切实际的幻想', en: 'Down-to-earth; steady and practical' },
  全力以赴: { tc: '把全部的力量都投入到某件事情當中去', sc: '把全部的力量都投入到某件事情当中去', en: 'To give one\'s all to a task' },
  莫逆之交: { tc: '指情投意合、非常要好，沒有利害衝突的知心朋友', sc: '指情投意合、非常要好，没有利害冲突的知心朋友', en: 'A close friend who truly understands you' },
  推心置腹: { tc: '比喻真心誠意地待人，毫無保留地吐露心聲', sc: '比喻真心诚意地待人，毫无保留地吐露心声', en: 'To confide in someone with complete sincerity' },
  視若無睹: { tc: '雖然看見了，卻像沒有看見一樣不予理睬，形容冷漠', sc: '虽然看见了，却像没有看见一样不予理睬，形容冷漠', en: 'To ignore something as if not seeing it' },
  相濡以沫: { tc: '比喻在同處困境時，用微薄的力量互相幫助、互相扶持', sc: '比喻在同处困境时，用微薄的力量互相帮助、互相扶持', en: 'To help each other through hardship' },
  責無旁貸: { tc: '自己應盡的責任，絕對不能推卸給別人', sc: '自己应尽的责任，绝对不能推卸给别人', en: 'A duty one must not shirk' },
  忘恩負義: { tc: '忘記了別人對自己的恩情，做出對不起別人的事情', sc: '忘记了别人对自己的恩情，做出对不起别人的事情', en: 'Ungrateful; betraying someone who helped you' },
  滄海桑田: { tc: '比喻世事變化巨大或世事無常', sc: '比喻世事变化巨大或世事无常', en: 'Great changes over time; how the world changes' },
  沧海桑田: { tc: '比喻世事變化巨大或世事無常', sc: '比喻世事变化巨大或世事无常', en: 'Great changes over time; how the world changes' },
  賞心悅目: { tc: '形容景色非常優美，讓人看了心情舒暢、非常高興', sc: '形容景色非常优美，让人看了心情舒畅、非常高兴', en: 'Pleasing to the eye; delightful scenery' },
  赏心悦目: { tc: '形容景色非常優美，讓人看了心情舒暢、非常高興', sc: '形容景色非常优美，让人看了心情舒畅、非常高兴', en: 'Pleasing to the eye; delightful scenery' },
  名落孫山: { tc: '考試或選拔沒有被錄取，榜上無名', sc: '考试或选拔没有被录取，榜上无名', en: 'To fail an exam or selection; not on the list' },
  不可或缺: { tc: '非常重要，絕對不能缺少', sc: '非常重要，绝对不能缺少', en: 'Essential; absolutely indispensable' },
  出類拔萃: { tc: '人才華或能力遠超同類，表現極優秀', sc: '人才华或能力远超同类，表现极优秀', en: 'Outstanding; far above the rest' },
  出类拔萃: { tc: '人才華或能力遠超同類，表現極優秀', sc: '人才华或能力远超同类，表现极优秀', en: 'Outstanding; far above the rest' },
  煥然一新: { tc: '形容事物改變了舊面貌，呈現出乾淨、光彩的全新氣象', sc: '形容事物改变了旧面貌，呈现出干净、光彩的全新气象', en: 'Completely refreshed with a new look' },
  焕然一新: { tc: '形容事物改變了舊面貌，呈現出乾淨、光彩的全新氣象', sc: '形容事物改变了旧面貌，呈现出干净、光彩的全新气象', en: 'Completely refreshed with a new look' },
  不合時宜: { tc: '不符合目前的時代需要或當前的情況', sc: '不符合目前的时代需要或当前的情况', en: 'Out of step with the times' },
  不合时宜: { tc: '不符合目前的時代需要或當前的情況', sc: '不符合目前的时代需要或当前的情况', en: 'Out of step with the times' },
  司空見慣: { tc: '指某種事情天天見到，已經習以為常，不足為奇', sc: '指某种事情天天见到，已经习以为常，不足为奇', en: 'Commonplace; nothing unusual anymore' },
  司空见惯: { tc: '指某種事情天天見到，已經習以為常，不足為奇', sc: '指某种事情天天见到，已经习以为常，不足为奇', en: 'Commonplace; nothing unusual anymore' },
  耳濡目染: { tc: '形容經常聽到、看到，無形中受到深刻的影響', sc: '形容经常听到、看到，无形中受到深刻的影响', en: 'Influenced gradually by what one hears and sees' },
  根深蒂固: { tc: '基礎牢固，根基深厚，極其不容易動搖或改變', sc: '基础牢固，根基深厚，极其不容易动摇或改变', en: 'Deep-rooted; hard to change' },
  層出不窮: { tc: '接連不斷地出現，沒有窮盡', sc: '接连不断地出现，没有穷尽', en: 'Emerging one after another without end' },
  层出不穷: { tc: '接連不斷地出現，沒有窮盡', sc: '接连不断地出现，没有穷尽', en: 'Emerging one after another without end' },
  集思廣益: { tc: '集中群眾的智慧，廣泛吸收有益的意見，從而擴大效果', sc: '集中群众的智慧，广泛吸收有益的意见，从而扩大效果', en: 'To pool ideas for better results' },
  集思广益: { tc: '集中群眾的智慧，廣泛吸收有益的意見，從而擴大效果', sc: '集中群众的智慧，广泛吸收有益的意见，从而扩大效果', en: 'To pool ideas for better results' },
  循序漸進: { tc: '指按照一定步驟逐漸深入或提高', sc: '指按照一定步骤逐渐深入或提高', en: 'Step by step; gradual progress' },
  循序渐进: { tc: '指按照一定步驟逐漸深入或提高', sc: '指按照一定步骤逐渐深入或提高', en: 'Step by step; gradual progress' },
  溫故知新: { tc: '溫習舊知識從而得到新的理解', sc: '温习旧知识从而得到新的理解', en: 'Review the old to gain new understanding' },
  温故知新: { tc: '溫習舊知識從而得到新的理解', sc: '温习旧知识从而得到新的理解', en: 'Review the old to gain new understanding' },
  專心致志: { tc: '把心思完全放在一件事上', sc: '把心思完全放在一件事上', en: 'To concentrate fully on one thing' },
  专心致志: { tc: '把心思完全放在一件事上', sc: '把心思完全放在一件事上', en: 'To concentrate fully on one thing' },
  一絲不苟: { tc: '形容做事認真細緻，一點不馬虎', sc: '形容做事认真细致，一点不马虎', en: 'Meticulous; not the slightest carelessness' },
  一丝不苟: { tc: '形容做事認真細緻，一點不馬虎', sc: '形容做事认真细致，一点不马虎', en: 'Meticulous; not the slightest carelessness' },
  實事求是: { tc: '指從實際出發，探求真理', sc: '指从实际出发，探求真理', en: 'To seek truth from facts' },
  实事求是: { tc: '指從實際出發，探求真理', sc: '指从实际出发，探求真理', en: 'To seek truth from facts' },
  見義勇為: { tc: '看到正義的事就勇敢去做', sc: '看到正义的事就勇敢去做', en: 'To act bravely for what is right' },
  见义勇为: { tc: '看到正義的事就勇敢去做', sc: '看到正义的事就勇敢去做', en: 'To act bravely for what is right' },
  自告奮勇: { tc: '主動要求承擔艱難任務', sc: '主动要求承担艰难任务', en: 'To volunteer for a difficult task' },
  自告奋勇: { tc: '主動要求承擔艱難任務', sc: '主动要求承担艰难任务', en: 'To volunteer for a difficult task' },
  百折不撓: { tc: '比喻意志堅強，無論受多少挫折都不退縮', sc: '比喻意志坚强，无论受多少挫折都不退缩', en: 'Indomitable despite setbacks' },
  百折不挠: { tc: '比喻意志堅強，無論受多少挫折都不退縮', sc: '比喻意志坚强，无论受多少挫折都不退缩', en: 'Indomitable despite setbacks' },
  精益求精: { tc: '已經很好，還要求更好', sc: '已经很好，还要求更好', en: 'To keep improving beyond good enough' },
};

export function getVocabHintEn(vocab) {
  if (vocab?.hintEn) return vocab.hintEn;
  const hints = VOCAB_HINTS[vocab?.tc] ?? VOCAB_HINTS[vocab?.sc] ?? VOCAB_HINTS[vocab?.word];
  return hints?.en ?? '';
}

export function withHints(vocab) {
  const hints = VOCAB_HINTS[vocab.tc] ?? VOCAB_HINTS[vocab.sc] ?? VOCAB_HINTS[vocab.word];
  if (!hints) return { ...vocab, hintEn: vocab.hintEn ?? getVocabHintEn(vocab) };
  return {
    ...vocab,
    hintTc: vocab.hintTc ?? hints.tc,
    hintSc: vocab.hintSc ?? hints.sc,
    hintEn: vocab.hintEn ?? hints.en,
  };
}

export function enrichVocabList(list) {
  return list.map((v) => applyVocabDecomposition(withHints(v)));
}
