/** Meta tags whose image link must be a full URL for link previews to load it. */
const IMAGE_TAGS = /(<meta\s+(?:property="og:image"|name="twitter:image")\s+content=")\.\/([^"]+)(")/g;

/**
 * Rewrites relative share image links to full URLs and adds og:url, once the site's address is known.
 * Without an address the page is left as it is, with relative links.
 */
export function makeShareLinksAbsolute(html: string, siteUrl: string): string {
  const base = siteUrl.trim();
  if (base === '') return html;
  const root = base.endsWith('/') ? base : `${base}/`;
  const withImages = html.replace(IMAGE_TAGS, (_match, head: string, path: string, tail: string) => `${head}${root}${path}${tail}`);
  if (withImages.includes('property="og:url"')) return withImages;
  return withImages.replace('<meta property="og:type"', `<meta property="og:url" content="${root}" />\n    <meta property="og:type"`);
}
