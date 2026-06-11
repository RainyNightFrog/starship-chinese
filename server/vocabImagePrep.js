/**
 * 默書詞表 OCR 前處理 — 放大、灰階、對比、銳化（提升格子字表辨識率）
 */
import sharp from 'sharp';

/** @param {Buffer|string} input — 檔案路徑或 raw buffer */
export async function preprocessVocabWorksheetImage(input) {
  let img = sharp(input);

  const meta = await img.metadata();
  const targetWidth = Math.max(1600, Math.min(2400, (meta.width ?? 800) * 2));

  /** 略過頂部標題列，聚焦詞語格子區 */
  if ((meta.height ?? 0) > 400) {
    const top = Math.round((meta.height ?? 0) * 0.07);
    img = img.extract({
      left: 0,
      top,
      width: meta.width ?? 800,
      height: Math.max(1, (meta.height ?? 800) - top),
    });
  }

  return img
    .resize({ width: targetWidth, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
}

/** data URL → 前處理後的 PNG data URL */
export async function preprocessVocabDataUrl(imageDataUrl) {
  const match = String(imageDataUrl).match(/^data:image\/\w+;base64,(.+)$/i);
  if (!match) return imageDataUrl;

  const buf = Buffer.from(match[1], 'base64');
  const processed = await preprocessVocabWorksheetImage(buf);
  return `data:image/png;base64,${processed.toString('base64')}`;
}
