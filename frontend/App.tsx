import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useI18n, translateError } from "./i18n";
import { LegalPage } from "./legal";
import { Turnstile } from "./Turnstile";

const durationOptions = [
  ["15", "15 minutes · quick pick"],
  ["30", "30 minutes · just right"],
  ["60", "1 hour · take your time"],
  ["180", "3 hours"],
  ["1440", "24 hours · decide tomorrow"],
  ["custom", "Custom date & time"],
] as const;

function LogoLoader({ label }: { label: string }) {
  return <div className="logo-loader" role="status" aria-label={label}>
    <div className="loader-mark" aria-hidden="true">
      <span>yea↗<br />or nay↘</span>
      <span className="loader-fill">yea↗<br />or nay↘</span>
    </div>
    <span className="sr-only">{label}</span>
  </div>;
}
function PreferenceIcon({ kind }: { kind: "language" | "sun" | "moon" }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "language" ? <><path d="M3 5h12M9 3v2M5 5c1 6 4 9 9 11M13 5c-1 5-4 9-10 12M14 21l4-10 4 10M16 17h4" /></> : kind === "sun" ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />}
  </svg>;
}

type T = (en: string, params?: Record<string, string | number>) => string;
type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};
type RoomSummary = {
  id: string;
  code: string;
  name: string;
  icon: string;
  status: string;
  ends_at: number;
  member_count: number;
  idea_count: number;
};
type Idea = {
  id: string;
  title: string;
  details: string;
  author_id: string;
  author_name: string;
  score: number;
  my_vote: number;
  winner: boolean;
};
type Room = RoomSummary & {
  host_name: string;
  host_id: string;
  is_host: boolean;
  created_at: number;
  members: User[];
  ideas: Idea[];
  comments: {
    id: string;
    idea_id: string;
    body: string;
    author_name: string;
  }[];
  winner_ids: string[];
};
type Preview = {
  code: string;
  name: string;
  icon: string;
  status: string;
  ends_at: number;
};
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter = 0,
  ) {
    super(message);
  }
}
async function api<T = Record<string, unknown>>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers:
        data instanceof File
          ? { "content-type": data.type }
          : data === undefined
            ? {}
            : { "content-type": "application/json" },
      body:
        data instanceof File
          ? data
          : data === undefined
            ? undefined
            : JSON.stringify(data),
    });
  } catch {
    throw new ApiError(
      "Could not connect. Check your connection and try again.",
      0,
    );
  }
  const value = await response
    .json()
    .catch(() => ({ error: "Something went wrong. Please try again." }));
  if (!response.ok)
    throw new ApiError(
      value.error || "Something went wrong. Please try again.",
      response.status,
      Math.max(0, Number(response.headers.get("retry-after")) * 1000 || Date.parse(response.headers.get("retry-after") || "") - Date.now() || 0),
    );
  return value as T;
}
function Avatar({ user }: { user: Pick<User, "name" | "avatarUrl"> }) {
  return user.avatarUrl ? (
    <img className="avatar" src={user.avatarUrl} alt="" />
  ) : (
    <span className="avatar" aria-hidden="true">
      {user.name.slice(0, 2).toUpperCase()}
    </span>
  );
}
function Modal({
  title,
  closeLabel,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  closeLabel: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    ref.current
      ?.querySelector<HTMLInputElement>(
        "input:not([type=file]):not([type=hidden])",
      )
      ?.focus();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={busy}
            aria-label={closeLabel}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
function FieldError({ message, id }: { message?: string; id?: string }) {
  return message ? (
    <p className="field-error" id={id} role="alert">
      {message}
    </p>
  ) : null;
}
function ImagePicker({
  t,
  onChange,
}: {
  t: T;
  onChange: (file: File | null) => void;
}) {
  const [error, setError] = useState(""),
    [preview, setPreview] = useState(""),
    [filename, setFilename] = useState("");
  return (
    <div className="field">
      <label htmlFor="image-upload">{t("Room image (optional)")}</label>
      <div className="image-picker">
        <input
          id="image-upload"
          className="image-picker-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-invalid={!!error}
          aria-describedby={error ? "image-error" : "image-filename"}
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setError("");
            setPreview("");
            setFilename("");
            onChange(null);
            if (!file) return;
            if (
              !["image/jpeg", "image/png", "image/webp"].includes(file.type)
            ) {
              setError(t("Use a JPG, PNG, or WebP image."));
              e.target.value = "";
              return;
            }
            if (file.size > 262144) {
              setError(t("Choose an image smaller than 256 KB."));
              e.target.value = "";
              return;
            }
            setFilename(file.name);
            const reader = new FileReader();
            reader.onload = () => setPreview(String(reader.result));
            reader.readAsDataURL(file);
            onChange(file);
          }}
        />
        <span className="image-picker-button" aria-hidden="true">
          {t("Choose an image")} ↗
        </span>
        <span id="image-filename">{filename || t("PNG, JPEG or WebP")}</span>
      </div>
      <small>{t("JPG, PNG or WebP, up to 256 KB.")}</small>
      {error && (
        <p className="field-error" id="image-error" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <img
          className="image-preview"
          src={preview}
          alt={t("Room image preview")}
        />
      )}
    </div>
  );
}

