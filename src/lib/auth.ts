import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken, type SessionPayload } from "@/lib/session-token";
export { signToken, verifyToken, type SessionPayload } from "@/lib/session-token";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || typeof session.userId !== "string") return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, language: true, isActive: true, sessionVersion: true },
  });
  if (!user?.isActive || user.sessionVersion !== (session.sessionVersion ?? 0)) return null;
  return { userId: user.id, email: user.email, name: user.name, role: user.role, language: user.language, sessionVersion: user.sessionVersion };
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireTeacher(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "TEACHER") throw new Error("Forbidden");
  return session;
}
