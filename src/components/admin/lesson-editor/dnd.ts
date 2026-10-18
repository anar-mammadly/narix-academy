import type { Modifier } from "@dnd-kit/core";

/** Keeps dragged blocks on the vertical axis (avoids sideways page scroll on phones). */
export const restrictToVerticalAxisSafe: Modifier = ({ transform }) => ({ ...transform, x: 0 });
