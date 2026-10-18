import {
  BookOpen, Bot, Bug, ClipboardList, FileCheck2, Layers, PenTool, Sparkles, Workflow, Wrench, type LucideIcon, type LucideProps,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = { BookOpen, Bot, Bug, ClipboardList, FileCheck2, Layers, PenTool, Sparkles, Workflow, Wrench };

export function ModuleIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? BookOpen;
  return <Icon aria-hidden {...props} />;
}
