import { requestTime } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonStyles } from "@/components/ui/Button";
import { loadStudentRows } from "@/components/admin/student-stats";
import { StudentsClient } from "@/components/admin/StudentsClient";

export const metadata: Metadata = { title: "Tələbələr" };

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requireTeacher();
  const [{ rows, totalLessons }, sp] = await Promise.all([loadStudentRows(), searchParams]);

  return (
    <div>
      <PageHeader
        title="Tələbələr"
        description={`${rows.length} tələbə · ${totalLessons} yayımlanmış dərs`}
        actions={
          <Link href="/admin/students/new" className={buttonStyles()}>
            <UserPlus className="h-4 w-4" aria-hidden /> Tələbə əlavə et
          </Link>
        }
      />
      <StudentsClient rows={rows} totalLessons={totalLessons} initialFilter={sp.filter === "inactive" ? "inactive" : "all"} serverNow={requestTime()} />
    </div>
  );
}
