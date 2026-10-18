"use client";

const COLORS = ["#5b4bff", "#12c48b", "#ffb547", "#ff4766", "#2bb8ff", "#ff7a1a"];

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export async function burst(intensity: "small" | "big" = "small") {
  if (reducedMotion()) return;
  const confetti = (await import("canvas-confetti")).default;
  if (intensity === "small") {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.75 }, colors: COLORS, scalar: 0.9, disableForReducedMotion: true });
    return;
  }
  const end = Date.now() + 900;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS, disableForReducedMotion: true });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
