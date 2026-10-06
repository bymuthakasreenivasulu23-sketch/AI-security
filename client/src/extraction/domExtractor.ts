import {
  ConsentSignal,
  InteractiveElement,
  PageSignals,
  PricingSignal,
  UrgencySignal,
  SENSITIVE_PATTERNS,
} from '@trustlens/shared';

function isElementVisible(el: HTMLElement): boolean {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    el.hidden
  ) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getElementSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  let selector = el.tagName.toLowerCase();
  if (el.className && typeof el.className === 'string') {
    const firstClass = el.className.split(/\s+/).filter(Boolean)[0];
    if (firstClass) selector += `.${firstClass}`;
  }
  return selector;
}

export function isPageLikelySensitive(): boolean {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();

  for (const keyword of SENSITIVE_PATTERNS.URL_KEYWORDS) {
    if (url.includes(keyword)) return true;
  }

  for (const t of SENSITIVE_PATTERNS.PAGE_TITLES) {
    if (title.includes(t)) return true;
  }

  const passwordInputs = document.querySelectorAll('input[type="password"]');
  if (passwordInputs.length > 0) return true;

  return false;
}

export function extractPageSignals(): PageSignals {
  const isSensitive = isPageLikelySensitive();

  // 1. Interactive Elements
  const interactiveElements: InteractiveElement[] = [];
  const interactiveNodes = document.querySelectorAll(
    'button, a[role="button"], input[type="checkbox"], input[type="radio"], select, [role="button"]'
  );

  interactiveNodes.forEach((node, idx) => {
    if (idx >= 60) return;
    const el = node as HTMLElement;
    if (!isElementVisible(el)) return;

    let text = '';
    if (el.tagName === 'INPUT') {
      const inputEl = el as HTMLInputElement;
      if (inputEl.type === 'password' || inputEl.type === 'hidden') return;
      if (inputEl.type === 'submit' || inputEl.type === 'button') {
        text = (inputEl.value || '').trim();
      } else {
        text = (inputEl.placeholder || '').trim();
      }
    } else {
      text = (el.innerText || el.textContent || '').trim();
    }
    text = text.slice(0, 150);

    const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('title') || null;
    const isChecked = (el as HTMLInputElement).checked ?? null;

    let nearbyText: string | null = null;
    if (el.parentElement) {
      nearbyText = (el.parentElement.innerText || '').trim().slice(0, 150);
    }

    interactiveElements.push({
      type: el.tagName.toLowerCase(),
      text,
      ariaLabel,
      checked: isChecked,
      visible: true,
      nearbyText,
      elementRole: el.getAttribute('role'),
      selector: getElementSelector(el),
    });
  });

  // 2. Consent & Checkbox Signals
  const consentSignals: ConsentSignal[] = [];
  const checkboxes = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  checkboxes.forEach((cb) => {
    const input = cb as HTMLInputElement;
    if (!isElementVisible(input)) return;

    let labelText = '';
    if (input.labels && input.labels.length > 0) {
      labelText = input.labels[0].innerText || '';
    } else if (input.parentElement) {
      labelText = input.parentElement.innerText || '';
    }

    labelText = labelText.trim().slice(0, 250);
    const lower = labelText.toLowerCase();

    const isConsentRelated =
      lower.includes('agree') ||
      lower.includes('consent') ||
      lower.includes('accept') ||
      lower.includes('marketing') ||
      lower.includes('newsletter') ||
      lower.includes('cookie') ||
      lower.includes('partner') ||
      lower.includes('terms') ||
      lower.includes('privacy') ||
      lower.includes('tracking') ||
      lower.includes('profiling') ||
      lower.includes('advertising');

    if (isConsentRelated) {
      consentSignals.push({
        type: input.type === 'radio' ? 'radio_consent' : 'checkbox_consent',
        label: labelText,
        checkedByDefault: input.checked,
        purpose: lower.includes('marketing') || lower.includes('advertising')
          ? 'marketing'
          : lower.includes('tracking') || lower.includes('cookie')
          ? 'cookies_and_tracking'
          : 'general_terms',
        selector: getElementSelector(input),
      });
    }
  });

  // Check for Cookie Banners & Asymmetry
  const cookieBanners = document.querySelectorAll(
    '[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [aria-label*="cookie" i]'
  );
  cookieBanners.forEach((banner) => {
    const bannerEl = banner as HTMLElement;
    if (!isElementVisible(bannerEl)) return;

    const bannerText = (bannerEl.innerText || '').toLowerCase();
    const hasAccept =
      bannerText.includes('accept all') ||
      bannerText.includes('i agree') ||
      bannerText.includes('allow all');
    const hasReject =
      bannerText.includes('reject all') ||
      bannerText.includes('decline') ||
      bannerText.includes('disagree');

    if (hasAccept && !hasReject) {
      consentSignals.push({
        type: 'banner_imbalance',
        label: 'Cookie Banner has Accept All with no visible Reject All',
        checkedByDefault: false,
        isRejectHiddenOrSubtle: true,
        selector: getElementSelector(bannerEl),
      });
    }
  });

  // 3. Pricing Signals (Fees, Recurring, Trials)
  const pricingSignals: PricingSignal[] = [];
  const pricingElements = document.querySelectorAll(
    '[class*="price" i], [class*="fee" i], [class*="total" i], [class*="subscription" i], [id*="price" i], [class*="cost" i]'
  );
  pricingElements.forEach((node, i) => {
    if (i >= 25) return;
    const el = node as HTMLElement;
    if (!isElementVisible(el)) return;

    const text = (el.innerText || '').trim();
    const lower = text.toLowerCase();

    if (
      lower.includes('fee') ||
      lower.includes('charge') ||
      lower.includes('service fee') ||
      lower.includes('ancillary') ||
      lower.includes('per month') ||
      lower.includes('/mo') ||
      lower.includes('billed') ||
      lower.includes('free trial') ||
      lower.includes('auto-renew') ||
      lower.includes('subscription')
    ) {
      const amountMatch = text.match(/(?:[\$€£₹¥]|rs\.?)\s*[\d,.]+|\b[\d,.]+\s*(?:usd|eur|gbp|inr)\b/i);
      pricingSignals.push({
        type: 'pricing_item',
        label: text.slice(0, 150),
        amount: amountMatch ? amountMatch[0] : null,
        context: el.parentElement ? el.parentElement.innerText.slice(0, 200) : null,
        isRecurring:
          lower.includes('/mo') ||
          lower.includes('month') ||
          lower.includes('annual') ||
          lower.includes('auto-renew') ||
          lower.includes('trial'),
        selector: getElementSelector(el),
      });
    }
  });

  // 4. Urgency & Countdown Signals
  const urgencySignals: UrgencySignal[] = [];
  const textNodes = document.querySelectorAll('div, span, p, h1, h2, h3, h4');
  textNodes.forEach((node) => {
    if (urgencySignals.length >= 10) return;
    const el = node as HTMLElement;
    if (el.children.length > 2 || !isElementVisible(el)) return;

    const text = (el.innerText || '').trim();
    if (!text || text.length > 150) return;
    const lower = text.toLowerCase();

    const timerMatch = text.match(/\b\d{1,2}:\d{2}\b/);
    const isUrgency =
      lower.includes('expires in') ||
      lower.includes('limited time') ||
      lower.includes('only left') ||
      lower.includes('only ') && lower.includes('remaining') ||
      lower.includes('hurry') ||
      lower.includes('act now') ||
      lower.includes('demand is high') ||
      lower.includes('viewing right now') ||
      timerMatch !== null;

    if (isUrgency) {
      urgencySignals.push({
        type: timerMatch ? 'countdown_timer' : 'urgency_claim',
        text: text.slice(0, 150),
        hasTimer: timerMatch !== null,
        timerValue: timerMatch ? timerMatch[0] : null,
        scarcityClaim: lower.includes('left') || lower.includes('demand') || lower.includes('remaining') ? text : null,
        selector: getElementSelector(el),
      });
    }
  });

  // 5. Headings
  const headings: string[] = [];
  document.querySelectorAll('h1, h2, h3').forEach((h, i) => {
    if (i < 15) {
      const text = (h as HTMLElement).innerText?.trim();
      if (text) headings.push(text.slice(0, 120));
    }
  });

  return {
    domain: window.location.hostname,
    pageUrl: window.location.href,
    pageTitle: document.title || 'Untitled Page',
    pageType: isSensitive ? 'sensitive_portal' : 'general',
    interactiveElements,
    pricingSignals,
    consentSignals,
    urgencySignals,
    headings,
    privacySnippets: [],
    isLikelySensitive: isSensitive,
    extractedAt: new Date().toISOString(),
  };
}
