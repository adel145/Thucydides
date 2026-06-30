export type ExtractedCareerJobLink = {
  title: string;
  url: string;
  snippet: string;
  preferredLocationSignal: boolean;
};

const targetRolePattern = /(software|developer|engineer|backend|full\s*stack|fullstack|python|qa|automation|data|machine learning|deep learning|computer vision|research student|student|technical support|noc|implementation|integration)/i;
const locationPattern = /(israel|tel aviv|haifa|jerusalem|beer|beersheba|remote|hybrid|\u05d9\u05e9\u05e8\u05d0\u05dc|\u05ea\u05dc \u05d0\u05d1\u05d9\u05d1|\u05d7\u05d9\u05e4\u05d4|\u05d9\u05e8\u05d5\u05e9\u05dc\u05d9\u05dd|\u05d1\u05d0\u05e8 \u05e9\u05d1\u05e2)/i;
const hashLikePattern = /^[a-f0-9]{8,}$/i;

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

function fallbackUntitledTitle(url: string) {
  return /myworkdayjobs\.com/i.test(url) ? "Untitled job link from Workday" : "Untitled job link from career page";
}

export function isReadableLinkTitle(value: string | null | undefined) {
  const title = stripTags(value ?? "");
  if (!title) return false;
  const compact = title.replace(/\s+/g, "");
  if (hashLikePattern.test(compact)) return false;
  if (/^[A-Z0-9]{8,}$/.test(compact)) return false;
  return /[a-zA-Z\u0590-\u05ff]/.test(title) && title.length >= 3;
}

function titleFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").filter(Boolean).at(-1) ?? parsed.hostname;
    const title = decodeURIComponent(last)
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return isReadableLinkTitle(title) ? title : fallbackUntitledTitle(url);
  } catch {
    return fallbackUntitledTitle(url);
  }
}

function titleFromNearbyText(content: string, index: number) {
  const before = stripTags(content.slice(Math.max(0, index - 160), index))
    .replace(/\[[^\]]*$/g, "")
    .split(/[\n\r.?!|\u2022]/)
    .at(-1)
    ?.trim() ?? "";
  const marker =
    before.match(/(?:^|\s)(open\s+role|role|job|position)\s*:?\s*(.{3,})$/i) ??
    before.match(/(?:^|\s)(careers?(?:\s+listing)?)\s*:?\s*(.{3,})$/i);
  const candidate = marker?.[2] && targetRolePattern.test(marker[2]) ? marker[2] : before;
  if (!targetRolePattern.test(candidate)) return null;
  return candidate
    .replace(/^(see|apply|open\s+role|role|job|position|careers?)\s*:?\s*/i, "")
    .slice(-110)
    .trim() || null;
}

function pushLink(links: ExtractedCareerJobLink[], seen: Set<string>, titleValue: string, href: string, baseUrl: string, contextValue?: string) {
  const url = resolveUrl(href, baseUrl);
  if (!url || seen.has(url)) return;
  const providedTitle = stripTags(titleValue);
  const title = isReadableLinkTitle(providedTitle) ? providedTitle : titleFromUrl(url);
  const context = decodeHtml(`${contextValue ?? ""} ${title} ${url}`);
  const isSpecificJobUrl = /\/job\//i.test(url) || /myworkdayjobs\.com/i.test(url);
  if (!title || (!targetRolePattern.test(context) && !isSpecificJobUrl)) return;
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
    pushLink(links, seen, link[1], link[2], baseUrl, link[1]);
  }

  const plainUrls = content.matchAll(/https?:\/\/[^\s<>)\]]+/gi);
  for (const match of plainUrls) {
    const url = match[0].replace(/[.,;:"']+$/g, "");
    const index = match.index ?? 0;
    const nearbyTitle = titleFromNearbyText(content, index);
    const nearbyContext = content.slice(Math.max(0, index - 160), index + url.length + 60);
    pushLink(links, seen, nearbyTitle ?? titleFromUrl(url), url, baseUrl, nearbyTitle ?? nearbyContext);
  }

  return links
    .sort((a, b) => Number(b.preferredLocationSignal) - Number(a.preferredLocationSignal))
    .slice(0, limit);
}
