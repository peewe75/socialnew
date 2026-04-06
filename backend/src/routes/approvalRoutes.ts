import { Router } from 'express';
import { submitApproval, getApprovalStatus, resumeApproval } from '../controllers/approvalController';

const router = Router();

// Ricevi approvazione dal tuo webhook
router.post('/submit', submitApproval);

// Status approvazione
router.get('/status/:newsId', getApprovalStatus);

// Riprendi wait node n8n da UI/app
router.post('/resume', resumeApproval);

export default router;
