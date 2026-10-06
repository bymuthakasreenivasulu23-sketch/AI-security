import { Router, Request, Response } from 'express';
import {
  analyzePage,
  getScans,
  getScanById,
  deleteScan,
  receivePageSignals,
} from '../controllers/scanController.js';
import {
  getSettings,
  updateSettings,
  clearAllUserData,
} from '../controllers/settingsController.js';
import { submitFindingFeedback } from '../controllers/feedbackController.js';
import { summarizePrivacyPolicy } from '../controllers/privacyController.js';
import { authenticateUser } from '../middleware/auth.js';
import { aiRateLimiter, standardRateLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validator.js';
import {
  AnalyzeRequestSchema,
  FeedbackTypeSchema,
  PrivacySummaryRequestSchema,
  SettingsUpdateSchema,
} from '@trustlens/shared';
import { z } from 'zod';
import { db } from '../db/index.js';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', async (_req: Request, res: Response) => {
  await db.init();
  res.status(200).json({
    status: 'healthy',
    service: 'trustlens-ai-server',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    storageMode: db.usingPostgres ? 'postgresql' : 'memory',
    aiConfigured: Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim().length > 0 &&
      !process.env.GEMINI_API_KEY.includes('your_gemini_api_key')
    ),
  });
});

// Auth inspection
apiRouter.get('/auth/me', authenticateUser, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// Page Analysis
apiRouter.post(
  '/analyze',
  authenticateUser,
  aiRateLimiter,
  validateBody(AnalyzeRequestSchema),
  analyzePage
);

// Scan History
apiRouter.get('/scans', authenticateUser, standardRateLimiter, getScans);
apiRouter.get('/scans/:id', authenticateUser, standardRateLimiter, getScanById);
apiRouter.delete('/scans/:id', authenticateUser, standardRateLimiter, deleteScan);

// Signals validation
apiRouter.post('/page-signals', authenticateUser, standardRateLimiter, receivePageSignals);

// Finding Feedback
apiRouter.post(
  '/findings/:id/feedback',
  authenticateUser,
  standardRateLimiter,
  validateBody(
    z.object({
      feedbackType: FeedbackTypeSchema,
      notes: z.string().max(500).optional(),
    })
  ),
  submitFindingFeedback
);

// User Settings
apiRouter.get('/settings', authenticateUser, standardRateLimiter, getSettings);
apiRouter.put(
  '/settings',
  authenticateUser,
  standardRateLimiter,
  validateBody(SettingsUpdateSchema),
  updateSettings
);
apiRouter.delete('/settings/data', authenticateUser, standardRateLimiter, clearAllUserData);

// Privacy Policy Summary
apiRouter.post(
  '/privacy-summary',
  authenticateUser,
  aiRateLimiter,
  validateBody(PrivacySummaryRequestSchema),
  summarizePrivacyPolicy
);
