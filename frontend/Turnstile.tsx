import { useEffect, useRef, useState } from "react";

type WidgetApi = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
};
declare global { interface Window { turnstile?: WidgetApi } }
let scriptReady: Promise<void> | undefined;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptReady) scriptReady = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      script.remove(); scriptReady = undefined; reject(new Error("challenge timed out"));
    }, 20_000);
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => { clearTimeout(timeout); resolve(); };
    script.onerror = () => { clearTimeout(timeout); script.remove(); scriptReady = undefined; reject(new Error("challenge unavailable")); };
    document.head.append(script);
  });
  return scriptReady;
}

export function Turnstile({ siteKey, locale, onToken, failure }: {
  siteKey: string; locale: string; onToken: (token: string) => void; failure: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true, widget: string | undefined;
    callback.current("");
    setFailed(false);
    void loadScript().then(() => {
      if (!active || !container.current) return;
      if (!window.turnstile) { scriptReady = undefined; throw new Error("challenge unavailable"); }
      widget = window.turnstile.render(container.current, {
        sitekey: siteKey, action: "signup", language: locale === "pt-PT" ? "pt" : "en", size: "flexible",
        callback: (token: string) => { if (active) { setFailed(false); callback.current(token); } },
        "expired-callback": () => callback.current(""),
        "error-callback": () => { if (active) { callback.current(""); setFailed(true); } },
      });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (widget !== undefined) window.turnstile?.remove(widget); };
  }, [siteKey, locale, attempt]);
  return <div><div ref={container} />{failed && <button type="button" className="text-button" onClick={() => setAttempt(value => value + 1)}>{failure}</button>}</div>;
}
