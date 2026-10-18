import { redirect } from "next/navigation";

// Lessons moved to the focused player at /learn/[slug].
export default async function LegacyLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/learn/${slug}`);
}
