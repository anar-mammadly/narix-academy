"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { CheckCircle2, Clock, History, ListChecks, Send, Server, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiEndpoint, ApiPlaygroundContent } from "@/types/blocks";
import { Button, Input, Label, Select, Tabs, Textarea } from "@/components/ui";
import { RichText } from "@/components/lesson/RichText";
import { BlockShell, Feedback, InlineError, useAttempt, type InteractiveProps } from "@/components/lesson/shared";

type Method = ApiEndpoint["method"];
const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const BODY_METHODS = new Set<Method>(["POST", "PUT", "PATCH"]);

const METHOD_TONE: Record<Method, string> = {
  GET: "text-pass bg-pass-soft",
  POST: "text-xp bg-xp-soft",
  PUT: "text-sky bg-sky-soft",
  PATCH: "text-iris-ink bg-iris-soft",
  DELETE: "text-bug bg-bug-soft",
};

const STATUS_TEXT: Record<number, string> = {
  200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
  301: "Moved Permanently", 302: "Found", 304: "Not Modified",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed",
  409: "Conflict", 415: "Unsupported Media Type", 422: "Unprocessable Entity", 429: "Too Many Requests",
  500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout",
};

type MockResponse = {
  id: number;
  method: Method;
  url: string;
  path: string;
  status: number;
  statusText: string;
  body: unknown;
  headers: [string, string][];
  latency: number;
  size: number;
  at: string;
};

/* ---------------------------- request matching ---------------------------- */

function splitPath(p: string) {
  return p.split("/").filter(Boolean);
}

