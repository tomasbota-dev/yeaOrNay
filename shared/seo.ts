// One production origin for canonical URLs, social metadata and the sitemap.
// Change this when moving to a custom domain, together with permanent redirects.
export const publicOrigin = "https://yea-or-nay.it-tomasbota.workers.dev";
export const languages = ["en", "pt"] as const;
export type Language = (typeof languages)[number];
export const pageIds = ["home", "dinner", "movie-night", "weekend", "how-it-works"] as const;
export type PageId = (typeof pageIds)[number];
export function publicPath(language: Language, page: PageId = "home") {
  return `/${language}/${page === "home" ? "" : `${page}/`}`;
}
export function publicRoute(path: string): { language: Language; page: PageId } | null {
  for (const language of languages)
    for (const page of pageIds)
      if (path === publicPath(language, page)) return { language, page };
  return null;
}
export const publicPaths = languages.flatMap(language => pageIds.map(page => publicPath(language, page)));
