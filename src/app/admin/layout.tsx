import { redirect } from "next/navigation";
import { getSession } from "@/server/auth";
import { AdminShell } from "@/frontend/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "TEACHER") redirect("/dashboard");
  return <AdminShell>{children}</AdminShell>;
}
