import { useI18n } from "@/lib/i18n/hooks";
import { Button } from "@mantine/core";
import Image from "next/image";

type Props = {
  keyword: string;
  image?: string | null;
  useDefaultImg?: boolean;
  className?: string;
  button?: { text: string; onClick: () => void };
};

export default function NoResultsSection({ keyword, image = null, useDefaultImg = false, className = "", button }: Props) {
  const { translate } = useI18n();

  const alt = translate("No results found", "لا توجد نتائج");

  return (
    <section className={`flex-center flex-1 flex-col gap-4 rounded-lg bg-gray-100 p-10 ${className}`}>
      {image ? (
        <Image src={image} alt={alt} height={65} width={65} />
      ) : useDefaultImg ? (
        <Image src="/images/landscape.png" alt={alt} height={50} width={50} />
      ) : null}
      <p className="text-gray-800">{translate(`No results found for "${keyword}"`, `لا توجد نتائج لـ"${keyword}"`)}</p>
      {button && <Button onClick={button.onClick}>{button.text}</Button>}
    </section>
  );
}
