import { Badge } from "@mantine/core";

/** Stored permit number with an SST badge when applicable. */
export default function SstPermitNumber({
  number,
  isSst,
  className,
}: {
  number: string;
  isSst: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <span className="font-mono">{number}</span>
      {isSst && (
        <Badge size="sm" variant="light" color="plum" radius="md">
          SST
        </Badge>
      )}
    </span>
  );
}
