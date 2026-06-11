import { EXAM_PARSE_STEPS } from '../examPaperGenerator';
import { MAX_UPLOAD_IMAGES } from '../uploadMetaUtils';

/** 試卷上載模態設定（獨立檔案，避免 HMR 與 React 組件混放） */
export const EXAM_UPLOAD_MODAL_CONFIG = {
  titleId: 'exam-upload-title',
  title: '📋 上載試卷',
  subtitle: 'Upload Exam Paper · AI 智能解析',
  intro: `請上載學校試卷照片或 PDF（可一次選多張，最多 ${MAX_UPLOAD_IMAGES} 張）。AI 將依圖片數量批量生成孿生類似題同步至學生端。`,
  borderClass: 'border-rose-500/60',
  previewAlt: '試卷預覽',
  capturePrefix: '試卷拍照',
  parseSteps: EXAM_PARSE_STEPS,
  parsingLabel: 'AI 智能解析大腦運轉中…',
  doneTitle: '孿生類似題已同步至學生端！',
  doneHint: '請切換至「單元測驗」「呈分試模擬」或「句子重組」開始練習 · 圖越多題越多',
};
