import { Button } from "@mantine/core";
import { Loader2 } from "lucide-react";
import ErrorAlert from "@/components/ui/error-alert";
import Link from "next/link";

type Props = {
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  leave?: { to: string; label: string; hint: string };
  requiredFields?: Record<string, string>;
  isValidated?: boolean;
  error: string;
  loading: boolean;
  children: React.ReactNode;
};

export default function AuthForm({
  onSubmit,
  submitLabel,
  leave,
  requiredFields,
  isValidated,
  error,
  loading,
  children,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="animate-fade-in mx-auto flex w-[450px] max-w-full flex-col gap-4">
      {children}

      <Button
        size="md"
        type="submit"
        disabled={(requiredFields && !hasCompleteData(requiredFields)) || isValidated === false || loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : submitLabel}
      </Button>

      {error && <ErrorAlert error={error} fade />}

      {leave && (
        <p className="flex items-center justify-center gap-1">
          <span>{leave.hint}</span>
          <Link href={leave.to} style={{ fontWeight: 500 }} className="text-blue-500 hover:text-blue-600">
            {leave.label}
          </Link>
        </p>
      )}
    </form>
  );
}

function hasCompleteData(data: Record<string, string>) {
  return Object.values(data).every((value) => value !== "");
}
