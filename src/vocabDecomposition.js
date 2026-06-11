/**
 * 詞彙字形拆解 — 逐字顯示部首 + 部件
 * 二字詞顯示兩個字；四字成語顯示四個字
 */

import { WORKSHEET_CHAR_DECOMPOSITION } from './worksheetCharDecomposition.js';

/** 單字拆解表 @type {Record<string, { radical: string, body: string }>} */
export const CHAR_DECOMPOSITION = {
  安: { radical: '宀', body: '女' },
  慰: { radical: '心', body: '尉' },
  價: { radical: '亻', body: '賈' },
  值: { radical: '亻', body: '直' },
  传: { radical: '亻', body: '专' },
  傳: { radical: '亻', body: '專' },
  授: { radical: '扌', body: '受' },
  启: { radical: '户', body: '攵' },
  啟: { radical: '戶', body: '攵' },
  发: { radical: '癶', body: '殳' },
  發: { radical: '癶', body: '殳' },
  珍: { radical: '王', body: '㐱' },
  贵: { radical: '贝', body: '𧷈' },
  貴: { radical: '貝', body: '𧷈' },
  沉: { radical: '氵', body: '冗' },
  著: { radical: '艹', body: '者' },
  着: { radical: '⺮', body: '者' },
  团: { radical: '囗', body: '专' },
  團: { radical: '囗', body: '專' },
  结: { radical: '纟', body: '吉' },
  結: { radical: '糸', body: '吉' },
  征: { radical: '彳', body: '正' },
  服: { radical: '月', body: '卩' },
  坚: { radical: '土', body: '臤' },
  堅: { radical: '土', body: '臤' },
  毅: { radical: '立', body: '豙' },
  虚: { radical: '虍', body: '業' },
  虛: { radical: '虍', body: '業' },
  怀: { radical: '忄', body: '不' },
  懷: { radical: '忄', body: '褱' },
  若: { radical: '艹', body: '右' },
  谷: { radical: '谷', body: '—' },
  恍: { radical: '忄', body: '光' },
  然: { radical: '灬', body: '肰' },
  大: { radical: '大', body: '—' },
  悟: { radical: '忄', body: '吾' },
  并: { radical: '丷', body: '井' },
  並: { radical: '立', body: '並' },
  肩: { radical: '月', body: '戶' },
  作: { radical: '亻', body: '乍' },
  战: { radical: '戈', body: '占' },
  戰: { radical: '戈', body: '單' },
  扣: { radical: '扌', body: '口' },
  人: { radical: '人', body: '—' },
  心: { radical: '心', body: '—' },
  弦: { radical: '弓', body: '玄' },
  不: { radical: '一', body: '丿' },
  寒: { radical: '冫', body: '𦰩' },
  而: { radical: '而', body: '—' },
  栗: { radical: '木', body: '西' },
  慄: { radical: '忄', body: '栗' },
  中: { radical: '丨', body: '口' },
  流: { radical: '氵', body: '㐬' },
  砥: { radical: '石', body: '氐' },
  柱: { radical: '木', body: '主' },
  循: { radical: '彳', body: '盾' },
  序: { radical: '广', body: '予' },
  渐: { radical: '氵', body: '斩' },
  漸: { radical: '氵', body: '斬' },
  进: { radical: '辶', body: '井' },
  進: { radical: '辶', body: '隹' },
  温: { radical: '氵', body: '昷' },
  溫: { radical: '氵', body: '𥁕' },
  故: { radical: '攵', body: '古' },
  知: { radical: '矢', body: '口' },
  新: { radical: '斤', body: '辛' },
  专: { radical: '一', body: '专' },
  專: { radical: '寸', body: '專' },
  致: { radical: '至', body: '攵' },
  志: { radical: '心', body: '士' },
  耳: { radical: '耳', body: '—' },
  濡: { radical: '氵', body: '需' },
  染: { radical: '木', body: '九' },
  一: { radical: '一', body: '—' },
  丝: { radical: '纟', body: '一' },
  絲: { radical: '糸', body: '丝' },
  苟: { radical: '艹', body: '句' },
  实: { radical: '宀', body: '头' },
  實: { radical: '宀', body: '貫' },
  事: { radical: '一', body: '事' },
  求: { radical: '水', body: '丶' },
  是: { radical: '日', body: '疋' },
  见: { radical: '见', body: '—' },
  見: { radical: '見', body: '—' },
  义: { radical: '丶', body: '义' },
  義: { radical: '羊', body: '我' },
  勇: { radical: '力', body: '甬' },
  为: { radical: '丶', body: '力' },
  為: { radical: '爪', body: '為' },
  自: { radical: '自', body: '—' },
  告: { radical: '口', body: '牛' },
  奋: { radical: '大', body: '田' },
  奮: { radical: '大', body: '隹' },
  百: { radical: '一', body: '白' },
  折: { radical: '扌', body: '斤' },
  挠: { radical: '扌', body: '尧' },
  撓: { radical: '扌', body: '堯' },
  精: { radical: '米', body: '青' },
  益: { radical: '皿', body: '益' },
  求: { radical: '氺', body: '丶' },
  雀: { radical: '隹', body: '小' },
  跃: { radical: '足', body: '夭' },
  躍: { radical: '足', body: '翟' },
  万: { radical: '一', body: '万' },
  萬: { radical: '艹', body: '萬' },
  分: { radical: '八', body: '刀' },
  落: { radical: '艹', body: '洛' },
  寞: { radical: '宀', body: '莫' },
  忐: { radical: '心', body: '忐' },
  忑: { radical: '心', body: '忑' },
  安: { radical: '宀', body: '女' },
  热: { radical: '灬', body: '执' },
  熱: { radical: '灬', body: '執' },
  泪: { radical: '氵', body: '戾' },
  淚: { radical: '氵', body: '戾' },
  盈: { radical: '皿', body: '夗' },
  眶: { radical: '目', body: '匡' },
  自: { radical: '自', body: '—' },
  惭: { radical: '忄', body: '斩' },
  慚: { radical: '忄', body: '斬' },
  形: { radical: '彡', body: '开' },
  形: { radical: '彡', body: '幵' },
  秽: { radical: '禾', body: '岁' },
  穢: { radical: '禾', body: '歲' },
  意: { radical: '音', body: '心' },
  气: { radical: '气', body: '—' },
  氣: { radical: '气', body: '米' },
  风: { radical: '风', body: '—' },
  風: { radical: '風', body: '—' },
  发: { radical: '癶', body: '殳' },
  廢: { radical: '广', body: '發' },
  废: { radical: '广', body: '发' },
  寝: { radical: '宀', body: '𠬶' },
  寢: { radical: '宀', body: '𠬶' },
  忘: { radical: '心', body: '亡' },
  食: { radical: '食', body: '—' },
  锲: { radical: '钅', body: '契' },
  鍥: { radical: '金', body: '契' },
  而: { radical: '而', body: '—' },
  舍: { radical: '舌', body: '口' },
  捨: { radical: '扌', body: '舍' },
  半: { radical: '十', body: '丷' },
  途: { radical: '辶', body: '余' },
  废: { radical: '广', body: '发' },
  廢: { radical: '广', body: '發' },
  破: { radical: '石', body: '皮' },
  釜: { radical: '金', body: '父' },
  沉: { radical: '氵', body: '冘' },
  舟: { radical: '舟', body: '—' },
  脚: { radical: '月', body: '却' },
  腳: { radical: '月', body: '卻' },
  踏: { radical: '足', body: '沓' },
  实: { radical: '宀', body: '头' },
  實: { radical: '宀', body: '貫' },
  地: { radical: '土', body: '也' },
  全: { radical: '人', body: '王' },
  力: { radical: '力', body: '—' },
  以: { radical: '人', body: '丶' },
  赴: { radical: '走', body: '卜' },
  莫: { radical: '艹', body: '莫' },
  逆: { radical: '辶', body: '屰' },
  之: { radical: '丿', body: '㔞' },
  交: { radical: '亠', body: '父' },
  推: { radical: '扌', body: '隹' },
  置: { radical: '罒', body: '直' },
  腹: { radical: '月', body: '復' },
  视: { radical: '见', body: '礻' },
  視: { radical: '見', body: '礻' },
  无: { radical: '无', body: '—' },
  無: { radical: '無', body: '—' },
  睹: { radical: '目', body: '者' },
  相: { radical: '木', body: '目' },
  濡: { radical: '氵', body: '需' },
  以: { radical: '人', body: '丶' },
  沫: { radical: '氵', body: '末' },
  责: { radical: '贝', body: '𢦏' },
  責: { radical: '貝', body: '𢦏' },
  旁: { radical: '方', body: '旁' },
  贷: { radical: '贝', body: '代' },
  貸: { radical: '貝', body: '代' },
  恩: { radical: '心', body: '因' },
  负: { radical: '贝', body: '刀' },
  負: { radical: '貝', body: '刀' },
  义: { radical: '丶', body: '义' },
  義: { radical: '羊', body: '我' },
  沧: { radical: '氵', body: '仓' },
  滄: { radical: '氵', body: '倉' },
  海: { radical: '氵', body: '每' },
  桑: { radical: '木', body: '叒' },
  田: { radical: '田', body: '—' },
  赏: { radical: '贝', body: '尚' },
  賞: { radical: '貝', body: '尚' },
  悦: { radical: '忄', body: '兑' },
  悅: { radical: '忄', body: '兌' },
  目: { radical: '目', body: '—' },
  名: { radical: '口', body: '夕' },
  落: { radical: '艹', body: '洛' },
  孙: { radical: '子', body: '小' },
  孫: { radical: '子', body: '系' },
  山: { radical: '山', body: '—' },
  缺: { radical: '缶', body: '夬' },
  可: { radical: '口', body: '可' },
  出: { radical: '凵', body: '山' },
  类: { radical: '大', body: '类' },
  類: { radical: '頁', body: '类' },
  拔: { radical: '扌', body: '犮' },
  萃: { radical: '艹', body: '卒' },
  焕: { radical: '火', body: '奂' },
  煥: { radical: '火', body: '奐' },
  然: { radical: '灬', body: '肰' },
  合: { radical: '人', body: '一' },
  时: { radical: '日', body: '寸' },
  時: { radical: '日', body: '寺' },
  宜: { radical: '宀', body: '且' },
  司: { radical: '口', body: '司' },
  空: { radical: '穴', body: '工' },
  见: { radical: '见', body: '—' },
  見: { radical: '見', body: '—' },
  惯: { radical: '忄', body: '贯' },
  慣: { radical: '忄', body: '貫' },
  耳: { radical: '耳', body: '—' },
  濡: { radical: '氵', body: '需' },
  目: { radical: '目', body: '—' },
  染: { radical: '木', body: '九' },
  根: { radical: '木', body: '艮' },
  深: { radical: '氵', body: '罙' },
  蒂: { radical: '艹', body: '帝' },
  层: { radical: '尸', body: '曾' },
  層: { radical: '尸', body: '曾' },
  出: { radical: '凵', body: '山' },
  穷: { radical: '穴', body: '力' },
  窮: { radical: '穴', body: '躬' },
  集: { radical: '隹', body: '木' },
  思: { radical: '田', body: '心' },
  广: { radical: '广', body: '—' },
  廣: { radical: '广', body: '黃' },
};

