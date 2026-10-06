import { Request, Response } from 'express';
import { db } from '../db/index.js';
import {
  analyzeSignalsWithGemini,
} from '../ai/gemini.js';
import {
  AnalyzeRequest,
  PageSignals,
  PageSignalsSchema,
} from '@trustlens/shared';
import { isSensitiveUrlOrContext } from '../utils/sanitizer.js';

export async function analyzePage(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const body: AnalyzeRequest = req.body;

    const userSettings = await db.getUserSettings(userId);

    const pageTitle = body.pageTitle || 'Untitled Page';
    const pageType = body.pageType || 'general';

    // Check sensitive page protection
    const isSensitive =
      body.signals?.isLikelySensitive ||
      isSensitiveUrlOrContext(body.pageUrl, pageTitle);

    if (isSensitive && userSettings.sensitive_page_protection && !body.forceAnalysis) {
      return res.status(200).json({
        success: true,
        isSensitivePage: true,
        message: 'Sensitive page detected. Automatic analysis is paused for your privacy.',
        recommendation:
          'This appears to be a financial, authentication, government, or healthcare page. You can analyze manually if needed.',
      });
    }

    // Parse and apply defaults to signals
    const signals: PageSignals = PageSignalsSchema.parse(
      body.signals || {
        domain: body.domain,
        pageUrl: body.pageUrl,
        pageTitle,
        pageType,
        interactiveElements: [],
        pricingSignals: [],
        consentSignals: [],
        urgencySignals: [],
        headings: [],
        privacySnippets: [],
        isLikelySensitive: isSensitive,
        extractedAt: new Date().toISOString(),
      }
    );

    // Analyze using Gemini (or fallback rule-based analyzer)
    const analysis = await analyzeSignalsWithGemini(signals);

    // Filter low-confidence findings if user disabled them
    let findingsToSave = analysis.findings;
    if (!userSettings.show_low_confidence) {
      findingsToSave = findingsToSave.filter((f) => f.confidence >= 0.7);
    }

    // Persist scan and findings to database
    const saved = await db.createScan(
      {
        user_id: userId,
        domain: body.domain,
        page_url: body.pageUrl,
        page_title: pageTitle,
        page_type: pageType,
        risk_score: analysis.overallRiskScore,
        risk_level: analysis.riskLevel,
        finding_count: findingsToSave.length,
        analysis_mode: analysis.analysisMode,
      },
      findingsToSave.map((f) => ({
        category: f.category,
        title: f.title,
        severity: f.severity,
        confidence: f.confidence,
        evidence: f.evidence,
        explanation: f.explanation,
        potential_impact: f.potentialImpact,
        recommendation: f.recommendation,
        source_element: f.sourceElement || '',
      }))
    );

    return res.status(200).json({
      success: true,
      data: {
        scanId: saved.scan.id,
        domain: saved.scan.domain,
        pageUrl: saved.scan.page_url,
        pageTitle: saved.scan.page_title,
        pageType: saved.scan.page_type,
        riskScore: saved.scan.risk_score,
        riskLevel: saved.scan.risk_level,
        findingCount: saved.scan.finding_count,
        analysisMode: saved.scan.analysis_mode || analysis.analysisMode,
        summary: analysis.summary,
        findings: saved.findings.map((f) => ({
          id: f.id,
          category: f.category,
          title: f.title,
          severity: f.severity,
          confidence: Number(f.confidence),
          evidence: f.evidence,
          explanation: f.explanation,
          potentialImpact: f.potential_impact,
          recommendation: f.recommendation,
          sourceElement: f.source_element,
          createdAt: f.created_at,
        })),
        createdAt: saved.scan.created_at,
      },
    });
  } catch (err: any) {
    console.error('[ScanController] analyzePage error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during page analysis.',
    });
  }
}

export async function getScans(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);
    const offset = (page - 1) * limit;

    const { scans, total } = await db.getScans(userId, limit, offset);

    return res.status(200).json({
      success: true,
      data: {
        scans: scans.map((s) => ({
          id: s.id,
          userId: s.user_id,
          domain: s.domain,
          pageUrl: s.page_url,
          pageTitle: s.page_title,
          pageType: s.page_type,
          riskScore: s.risk_score,
          riskLevel: s.risk_level,
          findingCount: s.finding_count,
          analysisMode: s.analysis_mode || 'rule_based',
          createdAt: s.created_at,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error('[ScanController] getScans error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve scan history.',
    });
  }
}

export async function getScanById(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const scanId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);

    const result = await db.getScanById(userId, scanId);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: result.scan.id,
        userId: result.scan.user_id,
        domain: result.scan.domain,
        pageUrl: result.scan.page_url,
        pageTitle: result.scan.page_title,
        pageType: result.scan.page_type,
        riskScore: result.scan.risk_score,
        riskLevel: result.scan.risk_level,
        findingCount: result.scan.finding_count,
        analysisMode: result.scan.analysis_mode || 'rule_based',
        createdAt: result.scan.created_at,
        findings: result.findings.map((f) => ({
          id: f.id,
          category: f.category,
          title: f.title,
          severity: f.severity,
          confidence: Number(f.confidence),
          evidence: f.evidence,
          explanation: f.explanation,
          potentialImpact: f.potential_impact,
          recommendation: f.recommendation,
          sourceElement: f.source_element,
          createdAt: f.created_at,
        })),
      },
    });
  } catch (err: any) {
    console.error('[ScanController] getScanById error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch scan details.',
    });
  }
}

export async function deleteScan(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const scanId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);

    const deleted = await db.deleteScan(userId, scanId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found or unauthorized to delete.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Scan record deleted successfully.',
    });
  } catch (err: any) {
    console.error('[ScanController] deleteScan error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete scan record.',
    });
  }
}

export async function receivePageSignals(req: Request, res: Response) {
  try {
    const validated = PageSignalsSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signals format',
        details: validated.error.issues,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Signals validated successfully',
      signalsCount: {
        interactive: validated.data.interactiveElements.length,
        pricing: validated.data.pricingSignals.length,
        consent: validated.data.consentSignals.length,
        urgency: validated.data.urgencySignals.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process page signals.',
    });
  }
}
