import {
  AnalyzeRequest,
  PageSignals,
  Settings,
  SettingsUpdate,
} from '@trustlens/shared';

const DEFAULT_API_BASE = 'http://localhost:5000/api';

export async function getApiBaseUrl(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.get(['apiBaseUrl'], (res) => {
        resolve(res.apiBaseUrl || DEFAULT_API_BASE);
      });
    } else {
      resolve(DEFAULT_API_BASE);
    }
  });
}

export async function sendAnalysisRequest(requestData: AnalyzeRequest) {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo-token',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${response.status}`);
  }

  return response.json();
}

export async function fetchUserSettings(): Promise<Settings | null> {
  const baseUrl = await getApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/settings`, {
      headers: {
        Authorization: 'Bearer demo-token',
      },
    });
    if (response.ok) {
      const json = await response.json();
      return json.data;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function updateUserSettings(settings: SettingsUpdate) {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo-token',
    },
    body: JSON.stringify(settings),
  });
  return response.json();
}
