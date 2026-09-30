import { semanticColorOrder, semanticPalette, type ColorThemeName } from "@/lib/constants/color-palette";

export type { ColorThemeName };

type ThemeColor = {
  label: { en: string; ar: string };
  role: { en: string; ar: string };
  usage: { en: string; ar: string };
  examples: { en: string; ar: string }[];
  shades: (typeof semanticPalette)[ColorThemeName];
};

/** Semantic labels and usage; hex shades come from {@link semanticPalette}. */
export const colorTheme: Record<ColorThemeName, ThemeColor> = {
  teal: {
    label: { en: "Teal", ar: "أخضر مزرق" },
    role: { en: "Primary actions", ar: "الإجراءات الرئيسية" },
    usage: { en: "Create, save, selected controls, and the main application accent.", ar: "للإنشاء والحفظ والعناصر المحددة واللون الرئيسي للتطبيق." },
    examples: [
      { en: "Create purchase order", ar: "إنشاء أمر توريد" },
      { en: "Save changes", ar: "حفظ التعديلات" },
      { en: "Selected filter", ar: "فلتر محدد" },
      { en: "Active sidebar item", ar: "عنصر نشط في القائمة الجانبية" },
      { en: "Focused form field", ar: "حقل نموذج قيد التركيز" },
      { en: "Primary report series", ar: "سلسلة التقرير الرئيسية" },
      { en: "Confirm receipt", ar: "تأكيد الاستلام" },
      { en: "Current pagination page", ar: "الصفحة الحالية في الترقيم" },
    ],
    shades: semanticPalette.teal,
  },
  haze: {
    label: { en: "Haze", ar: "أزرق ضبابي" },
    role: { en: "Information", ar: "المعلومات" },
    usage: { en: "Informational states, links, guidance, and secondary context.", ar: "للحالات المعلوماتية والروابط والإرشادات والسياق الثانوي." },
    examples: [
      { en: "Invoice PDF attached", ar: "تم إرفاق ملف PDF للفاتورة" },
      { en: "View audit history", ar: "عرض سجل التدقيق" },
      { en: "Information notice", ar: "تنبيه معلوماتي" },
      { en: "Open material details", ar: "فتح تفاصيل المادة" },
      { en: "Read-only system note", ar: "ملاحظة نظام للقراءة فقط" },
      { en: "Imported from spreadsheet", ar: "تم الاستيراد من جدول بيانات" },
      { en: "View linked requisition", ar: "عرض طلب الشراء المرتبط" },
      { en: "Helpful form guidance", ar: "إرشاد مساعد في النموذج" },
    ],
    shades: semanticPalette.haze,
  },
  ochre: {
    label: { en: "Ochre", ar: "مغرة" },
    role: { en: "Warning", ar: "تنبيه" },
    usage: { en: "Attention-needed states, pending work, low stock, and non-blocking cautions.", ar: "للحالات التي تحتاج انتباهًا والمهام المعلقة والمخزون المنخفض والتنبيهات غير المانعة." },
    examples: [
      { en: "Pending manager approval", ar: "بانتظار اعتماد المدير" },
      { en: "Low stock", ar: "مخزون منخفض" },
      { en: "Price requires review", ar: "السعر يحتاج مراجعة" },
      { en: "Draft requires completion", ar: "المسودة تحتاج إكمالًا" },
      { en: "Delivery date approaching", ar: "موعد التسليم قريب" },
      { en: "Near credit limit", ar: "قرب حد الائتمان" },
      { en: "Budget variance needs review", ar: "فرق الميزانية يحتاج مراجعة" },
      { en: "Unassigned requisition item", ar: "بند طلب شراء غير مخصص" },
    ],
    shades: semanticPalette.ochre,
  },
  clay: {
    label: { en: "Clay", ar: "طيني" },
    role: { en: "Danger", ar: "خطر" },
    usage: { en: "Destructive actions, rejected or overdue states, and blocking errors.", ar: "للإجراءات المدمرة وحالات الرفض أو التأخير والأخطاء المانعة." },
    examples: [
      { en: "Delete purchase order", ar: "حذف أمر التوريد" },
      { en: "Invoice overdue", ar: "فاتورة متأخرة" },
      { en: "Submission rejected", ar: "تم رفض الإرسال" },
      { en: "Remove BOM item", ar: "حذف بند من قائمة المواد" },
      { en: "Failed invoice upload", ar: "فشل رفع الفاتورة" },
      { en: "Critical validation error", ar: "خطأ تحقق حرج" },
      { en: "No permission to approve", ar: "لا توجد صلاحية للاعتماد" },
      { en: "Purchase order canceled", ar: "تم إلغاء أمر التوريد" },
    ],
    shades: semanticPalette.clay,
  },
  plum: {
    label: { en: "Plum", ar: "برقوقي" },
    role: { en: "Supporting accent", ar: "لون مساعد" },
    usage: { en: "Categorization, report series, and secondary accents—not status feedback.", ar: "للتصنيفات وسلاسل التقارير واللمسات الثانوية، وليس لرسائل الحالة." },
    examples: [
      { en: "Production department", ar: "قسم إنتاج" },
      { en: "Materials chart series", ar: "سلسلة بيانات المواد" },
      { en: "Product category", ar: "فئة المنتج" },
      { en: "Supplier comparison series", ar: "سلسلة مقارنة الموردين" },
      { en: "Internal reference tag", ar: "وسم مرجعي داخلي" },
      { en: "Cost breakdown category", ar: "فئة توزيع التكلفة" },
      { en: "Secondary report series", ar: "سلسلة تقرير ثانوية" },
      { en: "Production route label", ar: "وسم مسار الإنتاج" },
    ],
    shades: semanticPalette.plum,
  },
};

export const colorThemeOrder = semanticColorOrder;
