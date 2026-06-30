export type ExtractedCareerJobLink = {
  title: string;
  url: string;
  snippet: string;
  preferredLocationSignal: boolean;
};

const targetRolePattern = /(software|developer|engineer|backend|full\s*stack|fullstack|python|qa|automation|data|machine learning|deep learning|computer vision|research student|student|technical support|noc|implementation|integration)/i;
const locationPattern = /(israel|tel aviv|haifa|jerusalem|beer|beersheba|remote|hybrid|ישראל|תל אביב|חיפה|ירושלים|באר שבע)/i;

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " "));
}

function resolveUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

export function extractCareerJobLinks(html: string, baseUrl: string, limit = 20): ExtractedCareerJobLink[] {
  const links: ExtractedCareerJobLink[] = [];
  const seen = new Set<string>();
  const anchors = html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);

  for (const anchor of anchors) {
    const url = resolveUrl(anchor[1], baseUrl);
    if (!url || seen.has(url)) continue;
    const title = stripTags(anchor[2]);
    const context = decodeHtml(`${title} ${url}`);
    if (!title || !targetRolePattern.test(context)) continue;
    seen.add(url);
    links.push({
      title,
      url,
      snippet: title,
      preferredLocationSignal: locationPattern.test(context)
    });
  }

  return links
    .sort((a, b) => Number(b.preferredLocationSignal) - Number(a.preferredLocationSignal))
    .slice(0, limit);
}
