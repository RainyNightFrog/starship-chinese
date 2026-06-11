import { withCors } from '../_withCors.js';
import { isAzureConfigured } from '../../server/azureTts.js';

export default withCors((_req, res) => {
  res.json({
    ok: isAzureConfigured(),
    provider: 'azure-neural',
    region: process.env.AZURE_SPEECH_REGION || 'eastasia',
  });
});
