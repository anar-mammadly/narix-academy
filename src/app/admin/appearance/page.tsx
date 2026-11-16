import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { getAppearance } from "@/lib/site-settings";
import { PageHeader } from "@/components/layout/PageHeader";
import { AppearanceClient } from "./AppearanceClient";

export const metadata: Metadata = { title: "Görünüş" };

export default async function AppearancePage() {
  await requireTeacher();
  return (
    <>
      <PageHeader title="Görünüş" description="Platformadakı qrafikləri, illüstrasiyaları və şəkilləri yandırın, söndürün və ya dəyişin. Dəyişiklik dərhal bütün tələbələr üçün qüvvəyə minir." />
      <AppearanceClient initial={await getAppearance()} />
    </>
  );
}
