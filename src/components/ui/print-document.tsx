"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
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
  const printId = `print-doc-${useId().replace(/:/g, "")}`;
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const executePrint = useCallback(() => {
    const previousTitle = document.title;
    document.title = title;

    const style = document.createElement("style");
    style.setAttribute("data-print-document", printId);
    style.textContent = `
      @media print {
        @page { margin: ${paperMarginY}mm ${paperMarginX}mm; size: ${paperWidth}mm ${paperHeight}mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body > *:not(#${printId}) { display: none !important; }
        #${printId} {
          display: block !important;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.title = previousTitle;
      style.remove();
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.print();
    // Some browsers may not fire afterprint reliably
    setTimeout(cleanup, 1000);
  }, [title, printId, paperWidth, paperHeight, paperMarginX, paperMarginY]);

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

  const trigger = renderTrigger ? (
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
  );

  return (
    <>
      {trigger}
      {mounted &&
        createPortal(
          <div id={printId} className="hidden">
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
