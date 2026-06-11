import { withCors } from '../_withCors.js';
import { readingOcrHealthHandler } from '../../server/readingOcr.js';

export default withCors(readingOcrHealthHandler);
