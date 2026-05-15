import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Award, CheckCircle2 } from "lucide-react";
import { calculateProgress } from "@/lib/utils";

export default async function CertificatePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [totalLessons, progress, certificates] = await Promise.all([
    prisma.lesson.count({ where: { published: true } }),
    prisma.progress.findMany({ where: { userId: session.userId } }),
    prisma.certificate.findMany({ where: { userId: session.userId }, orderBy: { issuedAt: "desc" } }),
  ]);

  const completed = progress.filter(p => p.completed).length;
  const pct = calculateProgress(completed, totalLessons);
  const canClaim = pct >= 80 && certificates.length === 0;

  async function claimCertificate() {
    "use server";
    const s = await (await import("@/lib/auth")).requireSession();
    await (await import("@/lib/prisma")).prisma.certificate.create({
      data: { userId: s.userId, title: "Manual QA — Narix Academy" },
    });
    (await import("next/cache")).revalidatePath("/dashboard/certificate");
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Award size={24} className="text-yellow-500" /> Sertifikat
        </h1>
        <p className="text-muted mt-1">Kursu tamamlayaraq sertifikat əldə et</p>
      </div>

      {/* Progress to certificate */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-gray-900">Sertifikat üçün irəliləyiş</div>
            <div className="text-sm text-muted">80% tamamlanma tələb olunur</div>
          </div>
          <div className="text-3xl font-bold text-blue-700">{pct}%</div>
        </div>
        <div className="progress-bar mb-4">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-sm text-muted">{completed}/{totalLessons} dərs tamamlandı</div>
      </div>

      {canClaim && (
        <div className="card border-yellow-200 bg-yellow-50 text-center py-8">
          <Award size={48} className="text-yellow-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Təbrik edirik! 🎉</h2>
          <p className="text-muted mb-4">Sertifikat almağa haqqınız var</p>
          <form action={claimCertificate}>
            <button type="submit" className="btn-primary btn-lg">
              Sertifikatı əldə et
            </button>
          </form>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="space-y-3">
          {certificates.map(cert => (
            <div key={cert.id} className="card border-green-200 bg-green-50">
              <div className="flex items-center gap-4">
                <Award size={40} className="text-yellow-500 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{cert.title}</div>
                  <div className="text-sm text-muted">
                    {new Date(cert.issuedAt).toLocaleDateString("az-AZ")}
                  </div>
                  <div className="text-xs text-muted mt-0.5 font-mono">#{cert.code.slice(0, 12)}</div>
                </div>
                <CheckCircle2 size={24} className="text-green-500 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!canClaim && certificates.length === 0 && pct < 80 && (
        <div className="card text-center text-muted py-8">
          Sertifikat almaq üçün dərslərin ən azı 80%-ni tamamlayın.<br />
          Hələ {80 - pct}% qalıb.
        </div>
      )}
    </div>
  );
}
