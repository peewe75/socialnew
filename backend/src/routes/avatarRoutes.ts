import { Router } from 'express';
import {
  listAvatars,
  listVoices,
  generateVideo,
  getVideoStatus,
  downloadGeneratedVideo,
  generateVideoFromNews,
  testAvatarGeneration,
} from '../controllers/avatarController';

const router = Router();

router.get('/avatars', listAvatars);
router.get('/voices', listVoices);
router.post('/generate', generateVideo);
router.get('/status/:videoId', getVideoStatus);
router.post('/download/:videoId', downloadGeneratedVideo);
router.post('/generate-from-news', generateVideoFromNews);
router.get('/test', testAvatarGeneration);

export default router;
