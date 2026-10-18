"use client";

import { useSyncExternalStore } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { az } from "date-fns/locale";
import { formatDate } from "@/lib/utils";

const noop = () => () => {};

/**
 * "5 dəqiqə əvvəl". The server and the first client render show the fixed
 * Baku-time date so hydration matches; the relative text appears after mount.
 */
export function RelativeTime({ iso, className }: { iso: string | Date; className?: string }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const d = new Date(iso);
  return (
    <time dateTime={d.toISOString()} title={formatDate(d)} className={className}>
      {mounted ? formatDistanceToNowStrict(d, { addSuffix: true, locale: az }) : formatDate(d)}
    </time>
  );
}
