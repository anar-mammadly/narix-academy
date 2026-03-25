import { createHmac, timingSafeEqual } from "crypto";

function base64urlEncode(data: Buffer | string): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecodeToBuffer(segment: string): Buffer {
  let s = segment.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

export type SessionPayload = {
  sub: string;
  role: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
};

export function signJwt(
  payload: Omit<SessionPayload, "iat" | "exp">,
  secret: string,
  expiresInSeconds: number
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const h = base64urlEncode(JSON.stringify(header));
  const p = base64urlEncode(JSON.stringify(body));
  const sig = createHmac("sha256", secret).update(`${h}.${p}`).digest();
  const s = base64urlEncode(sig);
  return `${h}.${p}.${s}`;
}

export function verifyJwt(
  token: string,
  secret: string
): { valid: true; payload: SessionPayload } | { valid: false } {
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false };
  const [h, p, s] = parts;
  if (!h || !p || !s) return { valid: false };
  const expected = createHmac("sha256", secret).update(`${h}.${p}`).digest();
  let sigBuf: Buffer;
  try {
    sigBuf = base64urlDecodeToBuffer(s);
  } catch {
    return { valid: false };
  }
  if (sigBuf.length !== expected.length || !timingSafeEqual(sigBuf, expected)) {
    return { valid: false };
  }
  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64urlDecodeToBuffer(p).toString("utf8")) as SessionPayload;
  } catch {
    return { valid: false };
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) {
    return { valid: false };
  }
  return { valid: true, payload };
}
