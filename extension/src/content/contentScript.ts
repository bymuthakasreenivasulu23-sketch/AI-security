import { extractPageSignals, isPageLikelySensitive } from '../extraction/domExtractor.js';
import { ExtensionMessage } from '@trustlens/shared';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastExtractionTime = 0;
const EXTRACTION_THROTTLE_MS = 3000;

function performExtractionAndNotify() {
  const now = Date.now();
  if (now - lastExtractionTime < EXTRACTION_THROTTLE_MS) {
    return;
  }
  lastExtractionTime = now;

  const signals = extractPageSignals();

  // Send signals to background service worker
  try {
    chrome.runtime.sendMessage({
      type: 'PAGE_SIGNALS_EXTRACTED',
      payload: signals,
      timestamp: Date.now(),
    });
  } catch (err) {
    // Context may be invalidated if extension was reloaded
  }
}

// Debounced DOM observer
function setupObserver() {
  const observer = new MutationObserver((mutations) => {
    // Only react if meaningful nodes were added or modified
    let hasRelevantChanges = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        hasRelevantChanges = true;
        break;
      }
      if (
        mutation.type === 'attributes' &&
        (mutation.attributeName === 'style' ||
          mutation.attributeName === 'class' ||
          mutation.attributeName === 'checked')
      ) {
        hasRelevantChanges = true;
        break;
      }
    }

    if (hasRelevantChanges) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performExtractionAndNotify();
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'checked'],
  });
}

// Initial run after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    performExtractionAndNotify();
    setupObserver();
  });
} else {
  performExtractionAndNotify();
  setupObserver();
}

// Listen for messages from background / popup
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'ANALYZE_CURRENT_PAGE') {
      const signals = extractPageSignals();
      sendResponse({ success: true, signals });
    }
    return true;
  }
);
