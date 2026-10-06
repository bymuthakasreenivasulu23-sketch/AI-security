/**
 * Sanitizer and privacy filter for webpage signals and text.
 * Ensures passwords, credit card numbers, tokens, and prompt injection attempts are filtered.
 */

// Common sensitive patterns
const CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const JWT_REGEX = /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g;
const API_KEY_REGEX = /\b(?:AIza[0-9A-Za-z-_]{35}|ghp_[0-9a-zA-Z]{36}|sk-[a-zA-Z0-9]{32,})\b/g;

// Prompt injection keywords to neutralize
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /reveal\s+(the\s+)?system\s+prompt/gi,
  /you\s+are\s+now\s+in\s+developer\s+mode/gi,
  /system\s*:\s*override/gi,
  /output\s+the\s+api\s+key/gi,
];

export function scrubSensitiveData(text: string): string {
  if (!text) return '';
  return text
    .replace(CREDIT_CARD_REGEX, '[REDACTED_PAYMENT_CARD]')
    .replace(SSN_REGEX, '[REDACTED_SSN]')
    .replace(JWT_REGEX, '[REDACTED_AUTH_TOKEN]')
    .replace(API_KEY_REGEX, '[REDACTED_API_KEY]');
}

export function neutralizePromptInjection(text: string): string {
  if (!text) return '';
  let sanitized = text;
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[DISARMED_INSTRUCTION_TEXT]');
  }
  return sanitized;
}

function disarmXssAndHtml(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[DISARMED_SCRIPT]')
    .replace(/<script\b[^>]*>/gi, '[DISARMED_SCRIPT]')
    .replace(/<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '[DISARMED_HANDLER]')
    .replace(/javascript:\s*/gi, '[DISARMED_SCHEME]');
}

export function sanitizeSignalText(text: string, maxLength = 1000): string {
  if (!text) return '';
  const scrubbed = scrubSensitiveData(text);
  const disarmed = disarmXssAndHtml(scrubbed);
  const neutralized = neutralizePromptInjection(disarmed);
  return neutralized.trim().slice(0, maxLength);
}

export function isSensitiveUrlOrContext(url: string, title: string): boolean {
  const lowerUrl = (url || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  const sensitiveWords = [
    'login',
    'signin',
    'sign-in',
    'auth',
    'oauth',
    'account/password',
    'passwords',
    'bank',
    'banking',
    'wellsfargo',
    'chase',
    'bankofamerica',
    'citi.com',
    'health',
    'medical',
    'patient',
    'mychart',
    'government',
    'irs.gov',
    'ssa.gov',
    'id.me',
  ];

  return sensitiveWords.some(
    (word) => lowerUrl.includes(word) || lowerTitle.includes(word)
  );
}
