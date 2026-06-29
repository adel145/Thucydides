import { isIP } from "node:net";

export type JobPageFetchResult =
  | { ok: true; url: string; contentType: string | null; html: string }
  | { ok: false; url: string; reason: string };

const blockedProtocols = new Set(["file:", "data:", "ftp:", "javascript:", "chrome:", "about:"]);
const privateIpv4Ranges = [
  /^10\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./
];

export function isSafePublicHttpUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (blockedProtocols.has(url.protocol)) return false;
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname.toLocaleLowerCase();
    if (host === "localhost" || host === "0.0.0.0" || host === "::1") return false;
    if (privateIpv4Ranges.some((range) => range.test(host))) return false;
    if (isIP(host) === 6 && (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80"))) return false;
    return true;
  } catch {
    return false;
  }
}

export async function fetchPublicJobPage(url: string, options: { timeoutMs?: number; maxChars?: number } = {}): Promise<JobPageFetchResult> {
  if (!isSafePublicHttpUrl(url)) return { ok: false, url, reason: "Unsafe or unsupported URL." };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 9000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Thucydides local job discovery; manual review only" },
      signal: controller.signal
    });
    if (!response.ok) return { ok: false, url, reason: `HTTP ${response.status}` };
    const contentType = response.headers.get("content-type");
    if (contentType && !/(text\/html|application\/xhtml\+xml|application\/ld\+json)/i.test(contentType)) {
      return { ok: false, url, reason: `Unsupported content type: ${contentType}` };
    }
    const text = await response.text();
    return { ok: true, url, contentType, html: text.slice(0, options.maxChars ?? 200_000) };
  } catch (error) {
    return { ok: false, url, reason: error instanceof Error ? error.message : "Fetch failed." };
  } finally {
    clearTimeout(timeout);
  }
}
