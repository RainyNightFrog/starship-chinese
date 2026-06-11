/** 上載元數據共用工具 — 多圖批量解析 */

/** 單次上載圖片／PDF 頁數上限（詞表、閱讀、試卷共用） */
export const MAX_UPLOAD_IMAGES = 12;

export const UPLOAD_IMAGE_LIMIT_ZH = `最多 ${MAX_UPLOAD_IMAGES} 張`;
export const UPLOAD_IMAGE_LIMIT_EN = `Up to ${MAX_UPLOAD_IMAGES} images`;

export function getUploadImageCount(meta = {}) {
  const n = meta.fileCount ?? meta.files?.length ?? meta.images?.length ?? 1;
  return Math.max(1, Math.min(Number(n) || 1, MAX_UPLOAD_IMAGES));
}

export function buildUploadSummaryName(items = []) {
  if (!items.length) return '校本上載';
  if (items.length === 1) return getDisplayFileLabel(items[0].fileName, 0);
  const first = getDisplayFileLabel(items[0].fileName, 0);
  return `${items.length} 張圖片（${first} 等）`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 將檔名轉為可讀標籤（過濾 UUID 等無意義名稱） */
export function getDisplayFileLabel(fileName, index = 0) {
  const base = String(fileName ?? '').replace(/\.[^.]+$/, '').trim();
  if (!base || UUID_RE.test(base) || /^image-\d+$/i.test(base)) {
    return `上載材料第 ${index + 1} 頁`;
  }
  if (base.length > 36) return `上載材料第 ${index + 1} 頁`;
  return base;
}

/** 存入 assignedContent 的精簡圖片紀錄（含預覽 data URL） */
export function serializeUploadImages(meta = {}) {
  const files = meta.files ?? meta.images ?? [];
  return files.slice(0, MAX_UPLOAD_IMAGES).map((f, i) => ({
    id: f.id ?? `upload-img-${i}`,
    fileName: f.fileName ?? `image-${i + 1}`,
    mimeType: f.mimeType ?? null,
    source: f.source ?? 'file',
    previewUrl: f.previewUrl ?? null,
    capturedAt: f.capturedAt ?? null,
  }));
}

export function mergeUploadImagesIntoContent(content = {}, meta = {}) {
  return {
    ...content,
    uploadImages: serializeUploadImages(meta),
    uploadImageCount: getUploadImageCount(meta),
  };
}