function cleanPath(p: string) {
  const noQuery = p.split(/[?#]/)[0];
  const withSlash = noQuery.startsWith("/") ? noQuery : `/${noQuery}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
}

/** Resolve whatever the student typed to a path relative to baseUrl. */
function resolvePath(raw: string, baseUrl: string): string {
  const url = raw.trim();
  const base = baseUrl.replace(/\/+$/, "");
  if (base && url.toLowerCase().startsWith(base.toLowerCase())) return cleanPath(url.slice(base.length));
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      let path = u.pathname;
      try {
        const b = new URL(base);
        if (u.host !== b.host) return `__other_host__${path}`;
        const bp = b.pathname.replace(/\/+$/, "");
        if (bp && path.startsWith(bp)) path = path.slice(bp.length);
      } catch {
        /* base is not absolute; use pathname as-is */
      }
      return cleanPath(path);
    } catch {
      return cleanPath(url);
    }
  }
  return cleanPath(url);
}

function pathMatches(pattern: string, path: string) {
  const a = splitPath(cleanPath(pattern));
  const b = splitPath(path);
  return a.length === b.length && a.every((seg, i) => (seg.startsWith(":") ? b[i].length > 0 : seg === b[i]));
}

function byteLength(s: string) {
  return new TextEncoder().encode(s).length;
}

function buildResponse(
  endpoints: ApiEndpoint[], method: Method, url: string, baseUrl: string, seq: number
): Omit<MockResponse, "latency" | "at"> {
  const path = resolvePath(url, baseUrl);
  const samePath = endpoints.filter((e) => pathMatches(e.path, path));
  const hit = samePath.find((e) => e.method === method);
  let status: number;
  let body: unknown;
  const extra: [string, string][] = [];
  if (hit) {
    status = hit.status;
    body = hit.body;
  } else if (samePath.length) {
    status = 405;
    body = { error: "Method Not Allowed" };
    extra.push(["Allow", [...new Set(samePath.map((e) => e.method))].join(", ")]);
  } else {
    status = 404;
    body = { error: "Not Found" };
  }
  const text = status === 204 || body === undefined ? "" : JSON.stringify(body, null, 2);
  const size = byteLength(text);
  const headers: [string, string][] = [
    ...(text ? ([["Content-Type", "application/json; charset=utf-8"]] as [string, string][]) : []),
    ["Content-Length", String(size)],
    ...extra,
    ["X-Request-Id", `req_${(seq * 7919 + 104729).toString(36)}`],
    ["Server", "narix-mock/1.0"],
  ];
  return { id: seq, method, url, path, status, statusText: STATUS_TEXT[status] ?? "", body, headers, size };
}

/* ----------------------------- JSON colouring ----------------------------- */

const JSON_TOKEN = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function highlightJson(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(JSON_TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    let cls = "text-xp-bright"; // number
    if (tok.startsWith('"')) cls = tok.trimEnd().endsWith(":") ? "text-sky-bright" : "text-pass-bright";
    else if (tok === "true" || tok === "false") cls = "text-flame-bright";
    else if (tok === "null") cls = "text-bug-bright";
    if (cls === "text-sky-bright") {
      const colon = tok.lastIndexOf(":");
      out.push(<span key={i++} className={cls}>{tok.slice(0, colon)}</span>, tok.slice(colon));
    } else {
      out.push(<span key={i++} className={cls}>{tok}</span>);
    }
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function statusTone(status: number) {
  if (status >= 500) return "bg-bug-soft text-bug border-bug/30";
  if (status >= 400) return "bg-xp-soft text-xp border-xp/30";
  if (status >= 300) return "bg-sky-soft text-sky border-sky/30";
  return "bg-pass-soft text-pass border-pass/30";
}

function MethodTag({ method, className }: { method: Method; className?: string }) {
  return (
    <span className={cn("inline-flex w-16 shrink-0 justify-center rounded px-1.5 py-0.5 font-mono text-[0.7rem] font-bold", METHOD_TONE[method], className)}>
      {method}
    </span>
  );
}

/* --------------------------------- tasks ---------------------------------- */

function TaskQuestion({
  task, index, value, onChange, disabled, reveal,
}: {
  task: ApiPlaygroundContent["tasks"][number];
  index: number;
  value: number | undefined;
  onChange: (v: number) => void;
  disabled: boolean;
  reveal: boolean;
}) {
  const qid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusIndex = value ?? 0;
  const correct = value === task.correctIndex;

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(e.key in keys) || disabled) return;
    e.preventDefault();
    const next = (i + keys[e.key] + task.options.length) % task.options.length;
    onChange(next);
    refs.current[next]?.focus();
  }

  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <p id={qid} className="flex gap-2 font-medium text-ink">
        <span className="font-mono text-sm text-iris">{index + 1}.</span>
        <span>{task.question}</span>
      </p>
      <div role="radiogroup" aria-labelledby={qid} aria-disabled={disabled || undefined} className="mt-3 grid gap-2">
        {task.options.map((opt, i) => {
          const checked = value === i;
          const isAnswer = i === task.correctIndex;
          const showRight = reveal && isAnswer;
          const showWrong = reveal && checked && !isAnswer;
          return (
            <button
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-disabled={disabled || undefined}
              tabIndex={i === focusIndex ? 0 : -1}
              onClick={() => !disabled && onChange(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "flex min-h-11 w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-iris/20",
                showRight ? "border-pass/50 bg-pass-soft text-ink"
                  : showWrong ? "border-bug/50 bg-bug-soft text-ink"
                  : checked ? "border-iris bg-iris-soft text-ink"
                  : "border-line text-ink-2 hover:border-line-strong hover:bg-surface-2",
                disabled && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  checked ? "border-iris" : "border-line-strong"
                )}
                aria-hidden
              >
                {checked && <span className="h-2.5 w-2.5 rounded-full bg-iris" />}
              </span>
              <span className="flex-1">{opt}</span>
              {showRight && (
                <span className="flex items-center gap-1 text-xs font-semibold text-pass">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Düzgün cavab
                </span>
              )}
              {showWrong && (
                <span className="flex items-center gap-1 text-xs font-semibold text-bug">
                  <XCircle className="h-4 w-4" aria-hidden /> Sizin cavab
                </span>
              )}
            </button>
          );
        })}
      </div>
      {reveal && (
        <div className={cn("mt-3 flex gap-2 rounded-md px-3 py-2 text-sm animate-pop-in", correct ? "bg-pass-soft" : "bg-bug-soft")}>
          {correct ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pass" aria-hidden /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-bug" aria-hidden />}
          <p className="text-ink-2">
            <strong className={correct ? "text-pass" : "text-bug"}>{correct ? "Düzdür." : value === undefined ? "Cavablandırılmayıb." : "Səhvdir."}</strong>
            {task.explanation && <> {task.explanation}</>}
          </p>
        </div>
      )}
    </li>
  );
}

/* -------------------------------- component -------------------------------- */

export default function ApiPlayground(props: InteractiveProps<ApiPlaygroundContent>) {
  const { content, title } = props;
  const { result, pending, error, submit, reset } = useAttempt(props);
  const ids = useId();
  const baseUrl = content.baseUrl.replace(/\/+$/, "");

  const [method, setMethod] = useState<Method>(content.endpoints[0]?.method ?? "GET");
  const [url, setUrl] = useState(`${baseUrl}${content.endpoints[0]?.path ?? "/"}`);
  const [body, setBody] = useState("{\n  \n}");
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<MockResponse | null>(null);
  const [history, setHistory] = useState<MockResponse[]>([]);
  const [tab, setTab] = useState<"body" | "headers">("body");
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const initialAnswers = useMemo(() => {
    const raw = props.initial?.answer?.answers;
    const out: Record<string, number> = {};
    if (raw && typeof raw === "object") {
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (typeof v === "number") out[k] = v;
    }
    return out;
  }, [props.initial]);
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [taskError, setTaskError] = useState<string | null>(null);
  const reveal = result !== null && Object.keys(answers).length > 0;

  const hasBody = BODY_METHODS.has(method);

  function pick(ep: ApiEndpoint) {
    setMethod(ep.method);
    setUrl(`${baseUrl}${ep.path}`);
    setBodyError(null);
  }

  function send(e?: FormEvent) {
    e?.preventDefault();
    if (sending) return;
    if (hasBody && body.trim()) {
      try {
        JSON.parse(body);
      } catch (err) {
        setBodyError(`JSON səhvdir: ${err instanceof Error ? err.message : "parse xətası"}`);
        return;
      }
    }
    setBodyError(null);
    if (!url.trim()) return;
    const id = ++seq.current;
    const draft = buildResponse(content.endpoints, method, url, baseUrl, id);
    const latency = 40 + ((id * 137 + url.length * 31) % 180);
    setSending(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const res: MockResponse = {
        ...draft,
        latency,
        at: new Date().toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      setResponse(res);
      setHistory((h) => [res, ...h].slice(0, 8));
      setSending(false);
    }, Math.min(latency, 600));
  }

  function restore(h: MockResponse) {
    setMethod(h.method);
    setUrl(h.url);
    setResponse(h);
  }

  async function checkAnswers() {
    const missing = content.tasks.filter((t) => answers[t.id] === undefined).length;
    if (missing) {
      setTaskError(`${missing} sual cavabsız qalıb. Hamısını cavablandırın.`);
      return;
    }
    setTaskError(null);
    await submit({ answers });
  }

  function retry() {
    reset();
    setAnswers({});
  }

  const responseText = response && response.body !== undefined && response.status !== 204 ? JSON.stringify(response.body, null, 2) : "";

  return (
    <BlockShell type={props.type} title={title} passed={result?.passed} wide>
      <RichText text={content.instructions} className="text-sm text-ink-2" />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ------------------------------ request ------------------------------ */}
        <section aria-labelledby={`${ids}-req`} className="min-w-0 overflow-hidden rounded-lg border border-line">
          <h4 id={`${ids}-req`} className="border-b border-line bg-surface-2/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
            Sorğu (Request)
          </h4>
          <form onSubmit={send} className="grid gap-4 p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="sm:w-32 sm:shrink-0">
                <Label htmlFor={`${ids}-method`} className="sr-only">HTTP metodu</Label>
                <Select
                  id={`${ids}-method`}
                  aria-label="HTTP metodu"
                  value={method}
                  onValueChange={(v) => setMethod(v as Method)}
                  options={METHODS.map((m) => ({ value: m, label: m }))}
                  className="font-mono text-sm font-semibold"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Label htmlFor={`${ids}-url`} className="sr-only">URL</Label>
                <Input
                  id={`${ids}-url`}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  inputMode="url"
                  className="font-mono text-sm"
                  placeholder={`${baseUrl}/...`}
                />
              </div>
              <Button type="submit" loading={sending} className="sm:shrink-0">
                {!sending && <Send className="h-4 w-4" aria-hidden />} Göndər
              </Button>
            </div>

            {hasBody && (
              <div>
                <Label htmlFor={`${ids}-body`}>Body (JSON)</Label>
                <Textarea
                  id={`${ids}-body`}
                  value={body}
                  onChange={(e) => { setBody(e.target.value); if (bodyError) setBodyError(null); }}
                  spellCheck={false}
                  aria-invalid={bodyError ? true : undefined}
                  aria-describedby={bodyError ? `${ids}-body-err` : undefined}
                  className="min-h-28 font-mono text-sm"
                />
                {bodyError && (
                  <p id={`${ids}-body-err`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm text-bug">
                    <XCircle className="h-4 w-4 shrink-0" aria-hidden /> {bodyError}
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink-2" id={`${ids}-eps`}>Sənədləşdirilmiş endpoint-lər</p>
              <ul aria-labelledby={`${ids}-eps`} className="grid gap-1 rounded-lg border border-line bg-surface-2/40 p-1">
                {content.endpoints.map((ep, i) => {
                  const active = ep.method === method && pathMatches(ep.path, resolvePath(url, baseUrl));
                  return (
                    <li key={`${ep.method}-${ep.path}-${i}`}>
                      <button
                        type="button"
                        onClick={() => pick(ep)}
                        aria-pressed={active}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                          active ? "bg-surface shadow-pop" : "hover:bg-surface"
                        )}
                      >
                        <MethodTag method={ep.method} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-sm text-ink">{ep.path}</span>
                          {ep.description && <span className="block text-xs text-muted">{ep.description}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </form>

          {history.length > 0 && (
            <div className="border-t border-line p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-2">
                <History className="h-4 w-4" aria-hidden /> Tarixçə
              </p>
              <ul className="grid gap-1">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => restore(h)}
                      aria-current={response?.id === h.id || undefined}
                      className={cn("flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-2", response?.id === h.id && "bg-surface-2")}
                    >
                      <MethodTag method={h.method} />
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-2">{h.path}</span>
                      <span className={cn("rounded border px-1.5 font-mono text-xs font-semibold", statusTone(h.status))}>{h.status}</span>
                      <span className="hidden text-xs text-muted xs:inline">{h.at}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ------------------------------ response ----------------------------- */}
        <section aria-labelledby={`${ids}-res`} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-line">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2/60 px-4 py-2">
            <h4 id={`${ids}-res`} className="text-xs font-semibold uppercase tracking-wide text-muted">Cavab (Response)</h4>
            {response && (
              <div className="flex flex-wrap items-center gap-2 text-xs" aria-live="polite">
                <span className={cn("rounded-full border px-2.5 py-0.5 font-mono font-semibold", statusTone(response.status))}>
                  {response.status} {response.statusText}
                </span>
                <span className="flex items-center gap-1 text-muted">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> {response.latency} ms
                </span>
                <span className="text-muted">{response.size} B</span>
              </div>
            )}
          </div>

          {sending ? (
            <div className="flex min-h-56 flex-1 items-center justify-center gap-2 text-sm text-muted" role="status">
              <span className="h-2 w-2 animate-ping rounded-full bg-iris" aria-hidden /> Sorğu göndərilir…
            </div>
          ) : response ? (
            <div className="flex flex-1 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
                <Tabs
                  label="Cavab bölmələri"
                  value={tab}
                  onValueChange={(v) => setTab(v === "headers" ? "headers" : "body")}
                  items={[
                    { value: "body", label: "Body" },
                    { value: "headers", label: "Headers", count: response.headers.length },
                  ]}
                />
                <span className="truncate font-mono text-xs text-muted">
                  {response.method} {response.path} · {response.at}
                </span>
              </div>
              <div className="flex-1 p-4" role="tabpanel">
                {tab === "body" ? (
                  responseText ? (
                    <pre className="max-h-96 overflow-auto rounded-lg bg-code-bg p-4 font-mono text-[0.8rem] leading-relaxed text-code-ink" tabIndex={0} aria-label="Cavabın JSON body-si">
                      <code>{highlightJson(responseText)}</code>
                    </pre>
                  ) : (
                    <p className="rounded-lg bg-surface-2 p-4 text-sm text-muted">Body boşdur.</p>
                  )
                ) : (
                  <table className="w-full text-sm">
                    <caption className="sr-only">Cavab header-ləri</caption>
                    <tbody className="divide-y divide-line">
                      {response.headers.map(([k, v]) => (
                        <tr key={k}>
                          <th scope="row" className="py-2 pr-4 text-left align-top font-mono text-xs font-semibold text-ink-2">{k}</th>
                          <td className="break-all py-2 font-mono text-xs text-ink">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-56 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <Server className="h-8 w-8 text-line-strong" aria-hidden />
              <p className="text-sm text-muted">Sorğu göndərin — cavab burada görünəcək.</p>
            </div>
          )}
        </section>
      </div>

      {/* -------------------------------- tasks -------------------------------- */}
      {content.tasks.length > 0 && (
        <section aria-labelledby={`${ids}-tasks`} className="mt-6">
          <h4 id={`${ids}-tasks`} className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <ListChecks className="h-4 w-4 text-iris" aria-hidden /> Tapşırıqlar
          </h4>
          <ol className="grid gap-3">
            {content.tasks.map((t, i) => (
              <TaskQuestion
                key={t.id}
                task={t}
                index={i}
                value={answers[t.id]}
                onChange={(v) => setAnswers((a) => ({ ...a, [t.id]: v }))}
                disabled={result !== null}
                reveal={reveal}
              />
            ))}
          </ol>
          {result === null && (
            <Button className="mt-4" loading={pending} onClick={checkAnswers}>
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Cavabları yoxla
            </Button>
          )}
          <InlineError message={taskError ?? error} />
          {result && <Feedback result={result} onRetry={retry} />}
        </section>
      )}
    </BlockShell>
  );
}
