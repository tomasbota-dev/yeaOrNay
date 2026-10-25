import { renderToString } from "react-dom/server";
import { PublicSite } from "./PublicSite";
import { publicCopy } from "./public-content";
import { publicOrigin, publicPath, type Language, type PageId } from "../shared/seo";
export { languages, pageIds } from "../shared/seo";

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export function renderPublicPage(template: string, language: Language, page: PageId) {
  const copy = publicCopy[language];
  const title = page === "home" ? copy.homeTitle : copy.guides[page].title;
  const description = page === "home" ? copy.homeDescription : copy.guides[page].description;
  const canonical = publicOrigin + publicPath(language, page);
  const head = `<title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="en" href="${publicOrigin + publicPath("en", page)}" />
    <link rel="alternate" hreflang="pt-PT" href="${publicOrigin + publicPath("pt", page)}" />
    <link rel="alternate" hreflang="x-default" href="${publicOrigin + publicPath("en", page)}" />
    <meta property="og:site_name" content="Yea or Nay" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escape(title)}" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:locale" content="${language === "pt" ? "pt_PT" : "en_US"}" />
    <meta property="og:locale:alternate" content="${language === "pt" ? "en_US" : "pt_PT"}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escape(title)}" />
    <meta name="twitter:description" content="${escape(description)}" />`;
  if (!template.includes("<!--public-head-->") || !template.includes("<!--public-body-->")) throw new Error("Public HTML template markers are missing");
  return template.replace('lang="en-US"', `lang="${language === "pt" ? "pt-PT" : "en-US"}"`)
    .replace("<!--public-head-->", head)
    .replace("<!--public-body-->", () => renderToString(<PublicSite language={language} page={page} />));
}
