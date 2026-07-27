import { useRef } from "react";
import { Button, Menu } from "@mantine/core";

export default function PrintDocument({
  title,
  buttonLabel,
  children,
  paperWidth,
  paperHeight,
  paperMarginX = 10,
  paperMarginY = 15,
  icon = null,
  buttonType = "menu",
}: {
  title: string;
  buttonLabel?: string;
  children: React.ReactNode;
  paperWidth: number;
  paperHeight: number;
  paperMarginX?: number;
  paperMarginY?: number;
  icon?: React.ReactNode;
  buttonType?: "menu" | "button" | "icon";
}) {
  const label = buttonLabel ?? title;
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = printRef.current.innerHTML;
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");
    const htmlClass = document.documentElement.className;
    const htmlLang = document.documentElement.lang || "en";
    const htmlDir = document.documentElement.dir || "ltr";

    printWindow.document.open();
    printWindow.document.write(`
      <html lang="${htmlLang}" dir="${htmlDir}" class="${htmlClass}">
        <head>
          <title>${title}</title>
          ${stylesheets}
          <style>
            *, *::before, *::after { box-sizing: border-box; }
            html, body { margin: 0; }
            body { display: none; font-family: var(--font-alexandria), sans-serif; }
            @media print {
              @page { margin: ${paperMarginY}mm ${paperMarginX}mm; size: ${paperWidth}mm ${paperHeight}mm; }
              body { display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();

    const links = Array.from(printWindow.document.querySelectorAll('link[rel="stylesheet"]'));
    const waitForStyles = Promise.all(
      links.map(
        (link) =>
          new Promise<void>((resolve) => {
            if ((link as HTMLLinkElement).sheet) {
              resolve();
              return;
            }
            link.addEventListener("load", () => resolve(), { once: true });
            link.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );

    waitForStyles.then(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    });
  };

  return (
    <>
      {buttonType === "menu" ? (
        <Menu.Item onClick={handlePrint} leftSection={icon}>
          {label}
        </Menu.Item>
      ) : buttonType === "button" ? (
        <Button onClick={handlePrint} leftSection={icon} color="dark" variant="light" radius="md">
          {label}
        </Button>
      ) : (
        <>
          <button
            title={label}
            onClick={handlePrint}
            className="rounded-md text-xs text-gray-800 hover:text-gray-800/75 disabled:opacity-50"
          >
            {icon}
          </button>
        </>
      )}

      <div ref={printRef} className="hidden">
        {children}
      </div>
    </>
  );
}
