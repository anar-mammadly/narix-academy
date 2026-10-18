"use client";

// Fake "Narix Pay" login page with five seeded defects (see src/lib/bug-hunt.ts → login).
// Elements showing a defect carry data-bug="<id>" only while the defect is visible.

import { useId, useState, type FormEvent } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type MiniAppProps = { flagMode: boolean };

const DEMO_ACCOUNT = { email: "aysel@narix.az", password: "Narix2025" };

const inputCls =
  "h-10 w-full min-w-0 rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted outline-none transition focus:border-iris focus:ring-2 focus:ring-iris/25";

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "welcome"; name: string; emptySubmit: boolean };

export default function LoginApp({ flagMode }: MiniAppProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true); // BUG remember-checked: should default to false
  const [rememberTouched, setRememberTouched] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const tab = flagMode ? 0 : undefined; // lets keyboard users reach plain text while flagging

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const em = email.trim();
    // BUG empty-submit: required fields are not validated.
    if (!em || !password) {
      setStatus({ kind: "welcome", name: em || "qonaq", emptySubmit: true });
      return;
    }
    if (em.toLowerCase() === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      setStatus({ kind: "welcome", name: "Aysel", emptySubmit: false });
      return;
    }
    // BUG error-leak: message reveals whether the account exists.
    setStatus({
      kind: "error",
      message:
        em.toLowerCase() === DEMO_ACCOUNT.email
          ? "Şifrə yanlışdır. Bu email qeydiyyatdadır."
          : "Bu email ilə hesab tapılmadı.",
    });
  }

  if (status.kind === "welcome") {
    return (
      <div className="mx-auto grid w-full max-w-sm gap-4 px-4 py-10 text-center sm:py-14">
        <div
          data-bug={status.emptySubmit ? "empty-submit" : undefined}
          tabIndex={tab}
          className="grid justify-items-center gap-3 rounded-lg p-2"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-pass-soft text-pass">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold text-ink">Xoş gəldin, {status.name}!</h2>
          <p className="text-sm text-muted">Hesabına uğurla daxil oldun.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPassword("");
            setStatus({ kind: "idle" });
          }}
          className="mx-auto inline-flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-ink-2 hover:bg-surface-2"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Çıxış
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center gap-2" tabIndex={tab}>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-iris text-sm font-bold text-white" aria-hidden>
          N
        </span>
        <span className="font-semibold text-ink">Narix Pay</span>
      </div>
      <h2 className="text-xl font-semibold text-ink" tabIndex={tab}>Hesabına daxil ol</h2>
      <p className="mt-1 text-sm text-muted" tabIndex={tab}>Davam etmək üçün email və şifrəni yaz.</p>

      <form noValidate onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-email`} className="text-sm font-medium text-ink-2">Email</label>
          <input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="ad@domen.az"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* BUG password-visible: type="text" instead of type="password" */}
        <div data-bug="password-visible" className="grid gap-1.5">
          <label htmlFor={`${id}-password`} className="text-sm font-medium text-ink-2">Şifrə</label>
          <input
            id={`${id}-password`}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </div>

        <label
          data-bug={remember && !rememberTouched ? "remember-checked" : undefined}
          className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink-2"
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => {
              setRemember(e.target.checked);
              setRememberTouched(true);
            }}
            className="h-4 w-4 rounded border-line-strong accent-iris"
          />
          Məni xatırla
        </label>

        {status.kind === "error" && (
          <p
            role="alert"
            data-bug="error-leak"
            tabIndex={tab}
            className="rounded-md border border-bug/30 bg-bug-soft px-3 py-2 text-sm text-bug"
          >
            {status.message}
          </p>
        )}

        {/* BUG button-typo: “Daxl ol” instead of “Daxil ol” */}
        <button
          type="submit"
          data-bug="button-typo"
          className="h-10 rounded-md bg-iris text-sm font-semibold text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] transition hover:bg-iris-strong"
        >
          Daxl ol
        </button>
      </form>

      <p className={cn("mt-6 rounded-md border border-dashed border-line bg-surface-2/60 px-3 py-2 text-xs text-muted")} tabIndex={tab}>
        Test hesabı: <span className="font-mono text-ink-2">{DEMO_ACCOUNT.email}</span> /{" "}
        <span className="font-mono text-ink-2">{DEMO_ACCOUNT.password}</span>
      </p>
    </div>
  );
}
