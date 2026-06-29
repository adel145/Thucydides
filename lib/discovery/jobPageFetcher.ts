export async function fetchPublicJobPage(url: string, options: { timeoutMs?: number; maxChars?: number } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 9000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Thucydides local job discovery; manual review only" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Job page fetch failed: ${response.status}`);
    const text = await response.text();
    return text.slice(0, options.maxChars ?? 200_000);
  } finally {
    clearTimeout(timeout);
  }
}