export default function App() {
  const { t, locale, setLocale } = useI18n();
  const [route, setRoute] = useState(
    location.pathname.replace(/\/+$/, "") || "/",
  );
  const [user, setUser] = useState<User | null>(null),
    [boot, setBoot] = useState(true),
    [bootError, setBootError] = useState("");
  const [rooms, setRooms] = useState<RoomSummary[]>([]),
    [roomsLoaded, setRoomsLoaded] = useState(false);
  const [room, setRoom] = useState<Room | null>(null),
    [preview, setPreview] = useState<Preview | null>(null),
    [loading, setLoading] = useState(false);
  const [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false),
    [joinOpen, setJoinOpen] = useState(false),
    [feedback, setFeedback] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    text: string;
    label: string;
    action: () => Promise<void>;
    danger?: boolean;
  } | null>(null);
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("yn_theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  );
  const [now, setNow] = useState(Date.now());
  const [ideaDrafts, setIdeaDrafts] = useState<
    Record<string, { title: string; details: string }>
  >({});
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({}),
    [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const requestVersion = useRef(0),
    mutationVersion = useRef(0),
    busyRef = useRef(false);
  const code = route.match(/^\/room\/([^/]+)$/)?.[1]?.toUpperCase() || "";
  const legalKind = /^\/(privacy|terms)(\.html)?$/.exec(route)?.[1] as
    "privacy" | "terms" | undefined;
  function navigate(path: string) {
    history.pushState({}, "", path);
    setRoute(location.pathname.replace(/\/+$/, "") || "/");
    setError("");
    setMenu(false);
    setJoinOpen(false);
    setFeedback(false);
    setConfirm(null);
    setRoom(null);
    setPreview(null);
    requestVersion.current++;
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const link = (path: string, label: ReactNode, className = "") => (
    <a
      href={path}
      className={className}
      onClick={(e) => {
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          navigate(path);
        }
      }}
    >
      {label}
    </a>
  );
  const notify = (message: string) => setToast(message);
  async function perform(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    mutationVersion.current++;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      const err = e as ApiError;
      setError(translateError(err, locale));
      if (err.status === 401 && user) {
        setUser(null);
        setRoom(null);
        setRooms([]);
        setRoomsLoaded(false);
        setIdeaDrafts({});
        setCommentDrafts({});
        navigate("/login?next=" + encodeURIComponent(route));
        setError(t("Please log in to continue."));
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function loadSession() {
    setBoot(true);
    setBootError("");
    try {
      const result = await api<{ user: User }>("/api/me");
      setUser(result.user);
    } catch (e) {
      if ((e as ApiError).status !== 401)
        setBootError(translateError(e, locale));
    } finally {
      setBoot(false);
    }
  }
  useEffect(() => {
    void loadSession();
    const pop = () => {
      requestVersion.current++;
      setRoute(location.pathname.replace(/\/+$/, "") || "/");
      setRoom(null);
      setPreview(null);
      setError("");
      setMenu(false);
    };
    addEventListener("popstate", pop);
    return () => removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("yn_theme", theme);
  }, [theme]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".account-menu")) setMenu(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    document
      .querySelector("meta[name=description]")
      ?.setAttribute(
        "content",
        t(
          "Bring your group’s ideas together, vote on your favourites, and make a plan.",
        ),
      );
    document.title = legalKind
      ? t(
          legalKind === "terms"
            ? "Terms of service — Yea or Nay"
            : "Privacy notice — Yea or Nay",
        )
      : code && room
        ? room.name + " — Yea or Nay"
        : t("Yea or Nay — Good people. One good plan.");
  }, [route, locale, room?.name]);
  useEffect(() => {
    if (!boot && user && (route === "/login" || route === "/signup")) {
      const next = new URLSearchParams(location.search).get("next");
      navigate(next?.startsWith("/room/") ? next : "/");
    }
  }, [boot, user, route]);
  useEffect(() => {
    if (
      !boot &&
      !user &&
      !bootError &&
      (route === "/create" || route === "/profile" || route === "/dashboard")
    )
      navigate("/login?next=" + encodeURIComponent(route));
  }, [boot, user, route, bootError]);
  useEffect(() => {
    if (
      !user ||
      boot ||
      legalKind ||
      !(route === "/" || route === "/dashboard" || route === "/create" || code)
    )
      return;
    const version = ++requestVersion.current;
    let alive = true,
      inFlight = false;
    let socket: WebSocket | undefined, reconnect: ReturnType<typeof setTimeout> | undefined,
      debounce: ReturnType<typeof setTimeout> | undefined, ending: ReturnType<typeof setTimeout> | undefined;
    let blocked = false, failures = 0, retryAt = 0, refreshPending = false, lastSnapshot = 0;
    const stopSocket = () => { clearTimeout(reconnect); reconnect = undefined; if (socket) { socket.onclose = null; socket.close(); socket = undefined; } };
    const load = async (initial = false) => {
      if (!alive) return;
      if (!initial && document.hidden) { refreshPending = true; return; }
      if (Date.now() < retryAt) {
        refreshPending = true;
        clearTimeout(debounce);
        debounce = setTimeout(() => void load(), Math.max(500, retryAt - Date.now()));
        return;
      }
      if (inFlight) { refreshPending = true; return; }
      if (!initial && busyRef.current) {
        refreshPending = true;
        clearTimeout(debounce);
        debounce = setTimeout(() => void load(), 500);
        return;
      }
      refreshPending = false;
      inFlight = true;
      const mutation = mutationVersion.current;
      if (initial) setLoading(true);
      try {
        if (code) {
          try {
            const result = await api<Room>(
              "/api/rooms/" + encodeURIComponent(code),
            );
            if (
              alive &&
              version === requestVersion.current &&
              mutation === mutationVersion.current
            ) {
              setRoom(result);
              setPreview(null);
              lastSnapshot = Date.now();
              blocked = false;
              clearTimeout(ending);
              if (result.status === "open" && result.ends_at > Date.now())
                ending = setTimeout(() => void load(), Math.min(2_147_000_000, result.ends_at - Date.now() + 100));
              connect();
            } else if (alive && version === requestVersion.current) refreshPending = true;
          } catch (e) {
            if ((e as ApiError).status === 403) {
              blocked = true;
              stopSocket();
              const result = await api<{ room: Preview }>(
                "/api/rooms/" + encodeURIComponent(code) + "/preview",
              );
              if (
                alive &&
                version === requestVersion.current &&
                mutation === mutationVersion.current
              ) {
                setPreview(result.room);
                setRoom(null);
              } else if (alive && version === requestVersion.current) refreshPending = true;
            } else throw e;
          }
        } else {
          const result = await api<{ rooms: RoomSummary[] }>("/api/rooms");
          if (
            alive &&
            version === requestVersion.current &&
            mutation === mutationVersion.current
          ) {
            setRooms(result.rooms);
            setRoomsLoaded(true);
          } else if (alive && version === requestVersion.current) refreshPending = true;
        }
      } catch (e) {
        const status = (e as ApiError).status;
        if ([401, 403, 404].includes(status)) { blocked = true; stopSocket(); }
        if (status === 429 || status === 0 || status >= 500) {
          failures = Math.min(failures + 1, 6);
          retryAt = Date.now() + Math.max((e as ApiError).retryAfter || 0, Math.min(300_000, 30_000 * 2 ** (failures - 1)));
        }
        if (
          alive &&
          version === requestVersion.current &&
          mutation === mutationVersion.current
        ) {
          setError(translateError(e, locale));
          if ((e as ApiError).status === 401) {
            setUser(null);
            setRooms([]);
            setRoomsLoaded(false);
            setIdeaDrafts({});
            setCommentDrafts({});
            navigate("/login?next=" + encodeURIComponent(route));
            setError(t("Please log in to continue."));
          }
        }
      } finally {
        inFlight = false;
        if (alive && version === requestVersion.current) setLoading(false);
        if (refreshPending && alive) {
          refreshPending = false;
          clearTimeout(debounce);
          debounce = setTimeout(() => void load(), 500);
        }
      }
    };
    const connect = () => {
      if (!alive || !code || blocked || document.hidden || socket || reconnect || Date.now() < retryAt) return;
      const url = new URL("/api/rooms/" + encodeURIComponent(code) + "/events", location.href);
      url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      socket.onopen = () => { failures = 0; void load(); };
      socket.onmessage = (event) => {
        try {
          if (JSON.parse(event.data).type !== "room-changed") return;
          clearTimeout(debounce);
          debounce = setTimeout(() => void load(), 200);
        } catch { /* Ignore unknown messages. */ }
      };
      socket.onclose = (event) => {
        socket = undefined;
        if (!alive || document.hidden) return;
        if ([1008, 4001, 4003, 4004, 4401, 4403, 4404].includes(event.code)) {
          blocked = true;
          void load();
          return;
        }
        failures = Math.min(failures + 1, 8);
        const delay = Math.max(retryAt - Date.now(), Math.min(60_000, 1000 * 2 ** failures) * (0.75 + Math.random() * 0.5));
        reconnect = setTimeout(() => { reconnect = undefined; void load(); connect(); }, delay);
      };
    };
    void load(true);
    const timer = setInterval(() => {
      // Occasional reconciliation also recovers a notification lost after a committed write.
      if (!blocked && (!code || socket?.readyState !== WebSocket.OPEN || Date.now() - lastSnapshot >= 120_000)) void load();
    }, code ? 30_000 : 60_000);
    const visible = () => {
      if (document.hidden) stopSocket();
      else { void load(); if (!blocked) connect(); }
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false;
      clearInterval(timer);
      clearTimeout(debounce);
      clearTimeout(ending);
      stopSocket();
      document.removeEventListener("visibilitychange", visible);
    };
  }, [user?.id, boot, route, locale]);
  async function refreshRoom() {
    const result = await api<Room>("/api/rooms/" + encodeURIComponent(code));
    if (
      location.pathname.replace(/\/+$/, "").toUpperCase() ===
      "/ROOM/" + code
    ) {
      setRoom(result);
      setPreview(null);
    }
  }
  const pendingNext = code
    ? "/room/" + code
    : new URLSearchParams(location.search).get("next");
  const authPath = (mode: string) =>
    "/" +
    mode +
    (pendingNext ? "?next=" + encodeURIComponent(pendingNext) : "");
  const date = (stamp: number) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(stamp);
  const ask = (
    title: string,
    text: string,
    label: string,
    action: () => Promise<void>,
    danger = false,
  ) => {
    setError("");
    setConfirm({ title, text, label, action, danger });
  };
  function shell() {
    return (
      <>
        <header className="site-header">
          <a
            className="brand"
            href="/"
            aria-label={t("Yea or Nay home")}
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            yea<span>↗</span>
            <br />
            or nay<span>↘</span>
          </a>
          <div className="header-actions">
            <button
              className="preference"
              onClick={() => setLocale(locale === "pt-PT" ? "en-US" : "pt-PT")}
              aria-label={t("Change language")}
            >
              <PreferenceIcon kind="language" /><span>{locale === "pt-PT" ? "PT" : "EN"}</span>
            </button>
            <button
              className="preference"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={t(
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode",
              )}
            >
              <PreferenceIcon kind={theme === "dark" ? "sun" : "moon"} />
            </button>
            {user ? (
              <div className="account-menu">
                <button
                  className="user-button"
                  aria-expanded={menu}
                  onClick={() => setMenu(!menu)}
                >
                  <Avatar user={user} />
                  <span>{user.name}</span>
                  <span aria-hidden="true">⌄</span>
                </button>
                {menu && (
                  <div className="account-dropdown">
                    {link("/", t("Your rooms"))}
                    <button onClick={() => {
                      setError("");
                      setFeedback(true);
                      setMenu(false);
                    }}>{t("Feedback")}</button>
                    {link("/profile", t("Profile"))}
                    <button
                      onClick={() =>
                        void perform(async () => {
                          await api("/api/auth/logout", "POST");
                          setUser(null);
                          setRooms([]);
                          setRoomsLoaded(false);
                          setIdeaDrafts({});
                          setCommentDrafts({});
                          navigate("/");
                        })
                      }
                    >
                      {t("Log out")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="header-auth">
                {link(authPath("login"), t("Sign in"), "header-login")}
                {link(
                  authPath("signup"),
                  <>
                    {t("Get together")} <span>↗</span>
                  </>,
                  "button header-signup",
                )}
              </div>
            )}
          </div>
        </header>
      </>
    );
  }
  let content: ReactNode;
  if (boot)
    content = (
      <LogoLoader label={t("Getting things ready…")} />
    );
  else if (bootError)
    content = (
      <section className="page empty-state">
        <h1>{t("Let’s try that again.")}</h1>
        <p role="alert">{bootError}</p>
        <button className="button" onClick={() => void loadSession()}>
          {t("Try again")} ↗
        </button>
      </section>
    );
  else if (legalKind)
    content = <LegalPage kind={legalKind} t={t} locale={locale} />;
  else if (!user && (route === "/login" || route === "/signup"))
    content = (
      <AuthPage
        locale={locale}
        signup={route === "/signup"}
        t={t}
        busy={busy}
        link={link}
        next={new URLSearchParams(location.search).get("next")}
        onSubmit={(data) =>
          perform(async () => {
            const result = await api<{ user: User }>(
              "/api/auth/" + (route === "/signup" ? "signup" : "login"),
              "POST",
              data,
            );
            setUser(result.user);
            setIdeaDrafts({});
            setCommentDrafts({});
            const next = new URLSearchParams(location.search).get("next");
            navigate(
              next?.startsWith("/room/") ||
                next === "/create" ||
                next === "/profile"
                ? next
                : "/",
            );
          })
        }
      />
    );
  else if (!user && code)
    content = (
      <section className="page invitation">
        <p className="eyebrow">{t("There’s room for you.")}</p>
        <h1>{t("Good plans start with good company.")}</h1>
        <p className="muted">
          {t("Sign in or create an account to join room {code}.", { code })}
        </p>
        <div className="actions">
          {link(authPath("login"), t("Sign in to join"), "button")}
          {link(authPath("signup"), t("Create an account"), "button secondary")}
        </div>
      </section>
    );
  else if (!user && route === "/") content = <Landing t={t} link={link} />;
  else if (user && route === "/profile")
    content = (
      <Profile
        user={user}
        t={t}
        busy={busy}
        link={link}
        save={(data) =>
          perform(async () => {
            const result = await api<{ user: User }>(
              "/api/profile",
              "PUT",
              data,
            );
            setUser(result.user);
            notify(t("Profile updated."));
          })
        }
        photo={(file) =>
          perform(async () => {
            const result = await api<{ avatarUrl: string | null }>(
              "/api/profile/photo",
              file ? "POST" : "DELETE",
              file || undefined,
            );
            setUser({ ...user, avatarUrl: result.avatarUrl });
            notify(t("Profile photo updated."));
          })
        }
        remove={(password) =>
          ask(
            t("Delete your account?"),
            t(
              "This permanently deletes your account and personal data. This cannot be undone.",
            ),
            t("Delete account"),
            async () => {
              await api("/api/account", "DELETE", { password });
              setUser(null);
              setRooms([]);
              setIdeaDrafts({});
              setCommentDrafts({});
              navigate("/");
              notify(t("Your account has been deleted."));
            },
            true,
          )
        }
      />
    );
  else if (
    user &&
    (route === "/" || route === "/dashboard" || route === "/create")
  )
    content = (
      <div className="page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">{t("Your corner of the group chat")}</p>
            <h1>
              {t("Hey, {name}.", { name: user.name })}
              <br />
              {t("What’s the plan?")}
            </h1>
            <p className="muted">
              {t("A few good ideas. Your favourite people. Let’s decide.")}
            </p>
          </div>
          <div className="actions">
            <button
              className="button secondary"
              onClick={() => {
                setError("");
                setJoinOpen(true);
              }}
            >
              {t("Join with a code")} ↗
            </button>
            {link("/create", <>{t("Create a room")} ＋</>, "button")}
          </div>
        </div>
        {loading && !roomsLoaded ? (
          <LogoLoader label={t("Loading your rooms…")} />
        ) : roomsLoaded && !rooms.length ? (
          <section className="empty-state">
            <p className="eyebrow">{t("Your first good plan")}</p>
            <h2>{t("Every plan starts with a question.")}</h2>
            <p>{t("Create a room or join your people with an invite code.")}</p>
            {link("/create", t("Create your first room"), "button")}
          </section>
        ) : (
          <>
            {(["open", "closed"] as const).map((status) => {
              const items = rooms.filter((r) => r.status === status);
              return (
                  <section className="decision-group" key={status} aria-label={t(status === "open" ? "Ongoing decisions" : "Concluded decisions")}>
                    <div className="section-label">
                      <span>
                        {t(status === "open" ? "Ongoing decisions" : "Concluded decisions")}
                      </span>
                      <span>
                        {t(
                          items.length === 1 ? "{count} room" : "{count} rooms",
                          { count: items.length },
                        )}
                      </span>
                    </div>
                    {!items.length && <p className="decision-empty muted">{t(status === "open" ? "No ongoing decisions. Start a room and bring your people together." : "No concluded decisions yet. Finished rooms will appear here.")}</p>}
                    <div className="rooms">
                      {items.map((r) =>
                        link(
                          "/room/" + r.code,
                          <>
                            <span className="status">
                              {t(
                                r.status === "open" ? "Voting open" : "Decided",
                              )}
                              {r.status === "open" && (
                                <span> · {date(r.ends_at)}</span>
                              )}
                            </span>
                            {r.icon?.startsWith("/room-icons/") && (
                              <img className="room-image" src={r.icon} alt="" />
                            )}
                            <h2>{r.name}</h2>
                            <div className="meta">
                              <span>
                                {
                                  <>
                                    {t(
                                      r.member_count === 1
                                        ? "{count} person"
                                        : "{count} people",
                                      { count: r.member_count },
                                    )}{" "}
                                    /{" "}
                                    {t(
                                      r.idea_count === 1
                                        ? "{count} idea"
                                        : "{count} ideas",
                                      { count: r.idea_count },
                                    )}
                                  </>
                                }
                              </span>
                              <span>
                                {t(r.status === "open" ? "OPEN" : "RESULT")} ↗
                              </span>
                            </div>
                          </>,
                          "room-card",
                        ),
                      )}
                    </div>
                  </section>
              );
            })}
          </>
        )}
        <div className="room-note">
          <b>{t("Plans start with a question.")}</b>
          <p className="muted">
            {t(
              "You don’t need the perfect idea. Open a room and let everyone bring something to the table.",
            )}
          </p>
        </div>
      </div>
    );
  else if (user && code) {
    const open = room?.status === "open" && room.ends_at > now;
    const draft = ideaDrafts[code] || { title: "", details: "" };
    const winners =
      room?.ideas.filter((i) => room.winner_ids.includes(i.id)) || [];
    content =
      loading && !room && !preview ? (
        <LogoLoader label={t("Opening your room…")} />
      ) : preview ? (
        <section className="page invitation">
          <p className="eyebrow">{t("You’ve got an invite.")}</p>
          <h1>{preview.name}</h1>
          <p className="muted">
            {t("Join the room to add ideas and have your say.")}
          </p>
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              void perform(async () => {
                await api("/api/rooms/join", "POST", { code });
                await refreshRoom();
                notify(t("You’re in. Bring an idea."));
              })
            }
          >
            {t("Join this room")} ↗
          </button>
        </section>
      ) : room ? (
        <div className="page">
          {link("/", <>← {t("All your rooms")}</>, "eyebrow")}
          <div className="page-heading room-heading">
            <div>
              <p className="eyebrow">
                {t(
                  room.members.length === 1
                    ? "ROOM {code} / {count} MEMBER"
                    : "ROOM {code} / {count} MEMBERS",
                  { code: room.code, count: room.members.length },
                )}
              </p>
              {room.icon?.startsWith("/room-icons/") && (
                <img
                  className="room-cover"
                  src={room.icon}
                  alt={t("Room image")}
                />
              )}
              <h1>{room.name}</h1>
              <p className="muted">
                {t("Created by {name}", { name: room.host_name })} ·{" "}
                {date(room.created_at)}
              </p>
            </div>
            <span className={"deadline " + (!open ? "closed" : "")}>
              {open ? (
                <>
                  {t("VOTING OPEN")}
                  <strong>
                    {t("{time} left", {
                      time: countdown(Math.max(0, room.ends_at - now)),
                    })}
                  </strong>
                  <span>{t("Ends {date}", { date: date(room.ends_at) })}</span>
                </>
              ) : (
                t("VOTING CLOSED")
              )}
            </span>
          </div>
          <div className="room-layout">
            <section>
              {!open && (
                <div className="result">
                  <p className="eyebrow">
                    {t(
                      winners.length > 1
                        ? "It’s a tie!"
                        : winners.length
                          ? "The group has decided ↗"
                          : "The room is closed.",
                    )}
                  </p>
                  {winners.map((i) => (
                    <h2 key={i.id}>{i.title}</h2>
                  ))}
                  <p>
                    {t(
                      winners.length
                        ? "Good call. Now send the “see you there” message."
                        : "Thanks for deciding together.",
                    )}
                  </p>
                </div>
              )}
              {open && (
                <form
                  className="composer"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.title.trim()) {
                      setError(t("Give your idea a title."));
                      document
                        .querySelector<HTMLInputElement>("#idea-title")
                        ?.focus();
                      return;
                    }
                    void perform(async () => {
                      await api("/api/rooms/" + code + "/ideas", "POST", draft);
                      setIdeaDrafts((d) => ({
                        ...d,
                        [code]: { title: "", details: "" },
                      }));
                      await refreshRoom();
                      notify(t("Your idea is on the table."));
                    });
                  }}
                >
                  <label htmlFor="idea-title">
                    {t("Bring an idea to the table.")}
                  </label>
                  <input
                    id="idea-title"
                    disabled={busy}
                    value={draft.title}
                    onChange={(e) =>
                      setIdeaDrafts((d) => ({
                        ...d,
                        [code]: { ...draft, title: e.target.value },
                      }))
                    }
                    placeholder={t("What would you love to do?")}
                    maxLength={100}
                    required
                  />
                  <label className="sr-only" htmlFor="idea-details">
                    {t("Idea details")}
                  </label>
                  <textarea
                    id="idea-details"
                    disabled={busy}
                    value={draft.details}
                    onChange={(e) =>
                      setIdeaDrafts((d) => ({
                        ...d,
                        [code]: { ...draft, details: e.target.value },
                      }))
                    }
                    placeholder={t(
                      "The place, the time, the little details… (optional)",
                    )}
                    maxLength={500}
                    rows={2}
                  />
                  <div className="composer-bottom">
                    <small>
                      {t("Everyone can suggest. Everyone can vote.")}
                    </small>
                    <button className="button" disabled={busy} type="submit">
                      {t(busy ? "Posting…" : "Post idea")} ↗
                    </button>
                  </div>
                </form>
              )}
              <div className="section-label">
                <span>
                  {t(
                    room.ideas.length === 1
                      ? "ON THE TABLE / {count} IDEA"
                      : "ON THE TABLE / {count} IDEAS",
                    { count: room.ideas.length },
                  )}
                </span>
                <span>{t("YEA = +1 · NAY = −1")}</span>
              </div>
              {!room.ideas.length && (
                <div className="empty-state">
                  <h2>{t("Be the first to put an idea out there.")}</h2>
                  <p>
                    {t(
                      open
                        ? "A place, a plan, a possibility. What have you got?"
                        : "No ideas were added to this room.",
                    )}
                  </p>
                </div>
              )}
              {room.ideas.map((idea) => {
                const own = idea.author_id === user.id;
                const comments = room.comments.filter(
                  (c) => c.idea_id === idea.id,
                );
                return (
                  <article
                    className={"idea " + (idea.winner ? "winner" : "")}
                    key={idea.id}
                  >
                    <div className="idea-top">
                      <span>
                        {own
                          ? t("YOUR IDEA")
                          : t("IDEA BY {name}", { name: idea.author_name })}
                      </span>
                      {idea.winner && <span>{t("Winner")} ↗</span>}
                    </div>
                    <h2>{idea.title}</h2>
                    {idea.details && (
                      <p className="idea-details">{idea.details}</p>
                    )}
                    <div className="vote-row">
                      {([1, -1] as const).map((value) => (
                        <button
                          key={value}
                          className={
                            "vote " + (idea.my_vote === value ? "selected" : "")
                          }
                          data-vote={value}
                          aria-pressed={idea.my_vote === value}
                          aria-label={t(
                            value === 1
                              ? "Vote in favour of {title}"
                              : "Vote against {title}",
                            { title: idea.title },
                          )}
                          disabled={busy || !open || own}
                          onClick={() =>
                            void perform(async () => {
                              await api(
                                "/api/ideas/" + idea.id + "/vote",
                                "PUT",
                                { value },
                              );
                              await refreshRoom();
                            })
                          }
                        >
                          {value === 1 ? "↗" : "↘"}{" "}
                          {t(value === 1 ? "Yea" : "Nay")}{" "}
                          {idea.my_vote === value ? "✓" : ""}
                        </button>
                      ))}
                      <span className="vote-note">
                        {t(
                          !open
                            ? "Voting is closed"
                            : own
                              ? "Your idea · others can vote"
                              : idea.my_vote
                                ? "Your vote · tap again to remove"
                                : "What do you think?",
                        )}
                      </span>
                      <span className="score">
                        {t(
                          Math.abs(idea.score) === 1
                            ? "{score} net vote"
                            : "{score} net votes",
                          { score: (idea.score > 0 ? "+" : "") + idea.score },
                        )}
                      </span>
                    </div>
                    <button
                      className="comment-toggle"
                      aria-expanded={!!commentsOpen[idea.id]}
                      onClick={() =>
                        setCommentsOpen((s) => ({
                          ...s,
                          [idea.id]: !s[idea.id],
                        }))
                      }
                    >
                      {t(
                        commentsOpen[idea.id]
                          ? "Hide comments"
                          : "Comments ({count})",
                        { count: comments.length },
                      )}
                    </button>
                    {commentsOpen[idea.id] && (
                      <div className="comments">
                        {comments.map((c) => (
                          <div className="comment" key={c.id}>
                            <strong>{c.author_name}</strong>
                            <p>{c.body}</p>
                          </div>
                        ))}
                        {!comments.length && (
                          <p className="muted">
                            {t("No comments yet. Start the conversation.")}
                          </p>
                        )}
                        <form
                          noValidate
                          onSubmit={(e) => {
                            e.preventDefault();
                            const body = commentDrafts[idea.id]?.trim();
                            if (!body) {
                              setError(t("Write a comment before sending."));
                              return;
                            }
                            void perform(async () => {
                              await api(
                                "/api/ideas/" + idea.id + "/comments",
                                "POST",
                                { body },
                              );
                              setCommentDrafts((d) => ({
                                ...d,
                                [idea.id]: "",
                              }));
                              await refreshRoom();
                            });
                          }}
                        >
                          <label
                            className="sr-only"
                            htmlFor={"comment-" + idea.id}
                          >
                            {t("Your comment")}
                          </label>
                          <input
                            id={"comment-" + idea.id}
                            disabled={busy}
                            value={commentDrafts[idea.id] || ""}
                            onChange={(e) =>
                              setCommentDrafts((d) => ({
                                ...d,
                                [idea.id]: e.target.value,
                              }))
                            }
                            placeholder={t("Add a comment…")}
                            maxLength={280}
                          />
                          <button className="button" disabled={busy}>
                            {t("Send")} ↗
                          </button>
                        </form>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
            <aside className="side">
              <section>
                <h3>{t("Good company.")}</h3>
                <div className="member-list">
                  {room.members.map((m) => (
                    <div className="member" key={m.id}>
                      <Avatar user={m} />
                      <span>
                        {m.name}
                        {m.id === user.id && <small>{t("You")}</small>}
                        {m.id === room.host_id && <small>{t("Host")}</small>}
                      </span>
                      {room.is_host && m.id !== user.id && (
                        <details className="member-options">
                          <summary
                            aria-label={t("Manage {name}", { name: m.name })}
                          >
                            ···
                          </summary>
                          <div>
                            <button
                              onClick={() =>
                                ask(
                                  t("Remove {name}?", { name: m.name }),
                                  t("They can join again with the room code."),
                                  t("Remove member"),
                                  async () => {
                                    await api(
                                      "/api/rooms/" + code + "/members/kick",
                                      "POST",
                                      { userId: m.id },
                                    );
                                    await refreshRoom();
                                  },
                                )
                              }
                            >
                              {t("Remove")}
                            </button>
                            <button
                              onClick={() =>
                                ask(
                                  t("Ban {name}?", { name: m.name }),
                                  t(
                                    "They will no longer be able to join this room.",
                                  ),
                                  t("Ban member"),
                                  async () => {
                                    await api(
                                      "/api/rooms/" + code + "/members/ban",
                                      "POST",
                                      { userId: m.id },
                                    );
                                    await refreshRoom();
                                  },
                                  true,
                                )
                              }
                            >
                              {t("Ban")}
                            </button>
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3>{t("Room for your people.")}</h3>
                <p>{t("Share the code. Bring the group into the decision.")}</p>
                <div className="code">{code}</div>
                <button
                  className="button secondary"
                  onClick={() =>
                    void perform(async () => {
                      try {
                        await navigator.clipboard.writeText(code);
                        notify(t("Room code copied."));
                      } catch {
                        notify(t("Room code: {code}", { code }));
                      }
                    })
                  }
                >
                  {t("Copy room code")}
                </button>
                <button
                  className="button secondary"
                  onClick={() =>
                    void perform(async () => {
                      try {
                        await navigator.clipboard.writeText(
                          location.origin + "/room/" + code,
                        );
                        notify(t("Invite link copied."));
                      } catch {
                        notify(location.origin + "/room/" + code);
                      }
                    })
                  }
                >
                  {t("Copy invite link")} ↗
                </button>
              </section>
              <section>
                <h3>{t(room.is_host ? "Host controls" : "Your room")}</h3>
                {room.is_host ? (
                  <>
                    <p>{t("Keep the conversation moving.")}</p>
                    {open && (
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() =>
                          ask(
                            t("End voting?"),
                            t(
                              "The current scores will decide the result. Voting cannot be reopened.",
                            ),
                            t("End voting"),
                            async () => {
                              await api(
                                "/api/rooms/" + code + "/close",
                                "POST",
                              );
                              await refreshRoom();
                            },
                          )
                        }
                      >
                        {t("End voting")}
                      </button>
                    )}
                    <button
                      className="button secondary room-delete"
                      disabled={busy}
                      onClick={() =>
                        ask(
                          t("Delete this room?"),
                          t(
                            "All ideas, votes and comments in this room will be permanently deleted.",
                          ),
                          t("Delete room"),
                          async () => {
                            await api("/api/rooms/" + code, "DELETE");
                            navigate("/");
                            notify(t("Room deleted."));
                          },
                          true,
                        )
                      }
                    >
                      {t("Delete room")}
                    </button>
                  </>
                ) : (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      ask(
                        t("Leave this room?"),
                        t(
                          "You can join again with the room code unless the host has removed your access.",
                        ),
                        t("Leave room"),
                        async () => {
                          await api("/api/rooms/" + code + "/leave", "POST");
                          navigate("/");
                        },
                      )
                    }
                  >
                    {t("Leave room")}
                  </button>
                )}
              </section>
            </aside>
          </div>
        </div>
      ) : (
        <section className="page empty-state">
          <h1>{t("Couldn’t open this room.")}</h1>
          {link("/", t("Back to your rooms"), "button")}
        </section>
      );
  } else
    content = (
      <section className="page empty-state">
        <h1>{t("This page took a different turn.")}</h1>
        {link("/", t("Back home"), "button")}
      </section>
    );
  return (
    <>
      {shell()}
      <main id="main-content">
        {error && !confirm && !joinOpen && !feedback && route !== "/create" && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button
              className="icon-button"
              aria-label={t("Dismiss error")}
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}
        {content}
      </main>
      <footer>
        <div>
          {link(
            "/",
            <>
              {t("Less back-and-forth.")}
              <br />
              {t("More getting together.")}
            </>,
            "wordmark",
          )}
        </div>
        <div>
          {link("/privacy", t("Privacy"))}
          {link("/terms", t("Terms"))}
          <span>{t("Yea or Nay / Good plans, made together")}</span>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {user && route === "/create" && (
        <Modal
          closeLabel={t("Close dialog")}
          title={t("Create a room.")}
          busy={busy}
          onClose={() => navigate("/")}
        >
          <CreatePage
            t={t}
            busy={busy}
            onCancel={() => navigate("/")}
            serverError={error}
            onSubmit={(data, image) =>
              perform(async () => {
                const result = await api<{ room: RoomSummary }>(
                  "/api/rooms",
                  "POST",
                  data,
                );
                let warning = false;
                if (image) {
                  try {
                    await api(
                      "/api/rooms/" + result.room.code + "/icon",
                      "POST",
                      image,
                    );
                  } catch {
                    warning = true;
                  }
                }
                navigate("/room/" + result.room.code);
                notify(
                  warning
                    ? t(
                        "Your room is open, but the image could not be uploaded.",
                      )
                    : t("Your room is open. Bring your people in."),
                );
              })
            }
          />
        </Modal>
      )}
      {joinOpen && (
        <Modal
          closeLabel={t("Close dialog")}
          title={t("Bring your people together.")}
          busy={busy}
          onClose={() => {
            setJoinOpen(false);
            setError("");
          }}
        >
          <JoinForm
            t={t}
            busy={busy}
            error={error}
            onSubmit={(joinCode) =>
              perform(async () => {
                await api("/api/rooms/join", "POST", { code: joinCode });
                setJoinOpen(false);
                navigate("/room/" + joinCode);
              })
            }
          />
        </Modal>
      )}
      {feedback && (
        <Modal
          closeLabel={t("Close dialog")}
          title={t("How’s it going?")}
          busy={busy}
          onClose={() => {
            setFeedback(false);
            setError("");
          }}
        >
          <FeedbackForm
            t={t}
            busy={busy}
            error={error}
            onSubmit={(data) =>
              perform(async () => {
                await api("/api/feedback", "POST", data);
                setFeedback(false);
                notify(t("Thanks for helping make Yea or Nay better."));
              })
            }
          />
        </Modal>
      )}
      {confirm && (
        <Modal
          closeLabel={t("Close dialog")}
          title={confirm.title}
          busy={busy}
          onClose={() => {
            setConfirm(null);
            setError("");
          }}
        >
          <p className="muted">{confirm.text}</p>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                setConfirm(null);
                setError("");
              }}
            >
              {t("Cancel")}
            </button>
            <button
              className={"button " + (confirm.danger ? "danger-button" : "")}
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  await confirm.action();
                  setConfirm(null);
                })
              }
            >
              {busy ? t("Working…") : confirm.label}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function countdown(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  const h = Math.floor(seconds / 3600),
    m = Math.floor((seconds % 3600) / 60),
    s = seconds % 60;
  return (
    (h ? h + ":" : "") +
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0")
  );
}
type Link = (path: string, label: ReactNode, className?: string) => ReactNode;
function AuthPage({
  locale,
  signup,
  t,
  busy,
  link,
  next,
  onSubmit,
}: {
  locale: string;
  signup: boolean;
  t: T;
  busy: boolean;
  link: Link;
  next: string | null;
  onSubmit: (data: unknown) => Promise<void>;
}) {
  const [show, setShow] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<{ turnstileSiteKey: string | null; signupEnabled: boolean } | null>(null);
  const [configFailed, setConfigFailed] = useState(false);
  const [configAttempt, setConfigAttempt] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  useEffect(() => {
    if (!signup) return;
    let active = true;
    setConfig(null); setConfigFailed(false);
    void api<{ turnstileSiteKey: string | null; signupEnabled: boolean }>("/api/config")
      .then(value => { if (active) setConfig(value); })
      .catch(() => { if (active) setConfigFailed(true); });
    return () => { active = false; };
  }, [signup, configAttempt]);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    setErrors({});
    setShow(false);
    form.current?.reset();
  }, [signup]);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (signup && (!config?.signupEnabled || (config.turnstileSiteKey && !turnstileToken))) return;
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim(),
      email = String(data.get("email") || "").trim(),
      password = String(data.get("password") || "");
    const issues: Record<string, string> = {};
    if (signup && !name) issues.name = t("Tell us your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      issues.email = t("Enter a valid email address.");
    if (password.length < 10 || password.length > 128)
      issues.password = t("Password must be 10 to 128 characters long.");
    if (signup && !data.get("ageConfirmed"))
      issues.ageConfirmed = t(
        "Please confirm that you are 18 or older to create an account.",
      );
    setErrors(issues);
    if (Object.keys(issues).length) {
      e.currentTarget
        .querySelector<HTMLElement>('[name="' + Object.keys(issues)[0] + '"]')
        ?.focus();
      return;
    }
    void onSubmit({
      name,
      email,
      password,
      ageConfirmed: !!data.get("ageConfirmed"),
      turnstileToken: signup ? turnstileToken : undefined,
    }).finally(() => { if (signup) { setTurnstileToken(""); setChallengeAttempt(value => value + 1); } });
  };
  return (
    <section className="auth-page">
      <div className="auth-story">
        <p className="eyebrow">
          {t(signup ? "A little less “whatever”." : "Your people. Your plans.")}
        </p>
        <h1>
          {signup ? (
            <>
              {t("Your next")}
              <br />
              {t("good plan")}
              <br />
              <em>{t("starts here.")}</em>
            </>
          ) : (
            <>
              {t("Good to")}
              <br />
              {t("have you")}
              <br />
              <em>{t("back.")}</em>
            </>
          )}
        </h1>
        <p className="auth-intro">
          {t(
            signup
              ? "Bring your people together. Put every idea on the table. Find your next “let’s do it”."
              : "The ideas are on the table. Come back into the conversation.",
          )}
        </p>
        <div className="auth-graphic" aria-hidden="true">
          <div className="auth-mini">
            <small>{t("THE GROUP HAS DECIDED")}</small>
            <strong>
              {t("Less “you choose”.")}
              <br />
              {t("More “see you there”.")}
            </strong>
            <span>↗ {t("YEA, LET’S GO.")}</span>
          </div>
          <div className="auth-arrow">↗</div>
        </div>
        <p className="auth-footnote">{t("GOOD PEOPLE. ONE GOOD PLAN.")}</p>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-top">
          <span className="eyebrow">
            {t(signup ? "01 / MAKE YOURSELF AT HOME" : "01 / COME ON IN")}
          </span>
          {link("/", <>{t("Back to the idea")} ↗</>)}
        </div>
        <div className="auth-form-wrap">
          <h2>{t(signup ? "Join the conversation." : "Sign in.")}</h2>
          <p className="muted">
            {t(
              signup
                ? "A place for your people to make up their minds."
                : "Your rooms are right where you left them.",
            )}
          </p>
          {next?.startsWith("/room/") && (
            <p className="auth-invite">
              {t("Your room invitation will be waiting after you sign in.")}
            </p>
          )}
          <form ref={form} noValidate onSubmit={submit}>
            {signup && (
              <div className="auth-field">
                <label htmlFor="auth-name">
                  {t("What should we call you?")}
                </label>
                <input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  placeholder={t("Your name")}
                  maxLength={40}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "auth-name-error" : undefined}
                  onChange={(e) => {
                    if (e.target.value.trim())
                      setErrors((v) => ({ ...v, name: "" }));
                  }}
                  required
                />
                <FieldError id="auth-name-error" message={errors.name} />
              </div>
            )}
            <div className="auth-field">
              <label htmlFor="auth-email">{t("Email address")}</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t("you@example.com")}
                maxLength={254}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "auth-email-error" : undefined}
                onChange={(e) => {
                  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value.trim()))
                    setErrors((v) => ({ ...v, email: "" }));
                }}
                required
              />
              <FieldError id="auth-email-error" message={errors.email} />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">{t("Password")}</label>
              <div className="password-field">
                <input
                  id="auth-password"
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder={t(
                    signup ? "At least 10 characters" : "Your password",
                  )}
                  maxLength={128}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "auth-password-error" : undefined
                  }
                  onChange={(e) => {
                    if (
                      e.target.value.length >= 10 &&
                      e.target.value.length <= 128
                    )
                      setErrors((v) => ({ ...v, password: "" }));
                  }}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-controls="auth-password"
                  aria-pressed={show}
                  onClick={() => setShow(!show)}
                >
                  {t(show ? "Hide" : "Show")}
                </button>
              </div>
              <FieldError id="auth-password-error" message={errors.password} />
            </div>
            {signup && (
              <>
                <label className="auth-confirm">
                  <input
                    type="checkbox"
                    name="ageConfirmed"
                    required
                    aria-invalid={!!errors.ageConfirmed}
                    aria-describedby={
                      errors.ageConfirmed ? "auth-age-error" : undefined
                    }
                    onChange={(e) => {
                      if (e.target.checked)
                        setErrors((v) => ({ ...v, ageConfirmed: "" }));
                    }}
                  />
                  <span>{t("I confirm that I am 18 or older.")}</span>
                </label>
                <FieldError id="auth-age-error" message={errors.ageConfirmed} />
                {config?.turnstileSiteKey && <Turnstile key={challengeAttempt} siteKey={config.turnstileSiteKey} locale={locale} onToken={setTurnstileToken} failure={t("Verification could not load. Try again.")} />}
                {(configFailed || (config && !config.signupEnabled)) && <p role="status">{t("Account creation is temporarily unavailable. Please try again later.")}</p>}
                {configFailed && <button type="button" className="text-button" onClick={() => setConfigAttempt(value => value + 1)}>{t("Try again")}</button>}
              </>
            )}
            <button
              className="button auth-submit"
              type="submit"
              disabled={busy || (signup && (!config?.signupEnabled || !!config.turnstileSiteKey && !turnstileToken))}
            >
              {t(busy ? "Working…" : signup ? "Create my account" : "Sign in")}{" "}
              <span>↗</span>
            </button>
          </form>
          <p className="auth-switch">
            {t(signup ? "Already part of the group?" : "New around here?")}{" "}
            {link(
              "/" +
                (signup ? "login" : "signup") +
                (next ? "?next=" + encodeURIComponent(next) : ""),
              <>{t(signup ? "Sign in" : "Create an account")} ↗</>,
            )}
          </p>
          <p className="auth-legal">
            {link("/privacy", t("Privacy notice"))} ·{" "}
            {link("/terms", t("Terms of service"))}
          </p>
        </div>
      </div>
    </section>
  );
}
function CreatePage({
  t,
  busy,
  onCancel,
  serverError,
  onSubmit,
}: {
  t: T;
  busy: boolean;
  onCancel: () => void;
  serverError: string;
  onSubmit: (data: unknown, image: File | null) => Promise<void>;
}) {
  const [duration, setDuration] = useState("30"),
    [image, setImage] = useState<File | null>(null),
    [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const endsAt =
      duration === "custom"
        ? new Date(String(data.get("endsAt"))).getTime()
        : undefined;
    const issues: Record<string, string> = {};
    if (!name) issues.name = t("Give your room a question.");
    if (duration === "custom" && (!endsAt || endsAt <= Date.now()))
      issues.endsAt = t("Choose an end date and time in the future.");
    setErrors(issues);
    if (Object.keys(issues).length) {
      e.currentTarget
        .querySelector<HTMLElement>('[name="' + Object.keys(issues)[0] + '"]')
        ?.focus();
      return;
    }
    const invalidImage = e.currentTarget.querySelector<HTMLInputElement>(
      '#image-upload[aria-invalid="true"]',
    );
    if (invalidImage) {
      invalidImage.focus();
      return;
    }
    void onSubmit(
      {
        name,
        duration: Number(duration),
        ...(endsAt ? { endsAt } : {}),
        icon: "🎲",
      },
      image,
    );
  };
  return (
    <form className="create-form" noValidate onSubmit={submit}>
      <p className="eyebrow">{t("One question. Everyone’s ideas.")}</p>
      <div className="field">
        <label htmlFor="create-question">{t("What are we deciding?")}</label>
        <input
          id="create-question"
          name="name"
          autoFocus
          placeholder={t("Friday night. What’s the move?")}
          maxLength={70}
          required
          aria-invalid={!!errors.name}
          aria-describedby={
            errors.name ? "create-name-error" : "create-name-hint"
          }
          onChange={() => setErrors((v) => ({ ...v, name: "" }))}
        />
        <small id="create-name-hint">
          {t("Give your room a question. Up to 70 characters.")}
        </small>
        {errors.name && (
          <p className="field-error" id="create-name-error" role="alert">
            {errors.name}
          </p>
        )}
      </div>
      <div className="field">
        <span id="duration-label" className="field-label">{t("How long should voting last?")}</span>
        <input type="hidden" name="duration" value={duration} />
        <details className="duration-picker">
          <summary aria-labelledby="duration-label duration-value"><span id="duration-value">{t(durationOptions.find(([value]) => value === duration)?.[1] || "30 minutes · just right")}</span><span aria-hidden="true">⌄</span></summary>
          <div className="duration-options" role="radiogroup" aria-labelledby="duration-label">
            {durationOptions.map(([value, label]) => <label key={value}>
              <input type="radio" name="duration-choice" value={value} checked={duration === value}
                onChange={() => setDuration(value)} />{t(label)}
            </label>)}
          </div>
        </details>
      </div>
      {duration === "custom" && (
        <div className="field">
          <label htmlFor="create-end">{t("Voting ends")}</label>
          <input
            id="create-end"
            name="endsAt"
            type="datetime-local"
            required
            aria-invalid={!!errors.endsAt}
            aria-describedby={
              errors.endsAt ? "create-end-error" : "create-end-hint"
            }
            onChange={() => setErrors((v) => ({ ...v, endsAt: "" }))}
          />
          <small id="create-end-hint">
            {t("Choose a date and time in the future.")}
          </small>
          {errors.endsAt && (
            <p id="create-end-error" className="field-error" role="alert">
              {errors.endsAt}
            </p>
          )}
        </div>
      )}
      <ImagePicker t={t} onChange={setImage} />
      <FieldError message={serverError} />
      <div className="create-actions">
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={onCancel}
        >
          {t("Cancel")}
        </button>
        <button className="button" type="submit" disabled={busy}>
          {t(busy ? "Opening…" : "Open the room")} ↗
        </button>
      </div>
    </form>
  );
}
function Profile({
  user,
  t,
  busy,
  link,
  save,
  photo,
  remove,
}: {
  user: User;
  t: T;
  busy: boolean;
  link: Link;
  save: (data: unknown) => Promise<void>;
  photo: (file: File | null) => Promise<void>;
  remove: (password: string) => void;
}) {
  const [name, setName] = useState(user.name),
    [password, setPassword] = useState(""),
    [error, setError] = useState("");
  return (
    <div className="page profile-page">
      {link("/", <>← {t("Your rooms")}</>, "eyebrow")}
      <p className="eyebrow">{t("Account")}</p>
      <h1>{t("Your profile.")}</h1>
      <p className="muted">
        {t("Manage your name and profile photo.")}
      </p>
      <section className="profile-card">
        <div className="profile-photo-row">
          <Avatar user={user} />
          <div>
            <h2>{t("Profile photo")}</h2>
            <p className="muted">{t("JPG, PNG or WebP, up to 256 KB.")}</p>
            <label className="button secondary upload-button">
              {t("Upload photo")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setError("");
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type,
                    )
                  ) {
                    setError(t("Use a JPG, PNG, or WebP image."));
                    return;
                  }
                  if (file.size > 262144) {
                    setError(t("Choose an image smaller than 256 KB."));
                    return;
                  }
                  void photo(file);
                }}
              />
            </label>
            {user.avatarUrl && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => void photo(null)}
              >
                {t("Remove photo")}
              </button>
            )}
          </div>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!name.trim()) {
              setError(t("Tell us your name."));
              return;
            }
            void save({ name: name.trim(), email: user.email });
          }}
        >
          <div className="field">
            <label htmlFor="profile-name">{t("Name")}</label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={40}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="profile-email">{t("Email address")}</label>
            <input
              id="profile-email"
              type="email"
              value={user.email}
              readOnly
              aria-describedby="profile-email-help"
              autoComplete="email"
              maxLength={254}
              required
            />
            <p id="profile-email-help" className="muted">{t("Email changes are unavailable until email verification is supported.")}</p>
          </div>
          <FieldError message={error} />
          <button className="button" type="submit" disabled={busy}>
            {t(busy ? "Saving…" : "Save changes")} ↗
          </button>
        </form>
      </section>
      <section className="profile-danger">
        <h2>{t("Delete account")}</h2>
        <p>{t("Permanently delete your account and personal data.")}</p>
        <div className="field"><label htmlFor="delete-password">{t("Confirm your password to delete your account.")}</label>
          <input id="delete-password" type="password" autoComplete="current-password" maxLength={128} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></div>
        <button
          className="button danger-button"
          disabled={busy || !password}
          onClick={() => { remove(password); setPassword(""); }}
        >
          {t("Delete account")}
        </button>
      </section>
    </div>
  );
}
function JoinForm({
  t,
  busy,
  error,
  onSubmit,
}: {
  t: T;
  busy: boolean;
  error: string;
  onSubmit: (code: string) => Promise<void>;
}) {
  const [value, setValue] = useState(""),
    [validation, setValidation] = useState("");
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const code = value.trim().replace(/\s/g, "").toUpperCase();
        if (!code) {
          setValidation(t("Enter the room code your friend shared."));
          return;
        }
        setValidation("");
        void onSubmit(code);
      }}
    >
      <p className="muted">{t("Enter the room code your friend shared.")}</p>
      <div className="field">
        <label htmlFor="join-code">{t("Room code")}</label>
        <input
          id="join-code"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={8}
          autoComplete="off"
          autoCapitalize="characters"
          required
        />
      </div>
      <FieldError message={validation || error} />
      <button className="button" disabled={busy}>
        {t(busy ? "Joining…" : "Join room")} ↗
      </button>
    </form>
  );
}
function FeedbackForm({
  t,
  busy,
  error,
  onSubmit,
}: {
  t: T;
  busy: boolean;
  error: string;
  onSubmit: (data: unknown) => Promise<void>;
}) {
  const [rating, setRating] = useState(""),
    [validation, setValidation] = useState("");
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) {
          setValidation(t("Choose positive or negative feedback."));
          return;
        }
        void onSubmit({
          rating,
          note: new FormData(e.currentTarget).get("note"),
        });
      }}
    >
      <p className="muted">
        {t("Tell us what works and what could be better.")}
      </p>
      <fieldset className="feedback-ratings">
        <legend>{t("Your experience")}</legend>
        {[
          ["good", "Good"],
          ["bad", "Could be better"],
        ].map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="rating"
              value={value}
              checked={rating === value}
              onChange={() => {
                setRating(value);
                setValidation("");
              }}
            />
            {t(label)}
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="feedback-note">{t("Anything else? (optional)")}</label>
        <textarea id="feedback-note" name="note" maxLength={500} rows={4} />
      </div>
      <FieldError message={validation || error} />
      <button className="button" disabled={busy}>
        {t(busy ? "Sending…" : "Send feedback")} ↗
      </button>
    </form>
  );
}
function Landing({ t, link }: { t: T; link: Link }) {
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
