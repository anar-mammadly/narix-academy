import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TEACHER") redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <AdminSidebar session={session} />
      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden h-14 shrink-0" />
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
