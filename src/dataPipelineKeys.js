/**
 * 星航中文 — 跨組件 localStorage / sessionStorage 金鑰（100% 統一）
 * 上載 ➔ 預習 ➔ 默書 黃金公路必須全部引用本檔常數
 */

/** 家長 OCR / 自訂框 — 完整 IDIOM 配對物件陣列（含 options、correctAnswerIndex） */
export const PREVIEW_WORDS_STORAGE_KEY = 'starship_preview_words';

/** 默書 Web Speech — 純中文詞語陣列（由 preview 衍生） */
export const STUDIED_WORDS_STORAGE_KEY = 'starship_last_studied_words';

/** 中央共享四字詞庫（UGC 滾雪球） */
export const LS_GLOBAL_IDIOMS = 'starship_global_idioms';

/** 中央共享寫作手法 / 新考點矩陣 */
export const LS_GLOBAL_METHODS = 'starship_global_methods';

/** 中央共享閱讀文章池 */
export const LS_GLOBAL_READING = 'starship_global_reading';

/** 學習 session — 家長成績分析 */
export const LS_LEARNING_SESSIONS = 'xinghang_learning_sessions';

/** 錯題本 */
export const LS_WRONG_ANSWERS = 'xinghang_wrong_answers';

/** 常錯字 */
export const LS_WRONG_WORDS = 'xinghang_wrong_words';

/** 詞彙上載完成 — 前端事件（同分頁即時刷新） */
export const VOCAB_UPLOADED_EVENT = 'starship-vocab-uploaded';

/** 成績分析變更 — 前端事件 */
export const ANALYTICS_CHANGED_EVENT = 'xinghang-analytics-changed';
