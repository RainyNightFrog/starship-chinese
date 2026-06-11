import { withCors } from '../_withCors.js';
import { readingVocabOcrHandler } from '../../server/vocabOcr.js';

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: '4mb' } },
};

export default withCors(readingVocabOcrHandler);
