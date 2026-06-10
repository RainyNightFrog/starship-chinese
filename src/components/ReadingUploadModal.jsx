/**
 * 閱讀理解上載模態
 *
 * 薄包裝 AiUploadModal，並在上載完成回調前執行「防亂碼正則過濾」，
 * 確保送入 readingPaperGenerator 的 extractedPassages 已剔除 OCR 英文字母碎片。
 */
import React, { useCallback } from 'react';
import AiUploadModal from './AiUploadModal';
import { READING_UPLOAD_MODAL_CONFIG } from './readingUploadModalConfig';
import { sanitizeReadingUploadMeta } from '../readingDisplayGuard';

export default function ReadingUploadModal({ open, onClose, onComplete, ...rest }) {
  /** 上載解析完成 → 先清洗雜訊，再交給家長端 applyReadingPaperUpload */
  const handleComplete = useCallback((uploadMeta) => {
    const sanitized = sanitizeReadingUploadMeta(uploadMeta ?? {});
    onComplete?.(sanitized);
  }, [onComplete]);

  return (
    <AiUploadModal
      open={open}
      onClose={onClose}
      onComplete={handleComplete}
      config={READING_UPLOAD_MODAL_CONFIG}
      {...rest}
    />
  );
}
