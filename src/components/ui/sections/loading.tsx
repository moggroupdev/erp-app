import { useI18n } from "@/lib/i18n/hooks";
import { Loader2 } from "lucide-react";

export default function LoadingSection({ message, className = "" }: { message?: string; className?: string }) {
  const { translation } = useI18n();

  return (
    <section className={`flex-center flex-1 flex-col gap-4 rounded-xl bg-gray-100 p-10 ${className}`}>
      <div className="animate-spin text-gray-600">{<Loader2 size={20} />}</div>
      <p>{message || translation.loading}</p>
    </section>
  );
}
