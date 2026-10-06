import dns from 'node:dns/promises';
import { z } from 'zod';

export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  domain?: string;
  error?: string;
  ip?: string;
}

// Strict protocol check - only http and https allowed
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

// Private, loopback, link-local and cloud metadata IPv4 ranges
const PRIVATE_IPV4_REGEXES = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 127.0.0.0/8 (Loopback)
  /^0\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 0.0.0.0/8
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 10.0.0.0/8 (Private RFC1918)
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12 (Private RFC1918)
  /^192\.168\.\d{1,3}\.\d{1,3}$/, // 192.168.0.0/16 (Private RFC1918)
  /^169\.254\.\d{1,3}\.\d{1,3}$/, // 169.254.0.0/16 (Link-local & AWS/GCP/Azure metadata 169.254.169.254)
  /^192\.0\.2\.\d{1,3}$/, // TEST-NET-1
  /^198\.51\.100\.\d{1,3}$/, // TEST-NET-2
  /^203\.0\.113\.\d{1,3}$/, // TEST-NET-3
  /^224\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 224.0.0.0/4 (Multicast)
  /^240\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 240.0.0.0/4 (Reserved)
  /^255\.255\.255\.255$/, // Broadcast
];

// Blocked hostnames associated with internal / cloud metadata
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'metadata.internal',
  'instance-data',
  '169.254.169.254',
]);

/**
 * Checks whether an IPv4 address is in a private, loopback, or reserved range.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  // IPv6 checks
  const lowerIp = ip.toLowerCase();
  if (lowerIp === '::1' || lowerIp === '::' || lowerIp.startsWith('fe80:') || lowerIp.startsWith('fc00:') || lowerIp.startsWith('fd00:')) {
    return true;
  }
  // IPv4 mapped in IPv6
  if (lowerIp.startsWith('::ffff:')) {
    const v4 = lowerIp.replace('::ffff:', '');
    return PRIVATE_IPV4_REGEXES.some((reg) => reg.test(v4));
  }
  return PRIVATE_IPV4_REGEXES.some((reg) => reg.test(ip));
}

/**
 * Validates and normalizes a candidate URL with strict SSRF protections.
 */
export async function validateUrlForSsrf(
  rawUrl: string,
  options: { allowLocalhost?: boolean } = {}
): Promise<UrlValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string.' };
  }

  const trimmed = rawUrl.trim();

  // Explicit check against dangerous pseudo-protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('chrome:') ||
    lower.startsWith('chrome-extension:') ||
    lower.startsWith('about:') ||
    lower.startsWith('blob:')
  ) {
    return {
      isValid: false,
      error: 'Unsupported protocol. Only HTTP and HTTPS URLs are permitted.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    return { isValid: false, error: 'Invalid URL syntax.' };
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      isValid: false,
      error: `Disallowed protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`,
    };
  }

  // Credentials in URL check (e.g. http://admin:pass@host)
  if (parsed.username || parsed.password) {
    return {
      isValid: false,
      error: 'User credentials are not permitted in the target URL.',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    return { isValid: false, error: 'URL is missing a valid hostname.' };
  }

  // Hostname string checks
  const isLocalhost =
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname === '127.0.0.1' ||
    hostname === '::1';

  if (isLocalhost && !options.allowLocalhost) {
    return {
      isValid: false,
      error: 'Requests to localhost and internal loopback addresses are prohibited.',
    };
  }

  if (BLOCKED_HOSTNAMES.has(hostname) && !options.allowLocalhost) {
    return {
      isValid: false,
      error: `Requests to internal host "${hostname}" are blocked by SSRF policy.`,
    };
  }

  // Check direct IP hostnames
  if (isPrivateIp(hostname) && !options.allowLocalhost) {
    return {
      isValid: false,
      error: 'Requests to private IP addresses and cloud metadata endpoints are blocked.',
    };
  }

  // Asynchronous DNS Resolution & IP Revalidation to prevent DNS rebinding
  try {
    const lookup = await dns.lookup(hostname);
    const resolvedIp = lookup.address;

    if (isPrivateIp(resolvedIp) && !options.allowLocalhost) {
      return {
        isValid: false,
        error: `Hostname "${hostname}" resolved to prohibited private IP (${resolvedIp}).`,
      };
    }

    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      domain: hostname,
      ip: resolvedIp,
    };
  } catch (dnsErr: any) {
    // If DNS fails (e.g. mock domains or disconnected network)
    if (options.allowLocalhost && hostname === 'localhost') {
      return {
        isValid: true,
        normalizedUrl: parsed.toString(),
        domain: hostname,
      };
    }
    return {
      isValid: false,
      error: `DNS resolution failed for hostname "${hostname}": ${dnsErr.message || 'Host not found'}`,
    };
  }
}
