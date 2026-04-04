import { Router } from 'express';
import { submitApproval, getApprovalStatus } from '../controllers/approvalController';

const router = Router();

// Ricevi approvazione dal tuo webhook
router.post('/submit', submitApproval);

// Status approvazione
router.get('/status/:newsId', getApprovalStatus);

export default router;