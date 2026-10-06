import { PageSignals, InteractiveElement, PricingSignal, ConsentSignal, UrgencySignal } from '@trustlens/shared';
import { validateUrlForSsrf } from './urlValidator.js';
import { sanitizeSignalText, isSensitiveUrlOrContext } from './sanitizer.js';

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 7000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface FetchResult {
  success: boolean;
  html?: string;
  finalUrl?: string;
  statusCode?: number;
  error?: string;
}

/**
 * Safely fetches raw HTML from a remote URL with SSRF protections,
 * timeout controls, max redirect bounds, and response size limits.
 */
export async function safeFetchHtml(
  initialUrl: string,
  options: { allowLocalhost?: boolean } = {}
): Promise<FetchResult> {
  let currentUrl = initialUrl;
  let redirectsFollowed = 0;

  while (redirectsFollowed <= MAX_REDIRECTS) {
    const validation = await validateUrlForSsrf(currentUrl, options);
    if (!validation.isValid) {
      return {
        success: false,
        error: `SSRF validation failed: ${validation.error}`,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TrustLensAI/1.0 (Privacy & Dark Pattern Scanner; +https://trustlens.ai)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.1',
        },
        signal: controller.signal,
        redirect: 'manual', // Manual redirect control to validate each hop against SSRF!
      });

      clearTimeout(timeout);

      // Handle Redirects manually
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        redirectsFollowed++;
        if (redirectsFollowed > MAX_REDIRECTS) {
          return {
            success: false,
            error: `Too many redirects (exceeded maximum of ${MAX_REDIRECTS}).`,
          };
        }

        const locationHeader = response.headers.get('location');
        if (!locationHeader) {
          return {
            success: false,
            error: 'Redirect response missing Location header.',
          };
        }

        // Resolve relative redirects safely against current URL
        currentUrl = new URL(locationHeader, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: `Remote server responded with HTTP status ${response.status} (${response.statusText}).`,
        };
      }

      const contentType = response.headers.get('content-type') || '';
      if (
        !contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml') &&
        !contentType.includes('text/plain')
      ) {
        return {
          success: false,
          error: `Unsupported content type "${contentType}". Only HTML web pages can be analyzed.`,
        };
      }

      // Read response body with byte limit
      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        if (text.length > MAX_RESPONSE_BYTES) {
          return { success: false, error: 'Webpage response exceeded maximum allowed size (2MB).' };
        }
        return { success: true, html: text, finalUrl: currentUrl, statusCode: response.status };
      }

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > MAX_RESPONSE_BYTES) {
            reader.cancel();
            return {
              success: false,
              error: 'Webpage response exceeded maximum allowed size (2MB).',
            };
          }
          chunks.push(value);
        }
      }

      const merged = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      const decodedHtml = new TextDecoder('utf-8').decode(merged);
      return {
        success: true,
        html: decodedHtml,
        finalUrl: currentUrl,
        statusCode: response.status,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: `Connection timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`,
        };
      }
      return {
        success: false,
        error: `Network error retrieving URL: ${err.message || 'Connection failed.'}`,
      };
    }
  }

  return { success: false, error: 'Maximum redirects exceeded.' };
}

/**
 * Parses static HTML text into structured PageSignals with sanitization.
 * Strictly avoids capturing password values, card numbers, or session cookies.
 */
