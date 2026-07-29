export default function PrintTable({
  headers,
  rows,
  emptyLabel,
  monoColumnIndexes = [],
  footerRow,
}: {
  headers: string[];
  rows: string[][];
  emptyLabel: string;
  monoColumnIndexes?: number[];
  footerRow?: string[];
}) {
  if (rows.length === 0) {
    return <p className="py-2 text-[10px] text-gray-500">{emptyLabel}</p>;
  }

  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr className="border-b border-gray-300 bg-gray-50 text-[9px] font-medium tracking-wide text-gray-500 uppercase">
          {headers.map((header) => (
            <th key={header} className="px-2.5 py-2 text-start text-nowrap">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b border-gray-200">
            {row.map((cell, cellIndex) => (
              <td
                key={`${rowIndex}-${cellIndex}`}
                className={`px-2.5 py-2 ${monoColumnIndexes.includes(cellIndex) ? "font-mono text-gray-600" : ""}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footerRow ? (
        <tfoot>
          <tr className="bg-gray-50 font-semibold text-gray-700">
            {footerRow.map((cell, cellIndex) => (
              <td
                key={`footer-${cellIndex}`}
                className={`px-2.5 py-2 ${monoColumnIndexes.includes(cellIndex) ? "font-mono" : ""}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}
