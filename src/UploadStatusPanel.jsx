import React from 'react';
import { BilingualLabel } from './BilingualLabel';

/** 家長後台 — 檢視已上載圖片與 AI 生成內容是否就緒 */
export default function UploadStatusPanel({
  parentConfig,
  onRemoveImage,
  onClearAllUploads,
}) {
  const ac = parentConfig.assignedContent ?? {};
  const images = ac.uploadImages ?? [];
  const imageCount = ac.uploadImageCount ?? images.length;

  const hasVocab = Boolean(ac.vocabUploadSession);
  const hasExam = Boolean(ac.aiUploadSession);
  const hasReading = Boolean(ac.readingUploadSession);

  const dictCount = ac.vocabByTask?.dictation?.length ?? 0;
  const preCount = ac.vocabByTask?.prestudy?.length ?? 0;
  const quizCount = ac.quizBank?.length ?? 0;
  const sspaCount = ac.sspaBank?.length ?? 0;
  const sentenceCount = ac.sentenceBank?.length ?? (ac.sentence?.isAiGenerated ? 1 : 0);
  const readingCount = ac.readingBank?.length ?? 0;

  const hasAnyUpload = hasVocab || hasExam || hasReading;
  const hasGenerated = (hasVocab && (dictCount > 0 || preCount > 0))
    || (hasExam && (quizCount > 0 || sspaCount > 0 || sentenceCount > 0))
    || (hasReading && readingCount > 0);

  if (!hasAnyUpload && !images.length) {
    return (
      <div className="p-3 rounded-lg bg-slate-800/80 border border-dashed border-slate-600 text-center space-y-1">
        <p className="text-slate-400 text-xs font-bold">尚未上載圖片</p>
        <p className="text-slate-500 text-[10px]">完成上載並按「開始 AI 解析」後，這裡會顯示縮圖與生成題數</p>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-slate-800 border border-slate-600 space-y-3 text-left">
      <BilingualLabel
        zh="📂 上載紀錄與生成狀態"
        en="Upload Record & Generated Content"
        size="sm"
        center
        className="border-b border-slate-700 pb-2 block text-center"
      />

      <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold">
        <span className={`px-2 py-1 rounded-full ${hasGenerated ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' : 'bg-amber-900/40 text-amber-300 border border-amber-700'}`}>
          {hasGenerated ? '✅ 已生成學習內容' : '⏳ 等待解析或重新上載'}
        </span>
        {imageCount > 0 && (
          <span className="px-2 py-1 rounded-full bg-slate-700 text-slate-300">
            {imageCount} 張圖
          </span>
        )}
      </div>

      {parentConfig.uploadLabel && (
        <p className="text-center text-[10px] text-slate-400 font-bold truncate" title={parentConfig.uploadLabel}>
          方案：{parentConfig.uploadLabel}
        </p>
      )}

      {images.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-400 font-bold mb-1.5 text-center">已存圖片預覽 · 點 × 可移除</p>
          <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto xh-scroll xh-scroll--dark">
            {images.map((img, idx) => (
              <div
                key={img.id ?? idx}
                className="relative aspect-square rounded border border-slate-600 bg-slate-900 overflow-hidden group"
                title={img.fileName}
              >
                {img.previewUrl ? (
                  <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">📄</div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-slate-300 truncate px-0.5">
                  {idx + 1}
                </span>
                {onRemoveImage && img.id && (
                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-600/95 text-white text-xs font-bold leading-none shadow hover:bg-rose-500 active:scale-95"
                    aria-label={`移除第 ${idx + 1} 張圖片`}
                    title="移除此圖"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5 text-[10px] font-bold">
        {hasVocab && (
          <p className="rounded-lg bg-emerald-950/40 border border-emerald-800 px-2 py-1.5 text-emerald-200">
            📷 詞表上載 → 默書 {dictCount} 詞 · 預習 {preCount} 詞
            {dictCount + preCount > 0 ? ' ✅' : ' ⚠️ 尚未提取詞彙'}
          </p>
        )}
        {hasExam && (
          <p className="rounded-lg bg-rose-950/40 border border-rose-800 px-2 py-1.5 text-rose-200">
            📋 試卷上載 → 測驗 {quizCount} 題 · 呈分試 {sspaCount} 題 · 句子 {sentenceCount} 題
            {quizCount + sspaCount + sentenceCount > 0 ? ' ✅' : ' ⚠️ 尚未生成題目'}
          </p>
        )}
        {hasReading && (
          <p className="rounded-lg bg-indigo-950/40 border border-indigo-800 px-2 py-1.5 text-indigo-200">
            📖 閱讀上載 → 理解題 {readingCount} 題
            {readingCount > 0 ? ' ✅' : ' ⚠️ 尚未生成題目'}
          </p>
        )}
      </div>

      {onClearAllUploads && images.length > 0 && (
        <button
          type="button"
          onClick={onClearAllUploads}
          className="w-full py-2 rounded-lg border-2 border-rose-700/80 bg-rose-950/50 text-rose-200 text-[10px] font-black hover:bg-rose-900/60 active:scale-[0.99] transition"
        >
          🗑️ 清除全部上載圖片與 AI 內容
        </button>
      )}

      <p className="text-[9px] text-slate-500 text-center leading-snug">
        移除圖片後會依剩餘張數重新生成題目；清除全部則恢復預設題庫。
        <span className="block mt-0.5">重新整理頁面仍會清空紀錄（尚未永久儲存）。</span>
      </p>
    </div>
  );
}
