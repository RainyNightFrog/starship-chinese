/** 相機串流工具（獨立檔案，避免 HMR 與 React 組件混放） */
export function stopMediaStream(stream) {
  stream?.getTracks?.().forEach((track) => track.stop());
}
