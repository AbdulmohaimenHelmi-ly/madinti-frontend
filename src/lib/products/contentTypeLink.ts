export function withProductContentType(
  href: string,
  contentType?: "male" | "female"
): string {
  if (!contentType || !href.startsWith("/")) {
    return href;
  }

  const url = new URL(href, "http://local");
  if (!/\/products(?:\/|$)/.test(url.pathname)) {
    return href;
  }

  url.searchParams.set("content_type", contentType);
  return `${url.pathname}${url.search}${url.hash}`;
}