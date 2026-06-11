/**
 * 呈分試真題風格閱讀理解樣版 — 段意／重點／目的／情感／段落定位
 * 選項為專業合成句或固定標籤，嚴禁正文碎片。
 */

import { OPTION_MODES } from './readingTypeSafeOptions.js';
import {
  inferArticleProfile,
  buildParagraphIdeaOptions,
  inferParagraphIdeaAtIndex,
  paragraphLabelOptions,
  lineToParagraphIndex,
} from './readingArticleProfiler.js';
import { WORKSHEET43_DYNAMIC_TEMPLATES } from './readingWorksheetReferencePool.js';

function pickAnchor(ctx, offset = 0) {
  const anchors = ctx.anchors ?? [];
  if (!anchors.length) return { lineIndex: 0, text: ctx.lines[0] ?? '' };
  return anchors[(offset + ctx.randInt(anchors.length)) % anchors.length];
}

function structured(correct, distractors, correctIndex = 0) {
  const opts = [correct, ...distractors].filter(Boolean);
  const unique = [...new Set(opts)];
  while (unique.length < 4) unique.push(`與文章內容不符的敘述（干擾${unique.length}）`);
  const fixedCorrectIndex = unique.indexOf(correct);
  return {
    correct,
    structuredOptions: unique.slice(0, 4),
    fixedCorrectIndex: fixedCorrectIndex >= 0 ? fixedCorrectIndex : correctIndex,
    optionMode: OPTION_MODES.STRUCTURED_CHOICE,
  };
}

