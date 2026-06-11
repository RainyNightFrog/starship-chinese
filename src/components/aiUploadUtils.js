/** 相機串流工具（獨立檔案，避免 HMR 與 React 組件混放） */
export function stopMediaStream(stream) {
  stream?.getTracks?.().forEach((track) => track.stop());
}

/** 手機拍照常 >4MB — 壓縮後再送 OCR API，避免 413 / 500 */
const MAX_OCR_EDGE = 1800;
const JPEG_QUALITY = 0.82;

export async function compressImageDataUrl(dataUrl, maxEdge = MAX_OCR_EDGE, quality = JPEG_QUALITY) {
  if (typeof document === 'undefined' || !String(dataUrl ?? '').startsWith('data:image/')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height, 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
