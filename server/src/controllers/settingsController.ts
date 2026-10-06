import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { SettingsUpdate } from '@trustlens/shared';

export async function getSettings(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const settings = await db.getUserSettings(userId);

    return res.status(200).json({
      success: true,
      data: {
        auto_scan: settings.auto_scan,
        ai_analysis: settings.ai_analysis,
        telemetry_enabled: settings.telemetry_enabled,
        sensitive_page_protection: settings.sensitive_page_protection,
        show_low_confidence: settings.show_low_confidence,
        risk_notification_threshold: settings.risk_notification_threshold,
        retention_days: settings.retention_days,
        updated_at: settings.updated_at,
      },
    });
  } catch (err: any) {
    console.error('[SettingsController] getSettings error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user settings.',
    });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const updates: SettingsUpdate = req.body;

    const updated = await db.updateUserSettings(userId, updates);

    return res.status(200).json({
      success: true,
      data: {
        auto_scan: updated.auto_scan,
        ai_analysis: updated.ai_analysis,
        telemetry_enabled: updated.telemetry_enabled,
        sensitive_page_protection: updated.sensitive_page_protection,
        show_low_confidence: updated.show_low_confidence,
        risk_notification_threshold: updated.risk_notification_threshold,
        retention_days: updated.retention_days,
        updated_at: updated.updated_at,
      },
    });
  } catch (err: any) {
    console.error('[SettingsController] updateSettings error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings.',
    });
  }
}

export async function clearAllUserData(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    await db.deleteAllUserData(userId);

    return res.status(200).json({
      success: true,
      message: 'All scan history and feedback records have been permanently cleared.',
    });
  } catch (err: any) {
    console.error('[SettingsController] clearAllUserData error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear user data.',
    });
  }
}
