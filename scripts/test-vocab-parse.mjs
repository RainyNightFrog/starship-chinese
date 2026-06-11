import { parseVocabFromOcrText } from '../src/vocabOcrParser.js';

const samples = [
  `小學高年級字詞表
廉
潔
輝
煌
平凡
烹調`,
  `小學高年級字詞表
lián jié 廉潔 huī huáng 輝煌 píng fán 平凡 pēng tiáo 烹調 yí chǎn 遺產`,
  `廉潔輝煌平凡烹調遺產精細菜餚美觀講究祈求滋味記載`,
  `小學高年級字詞表
lián jié 廉潔 huī huáng 輝煌 píng fán 平凡 pēng tiáo 烹調 yí chǎn 遺產 jīng xì 精細 cài yáo 菜餚 měi guān 美觀 jiǎng jiu 講究 qí qiú 祈求 zī wèi 滋味 jì zǎi 記載 wāng yáng 汪洋 liǎo jiě 瞭解 xué shí 學識`,
];

for (const s of samples) {
  const r = parseVocabFromOcrText(s, { maxWords: 25, minWords: 3 });
  console.log('---');
  console.log('IN:', s.slice(0, 60).replace(/\n/g, '|'));
  console.log('OUT:', r.length, r.map((q) => q.word).join(','));
}
