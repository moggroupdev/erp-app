/**
 * Spatial ETA e-invoice PDF parser (ported from examples/export-invoice-totals.mjs).
 * Uses text item coordinates — plain concatenated text is not enough for some layouts.
 */

export type ParsedSupplierInvoice = {
  invoiceNumber: string;
  issuedAt: string | null;
  totalPurchases: number | null;
  totalDiscount: number | null;
  vatAmount: number | null;
  withholdingTaxAmount: number | null;
  totalAmount: number | null;
  missingFields: string[];
};

type TextItem = { str: string; x: number; y: number };

type LineBucket = {
  y: number;
  items: TextItem[];
  text: string;
  compact: string;
  left: string;
};

type TotalField = {
  key: "sales" | "discount" | "vat" | "withholding" | "grandTotal";
  label: string;
  match: (compact: string) => boolean;
};

const TOTAL_FIELDS: TotalField[] = [
  {
    key: "sales",
    label: "totalPurchases",
    match: (c) => c.includes("اجماليالمبيعات"),
  },
  {
    key: "discount",
    label: "totalDiscount",
    match: (c) => c.includes("اجماليالخصم") && !c.includes("الصنف"),
  },
  {
    key: "vat",
    label: "vatAmount",
    match: (c) => c.includes("ضريبهالقيمه") || c.includes("ضريبةالقيمه"),
  },
  {
    key: "withholding",
    label: "withholdingTaxAmount",
    match: (c) => c.includes("الخصمتحتحسابالضريبه") || c.includes("تحتحسابالضريب"),
  },
  {
    key: "grandTotal",
    label: "totalAmount",
    match: (c) => c.includes("اجماليالمبلغ"),
  },
];

function normalizeArabic(s: string): string {
  return String(s || "")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\u0600-\u06FF]/g, "");
}

function easternToWestern(s: string): string {
  return String(s || "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function parseAmount(str: string): number | null {
  const western = easternToWestern(str);
  const m = western.match(/(\d{1,3}(?:[.,]\d{3})*)[.,](\d{2,5})/);
  if (m) {
    const intPart = m[1].replace(/[.,]/g, "");
    const n = Number(`${intPart}.${m[2]}`);
    return Number.isFinite(n) ? n : null;
  }
  const digits = western.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

function reconstructLine(items: TextItem[], wordGap = 5): string {
  const sorted = items
    .map((it) => ({ s: it.str.normalize("NFKC"), x: it.x }))
    .filter((it) => it.s.trim() !== "")
    .sort((a, b) => a.x - b.x);

  const words: string[] = [];
  let cur = "";
  let lastX: number | null = null;
  for (const it of sorted) {
    if (lastX !== null && it.x - lastX >= wordGap) {
      words.push(cur);
      cur = "";
    }
    cur += it.s;
    lastX = it.x;
  }
  if (cur) words.push(cur);

  return words
    .map((w) => {
      const n = w.normalize("NFKC");
      if (/[\u0600-\u06FF]/.test(n)) return [...n].reverse().join("");
      return n;
    })
    .reverse()
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function bucketLines(items: TextItem[]): LineBucket[] {
  const buckets = new Map<number, TextItem[]>();
  for (const it of items) {
    const y = Math.round(it.y);
    if (!buckets.has(y)) buckets.set(y, []);
    buckets.get(y)!.push(it);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([y, lineItems]) => {
      const text = reconstructLine(lineItems);
      const compact = normalizeArabic(text);
      const left = lineItems
        .filter((it) => it.x < 200)
        .sort((a, b) => a.x - b.x)
        .map((it) => it.str)
        .join("");
      return { y, items: lineItems, text, compact, left };
    });
}

function firstDate(items: TextItem[]): string {
  for (const it of items) {
    const t = easternToWestern(it.str.normalize("NFKC"));
    const m = t.match(/(20\d{2})[\/\-.](\d{2})[\/\-.](\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  return "";
}

function extractInvoiceNoFromLine(line: LineBucket): string {
  const compact = line.compact || "";
  const isInternal = compact.includes("الرقمالداخلي");
  const isInvoiceLabel =
    compact.includes("رقمالفاتوره") && !compact.includes("المبدئيه") && !compact.includes("للتصدير");
  if (!isInternal && !isInvoiceLabel) return "";

  const text = easternToWestern(`${line.text} ${line.left || ""}`);
  const candidates = [...text.matchAll(/[A-Za-z0-9][A-Za-z0-9\-\/]{0,31}/g)].map((m) => m[0]);
  const value = candidates.find((c) => /[A-Za-z0-9]/.test(c) && !/^(20\d{2})$/.test(c));
  return value || "";
}

async function readPdfFromArrayBuffer(data: ArrayBuffer) {
  // Use package main entry — Turbopack cannot resolve deep paths like legacy/build/pdf.mjs
  const pdfjs = await import("pdfjs-dist");

  // Browser builds require an explicit worker URL (disableWorker is ignored in pdfjs-dist v4+)
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  }

  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const pages: { page: number; items: TextItem[]; lines: LineBucket[] }[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items: TextItem[] = content.items
      .filter((it): it is (typeof content.items)[number] & { str: string; transform: number[] } => "str" in it)
      .map((it) => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
      }));
    pages.push({ page: i, items, lines: bucketLines(items) });
  }

  return { numPages: doc.numPages, pages };
}

function parseInvoiceFromPages(pages: { lines: LineBucket[] }[]): ParsedSupplierInvoice {
  const allLines = pages.flatMap((p) => p.lines);

  const totals: Record<TotalField["key"], number | null> = {
    sales: null,
    discount: null,
    vat: null,
    withholding: null,
    grandTotal: null,
  };

  for (const line of allLines) {
    for (const field of TOTAL_FIELDS) {
      if (totals[field.key] != null) continue;
      if (!field.match(line.compact)) continue;
      const n = parseAmount(line.left) ?? parseAmount(line.text);
      if (n != null) totals[field.key] = n;
    }
  }

  let issuedAt = "";
  let invoiceNumber = "";

  for (const line of allLines) {
    if (line.compact.includes("تاريخالاصدار") || line.compact.includes("تاريخاالصدار")) {
      if (!issuedAt) issuedAt = firstDate(line.items);
    }
    if (!invoiceNumber) {
      invoiceNumber = extractInvoiceNoFromLine(line);
    }
  }

  // Some ETA PDFs prefix the invoice number with a backslash in extracted text
  invoiceNumber = invoiceNumber.replace(/^\\+/, "").trim();

  const missingFields: string[] = [];
  if (!invoiceNumber) missingFields.push("invoiceNumber");
  if (!issuedAt) missingFields.push("issuedAt");
  for (const field of TOTAL_FIELDS) {
    // Withholding tax is often absent on ETA invoices; treat as optional
    if (field.key === "withholding") continue;
    if (totals[field.key] == null) missingFields.push(field.label);
  }

  return {
    invoiceNumber,
    issuedAt: issuedAt || null,
    totalPurchases: totals.sales,
    totalDiscount: totals.discount,
    vatAmount: totals.vat,
    withholdingTaxAmount: totals.withholding,
    totalAmount: totals.grandTotal,
    missingFields,
  };
}

/** Parse an ETA supplier invoice PDF File in the browser. Ignores the filename. */
export default async function parseSupplierInvoicePdf(file: File): Promise<ParsedSupplierInvoice> {
  const data = await file.arrayBuffer();
  const pdf = await readPdfFromArrayBuffer(data);
  return parseInvoiceFromPages(pdf.pages);
}
