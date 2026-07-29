import { useCallback, useRef, useState } from "react";
import { Button, Menu } from "@mantine/core";
import { Printer } from "lucide-react";

export default function PrintDocument({
  title,
  buttonLabel,
  children,
  paperWidth = 210,
  paperHeight = 297,
  paperMarginX = 10,
  paperMarginY = 15,
  icon = <Printer size={15} />,
  buttonType = "menu",
  onBeforePrint,
  renderTrigger,
}: {
  title: string;
  buttonLabel?: string;
  children: React.ReactNode;
  paperWidth?: number;
  paperHeight?: number;
  paperMarginX?: number;
  paperMarginY?: number;
  icon?: React.ReactNode;
  buttonType?: "menu" | "button" | "icon";
  /** Async callback invoked before printing. Print is delayed until it resolves. */
  onBeforePrint?: () => Promise<void> | void;
  /** Render a fully custom trigger while reusing the internal print behavior. */
  renderTrigger?: (params: {
    onClick: () => void;
    loading: boolean;
    disabled: boolean;
    label: string;
    icon: React.ReactNode;
  }) => React.ReactNode;
}) {
  const label = buttonLabel ?? title;
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const executePrint = useCallback(() => {
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
  }, [title, paperWidth, paperHeight, paperMarginX, paperMarginY]);

  const handlePrint = useCallback(async () => {
    if (onBeforePrint) {
      setLoading(true);
      try {
        await onBeforePrint();
      } finally {
        setLoading(false);
      }
      // Allow a tick for React to re-render children with new data
      await new Promise((r) => setTimeout(r, 0));
    }
    executePrint();
  }, [onBeforePrint, executePrint]);

  const loadingIcon = loading ? <Printer size={15} className="animate-pulse" /> : icon;

  return (
    <>
      {renderTrigger ? (
        renderTrigger({
          onClick: () => {
            void handlePrint();
          },
          loading,
          disabled: loading,
          label,
          icon: loadingIcon,
        })
      ) : buttonType === "menu" ? (
        <Menu.Item onClick={handlePrint} leftSection={loadingIcon} disabled={loading}>
          {label}
        </Menu.Item>
      ) : buttonType === "button" ? (
        <Button onClick={handlePrint} leftSection={loadingIcon} color="dark" variant="light" radius="md" disabled={loading}>
          {label}
        </Button>
      ) : (
        <button
          title={label}
          onClick={handlePrint}
          disabled={loading}
          className="rounded-md text-xs text-gray-800 hover:text-gray-800/75 disabled:opacity-50"
        >
          {loadingIcon}
        </button>
      )}

      <div ref={printRef} className="hidden">
        {children}
      </div>
    </>
  );
}
