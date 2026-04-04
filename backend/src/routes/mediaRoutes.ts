import { Router } from 'express';
import {
  generateImage,
  generateVideoScript,
  uploadMediaToBlotato,
  testGeneration,
} from '../controllers/mediaController';

const router = Router();

// Genera immagine
router.post('/generate-image', generateImage);

// Genera script video
router.post('/generate-video-script', generateVideoScript);

// Carica media su Blotato
router.post('/upload-to-blotato', uploadMediaToBlotato);

// Test generation
router.get('/test', testGeneration);

export default router;