/** 查單字拆解（手動表 → 校本字詞表 CCD → 兜底） */
export function lookupCharDecomposition(char) {
  const key = String(char ?? '').trim();
  if (!key) return null;

  const manual = CHAR_DECOMPOSITION[key];
  if (manual) {
    return { radical: manual.radical, body: manual.body };
  }

  const worksheet = WORKSHEET_CHAR_DECOMPOSITION[key];
  if (worksheet) {
    return { radical: worksheet.radical, body: worksheet.body };
  }

  /** 未知字：獨體字標示 — */
  return { radical: key, body: '—' };
}

/** 逐字拆解整個詞語 @returns {{ chars: Array<{ char: string, radical: string, body: string }> } | null} */
export function getVocabDecomposition(vocab) {
  const word = String(vocab?.tc || vocab?.sc || vocab?.word || vocab?.idiomWord || '').trim();
  if (!word || !/^[\u4e00-\u9fff]+$/.test(word)) return null;
  /** 僅拆解 2–4 字成語／詞語；OCR 亂串不顯示拆解 */
  if (word.length < 2 || word.length > 4) return null;

  const chars = [...word];
  return {
    chars: chars.map((char) => ({
      char,
      ...lookupCharDecomposition(char),
    })),
  };
}

/** 合併至詞彙（保留相容；拆解改由 getVocabDecomposition 逐字計算） */
export function applyVocabDecomposition(vocab) {
  if (!vocab) return vocab;
  const decomp = getVocabDecomposition(vocab);
  if (!decomp?.chars?.length) return { ...vocab };
  const first = decomp.chars[0];
  return {
    ...vocab,
    radical: vocab.radical || first.radical,
    body: vocab.body || first.body,
    decompositionChars: decomp.chars,
  };
}

/** @deprecated 改用 getVocabDecomposition */
export function lookupVocabDecomposition(word) {
  const decomp = getVocabDecomposition({ tc: word });
  if (!decomp?.chars?.length) return null;
  if (decomp.chars.length === 1) return decomp.chars[0];
  return decomp.chars[0];
}

/** 舊版整詞表 — 保留匯出以免外部引用報錯 */
export const VOCAB_DECOMPOSITION = {};
