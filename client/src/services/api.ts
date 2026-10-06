import {
  AnalyzeRequest,
  FeedbackType,
  PrivacySummaryRequest,
  ScanResponse,
  Settings,
  SettingsUpdate,
} from '@trustlens/shared';

const API_BASE = '/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer demo-token',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Scans
  analyze: (payload: AnalyzeRequest) =>
    apiRequest<{ success: boolean; data?: ScanResponse; isSensitivePage?: boolean; message?: string }>(
      '/analyze',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  getScans: (page = 1, limit = 20) =>
    apiRequest<{
      success: boolean;
      data: {
        scans: ScanResponse[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>(`/scans?page=${page}&limit=${limit}`),

  getScanById: (id: string) =>
    apiRequest<{ success: boolean; data: ScanResponse }>(`/scans/${id}`),

  deleteScan: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/scans/${id}`, {
      method: 'DELETE',
    }),

  // Findings Feedback
  submitFeedback: (findingId: string, feedbackType: FeedbackType, notes?: string) =>
    apiRequest<{ success: boolean; data: any }>(`/findings/${findingId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedbackType, notes }),
    }),

  // Settings
  getSettings: () =>
    apiRequest<{ success: boolean; data: Settings }>('/settings'),

  updateSettings: (settings: SettingsUpdate) =>
    apiRequest<{ success: boolean; data: Settings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  clearUserData: () =>
    apiRequest<{ success: boolean; message: string }>('/settings/data', {
      method: 'DELETE',
    }),

  // Privacy Policy Summarization
  summarizePrivacyPolicy: (payload: PrivacySummaryRequest) =>
    apiRequest<{ success: boolean; data: any }>('/privacy-summary', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Health & System Info
  getHealth: () =>
    apiRequest<{
      status: string;
      service: string;
      storageMode: 'postgresql' | 'memory';
      aiConfigured: boolean;
    }>('/health'),
};
