"use client";

// Fake "Narix Shop" cart with five seeded defects (see src/lib/bug-hunt.ts → cart).
// Elements showing a defect carry data-bug="<id>" only while the defect is visible.

import { useId, useState, type FormEvent } from "react";
import { CheckCircle2, Headphones, Minus, Plus, Smartphone, Tag, Trash2, Truck, Cable } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MiniAppProps } from "./LoginApp";

type Item = { id: string; name: string; meta: string; price: number; qty: number; removed: boolean; icon: typeof Headphones };

const INITIAL: Item[] = [
  { id: "headphones", name: "Simsiz qulaqcıq", meta: "Qara · Bluetooth 5.3", price: 25, qty: 1, removed: false, icon: Headphones },
  { id: "cable", name: "USB-C kabel", meta: "1 m · 60 W", price: 8, qty: 1, removed: false, icon: Cable },
  { id: "case", name: "Telefon örtüyü", meta: "Silikon · Mavi", price: 12, qty: 1, removed: false, icon: Smartphone },
];

const FREE_SHIPPING_FROM = 50;
const SHIPPING_FEE = 4.99;
const azn = (n: number) => `${n.toFixed(2)} ₼`;

export default function CartApp({ flagMode }: MiniAppProps) {
  const id = useId();
  const [items, setItems] = useState<Item[]>(INITIAL);
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<{ applied: boolean; error: string | null }>({ applied: false, error: null });
  const [ordered, setOrdered] = useState(false);
  const tab = flagMode ? 0 : undefined;

  // BUG negative-qty: no lower bound on quantity.
  const changeQty = (itemId: string, delta: number) =>
    setItems((list) => list.map((it) => (it.id === itemId ? { ...it, qty: it.qty + delta } : it)));
  // BUG remove-fails: item is only marked, never removed, and still counted.
  const remove = (itemId: string) =>
    setItems((list) => list.map((it) => (it.id === itemId ? { ...it, removed: true } : it)));

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  // BUG promo-wrong: `/ 1000` instead of `/ 100` → 1% instead of 10%.
  const discount = promo.applied ? (subtotal * 10) / 1000 : 0;
  const afterDiscount = subtotal - discount;
  // BUG shipping-threshold: threshold compared against 500 instead of 50.
  const shipping = afterDiscount > 0 && afterDiscount <= FREE_SHIPPING_FROM * 10 ? SHIPPING_FEE : 0;
  const shippingBug = afterDiscount > FREE_SHIPPING_FROM && shipping > 0;
  const total = afterDiscount + shipping;
  const count = items.reduce((s, it) => s + it.qty, 0);
  const leftForFree = Math.max(0, FREE_SHIPPING_FROM - afterDiscount);

  function applyPromo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return setPromo({ applied: false, error: "Promo kodu daxil edin" });
    if (c === "SAVE10") return setPromo({ applied: true, error: null });
    setPromo({ applied: false, error: "Bu promo kod etibarsızdır" });
  }

  if (ordered) {
    return (
      <div className="mx-auto grid w-full max-w-sm justify-items-center gap-3 px-4 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-pass-soft text-pass">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-ink" tabIndex={tab}>Sifariş qəbul edildi</h2>
        <p className="text-sm text-muted" tabIndex={tab}>Ödəniləcək məbləğ: {azn(total)}</p>
        <button
          type="button"
          onClick={() => setOrdered(false)}
          className="mt-2 inline-flex h-9 items-center rounded-md border border-line px-3 text-sm font-medium text-ink-2 hover:bg-surface-2"
        >
          Səbətə qayıt
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-3 sm:p-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0">
        <h2 className="mb-3 text-lg font-semibold text-ink" tabIndex={tab}>
          Səbət <span className="text-sm font-normal text-muted">({count} məhsul)</span>
        </h2>
        <ul className="grid gap-2">
          {items.map((it) => {
            const Icon = it.icon;
            // BUG total-not-updated: headphones line total ignores quantity.
            const lineTotal = it.id === "headphones" ? it.price : it.price * it.qty;
            const lineBug = it.id === "headphones" && it.qty !== 1;
            return (
              <li
                key={it.id}
                data-bug={it.removed ? "remove-fails" : undefined}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3",
                  it.removed && "opacity-45"
                )}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1" tabIndex={tab}>
                  <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                  <p className="truncate text-xs text-muted">{it.meta} · {azn(it.price)}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center rounded-md border border-line">
                    <button
                      type="button"
                      onClick={() => changeQty(it.id, -1)}
                      aria-label={`${it.name}: miqdarı azalt`}
                      className="grid h-8 w-8 place-items-center text-ink-2 hover:bg-surface-2"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <span
                      data-bug={it.qty < 1 ? "negative-qty" : undefined}
                      tabIndex={tab}
                      aria-label={`Miqdar: ${it.qty}`}
                      className="w-8 text-center text-sm font-semibold tabular-nums text-ink"
                    >
                      {it.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQty(it.id, 1)}
                      aria-label={`${it.name}: miqdarı artır`}
                      className="grid h-8 w-8 place-items-center text-ink-2 hover:bg-surface-2"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  <span
                    data-bug={lineBug ? "total-not-updated" : undefined}
                    tabIndex={tab}
                    className="w-16 text-right text-sm font-semibold tabular-nums text-ink"
                  >
                    {azn(lineTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    aria-label={`${it.name}: sil`}
                    className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-bug-soft hover:text-bug"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="grid content-start gap-3 rounded-lg border border-line bg-surface-2/50 p-4">
        <p className="flex items-center gap-2 text-xs text-ink-2" tabIndex={tab}>
          <Truck className="h-4 w-4 shrink-0 text-sky" aria-hidden />
          {leftForFree > 0
            ? `Pulsuz çatdırılmaya ${azn(leftForFree)} qaldı`
            : "Pulsuz çatdırılma qazandınız!"}
        </p>

        <form onSubmit={applyPromo} className="grid gap-1.5">
          <label htmlFor={`${id}-promo`} className="text-xs font-medium text-ink-2">Promo kod</label>
          <div className="flex gap-2">
            <input
              id={`${id}-promo`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SAVE10"
              autoComplete="off"
              className="h-9 w-full min-w-0 rounded-md border border-line bg-surface px-3 text-sm uppercase text-ink placeholder:normal-case placeholder:text-muted outline-none focus:border-iris focus:ring-2 focus:ring-iris/25"
            />
            <button type="submit" className="h-9 shrink-0 rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-3">
              Tətbiq et
            </button>
          </div>
          {promo.error && <p role="alert" className="text-xs text-bug" tabIndex={tab}>{promo.error}</p>}
          {promo.applied && (
            <p className="flex items-center gap-1 text-xs text-pass" tabIndex={tab}>
              <Tag className="h-3.5 w-3.5" aria-hidden /> SAVE10 tətbiq olundu (−10%)
            </p>
          )}
        </form>

        <dl className="grid gap-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between gap-2" tabIndex={tab}>
            <dt className="text-muted">Ara cəm</dt>
            <dd className="tabular-nums text-ink">{azn(subtotal)}</dd>
          </div>
          {promo.applied && (
            <div className="flex justify-between gap-2" data-bug="promo-wrong" tabIndex={tab}>
              <dt className="text-muted">Endirim (SAVE10)</dt>
              <dd className="tabular-nums text-pass">−{azn(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-2" data-bug={shippingBug ? "shipping-threshold" : undefined} tabIndex={tab}>
            <dt className="text-muted">Çatdırılma</dt>
            <dd className="tabular-nums text-ink">{shipping > 0 ? azn(shipping) : "Pulsuz"}</dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-line pt-2 font-semibold" tabIndex={tab}>
            <dt className="text-ink">Yekun</dt>
            <dd className="tabular-nums text-ink">{azn(total)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => setOrdered(true)}
          className="h-10 rounded-md bg-iris text-sm font-semibold text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] transition hover:bg-iris-strong"
        >
          Sifarişi rəsmiləşdir
        </button>
      </aside>
    </div>
  );
}
