export default function MoneyViewer({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  return <span className={className}>{`${amount.toFixed(2)} ${currency}`}</span>;
}
