import { withCors } from '../_withCors.js';
import { synthesizeHandler } from '../../server/azureTts.js';

export const config = {
  maxDuration: 30,
  api: { bodyParser: { sizeLimit: '1mb' } },
};

export default withCors(synthesizeHandler);
