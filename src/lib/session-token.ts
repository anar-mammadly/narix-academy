import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "narix-academy-dev-only-secret-min-32-chars!!"
);

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
  language: string;
  sessionVersion?: number;
};

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

