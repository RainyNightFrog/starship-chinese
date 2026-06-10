import { READING_PARSE_STEPS, parseReadingUploadItems } from '../readingPaperGenerator';

/** 閱讀理解上載模態設定（後端 Tesseract OCR + 前端動態出題） */
export const READING_UPLOAD_MODAL_CONFIG = {
  titleId: 'reading-upload-title',
  title: '📖 上載閱讀文章',
  subtitle: 'Tesseract OCR · 正文去噪 · 動態出題',
  intro: '上載閱讀試卷或文章照片（可多張連續頁），本機伺服器以 Tesseract 辨識繁體中文，自動分離故事正文與考卷題目，並由前端引擎隨機生成 3 道理解題。亦可貼上文字作備援。',
  allowTextPaste: true,
  borderClass: 'border-indigo-500/60',
  previewAlt: '閱讀文章預覽',
  capturePrefix: '閱讀文章拍照',
  parseSteps: READING_PARSE_STEPS,
  parseUploadItems: parseReadingUploadItems,
  useOfflineOcr: false,
  useBackendOcr: true,
  parsingLabel: 'AI 正在讀取考卷文字（伺服器安全辨識中）...',
  parsingSubLabelMulti: '伺服器正在逐頁 OCR 辨識，請勿關閉視窗…',
  doneTitle: '閱讀理解已同步至學生端！',
  doneHint: '已自動剔除考卷題號、分數欄與 A–D 選項，僅保留乾淨故事正文，並生成 3 道隨機理解題。',
};
