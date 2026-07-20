import { formatMoney } from "@/lib/helpers/format-money";

export default function MoneyViewer({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  return <span className={className}>{formatMoney(amount, currency)}</span>;
}
