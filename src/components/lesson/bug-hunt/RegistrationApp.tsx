"use client";

// Fake "Narix Kurslar" sign-up form with five seeded defects (see src/lib/bug-hunt.ts → registration).
// Elements showing a defect carry data-bug="<id>" only while the defect is visible.

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Check, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MiniAppProps } from "./LoginApp";

const inputCls =
  "h-10 w-full min-w-0 rounded-md border bg-surface px-3 text-sm text-ink placeholder:text-muted outline-none transition focus:border-iris focus:ring-2 focus:ring-iris/25";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Field = "name" | "age" | "email" | "password";

function Hint({ tone, children, bug, tab }: { tone: "error" | "ok"; children: ReactNode; bug?: string; tab?: number }) {
  return (
    <p
      data-bug={bug}
      tabIndex={tab}
      className={cn("flex items-center gap-1 text-xs", tone === "error" ? "text-bug" : "text-pass")}
    >
      {tone === "ok" && <Check className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </p>
  );
}

export default function RegistrationApp({ flagMode }: MiniAppProps) {
  const id = useId();
  const [values, setValues] = useState<Record<Field, string>>({ name: "", age: "", email: "", password: "" });
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, age: false, email: false, password: false });
  const [terms, setTerms] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const tab = flagMode ? 0 : undefined;

  const set = (f: Field) => (v: string) => setValues((s) => ({ ...s, [f]: v }));
  const touch = (f: Field) => () => setTouched((s) => ({ ...s, [f]: true }));

  // Name
  const nameError = values.name.trim() ? null : "Bu sahə məcburidir";

  // Age — BUG age-boundary: `age > 18` instead of `age >= 18`.
  const ageNum = Number(values.age);
  const ageError = !values.age.trim()
    ? "Yaşı daxil edin"
    : !Number.isInteger(ageNum)
      ? "Yaş tam ədəd olmalıdır"
      : ageNum > 18 && ageNum <= 60
        ? null
        : "Yaş 18–60 aralığında olmalıdır";
  const ageBug = ageError !== null && ageNum === 18;

  // Email — BUG email-validation: any non-empty text is reported as valid.
  const emailError = values.email.trim() ? null : "Email daxil edin";
  const emailBug = !!values.email.trim() && !EMAIL_RE.test(values.email.trim());

  // Password — BUG password-length: minimum checked as 6 instead of 8.
  const pwLen = values.password.length;
  const passwordError = pwLen === 0 ? "Şifrə daxil edin" : pwLen < 6 ? "Şifrə ən az 8 simvol olmalıdır" : null;
  const passwordBug = pwLen >= 6 && pwLen < 8;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ name: true, age: true, email: true, password: true });
    if (nameError || ageError || emailError || passwordError) return;
    setDone(values.name.trim());
  }

  if (done !== null) {
    return (
      <div className="mx-auto grid w-full max-w-sm justify-items-center gap-3 px-4 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-pass-soft text-pass">
          <PartyPopper className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-ink" tabIndex={tab}>Hesab yaradıldı!</h2>
        <p className="text-sm text-muted" tabIndex={tab}>Təsdiq linki {values.email.trim()} ünvanına göndərildi.</p>
        <button
          type="button"
          onClick={() => setDone(null)}
          className="mt-2 inline-flex h-9 items-center rounded-md border border-line px-3 text-sm font-medium text-ink-2 hover:bg-surface-2"
        >
          Yeni qeydiyyat
        </button>
      </div>
    );
  }

  const fieldBorder = (err: boolean) => (err ? "border-bug/60" : "border-line");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <h2 className="text-xl font-semibold text-ink" tabIndex={tab}>Narix Kurslara qoşul</h2>
      <p className="mt-1 text-sm text-muted" tabIndex={tab}>Pulsuz hesab yarat və ilk dərsə başla.</p>

      <form noValidate onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          {/* BUG name-label: label says “Soyad” for the first-name field */}
          <div data-bug="name-label" className="grid min-w-0 gap-1.5">
            <label htmlFor={`${id}-name`} className="text-sm font-medium text-ink-2">Soyad</label>
            <input
              id={`${id}-name`}
              autoComplete="off"
              placeholder="Məs: Aysel"
              value={values.name}
              onChange={(e) => set("name")(e.target.value)}
              onBlur={touch("name")}
              aria-invalid={touched.name && !!nameError}
              className={cn(inputCls, fieldBorder(touched.name && !!nameError))}
            />
            {touched.name && nameError && <Hint tone="error" tab={tab}>{nameError}</Hint>}
          </div>

          <div data-bug={touched.age && ageBug ? "age-boundary" : undefined} className="grid min-w-0 content-start gap-1.5">
            <label htmlFor={`${id}-age`} className="text-sm font-medium text-ink-2">Yaş</label>
            <input
              id={`${id}-age`}
              type="number"
              inputMode="numeric"
              placeholder="18–60"
              value={values.age}
              onChange={(e) => set("age")(e.target.value)}
              onBlur={touch("age")}
              aria-invalid={touched.age && !!ageError}
              className={cn(inputCls, fieldBorder(touched.age && !!ageError))}
            />
            {touched.age && ageError && <Hint tone="error" tab={tab}>{ageError}</Hint>}
          </div>
        </div>

        <div data-bug={emailBug ? "email-validation" : undefined} className="grid gap-1.5">
          <label htmlFor={`${id}-email`} className="text-sm font-medium text-ink-2">Email</label>
          <input
            id={`${id}-email`}
            type="text"
            inputMode="email"
            autoComplete="off"
            placeholder="ad@domen.az"
            value={values.email}
            onChange={(e) => set("email")(e.target.value)}
            onBlur={touch("email")}
            aria-invalid={touched.email && !!emailError}
            className={cn(inputCls, fieldBorder(touched.email && !!emailError))}
          />
          {values.email.trim() ? (
            <Hint tone="ok" tab={tab}>Email formatı düzgündür</Hint>
          ) : (
            touched.email && emailError && <Hint tone="error" tab={tab}>{emailError}</Hint>
          )}
        </div>

        <div data-bug={passwordBug ? "password-length" : undefined} className="grid gap-1.5">
          <label htmlFor={`${id}-password`} className="text-sm font-medium text-ink-2">Şifrə</label>
          <input
            id={`${id}-password`}
            type="password"
            autoComplete="new-password"
            placeholder="Ən az 8 simvol"
            value={values.password}
            onChange={(e) => set("password")(e.target.value)}
            onBlur={touch("password")}
            aria-invalid={(touched.password || pwLen > 0) && !!passwordError}
            className={cn(inputCls, fieldBorder((touched.password || pwLen > 0) && !!passwordError))}
          />
          {pwLen > 0 && !passwordError ? (
            <div className="grid gap-1">
              <div className="flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1 flex-1 rounded-full bg-pass-bright" />
                ))}
              </div>
              <Hint tone="ok" tab={tab}>Güclü şifrə</Hint>
            </div>
          ) : (
            (touched.password || pwLen > 0) && passwordError && <Hint tone="error" tab={tab}>{passwordError}</Hint>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-iris"
          />
          <span>
            <span className="font-medium text-ink">İstifadə şərtlərini</span> oxudum və qəbul edirəm
          </span>
        </label>

        {/* BUG terms-button: should be disabled until terms are accepted */}
        <button
          type="submit"
          data-bug={!terms ? "terms-button" : undefined}
          className="h-10 rounded-md bg-iris text-sm font-semibold text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] transition hover:bg-iris-strong"
        >
          Qeydiyyatdan keç
        </button>
      </form>
    </div>
  );
}
