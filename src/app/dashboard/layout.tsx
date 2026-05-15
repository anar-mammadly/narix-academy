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
        {/* Mobile top padding for fixed header */}
        <div className="lg:hidden h-14 shrink-0" />
        <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
        {/* Mobile bottom padding for bottom nav */}
        <div className="lg:hidden h-20 shrink-0" />
      </main>
    </div>
  );
}
