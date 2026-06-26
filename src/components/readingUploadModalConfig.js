import { READING_PARSE_STEPS, parseReadingUploadItems } from '../readingPaperGenerator';
import { MAX_UPLOAD_IMAGES } from '../uploadMetaUtils';

/** 閱讀理解上載模態設定（後端 Tesseract OCR + 前端動態出題） */
export const READING_UPLOAD_MODAL_CONFIG = {
  titleId: 'reading-upload-title',
  title: '📖 上載閱讀文章',
  subtitle: 'Tesseract OCR · 正文去噪 · 動態出題',
  intro: `上載閱讀試卷或文章照片（可一次選多張，最多 ${MAX_UPLOAD_IMAGES} 張連續頁），本機伺服器以 Tesseract 辨識繁體中文，自動分離故事正文與考卷題目，並由前端引擎隨機生成 3 道理解題。亦可貼上文字作備援。`,
  allowTextPaste: true,
  borderClass: 'border-indigo-500/60',
  previewAlt: '閱讀文章預覽',
  capturePrefix: '閱讀文章拍照',
  parseSteps: READING_PARSE_STEPS,
  parseUploadItems: parseReadingUploadItems,
  useOfflineOcr: false,
  useBackendOcr: true,
  parsingLabel: 'AI 正在高速讀取考卷（已解鎖本地加速）...',
  parsingSubLabelMulti: 'Singleton Worker 逐頁辨識中，chi_tra 已快取，請勿關閉視窗…',
  doneTitle: '閱讀理解已同步至學生端！',
  doneHint: '已自動剔除考卷題號、分數欄與 A–D 選項，僅保留乾淨故事正文，並生成 3 道隨機理解題。',
  galleryMultiLabel: ' · 將依序拼讀成一篇完整長文',
  galleryMultiSubLabel: '請確認縮圖順序（1→2→…），再開始 AI 解析',
  gallerySingleSubLabel: '可繼續添加，或開始 AI 解析',
  pasteSuggestLabel: '✨ 建議：直接貼上文章文字（比拍照 OCR 更準）',
  pastePlaceholder: '每行一段落，例如：\n暴雨令西環水浸。\n水中的汽車變成小島。\n...\n\n（多頁可用 --- 分隔）',
  emptyGalleryHint: '尚未添加圖片，請選擇檔案、拍照，或貼上文章文字',
  doneMultiSummary: (n) => `已將 ${n} 張考卷拼讀為 1 篇閱讀文章`,
  doneSingleSummary: (n) => `共解析 ${n} 張圖片`,
  parseButtonLabel: '🧠 開始 AI 解析',
};
