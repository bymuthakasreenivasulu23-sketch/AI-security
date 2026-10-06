import {
  RiskLevel,
  SeverityLevel,
  DarkPatternCategory,
} from '../constants/index.js';
import {
  InteractiveElement,
  PricingSignal,
  ConsentSignal,
  UrgencySignal,
  PageSignals,
  Finding,
  AIAnalysis,
  AnalyzeRequest,
  PrivacyAnalysis,
  ConsentAnalysis,
  PricingAnalysis,
  Feedback,
  Settings,
  SettingsUpdate,
  ScanResponse,
} from '../schemas/index.js';

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  autoScan: boolean;
  aiAnalysis: boolean;
  telemetryEnabled: boolean;
  sensitivePageProtection: boolean;
  showLowConfidence: boolean;
  riskNotificationThreshold: number;
  retentionDays: number;
  updatedAt: string;
}

export interface ScanRecord {
  id: string;
  userId: string;
  domain: string;
  pageUrl: string;
  pageTitle: string;
  pageType: string;
  riskScore: number;
  riskLevel: RiskLevel;
  findingCount: number;
  createdAt: string;
}

export interface FindingRecord extends Finding {
  id: string;
  scanId: string;
  createdAt: string;
}

export interface RiskScoreBreakdown {
  score: number;
  level: RiskLevel;
  severityWeights: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  confidenceMultiplier: number;
  manipulationIntensity: number;
  privacyImpactFactor: number;
  reasons: string[];
}

export type ExtensionMessageType =
  | 'ANALYZE_CURRENT_PAGE'
  | 'PAGE_SIGNALS_EXTRACTED'
  | 'GET_STATUS'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'SENSITIVE_PAGE_DETECTED'
  | 'ANALYSIS_STARTED'
  | 'ANALYSIS_COMPLETED'
  | 'ANALYSIS_FAILED';

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload?: T;
  timestamp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}
