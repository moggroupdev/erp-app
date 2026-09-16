"use client";

import { useDisclosure } from "@mantine/hooks";
import { Collapse } from "@mantine/core";
import { Braces, ChevronDown } from "lucide-react";
import CopyButton from "@/components/ui/copy-button";
import type { AuditLogSnapshot } from "@/types/audit-log";

type SnapshotJsonSectionProps = {
  title: string;
  snapshot: AuditLogSnapshot | null;
};

export default function SnapshotJsonSection({ title, snapshot }: SnapshotJsonSectionProps) {
  const [opened, { toggle }] = useDisclosure(false);

  if (!snapshot) return null;

  const jsonText = JSON.stringify(snapshot, null, 2);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className={`flex items-center gap-2 px-3 py-2 ${opened ? "border-b border-gray-200 bg-gray-50" : ""}`}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={opened}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-start text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
            <Braces size={14} />
          </span>
          <span className="min-w-0 flex-1 truncate">{title}</span>
          <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${opened ? "rotate-180" : ""}`} />
        </button>
        <CopyButton text={jsonText} />
      </div>
      <Collapse in={opened}>
        <pre dir="ltr" className="max-h-[450px] overflow-auto bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
          {jsonText}
        </pre>
      </Collapse>
    </section>
  );
}
