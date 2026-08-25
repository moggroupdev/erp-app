import type { ReactNode } from "react";

export default function PrintTable({
  headers,
  rows,
  emptyLabel,
  monoColumnIndexes = [],
  noWrapIndexes,
  footerRow,
  tableClassName,
  columnWidths,
}: {
  headers: string[];
  rows: ReactNode[][];
  emptyLabel: string;
  monoColumnIndexes?: number[];
  /** Column indexes that get `text-nowrap`. When omitted, all columns wrap normally. */
  noWrapIndexes?: number[];
  footerRow?: ReactNode[];
  /** Override the default table font-size class (e.g. `"text-[9px]"`). */
  tableClassName?: string;
  /** Optional fixed widths per column (e.g. `"8%"`, `"42%"`). */
  columnWidths?: string[];
}) {
  if (rows.length === 0 && !footerRow) {
    return <p className="py-2 text-[10px] text-gray-500">{emptyLabel}</p>;
  }

  function cellClasses(cellIndex: number) {
    const parts = ["px-2.5 py-2"];
    if (monoColumnIndexes.includes(cellIndex)) parts.push("font-mono text-gray-600");
    if (noWrapIndexes?.includes(cellIndex)) parts.push("text-nowrap");
    return parts.join(" ");
  }

  return (
    <table className={`w-full border-collapse ${columnWidths ? "table-fixed" : ""} ${tableClassName ?? "text-[10px]"}`}>
      {columnWidths ? (
        <colgroup>
          {columnWidths.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
        </colgroup>
      ) : null}
      <thead className="break-inside-avoid break-after-avoid">
        <tr className="border-b border-gray-300 bg-gray-50 text-[9px] font-medium tracking-wide text-gray-500 uppercase">
          {headers.map((header, headerIndex) => (
            <th key={headerIndex} className="px-2.5 py-2 text-start text-nowrap">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr className="break-inside-avoid border-b border-gray-200">
            <td colSpan={headers.length} className="px-2.5 py-2 text-gray-500">
              {emptyLabel}
            </td>
          </tr>
        ) : (
          rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="break-inside-avoid border-b border-gray-200">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className={cellClasses(cellIndex)}>
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
        {footerRow ? (
          <tr className="break-inside-avoid border-b border-gray-200 bg-gray-50 font-semibold text-gray-700">
            {footerRow.map((cell, cellIndex) => (
              <td key={`footer-${cellIndex}`} className="px-2.5 py-2">
                {cell}
              </td>
            ))}
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
