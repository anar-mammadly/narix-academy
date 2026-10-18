// In-browser JavaScript runner for CODE_EXERCISE blocks.
//
// Student code runs inside a throwaway dedicated Web Worker built from a Blob
// URL, so it cannot touch the page, and an infinite loop is stopped by
// terminating the worker. Network APIs are disabled before the code runs.
// Client-only: call it from event handlers / effects, never during SSR.

export type LogLevel = "log" | "warn" | "error" | "info";
export type LogEntry = { level: LogLevel; text: string };
export type TestSpec = { name: string; assert: string };
export type TestResult = { name: string; passed: boolean; error?: string };
export type RunResult = { logs: LogEntry[]; error: string | null; tests: TestResult[] };

export const TIMEOUT_MESSAGE = "Kod 3 saniyədən çox işlədi — sonsuz dövr ola bilər";
const MAX_LOGS = 300;

type WorkerRequest = { nonce: string; code: string; body: string; count: number };
type WorkerMessage =
  | { nonce: string; kind: "log"; level: LogLevel; text: string }
  | { nonce: string; kind: "done"; error: string | null; results: (true | false | string)[] };

/**
 * Builds the body of the function that runs student code and every assert in
 * one scope, so asserts can see top-level `const`/`let`/`function` bindings.
 * Each assert is evaluated with a *direct* eval so a broken assert only fails
 * its own test. Assigning by index (not push) keeps it safe from student code
 * that monkey-patches Array.prototype.
 */
export function buildRunBody(code: string, asserts: string[]): string {
  const checks = asserts
    .map(
      (a, i) =>
        `try { __narix_r[${i}] = !!eval(${JSON.stringify(a)}); } catch (__narix_e) { __narix_r[${i}] = __narix_e; }`
    )
    .join("\n");
  // Newline after the student code so a trailing `//` comment can't swallow the checks.
  return `${code}\n;\n${checks}\n`;
}

// Worker source as a plain JS string: kept out of the bundler's reach so no
// transpiler helpers or HMR instrumentation can leak into it. Avoid backticks.
const WORKER_SOURCE = String.raw`
"use strict";
(function () {
  var MAX_LOGS = __MAX_LOGS__;
  var post = self.postMessage.bind(self);
  var BLOCKED = ["fetch", "XMLHttpRequest", "importScripts", "WebSocket", "EventSource", "Worker", "SharedWorker", "WebTransport", "indexedDB", "caches"];
  BLOCKED.forEach(function (key) {
    try { Object.defineProperty(self, key, { value: undefined, configurable: false, writable: false }); }
    catch (e) { try { self[key] = undefined; } catch (e2) {} }
  });

  function fmt(value, depth, seen, top) {
    var t = typeof value;
    if (t === "string") return top ? value : JSON.stringify(value);
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (t === "number") return Object.is(value, -0) ? "-0" : String(value);
    if (t === "bigint") return String(value) + "n";
    if (t === "boolean") return String(value);
    if (t === "symbol") return value.toString();
    if (t === "function") {
      var name = value.name || "(anonim)";
      var src = "";
      try { src = Function.prototype.toString.call(value); } catch (e) {}
      return /^class\b/.test(src) ? "class " + name : "ƒ " + name + "()";
    }
    if (value instanceof Error) return value.name + ": " + value.message;
    if (value instanceof Date) return isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
    if (value instanceof RegExp) return String(value);
    if (seen.indexOf(value) !== -1) return "[Dairəvi]";
    if (depth > 3) return Array.isArray(value) ? "[Array]" : "{…}";
    seen.push(value);
    try {
      if (Array.isArray(value)) {
        var items = value.slice(0, 100).map(function (v) { return fmt(v, depth + 1, seen, false); });
        if (value.length > 100) items.push("… daha " + (value.length - 100));
        return "[" + items.join(", ") + "]";
      }
      if (value instanceof Map) {
        var m = Array.from(value).slice(0, 50).map(function (kv) { return fmt(kv[0], depth + 1, seen, false) + " => " + fmt(kv[1], depth + 1, seen, false); });
        return "Map(" + value.size + ") {" + m.join(", ") + "}";
      }
      if (value instanceof Set) {
        var st = Array.from(value).slice(0, 50).map(function (v) { return fmt(v, depth + 1, seen, false); });
        return "Set(" + value.size + ") {" + st.join(", ") + "}";
      }
      if (value instanceof Promise) return "Promise {…}";
      var keys = Object.keys(value);
      var ctor = value.constructor && value.constructor.name;
      var prefix = ctor && ctor !== "Object" ? ctor + " " : "";
      if (!keys.length) return prefix + "{}";
      var entries = keys.slice(0, 50).map(function (k) {
        var label = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
        return label + ": " + fmt(value[k], depth + 1, seen, false);
      });
      if (keys.length > 50) entries.push("…");
      return prefix + "{ " + entries.join(", ") + " }";
    } catch (e) {
      return "[obyekt]";
    } finally {
      seen.pop();
    }
  }

  function describe(e) {
    if (e instanceof Error) return e.name + ": " + e.message;
    try { return String(e); } catch (x) { return "Naməlum xəta"; }
  }

  // V8 reports Function bodies at line +2 ("function anonymous(__narix_r\n) {\n").
  function lineOf(e) {
    var stack = e && typeof e.stack === "string" ? e.stack : "";
    var m = /<anonymous>:(\d+):(\d+)/.exec(stack);
    return m ? Math.max(1, Number(m[1]) - 2) : null;
  }

  self.onmessage = function (event) {
    self.onmessage = null;
    var nonce = event.data.nonce, code = event.data.code, body = event.data.body, count = event.data.count;
    var logged = 0;
    function emit(level, args) {
      logged++;
      if (logged > MAX_LOGS) {
        if (logged === MAX_LOGS + 1) post({ nonce: nonce, kind: "log", level: "warn", text: "… çıxış " + MAX_LOGS + " sətirdən sonra qısaltıldı" });
        return;
      }
      var text;
      try { text = Array.prototype.map.call(args, function (a) { return fmt(a, 0, [], true); }).join(" "); }
      catch (e) { text = "[format xətası]"; }
      post({ nonce: nonce, kind: "log", level: level, text: text });
    }
    var fake = {};
    ["log", "warn", "error", "info"].forEach(function (lv) { fake[lv] = function () { emit(lv, arguments); }; });
    fake.debug = fake.table = fake.dir = function () { emit("log", arguments); };
    fake.trace = function () { emit("info", arguments); };
    fake.clear = fake.group = fake.groupEnd = fake.time = fake.timeEnd = fake.count = fake.assert = function () {};
    try { Object.defineProperty(self, "console", { value: fake, configurable: true, writable: true }); } catch (e) {}

    var results = [];
    for (var i = 0; i < count; i++) results.push(false);
    function finish(error) {
      // One macrotask so already-resolved promise callbacks can still log.
      setTimeout(function () { post({ nonce: nonce, kind: "done", error: error, results: results }); }, 0);
    }

    // 1) Compile the student code alone so syntax errors are attributed to it.
    try { new Function(code); }
    catch (e) { finish("Sintaksis xətası: " + describe(e)); return; }

    // 2) Compile + run student code and asserts in one scope.
    var run;
    try { run = new Function("__narix_r", body); }
    catch (e) { finish("Testləri hazırlamaq alınmadı: " + describe(e)); return; }

    var raw = [];
    try { run(raw); }
    catch (e) {
      var line = lineOf(e);
      finish("İcra xətası" + (line ? " (sətir " + line + ")" : "") + ": " + describe(e));
      return;
    }
    for (var j = 0; j < count; j++) {
      var r = raw[j];
      results[j] = r === true ? true : (r === false || r === undefined) ? false : describe(r);
    }
    finish(null);
  };
})();
`;

