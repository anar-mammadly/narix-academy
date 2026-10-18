import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJson, type QuizContent } from "@/types/blocks";
import { PageHeader } from "@/components/layout/PageHeader";
import ReviewSession, { type ReviewCard } from "./ReviewSession";

export const metadata: Metadata = { title: "Təkrar" };

export default async function ReviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [due, upcoming] = await Promise.all([
    prisma.reviewItem.findMany({
      where: { userId: session.userId, dueAt: { lte: new Date() } },
      orderBy: { dueAt: "asc" },
      take: 15,
      include: { block: { select: { content: true, lesson: { select: { title: true, slug: true } } } } },
    }),
    prisma.reviewItem.count({ where: { userId: session.userId, dueAt: { gt: new Date() } } }),
  ]);

  // Only the question text and options go to the browser — never the answer.
  const cards: ReviewCard[] = due.flatMap((item) => {
    const q = parseJson<QuizContent>(item.block.content, { questions: [] }).questions.find((x) => x.id === item.questionId);
    return q ? [{ id: item.id, box: item.box, text: q.text, options: q.options, lessonTitle: item.block.lesson.title, lessonSlug: item.block.lesson.slug }] : [];
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Təkrar"
        description="Quizlərdə səhv etdiyin suallar fasilələrlə qayıdır: düz cavab verdikcə daha gec görünür. Hər düz cavab +3 XP."
      />
      <ReviewSession cards={cards} upcoming={upcoming} />
    </div>
  );
}
