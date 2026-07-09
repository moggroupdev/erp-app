"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import copyToClipboard from "@/lib/helpers/copy-to-clipboard";
import { useI18n } from "@/lib/i18n/hooks";

export default function CopyButton({ text, className }: { text: string; className?: string }) {
  const { translate } = useI18n();
  const [copied, setCopied] = useState(false);

  const label = copied ? translate("Copied!", "تم النسخ!") : translate("Copy", "نسخ");

  return (
    <button
      type="button"
      title={label}
      onClick={() => copyToClipboard(text, setCopied)}
      className={`rounded-md p-1 transition-colors ${
        copied ? "bg-teal-50 text-teal-600" : "bg-blue-50 text-blue-400 hover:text-blue-600"
      } ${className ?? ""}`}
    >
      {copied ? <Check size={12.5} strokeWidth={2.5} /> : <Copy size={12.5} />}
    </button>
  );
}
