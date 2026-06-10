/** 試卷上載模態 — AiUploadModal 薄包裝 */
import AiUploadModal from './AiUploadModal';
import { EXAM_UPLOAD_MODAL_CONFIG } from './examUploadModalConfig';

export default function ExamUploadModal(props) {
  return <AiUploadModal {...props} config={EXAM_UPLOAD_MODAL_CONFIG} />;
}
