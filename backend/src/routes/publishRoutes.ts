import { Router } from 'express';
import {
  approveAndPublish,
  getPublishStatus,
  getConnectedAccounts,
} from '../controllers/publishController';

const router = Router();

// Pubblica post approvati
router.post('/approve', approveAndPublish);

// Controlla status
router.get('/status/:postId', getPublishStatus);

// Lista account collegati
router.get('/accounts', getConnectedAccounts);

export default router;