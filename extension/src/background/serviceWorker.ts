import { PageSignals, RiskLevel } from '@trustlens/shared';
import { sendAnalysisRequest } from '../services/apiService.js';

function getBadgeColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'critical':
      return '#DC2626'; // Red-600
    case 'high':
      return '#EA580C'; // Orange-600
    case 'moderate':
      return '#D97706'; // Amber-600
    case 'mild':
      return '#CA8A04'; // Yellow-600
    case 'low':
    default:
      return '#16A34A'; // Green-600
  }
}

// Update Extension Action Badge on the tab
function updateTabBadge(tabId: number, score: number, riskLevel: RiskLevel) {
  if (typeof chrome === 'undefined' || !chrome.action) return;

  const text = score.toString();
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({
    tabId,
    color: getBadgeColor(riskLevel),
  });
}

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_SIGNALS_EXTRACTED') {
    const signals = message.payload as PageSignals;
    const tabId = sender.tab?.id;

    if (!tabId || !signals) {
      return;
    }

    // Cache latest signals for this tab
    chrome.storage.local.set({
      [`signals_${tabId}`]: signals,
    });

    // If sensitive, set warning state without auto-analyzing
    if (signals.isLikelySensitive) {
      chrome.action.setBadgeText({ tabId, text: 'PAUSE' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#6B7280' });
      chrome.storage.local.set({
        [`scan_${tabId}`]: {
          isSensitivePage: true,
          message: 'Sensitive page detected. Automatic analysis is paused for your privacy.',
        },
      });
      sendResponse({ status: 'paused_sensitive' });
      return true;
    }

    // Auto-analyze in background
    sendAnalysisRequest({
      domain: signals.domain,
      pageUrl: signals.pageUrl,
      pageTitle: signals.pageTitle,
      pageType: signals.pageType,
      signals,
    })
      .then((res) => {
        if (res.success && res.data) {
          updateTabBadge(tabId, res.data.riskScore, res.data.riskLevel);
          chrome.storage.local.set({
            [`scan_${tabId}`]: res.data,
          });
        }
      })
      .catch((err) => {
        console.warn('[Background] Auto-scan failed:', err.message);
      });

    sendResponse({ status: 'processing' });
  }

  return true;
});
