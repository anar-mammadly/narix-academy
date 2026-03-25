import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { StudentShell } from "@/components/student/StudentShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login?next=/dashboard");
  if (s.role !== "STUDENT") redirect("/admin");
  return <StudentShell userName={s.name}>{children}</StudentShell>;
}
