export function isOpenLegacyContract(contract: {
  legacyNumber: string | null;
  inquiry: { id: string } | null;
  cancelledAt: string | null;
  completedAt: string | null;
}) {
  return !!contract.legacyNumber && !contract.inquiry && !contract.cancelledAt && !contract.completedAt;
}

export function getContractStatusLabel(
  contract: { cancelledAt: string | null; completedAt: string | null },
  translate: (en: string, ar: string) => string,
) {
  if (contract.cancelledAt) return { label: translate("Cancelled", "ملغي"), className: "text-clay-600 font-bold" };
  if (contract.completedAt) return { label: translate("Completed", "مكتمل"), className: "text-teal-600 font-bold" };
  return { label: translate("Open", "مفتوح"), className: "text-ochre-600 font-bold" };
}

export function contractItemTitle(item: { title: string | null; product: { title: string } }) {
  const lineTitle = item.title?.trim();
  return lineTitle || item.product.title;
}
