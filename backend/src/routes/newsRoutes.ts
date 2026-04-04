import { Router } from 'express';
import { collectNews, generatePosts, listNews } from '../controllers/newsController';

const router = Router();

router.post('/collect', collectNews);
router.post('/generate', generatePosts);
router.get('/list', listNews);

export default router;
