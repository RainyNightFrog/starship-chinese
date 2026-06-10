/**
 * 多圖無縫拼接 — Multi-image Prompt 與上下文整合
 *
 * 家長依序上載考卷第 2、3 頁時，Vision API 必須將多張圖視為同一篇連續正文。
 */

import {
  READING_VISION_SYSTEM_PROMPT,
  READING_VISION_USER_PROMPT,
} from './readingAiPrompt.js';

/** 多圖拼接 — 權威出題專家動態出題指令 */
export const READING_STITCH_EXPERT_PROMPT = `

■ 【動態出題 — 100% 扣緊正文，禁止靜態模板】
你是一位香港小學中文科權威出題專家。
1. 先將所有圖片中的閱讀正文完整拼湊提取（剔除校名、分數欄、句義辨析等非閱讀理解雜題）
2. 【必須 100% 完全根據你提取出的這篇真實故事內文】，當場動態構思 3 道高仿真小五/小六呈分試選擇題
3. 每題 4 個選項均須由你根據該篇文章即時撰寫，禁止使用預設、快取或與本文無關的通用選項
4. 以標準 JSON 回傳 articleTitle、articleLines、questions（恰好 3 題，每題 4 個 options）`;

/** 多頁考卷拼接 System 補充 */
export const READING_STITCH_SYSTEM_APPEND = `

■ 【多頁考卷無縫拼接 — 最高優先】
  · 當收到多張圖片時，必須依「第 1 張 → 第 2 張 → …」順序閱讀
  · 所有圖片文字合併為【一篇連續、不可分割的長篇閱讀材料】，contentTrack 必須為 "A"
  · 第一張末尾被截斷的句子（如「像是受…」）必須與第二張開頭（如「了傷似的…」）語義拼接成完整句
  · 只保留正文框內的記敘/抒情故事；頁底「四、句義辨析」「面對這壯麗的景色」等其他大題 100% 剔除
  · 合併後 articleLines 按完整句子分行，繁體中文（香港用字）`;

/**
 * 依上載順序組裝多圖 User Prompt
 */
export function buildMultiImageUserPrompt(imageCount = 2, fileNames = []) {
  const orderHint = fileNames.length
    ? fileNames.map((name, i) => `第 ${i + 1} 張：${name}`).join(' → ')
    : `第 1 張至第 ${imageCount} 張（依上載順序）`;

  return `${READING_VISION_USER_PROMPT}

═══════════════════════════════════════
【多頁考卷深度拼讀 — 共 ${imageCount} 張】
═══════════════════════════════════════
上載順序：${orderHint}

嚴格指令：
1. 將 ${imageCount} 張圖視為同一篇閱讀材料的連續頁面，不得拆成多篇
2. 跨頁斷句必須拼接還原（前一頁末字 + 後一頁首字 = 完整語句）
3. 刪除每頁底部的「四、句義辨析」「1. 面對這壯麗…」「2. 這名服務生…」等非閱讀正文
4. 只輸出正文框內完整故事至 articleLines；contentTrack = "A"
5. 【必須 100% 根據提取出的正文】動態生成恰好 3 道呈分試選擇題（每題 4 個 options）
6. 只返回 JSON，不要其他文字`;
}

/** OpenAI / Azure messages（多圖） */
export function buildOpenAiStitchMessages(images = []) {
  const content = [
    { type: 'text', text: buildMultiImageUserPrompt(images.length, images.map((i) => i.fileName ?? '')) },
  ];
  images.forEach((img, index) => {
    content.push({
      type: 'text',
      text: `【第 ${index + 1} 張 / 共 ${images.length} 張 — 請與前後頁拼接】`,
    });
    content.push({
      type: 'image_url',
      image_url: { url: img.imageDataUrl, detail: 'high' },
    });
  });
  return [
    {
      role: 'system',
      content: READING_VISION_SYSTEM_PROMPT + READING_STITCH_SYSTEM_APPEND + READING_STITCH_EXPERT_PROMPT,
    },
    { role: 'user', content },
  ];
}

/** Gemini parts（多圖） */
export function buildGeminiStitchParts(images = []) {
  const parts = [
    { text: buildMultiImageUserPrompt(images.length, images.map((i) => i.fileName ?? '')) },
  ];
  images.forEach((img, index) => {
    const { mimeType, base64 } = parseImageDataUrl(img.imageDataUrl);
    parts.push({ text: `【第 ${index + 1} 張 / 共 ${images.length} 張】` });
    parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
  });
  return parts;
}

function parseImageDataUrl(imageDataUrl) {
  const match = imageDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/i);
  if (!match) throw new Error('需要有效的圖片 data URL');
  return { mimeType: match[1], base64: match[2] };
}

/** 正規化前端上載圖片陣列（保留順序） */
export function normalizeStitchImageInputs(images = []) {
  return images
    .map((item, order) => ({
      order: item.order ?? order,
      fileName: item.fileName ?? item.name ?? `第${order + 1}頁`,
      imageDataUrl: item.imageDataUrl ?? item.previewUrl ?? item.url,
    }))
    .filter((item) => item.imageDataUrl && /^data:image\//i.test(item.imageDataUrl))
    .sort((a, b) => a.order - b.order);
}
