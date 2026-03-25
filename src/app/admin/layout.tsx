import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "TEACHER") redirect("/dashboard");
  return <AdminShell>{children}</AdminShell>;
}