function makeNonce(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function runJavaScript(code: string, tests: TestSpec[], timeoutMs = 3000): Promise<RunResult> {
  const failAll = (error: string): TestResult[] => tests.map((t) => ({ name: t.name, passed: false, error }));

  if (typeof window === "undefined" || typeof Worker === "undefined") {
    const error = "Bu brauzer kodu işə salmağı dəstəkləmir";
    return Promise.resolve({ logs: [], error, tests: failAll(error) });
  }

  const source = WORKER_SOURCE.replace("__MAX_LOGS__", String(MAX_LOGS));
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  let worker: Worker;
  try {
    worker = new Worker(url);
  } catch {
    URL.revokeObjectURL(url);
    const error = "Kod icraçısını başlatmaq alınmadı";
    return Promise.resolve({ logs: [], error, tests: failAll(error) });
  }
  URL.revokeObjectURL(url);

  const nonce = makeNonce();
  const logs: LogEntry[] = [];

  return new Promise<RunResult>((resolve) => {
    let settled = false;
    const settle = (r: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(r);
    };

    const timer = setTimeout(() => {
      settle({ logs, error: TIMEOUT_MESSAGE, tests: failAll("Vaxt bitdi") });
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (!msg || msg.nonce !== nonce) return; // ignore anything student code posts
      if (msg.kind === "log") {
        logs.push({ level: msg.level, text: msg.text });
        return;
      }
      if (msg.error) {
        settle({ logs, error: msg.error, tests: failAll("Kod icra olunmadı") });
        return;
      }
      settle({
        logs,
        error: null,
        tests: tests.map((t, i) => {
          const r = msg.results[i];
          if (r === true) return { name: t.name, passed: true };
          if (typeof r === "string") return { name: t.name, passed: false, error: r };
          return { name: t.name, passed: false };
        }),
      });
    };

    worker.onerror = (e: ErrorEvent) => {
      e.preventDefault();
      settle({ logs, error: `İcra xətası: ${e.message || "naməlum xəta"}`, tests: failAll("Kod icra olunmadı") });
    };

    const req: WorkerRequest = { nonce, code, body: buildRunBody(code, tests.map((t) => t.assert)), count: tests.length };
    worker.postMessage(req);
  });
}
