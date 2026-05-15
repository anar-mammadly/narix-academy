import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import StudentSidebar from "@/components/student/StudentSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "TEACHER") redirect("/admin");

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <StudentSidebar session={session} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
