"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  items: TabItem[];
  className?: string;
}

export function Tabs({ value, onValueChange, items, className }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange}>
      <RadixTabs.List className={cn("flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1", className)}>
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-card"
          >
            {item.icon}
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
