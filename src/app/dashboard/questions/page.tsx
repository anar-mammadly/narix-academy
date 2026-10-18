import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { flattenPath, getStudentPath } from "@/lib/curriculum";
import { PageHeader } from "@/components/layout/PageHeader";
import { getQuestionFeed } from "@/app/api/questions/query";
import QuestionsClient from "./QuestionsClient";

export const metadata = { title: "Suallar" };

export default async function QuestionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const lessons = flattenPath(await getStudentPath(session.userId));
  const feed = await getQuestionFeed(session, { filter: "all", q: "", skip: 0 }, lessons.map((l) => l.id));

  return (
    <>
      <PageHeader title="Suallar" description="Müəllimə və qrup yoldaşlarına sual ver, cavabları izlə." />
      <QuestionsClient
        initial={feed}
        lessons={lessons.map((l) => ({ value: l.id, label: `${l.moduleTitle} · ${l.title}` }))}
      />
    </>
  );
}
