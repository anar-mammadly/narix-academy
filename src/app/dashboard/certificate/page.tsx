import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { COURSE_TITLE, getCertificateProgress } from "@/app/api/certificate/eligibility";
import { formatAzDate } from "../calendar/az-date";
import CertificateClient from "./CertificateClient";

export const metadata = { title: "Sertifikat" };

async function siteOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function CertificatePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [progress, cert, user, origin] = await Promise.all([
    getCertificateProgress(session.userId),
    prisma.certificate.findFirst({ where: { userId: session.userId }, orderBy: { issuedAt: "asc" }, select: { code: true, issuedAt: true } }),
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } }),
    siteOrigin(),
  ]);

  return (
    <>
      <PageHeader
        title="Sertifikat"
        description={cert ? "Sertifikatın hazırdır. Yüklə və ya linki paylaş." : "Dərslərin 80%-ni bitir və sertifikatını al."}
      />
      <CertificateClient
        progress={progress}
        name={user?.name ?? session.name}
        course={COURSE_TITLE}
        origin={origin}
        certificate={cert ? { code: cert.code, date: formatAzDate(cert.issuedAt) } : null}
        today={formatAzDate(new Date())}
      />
    </>
  );
}