/** 呈分試真題風格動態樣版 */
export const SSPA_EXAM_TEMPLATES = [
  {
    id: 'sspa_article_focus',
    category: 'main_theme',
    build(ctx) {
      const p = inferArticleProfile(ctx);
      const built = structured(p.articleFocus, p.focusDistractors);
      return {
        questionText: '下列哪一項是文章的重點？',
        ...built,
        hint: '文章重點須能概括全文，而非只寫某一細節或表面活動。',
        trapProfile: 'theme',
      };
    },
  },
  {
    id: 'sspa_author_main_purpose',
    category: 'main_theme',
    build(ctx) {
      const p = inferArticleProfile(ctx);
      const built = structured(p.authorPurpose, p.purposeDistractors);
      return {
        questionText: '下列哪一項是作者寫這篇文章的主要目的？',
        ...built,
        hint: '思考作者想透過文章讓讀者明白或感受到甚麼。',
        trapProfile: 'intent',
      };
    },
  },
  {
    id: 'sspa_para_main_idea',
    category: 'paragraph_logic',
    build(ctx) {
      const anchor = pickAnchor(ctx);
      const p = inferArticleProfile(ctx);
      const paraNum = anchor.lineIndex + 1;
      const ideaIdx = lineToParagraphIndex(anchor.lineIndex, p.lineCount);
      const correct = inferParagraphIdeaAtIndex(p, ctx, ideaIdx);
      const opts = buildParagraphIdeaOptions(p, correct, ctx, ideaIdx);
      const fixedCorrectIndex = opts.indexOf(correct);
      return {
        questionText: `文中第${paraNum}段主要是？`,
        correct,
        structuredOptions: opts.slice(0, 4),
        fixedCorrectIndex: fixedCorrectIndex >= 0 ? fixedCorrectIndex : 0,
        optionMode: OPTION_MODES.STRUCTURED_CHOICE,
        hint: `先概括第${paraNum}段的大意，再排除看似合理但屬於其他段落的選項。`,
        trapProfile: 'summary',
      };
    },
  },
  {
    id: 'sspa_which_paragraph',
    category: 'paragraph_logic',
    build(ctx) {
      const p = inferArticleProfile(ctx);
      const labels = paragraphLabelOptions(p.lineCount);
      const targetIdx = Math.min(p.difficultyPara - 1, labels.length - 1);
      const correct = labels[targetIdx] ?? labels[0];
      const distractors = labels.filter((l) => l !== correct);
      return {
        questionText: `文中哪一段描述了「${p.difficultyAspect}」？`,
        correct,
        structuredOptions: [correct, ...distractors].slice(0, 4),
        fixedCorrectIndex: 0,
        optionMode: OPTION_MODES.STRUCTURED_CHOICE,
        hint: '先找出與題幹關鍵詞相關的段落，再對照各段大意。',
        trapProfile: 'structure',
      };
    },
  },
  {
    id: 'sspa_quote_purpose',
    category: 'rhetoric',
    build(ctx) {
      const p = inferArticleProfile(ctx);
      const built = structured(p.quotePurpose, [
        '說明人物不肯認輸的性格',
        '指出人物比別人優勝的原因',
        '解釋人物能和常人一樣活動的原因',
        '批評人物言行不當',
      ]);
      return {
        questionText: '作者引述文中人物的說話，目的是甚麼？',
        ...built,
        hint: '引述對話通常為帶出人物性格、情感或文章道理服務。',
        trapProfile: 'technique',
      };
    },
  },
  {
    id: 'sspa_emotion_express',
    category: 'vocab_inference',
    build(ctx) {
      const p = inferArticleProfile(ctx);
      const correct = p.emotions?.[0] ?? '感到溫暖而有所體會';
      const pool = [
        correct,
        p.emotions?.[1],
        ...(p.emotionDistractors ?? []),
        '慨歎自己沒有珍惜同學之間的友誼',
        '後悔因喜歡玩樂而忽略學業',
      ].filter(Boolean);
      const unique = [...new Set(pool)].slice(0, 4);
      return {
        questionText: '下列哪一項最能說明作者在文章中抒發的情感？',
        correct,
        structuredOptions: unique,
        fixedCorrectIndex: Math.max(0, unique.indexOf(correct)),
        optionMode: OPTION_MODES.STRUCTURED_CHOICE,
        hint: '留意文中帶有情感色彩的詞語，以及結尾所抒發的感受。',
        trapProfile: 'feeling',
      };
    },
  },
  {
    id: 'sspa_detail_reason',
    category: 'paragraph_logic',
    build(ctx) {
      const anchor = pickAnchor(ctx, 1);
      const p = inferArticleProfile(ctx);
      const correct = p.genre === 'nostalgic'
        ? '被隊友的鞋子擲中，回想起往事既好笑又無奈'
        : p.genre === 'inspirational'
          ? '主人公面對挫折仍堅持追夢，令人敬佩'
          : `與「${p.difficultyAspect}」相關的情節發展`;
      const built = structured(correct, [
        '踢球時經常跌倒',
        '和足球「捉迷藏」',
        '要上無聊乏味的體育課',
        '只為增加文章字數',
      ]);
      return {
        questionText: `根據文中第${anchor.lineIndex + 1}段，下列哪一項最能解釋該段所描述的情況？`,
        ...built,
        hint: '找出因果或轉折關係，勿選只寫表面現象的選項。',
        trapProfile: 'cause',
      };
    },
  },
  {
    id: 'sspa_negative_fact',
    category: 'vocab_inference',
    build(ctx) {
      const p = inferArticleProfile(ctx);
      if (p.genre !== 'biography' || !p.contributionOptions) return null;
      const correct = p.notContribution ?? '在世界各地興建孔廟';
      const opts = [...p.contributionOptions];
      const fixedCorrectIndex = opts.indexOf(correct);
      if (fixedCorrectIndex < 0) return null;
      return {
        questionText: `下列哪一項不是${p.subject}的貢獻？`,
        correct,
        structuredOptions: opts,
        fixedCorrectIndex,
        optionMode: OPTION_MODES.STRUCTURED_CHOICE,
        hint: '逐項對照原文，找出文中未提及或張冠李戴的選項。',
        trapProfile: 'vocab',
      };
    },
  },
  {
    id: 'sspa_contrast_check',
    category: 'rhetoric',
    build(ctx) {
      const text = (ctx.lines ?? []).join('');
      const hasContrast = /雖然|但是|然而|卻|而|前.*後|一方面.*另一方面/.test(text);
      const correct = hasContrast
        ? '透過前後情境或心態的反差，突出人物成長或文章中心思想'
        : '文中並無明顯的對比，不宜強行套用對比手法';
      const built = structured(correct, [
        '故意混淆讀者視聽，使情節模糊不清',
        '為了增加字數，使內容看起來更豐富',
        '證明主角缺乏誠信',
        '只為描寫優美的風景',
      ]);
      return {
        questionText: '關於文中「對比」手法的運用，以下哪一項最準確？',
        ...built,
        hint: '對比須有明顯的前後反差，且服務於深化主旨。',
        trapProfile: 'technique',
      };
    },
  },
  {
    id: 'sspa_first_para_role',
    category: 'paragraph_logic',
    build(ctx) {
      const p = inferArticleProfile(ctx);
      const correct = inferParagraphIdeaAtIndex(p, ctx, 0);
      const opts = buildParagraphIdeaOptions(p, correct, ctx, 0);
      const fixedCorrectIndex = opts.indexOf(correct);
      return {
        questionText: '文中第一段主要是？',
        correct,
        structuredOptions: opts.slice(0, 4),
        fixedCorrectIndex: fixedCorrectIndex >= 0 ? fixedCorrectIndex : 0,
        optionMode: OPTION_MODES.STRUCTURED_CHOICE,
        hint: '開首段通常交代背景、引出人物；注意勿與後文論述細節或總結段混淆。',
        trapProfile: 'summary',
      };
    },
  },

  // ── beasmartc9 閱讀理解(43)「米」真題手法（動態 OCR）──
  ...WORKSHEET43_DYNAMIC_TEMPLATES,
];

export const SSPA_EXAM_TEMPLATE_IDS = SSPA_EXAM_TEMPLATES.map((t) => t.id);
