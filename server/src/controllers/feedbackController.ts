import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { Feedback } from '@trustlens/shared';

export async function submitFindingFeedback(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const findingId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const { feedbackType, notes } = req.body as Feedback;

    const saved = await db.addFeedback(userId, findingId, feedbackType, notes);

    return res.status(201).json({
      success: true,
      data: {
        id: saved.id,
        findingId: saved.finding_id,
        feedbackType: saved.feedback_type,
        notes: saved.notes,
        createdAt: saved.created_at,
      },
    });
  } catch (err: any) {
    console.error('[FeedbackController] submitFindingFeedback error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to record feedback.',
    });
  }
}
