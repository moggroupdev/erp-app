"use client";

import { Table } from "@mantine/core";
import { sumColumnMinWidths } from "../table-layout";

export default function RfqFixedTable({
  columnWidths,
  className = "",
  verticalSpacing = 4,
  scrollClassName = "",
  children,
}: {
  columnWidths: number[];
  className?: string;
  verticalSpacing?: number | "xs";
  scrollClassName?: string;
  children: React.ReactNode;
}) {
  const minWidth = sumColumnMinWidths(columnWidths);

  return (
    <div className={`w-full max-w-full overflow-x-auto ${scrollClassName}`.trim()}>
      <Table
        withColumnBorders
        className={`table-fixed [&_td]:align-middle! [&_th]:align-middle! ${className}`.trim()}
        style={{ width: "100%", minWidth }}
        horizontalSpacing="xs"
        verticalSpacing={verticalSpacing}
      >
        <colgroup>
          {columnWidths.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
        </colgroup>
        {children}
      </Table>
    </div>
  );
}
