"use client";

export function formatSnapshotValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function SnapshotValue({ value }: { value: unknown }) {
  const formatted = formatSnapshotValue(value);
  const isLong = formatted.length > 120;

  if (isLong) {
    return (
      <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-xs text-gray-700">
        {formatted}
      </pre>
    );
  }

  return <span className="break-all">{formatted}</span>;
}
