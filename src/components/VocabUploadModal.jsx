/** 詞表上載模態 — AiUploadModal 薄包裝 */
import AiUploadModal from './AiUploadModal';
import { VOCAB_UPLOAD_MODAL_CONFIG } from '../vocabListGenerator';

export default function VocabUploadModal(props) {
  return <AiUploadModal {...props} config={VOCAB_UPLOAD_MODAL_CONFIG} />;
}
