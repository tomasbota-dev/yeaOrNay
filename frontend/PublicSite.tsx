import { useEffect, useState, type ReactNode } from "react";
import { Landing } from "./Landing";
import { translate } from "./i18n";
import { publicCopy } from "./public-content";
import { pageIds, publicPath, type Language, type PageId } from "../shared/seo";

export function PublicSite({ language, page }: { language: Language; page: PageId }) {
  const copy = publicCopy[language];
  const locale = language === "pt" ? "pt-PT" : "en-US";
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem("yn_locale", locale);
      const theme = localStorage.getItem("yn_theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      setDark(theme === "dark");
      document.documentElement.dataset.theme = theme;
    } catch { /* Public content works without browser storage. */ }
  }, [locale]);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("yn_theme", next ? "dark" : "light"); } catch { /* Optional preference. */ }
  }
  const appPath = (path: string) => `${path}?lang=${locale}`;
  const link = (path: string, label: ReactNode, className = "") => <a href={appPath(path)} className={className}>{label}</a>;
  const guide = page === "home" ? null : copy.guides[page];
  return <>
    <a className="skip" href="#main-content">{copy.skip}</a>
    <header className="site-header public-header">
      <a className="brand" href={publicPath(language)} aria-label={`Yea or Nay · ${copy.home}`}>yea<span>↗</span><br />or nay<span>↘</span></a>
      <div className="header-actions">
        <a className="preference" href={publicPath(language === "en" ? "pt" : "en", page)} hrefLang={language === "en" ? "pt-PT" : "en"} aria-label={copy.language}>{language === "en" ? "PT" : "EN"}</a>
        <button className="preference" onClick={toggleTheme} aria-label={copy.theme} aria-pressed={dark}><span aria-hidden="true">{dark ? "☀" : "☾"}</span></button>
        <a className="public-dashboard" href={appPath("/dashboard")}>{copy.dashboard}</a>
        <div className="header-auth">{link("/login", copy.signIn, "header-login")}{link("/signup", <>{copy.start} ↗</>, "button header-signup")}</div>
      </div>
    </header>
    <main id="main-content">
      {page === "home" ? <>
        <div className="public-category"><p>{copy.category}</p></div>
        <Landing t={text => translate(locale, text)} link={link} />
      </> : guide && <article className="public-guide">
        <div className="public-breadcrumb"><a href={publicPath(language)}>{copy.home}</a><span aria-hidden="true"> / </span><span>{page === "how-it-works" ? copy.rulesLink : copy.category}</span></div>
        <p className="eyebrow">Yea or Nay · {copy.category}</p>
        <h1>{guide.heading}</h1>
        <p className="public-intro">{guide.intro}</p>
        <aside className="public-example" aria-label={copy.exampleLabel}>
          <p className="eyebrow">{copy.exampleLabel}</p>
          <h2>{guide.example.heading}</h2>
          <ul>{guide.example.ideas.map(idea => <li key={idea}>{idea}</li>)}</ul>
          <p>{guide.example.note}</p>
        </aside>
        <ol className="public-guide-steps">{guide.steps.map(step => <li key={step.heading}><h2>{step.heading}</h2><p>{step.text}</p></li>)}</ol>
      </article>}
      <section className="public-discovery" aria-labelledby="public-examples-title">
        <p className="eyebrow">{copy.category}</p>
        <h2 id="public-examples-title">{page === "home" ? copy.examples : copy.back}</h2>
        <p className="public-intro">{copy.examplesIntro}</p>
        <div className="public-guide-grid">{pageIds.filter(id => id !== "home" && id !== page).map(id => {
          const item = copy.guides[id as Exclude<PageId, "home">];
          return <a className="public-guide-card" key={id} href={publicPath(language, id)}><h3>{item.heading} <span aria-hidden="true">↗</span></h3><p>{item.description}</p></a>;
        })}</div>
      </section>
      <section className="public-cta"><h2>{copy.ctaHeading}</h2><p>{copy.accountNote}</p>{link("/signup", <>{copy.start} ↗</>, "button")}</section>
    </main>
    <footer><a className="wordmark" href={publicPath(language)}>Yea or Nay ↗</a><div><a href={publicPath(language, "how-it-works")}>{copy.rulesLink}</a><a href={appPath("/privacy")}>{copy.privacy}</a><a href={appPath("/terms")}>{copy.terms}</a></div></footer>
  </>;
}
