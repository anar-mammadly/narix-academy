"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, requestJson } from "../request";
import type { SaveStatus } from "./types";

export const AUTOSAVE_DELAY = 700;

type Payload = { title: string | null; content: unknown };

/**
 * Debounced, serialised autosave for one block.
 * Changes are coalesced for AUTOSAVE_DELAY ms; at most one request is in flight,
 * and edits made during a request are sent right after it finishes.
 */
export function useBlockAutosave(lessonId: string, blockId: string) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<Payload | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const url = `/api/lessons/${lessonId}/blocks/${blockId}`;

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inFlight.current) return; // the running loop picks up the new payload
    inFlight.current = true;
    try {
      while (pending.current) {
        const payload = pending.current;
        pending.current = null;
        setStatus("saving");
        try {
          await requestJson(url, "PATCH", payload);
          setError(null);
        } catch (e) {
          // Keep the newest edits if any arrived meanwhile; otherwise retry this payload later.
          pending.current = pending.current ?? payload;
          setError(errorMessage(e));
          setStatus("error");
          return;
        }
      }
      setStatus("saved");
    } finally {
      inFlight.current = false;
    }
  }, [url]);

  const schedule = useCallback(
    (payload: Payload) => {
      pending.current = payload;
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY);
    },
    [flush]
  );

  // Send unsaved edits when the card unmounts (navigation, block removed from view).
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (pending.current) {
        void fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending.current),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [url]);

  return { status, error, schedule, flush };
}
