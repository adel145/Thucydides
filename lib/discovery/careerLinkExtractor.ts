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

function titleFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").filter(Boolean).at(-1) ?? parsed.hostname;
    return decodeURIComponent(last)
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return url;
  }
}

function pushLink(links: ExtractedCareerJobLink[], seen: Set<string>, titleValue: string, href: string, baseUrl: string) {
  const url = resolveUrl(href, baseUrl);
  if (!url || seen.has(url)) return;
  const title = stripTags(titleValue) || titleFromUrl(url);
  const context = decodeHtml(`${title} ${url}`);
  if (!title || !targetRolePattern.test(context)) return;
  seen.add(url);
  links.push({
    title,
    url,
    snippet: title,
    preferredLocationSignal: locationPattern.test(context)
  });
}

export function extractCareerJobLinks(content: string, baseUrl: string, limit = 20): ExtractedCareerJobLink[] {
  const links: ExtractedCareerJobLink[] = [];
  const seen = new Set<string>();
  const anchors = content.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);

  for (const anchor of anchors) {
    pushLink(links, seen, anchor[2], anchor[1], baseUrl);
  }

  const markdownLinks = content.matchAll(/\[([^\]]{2,160})\]\((https?:\/\/[^)\s]+)\)/gi);
  for (const link of markdownLinks) {
    pushLink(links, seen, link[1], link[2], baseUrl);
  }

  const plainUrls = content.matchAll(/https?:\/\/[^\s<>)\]]+/gi);
  for (const match of plainUrls) {
    const url = match[0].replace(/[.,;:"']+$/g, "");
    pushLink(links, seen, titleFromUrl(url), url, baseUrl);
  }

  return links
    .sort((a, b) => Number(b.preferredLocationSignal) - Number(a.preferredLocationSignal))
    .slice(0, limit);
}
