import { Request, Response } from 'express';
import { analyzePrivacyPolicyWithGemini } from '../ai/gemini.js';
import { PrivacySummaryRequest } from '@trustlens/shared';

export async function summarizePrivacyPolicy(req: Request, res: Response) {
  try {
    const { text } = req.body as PrivacySummaryRequest;

    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Privacy policy text must contain at least 20 characters.',
      });
    }

    const summary = await analyzePrivacyPolicyWithGemini(text);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    console.error('[PrivacyController] summarizePrivacyPolicy error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze privacy policy text.',
    });
  }
}
