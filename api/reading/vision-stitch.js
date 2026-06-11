import { withCors } from '../_withCors.js';
import { readingOcrStitchHandler } from '../../server/readingOcr.js';

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: '4mb' } },
};

export default withCors(readingOcrStitchHandler);
