import { Router } from 'express';
import {
  getPostMetrics,
  getMultipleMetrics,
  generateSummary,
  comparePeriods,
  getOptimizations,
  getDashboard,
  syncAnalytics,
  testAnalytics,
} from '../controllers/analyticsController';

const router = Router();

// Metriche singolo post
router.get('/post/:blotatoPostId', getPostMetrics);

// Metriche multipli post
router.post('/multiple', getMultipleMetrics);

// Summary analytics
router.post('/summary', generateSummary);

// Confronta periodi
router.post('/compare', comparePeriods);

// Raccomandazioni ottimizzazioni
router.post('/optimizations', getOptimizations);

// Dashboard completo
router.get('/dashboard', getDashboard);

// Sync manuale
router.post('/sync', syncAnalytics);

// Test
router.get('/test', testAnalytics);

export default router;
