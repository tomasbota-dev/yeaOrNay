import { useEffect, useRef, useState, type ReactNode } from "react";
type T = (english: string) => string;
type Link = (path: string, label: ReactNode, className?: string) => ReactNode;
export function Landing({ t, link }: { t: T; link: Link }) {
  const sceneRef = useRef<HTMLElement>(null),
    wrapRef = useRef<HTMLDivElement>(null),
    boardRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState("idea");
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (!wrapRef.current || !boardRef.current) return;
      const progress = media.matches
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              (innerHeight * 0.35 -
                wrapRef.current.getBoundingClientRect().top) /
                (wrapRef.current.offsetHeight * 0.75),
            ),
          );
      setStage(
        progress < 0.32 ? "idea" : progress < 0.67 ? "vote" : "decision",
      );
      boardRef.current.style.transform = media.matches
        ? "none"
        : `translateY(${-progress * 32}px) rotate(${-7 + progress * 7}deg) scale(${1 + progress * 0.17})`;
    };
    update();
    addEventListener("scroll", update, { passive: true });
    media.addEventListener("change", update);
    return () => {
      removeEventListener("scroll", update);
      media.removeEventListener("change", update);
    };
  }, []);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t("For the group chat that never decides.")}</p>
        <div className="hero-top">
          <h1>
            {t("Good people.")}
            <br />
            <i>{t("One good plan.")}</i>
          </h1>
          <div className="hero-side">
            <p>
              {t(
                "Bring your group’s ideas together, vote on your favourites, and make a plan.",
              )}
            </p>
            {link(
              "/signup",
              <>
                {t("Make a plan")} <span>↗</span>
              </>,
              "button",
            )}
            <button
              className="walkthrough-link"
              onClick={() =>
                sceneRef.current?.scrollIntoView({
                  behavior: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? "instant"
                    : "smooth",
                })
              }
            >
              {t("See how it works")} ↗
            </button>
          </div>
        </div>
        <div className="hero-bottom">
          <span>{t("IDEAS → VOTES → ACTUAL PLANS")}</span>
          <span>{t("Scroll. See how a plan comes together.")} ↓</span>
        </div>
      </section>
      <div className="scene-wrap" ref={wrapRef}>
        <section
          className="scene"
          ref={sceneRef}
          data-stage={stage}
          aria-label={t("A group turning ideas into a plan")}
        >
          <span className="scene-label">
            {t(
              stage === "idea"
                ? "01 / SOFIA ADDS AN IDEA"
                : stage === "vote"
                  ? "02 / EVERYONE HAS A SAY"
                  : "03 / THE GROUP HAS DECIDED",
            )}
          </span>
          <div className="scene-progress">
            {[
              ["idea", "01 Add an idea"],
              ["vote", "02 Vote together"],
              ["decision", "03 Make the plan"],
            ].map(([value, label]) => (
              <span key={value} data-active={value === stage}>
                {t(label)}
              </span>
            ))}
          </div>
          <span className="orbit" aria-hidden="true">
            ↗
          </span>
          <div className="board" ref={boardRef}>
            <article className="ticket" data-stage="idea">
              <small>{t("01 / SOFIA ADDS AN IDEA")}</small>
              <h3>
                {t("Dumplings?")}
                <br />
                {t("Absolutely dumplings.")}
              </h3>
              <div className="ticket-bottom">
                <span className="stamp">
                  ↗ {t("YEA")} · {stage === "idea" ? "0" : "6"}
                </span>
                <span>
                  ↘ {t("NAY")} · {stage === "idea" ? "0" : "1"}
                </span>
              </div>
            </article>
            <article className="ticket" data-stage="vote">
              <small>{t("02 / THE GROUP VOTES")}</small>
              <h3>{t("Film under the stars.")}</h3>
              <div className="ticket-bottom">
                <span className="stamp">↗ {t("YEA")} · 4</span>
                <span>↘ {t("NAY")} · 2</span>
              </div>
            </article>
            <article className="ticket" data-stage="decision">
              <small>{t("03 / THE GROUP HAS DECIDED")}</small>
              <h3>{t("Meet you at 8.")} ↗</h3>
            </article>
          </div>
          <span className="scene-caption">
            {t("Turn all those “maybe”s into a plan.")}
          </span>
        </section>
      </div>
      <section className="steps">
        <p className="eyebrow">{t("Less organising. More living.")}</p>
        <h2>
          {t("A room for your ideas.")}
          <br />
          {t("A reason to get out.")}
        </h2>
        <div className="step-grid">
          <article>
            <b>{t("01 / GET TOGETHER")}</b>
            <h3>{t("Open the question.")}</h3>
            <p>
              {t(
                "Friday night? Your next trip? Start a room, set a deadline, and send the link.",
              )}
            </p>
          </article>
          <article>
            <b>{t("02 / PUT IT OUT THERE")}</b>
            <h3>{t("Every idea gets a say.")}</h3>
            <p>
              {t(
                "Add a suggestion. Give a yea to what you love and a nay to what you don’t.",
              )}
            </p>
          </article>
          <article>
            <b>{t("03 / MAKE IT HAPPEN")}</b>
            <h3>{t("There’s your plan.")}</h3>
            <p>
              {t(
                "When time is up, see what the group picked. The next part is yours.",
              )}
            </p>
          </article>
        </div>
        <div className="steps-action">
          {link("/signup", <>{t("Make a plan together")} ↗</>, "button")}
        </div>
      </section>
    </>
  );
}
