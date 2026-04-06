import { Router } from 'express';
import {
  triggerPipeline,
  sendToN8N,
  onPublished,
  onApprovalResult,
  checkHealth,
  getConfig,
} from '../controllers/n8nController';

const router = Router();

// Pipeline trigger: raccoglie news + invia a n8n
router.post('/trigger', triggerPipeline);

// Invia news già raccolte a n8n
router.post('/send', sendToN8N);

// Callbacks da n8n
router.post('/callback/published', onPublished);
router.post('/callback/publish', onPublished);
router.post('/callback/approval', onApprovalResult);

// Health check e config
router.get('/health', checkHealth);
router.get('/config', getConfig);

export default router;
