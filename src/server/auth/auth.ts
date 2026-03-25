import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/server/config/constants";
import { verifyJwt, type SessionPayload, signJwt } from "./jwt";
import type { Role } from "@/shared/types/blocks";

export type SessionUser = {
  userId: string;
  role: Role;
  email: string;
  name: string;
};

function getSecret(): string | null {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) return null;
  return s;
}

export async function getSession(): Promise<SessionUser | null> {
  const secret = getSecret();
  if (!secret) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = verifyJwt(token, secret);
  if (!result.valid) return null;
  const { sub, role, email, name } = result.payload;
  if (!sub || (role !== "TEACHER" && role !== "STUDENT")) return null;
  return {
    userId: sub,
    role: role as Role,
    email: email ?? "",
    name: name ?? "",
  };
}

export function createSessionToken(payload: Omit<SessionPayload, "iat" | "exp">): string | null {
  const secret = getSecret();
  if (!secret) return null;
  return signJwt(payload, secret, 60 * 60 * 24 * 7);
}

export async function requireTeacher(): Promise<SessionUser> {
  const s = await getSession();
  if (!s || s.role !== "TEACHER") {
    throw new Error("UNAUTHORIZED");
  }
  return s;
}

export async function requireStudent(): Promise<SessionUser> {
  const s = await getSession();
  if (!s || s.role !== "STUDENT") {
    throw new Error("UNAUTHORIZED");
  }
  return s;
}

export async function requireAuth(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}
