/** True when src is absolute http(s) — Next/Image requires remotePatterns unless unoptimized */
export function isRemoteImageSrc(src: string): boolean {
  return /^https?:\/\//i.test(src.trim());
}
