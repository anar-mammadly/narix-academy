import type { Metadata } from "next";
import { PlaygroundClient } from "@/frontend/components/playground/PlaygroundClient";

export const metadata: Metadata = {
  title: "Playground — QA Academy",
  description: "QA praktika zonası: nümunə test materialları və veb önizləmə.",
};

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