export function extractSignalsFromHtml(html: string, pageUrl: string): PageSignals {
  const urlObj = new URL(pageUrl);
  const domain = urlObj.hostname;

  // 1. Extract Page Title
  let pageTitle = domain;
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    pageTitle = sanitizeSignalText(titleMatch[1].trim(), 200);
  }

  const isSensitive = isSensitiveUrlOrContext(pageUrl, pageTitle);

  // 2. Extract Headings (h1, h2)
  const headings: string[] = [];
  const headingMatches = html.matchAll(/<h[1-2][^>]*>([\s\S]*?)<\/h[1-2]>/gi);
  for (const m of headingMatches) {
    if (m[1]) {
      const stripped = sanitizeSignalText(m[1].replace(/<[^>]+>/g, ' ').trim(), 200);
      if (stripped && !headings.includes(stripped) && headings.length < 8) {
        headings.push(stripped);
      }
    }
  }

  // 3. Extract Interactive Elements & Confirmshaming (buttons, links)
  const interactiveElements: InteractiveElement[] = [];
  const buttonMatches = html.matchAll(/<(button|a|input)[^>]*>([\s\S]*?)<\/\1>|<input[^>]*type=["']?(submit|button)["']?[^>]*>/gi);

  for (const m of buttonMatches) {
    const fullTag = m[0];
    const innerText = m[2] ? m[2].replace(/<[^>]+>/g, ' ').trim() : '';
    const valueMatch = fullTag.match(/value=["']([^"']+)["']/i);
    const label = sanitizeSignalText(innerText || (valueMatch ? valueMatch[1] : ''), 150);

    if (label && label.length > 2) {
      interactiveElements.push({
        type: fullTag.toLowerCase().includes('<button') ? 'button' : 'link',
        text: label,
        visible: true,
      });
      if (interactiveElements.length >= 25) break;
    }
  }

  // 4. Extract Consent & Checkbox Signals
  const consentSignals: ConsentSignal[] = [];
  const checkboxMatches = html.matchAll(/<input[^>]*type=["']?checkbox["']?[^>]*>/gi);

  for (const m of checkboxMatches) {
    const tag = m[0];
    const isChecked = /\bchecked\b/i.test(tag);

    // Extract proximity text around the checkbox
    const idx = m.index ?? 0;
    const surrounding = html.slice(Math.max(0, idx - 100), Math.min(html.length, idx + 250));
    const cleanContext = sanitizeSignalText(surrounding.replace(/<[^>]+>/g, ' ').trim(), 300);

    const isMarketing = /marketing|promot|partner|sponsor|newsletter|advertis/i.test(cleanContext);
    const isTracking = /track|cookie|behavior|profil|share data|third-party/i.test(cleanContext);

    if (isMarketing || isTracking || isChecked) {
      consentSignals.push({
        type: 'checkbox',
        label: cleanContext || 'Consent agreement checkbox',
        checkedByDefault: isChecked,
        purpose: isMarketing ? 'marketing' : isTracking ? 'tracking' : 'general',
      });
      if (consentSignals.length >= 10) break;
    }
  }

  // 5. Extract Pricing & Fee Signals
  const pricingSignals: PricingSignal[] = [];
  // Detect Currency mentions ($ , € , £ , ¥ , ₹)
  const priceMatches = html.matchAll(/(₹|\$|€|£|¥)\s*(\d+(?:[.,]\d{2})?)/g);
  for (const m of priceMatches) {
    const amount = `${m[1]}${m[2]}`;
    const idx = m.index ?? 0;
    const surrounding = html.slice(Math.max(0, idx - 80), Math.min(html.length, idx + 150));
    const context = sanitizeSignalText(surrounding.replace(/<[^>]+>/g, ' ').trim(), 200);

    const isFee = /service fee|processing fee|convenience fee|handling charge|surcharge|hidden fee/i.test(context);
    const isRecurring = /auto-renew|renews at|free trial|month|year|weekly|subscription/i.test(context);

    pricingSignals.push({
      type: isFee ? 'hidden_fee' : isRecurring ? 'trial' : 'price',
      label: isFee ? 'Mandatory Ancillary Processing Surcharge' : isRecurring ? 'Subscription Tier' : 'Product Price',
      amount,
      context,
      isRecurring,
    });
    if (pricingSignals.length >= 10) break;
  }

  // 6. Extract Urgency & Countdown Signals
  const urgencySignals: UrgencySignal[] = [];
  const timerMatches = html.matchAll(/(?:expires in|hurry|deal ends in|offer ends in|limited time)\s*(\d{1,2}:\d{2})/gi);
  for (const m of timerMatches) {
    urgencySignals.push({
      type: 'countdown_timer',
      text: sanitizeSignalText(m[0], 150),
      hasTimer: true,
      timerValue: m[1],
    });
  }

  // Scarcity Claims
  const scarcityMatches = html.matchAll(/(only \d+ (?:left|remaining)|in high demand|\d+ people are viewing)/gi);
  for (const m of scarcityMatches) {
    urgencySignals.push({
      type: 'scarcity',
      text: sanitizeSignalText(m[0], 150),
      scarcityClaim: sanitizeSignalText(m[0], 150),
    });
  }

  // 7. Privacy Snippets
  const privacySnippets: string[] = [];
  const privacyMatches = html.matchAll(/(?:we collect|data collected|information we share|third parties may|privacy policy)[\s\S]{20,250}\./gi);
  for (const m of privacyMatches) {
    const snip = sanitizeSignalText(m[0].replace(/<[^>]+>/g, ' ').trim(), 250);
    if (snip && !privacySnippets.includes(snip) && privacySnippets.length < 5) {
      privacySnippets.push(snip);
    }
  }

  return {
    domain,
    pageUrl,
    pageTitle,
    pageType: 'webpage_static_analysis',
    interactiveElements,
    pricingSignals,
    consentSignals,
    urgencySignals,
    headings,
    privacySnippets,
    isLikelySensitive: isSensitive,
    extractedAt: new Date().toISOString(),
  };
}
