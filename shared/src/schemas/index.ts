import { z } from 'zod';
import { DARK_PATTERN_CATEGORIES, RISK_LEVELS, SEVERITY_LEVELS } from '../constants/index.js';

export const RiskLevelSchema = z.enum(RISK_LEVELS);
export const SeverityLevelSchema = z.enum(SEVERITY_LEVELS);
export const DarkPatternCategorySchema = z.enum(DARK_PATTERN_CATEGORIES);

export const InteractiveElementSchema = z.object({
  type: z.string().max(100),
  text: z.string().max(500).default(''),
  ariaLabel: z.string().max(300).optional().nullable(),
  checked: z.boolean().optional().nullable(),
  visible: z.boolean().default(true),
  nearbyText: z.string().max(500).optional().nullable(),
  elementRole: z.string().max(100).optional().nullable(),
  selector: z.string().max(300).optional().nullable(),
  classes: z.string().max(300).optional().nullable(),
  isSubmitOrPrimary: z.boolean().optional(),
});
export type InteractiveElement = z.infer<typeof InteractiveElementSchema>;

export const PricingSignalSchema = z.object({
  type: z.string().max(100),
  label: z.string().max(200),
  amount: z.string().max(100).optional().nullable(),
  context: z.string().max(500).optional().nullable(),
  isRecurring: z.boolean().optional(),
  selector: z.string().max(300).optional().nullable(),
});
export type PricingSignal = z.infer<typeof PricingSignalSchema>;

export const ConsentSignalSchema = z.object({
  type: z.string().max(100),
  label: z.string().max(300),
  checkedByDefault: z.boolean(),
  purpose: z.string().max(200).optional().nullable(),
  isRejectHiddenOrSubtle: z.boolean().optional(),
  selector: z.string().max(300).optional().nullable(),
});
export type ConsentSignal = z.infer<typeof ConsentSignalSchema>;

export const UrgencySignalSchema = z.object({
  type: z.string().max(100),
  text: z.string().max(300),
  hasTimer: z.boolean().optional(),
  timerValue: z.string().max(100).optional().nullable(),
  scarcityClaim: z.string().max(300).optional().nullable(),
  selector: z.string().max(300).optional().nullable(),
});
export type UrgencySignal = z.infer<typeof UrgencySignalSchema>;

export const PageSignalsSchema = z.object({
  domain: z.string().max(255),
  pageUrl: z.string().url().max(2048),
  pageTitle: z.string().max(500),
  pageType: z.string().max(100).default('general'),
  interactiveElements: z.array(InteractiveElementSchema).max(100).default([]),
  pricingSignals: z.array(PricingSignalSchema).max(50).default([]),
  consentSignals: z.array(ConsentSignalSchema).max(50).default([]),
  urgencySignals: z.array(UrgencySignalSchema).max(50).default([]),
  headings: z.array(z.string().max(200)).max(30).default([]),
  privacySnippets: z.array(z.string().max(500)).max(20).default([]),
  isLikelySensitive: z.boolean().default(false),
  extractedAt: z.string().datetime().optional(),
});
export type PageSignals = z.infer<typeof PageSignalsSchema>;

export const FindingSchema = z.object({
  category: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  severity: SeverityLevelSchema,
  confidence: z.number().min(0).max(1),
  evidence: z.string().min(1).max(1000),
  explanation: z.string().min(1).max(2000),
  potentialImpact: z.string().min(1).max(1000),
  recommendation: z.string().min(1).max(1000),
  sourceElement: z.string().max(300).default(''),
});
export type Finding = z.infer<typeof FindingSchema>;

export const AnalysisModeSchema = z.enum(['ai', 'rule_based']);
export type AnalysisMode = z.infer<typeof AnalysisModeSchema>;

export const AIAnalysisSchema = z.object({
  overallRiskScore: z.number().int().min(0).max(100),
  riskLevel: RiskLevelSchema,
  summary: z.string().min(1).max(3000),
  findings: z.array(FindingSchema).default([]),
  analysisMode: AnalysisModeSchema.default('rule_based'),
});
export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;

export const AnalyzeRequestSchema = z.object({
  domain: z.string().max(255).optional(),
  pageUrl: z.string().url().max(2048),
  pageTitle: z.string().max(500).default('Untitled Page'),
  pageType: z.string().max(100).default('general'),
  signals: PageSignalsSchema.optional(),
  forceAnalysis: z.boolean().optional().default(false),
});
export type AnalyzeRequest = z.input<typeof AnalyzeRequestSchema>;

export const PrivacyAnalysisSchema = z.object({
  summary: z.string().min(1).max(3000),
  dataCollected: z.array(z.string()).default([]),
  purposes: z.array(z.string()).default([]),
  sharing: z.array(z.string()).default([]),
  trackingIndicators: z.array(z.string()).default([]),
  profilingIndicators: z.array(z.string()).default([]),
  retention: z.string().default('Not clearly specified'),
  userControls: z.array(z.string()).default([]),
  sensitiveDataIndicators: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
  uncertainties: z.array(z.string()).default([]),
});
export type PrivacyAnalysis = z.infer<typeof PrivacyAnalysisSchema>;

export const PrivacySummaryRequestSchema = z.object({
  text: z.string().min(50).max(20000),
  domain: z.string().max(255).optional(),
});
export type PrivacySummaryRequest = z.infer<typeof PrivacySummaryRequestSchema>;

export const ConsentAnalysisSchema = z.object({
  hasPreselectedOptions: z.boolean(),
  isBundled: z.boolean(),
  rejectOptionClear: z.boolean(),
  marketingCheckedByDefault: z.boolean(),
  trackingCheckedByDefault: z.boolean(),
  visualImbalanceDetected: z.boolean(),
  summary: z.string(),
  findings: z.array(FindingSchema).default([]),
});
export type ConsentAnalysis = z.infer<typeof ConsentAnalysisSchema>;

export const PricingAnalysisSchema = z.object({
  hasHiddenFees: z.boolean(),
  hasDripPricing: z.boolean(),
  hasSubscriptionAmbiguity: z.boolean(),
  misleadingDiscount: z.boolean(),
  summary: z.string(),
  findings: z.array(FindingSchema).default([]),
});
export type PricingAnalysis = z.infer<typeof PricingAnalysisSchema>;

export const FeedbackTypeSchema = z.enum([
  'accurate',
  'false_positive',
  'helpful',
  'not_helpful',
  'missed_element',
]);
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;

export const FeedbackSchema = z.object({
  findingId: z.string().uuid(),
  feedbackType: FeedbackTypeSchema,
  notes: z.string().max(500).optional(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const SettingsSchema = z.object({
  auto_scan: z.boolean(),
  ai_analysis: z.boolean(),
  telemetry_enabled: z.boolean(),
  sensitive_page_protection: z.boolean(),
  show_low_confidence: z.boolean(),
  risk_notification_threshold: z.number().int().min(0).max(100),
  retention_days: z.number().int().min(1).max(365),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const SettingsUpdateSchema = SettingsSchema.partial();
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const ScanResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  domain: z.string(),
  pageUrl: z.string(),
  pageTitle: z.string(),
  pageType: z.string(),
  riskScore: z.number(),
  riskLevel: RiskLevelSchema,
  findingCount: z.number(),
  analysisMode: AnalysisModeSchema.default('rule_based'),
  createdAt: z.string().datetime(),
  findings: z.array(
    FindingSchema.extend({
      id: z.string().uuid().optional(),
      scanId: z.string().uuid().optional(),
      createdAt: z.string().datetime().optional(),
    })
  ).optional(),
});
export type ScanResponse = z.infer<typeof ScanResponseSchema>;
