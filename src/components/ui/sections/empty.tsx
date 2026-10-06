import { useI18n } from "@/lib/i18n/hooks";
import Image from "next/image";

type Props = {
  message?: string;
  image?: string | null;
  useDefaultImg?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export default function EmptySection({
  message = "",
  image: img = null,
  useDefaultImg = false,
  className = "",
  children,
}: Props) {
  const { translate } = useI18n();

  return (
    <section className={`flex-center flex-1 flex-col gap-4 rounded-xl bg-gray-100 p-10 text-center ${className}`}>
      {img ? (
        <Image src={img} alt={message || translate("Empty", "فارغ")} height={65} width={65} />
      ) : useDefaultImg ? (
        <Image src="/images/empty.png" alt={message || translate("Empty", "فارغ")} height={60} width={60} />
      ) : null}
      <p>{message || translate("Empty", "فارغ")}</p>
      {children}
    </section>
  );
}
