import type { ProductionSubDepartment } from "@/lib/constants/enums/production-sub-departments";

/** Odoo-inspired flat geometric icons with overlapping translucent shapes. */
export default function ProductionDepartmentIcon({
  department,
  className = "",
}: {
  department: ProductionSubDepartment;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      {ICONS[department]}
    </svg>
  );
}

const ICONS: Record<ProductionSubDepartment, React.ReactNode> = {
  cutting: (
    <>
      <rect x="10" y="28" width="44" height="10" rx="3" fill="#714B67" opacity="0.85" />
      <rect x="18" y="14" width="10" height="36" rx="3" fill="#017E84" transform="rotate(35 23 32)" />
      <rect x="36" y="14" width="10" height="36" rx="3" fill="#F06EAA" transform="rotate(-35 41 32)" />
    </>
  ),
  bending: (
    <>
      <path d="M12 46 L12 20 L36 20" stroke="#017E84" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M28 46 L52 46 L52 22"
        stroke="#F06A26"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </>
  ),
  refrigeration: (
    <>
      <circle cx="32" cy="32" r="18" fill="#017E84" opacity="0.2" />
      <path d="M32 12 V52 M12 32 H52 M18 18 L46 46 M46 18 L18 46" stroke="#017E84" strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="7" fill="#714B67" />
    </>
  ),
  electricity: (
    <>
      <rect x="14" y="14" width="36" height="36" rx="8" fill="#714B67" opacity="0.25" />
      <path d="M36 10 L22 34 H34 L28 54 L46 28 H33 Z" fill="#F3CC45" />
      <path d="M36 10 L22 34 H34 L28 54 L46 28 H33 Z" fill="#F06A26" opacity="0.45" />
    </>
  ),
  gas: (
    <>
      <ellipse cx="32" cy="40" rx="16" ry="12" fill="#F06A26" opacity="0.35" />
      <path
        d="M32 12 C40 24 48 30 48 40 C48 50 40 54 32 54 C24 54 16 50 16 40 C16 30 24 24 32 12 Z"
        fill="#F06A26"
      />
      <path
        d="M32 26 C36 32 40 35 40 40 C40 45 36 48 32 48 C28 48 24 45 24 40 C24 35 28 32 32 26 Z"
        fill="#F3CC45"
      />
    </>
  ),
  injection: (
    <>
      <rect x="28" y="8" width="8" height="14" rx="2" fill="#714B67" />
      <rect x="24" y="20" width="16" height="28" rx="4" fill="#017E84" />
      <path d="M32 48 L32 58" stroke="#F06A26" strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="28" r="4" fill="#F3CC45" />
    </>
  ),
  sheet_metal_neutral: (
    <>
      <rect x="10" y="22" width="44" height="28" rx="4" fill="#714B67" opacity="0.3" />
      <rect x="14" y="16" width="44" height="28" rx="4" fill="#017E84" />
      <rect x="20" y="24" width="20" height="4" rx="1" fill="white" opacity="0.5" />
      <rect x="20" y="32" width="28" height="4" rx="1" fill="white" opacity="0.35" />
    </>
  ),
  sheet_metal_cold: (
    <>
      <rect x="10" y="22" width="44" height="28" rx="4" fill="#5B7FC7" opacity="0.35" />
      <rect x="14" y="16" width="44" height="28" rx="4" fill="#017E84" />
      <path
        d="M24 28 L28 36 L36 22"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </>
  ),
  sheet_metal_hot: (
    <>
      <rect x="10" y="22" width="44" height="28" rx="4" fill="#F06A26" opacity="0.35" />
      <rect x="14" y="16" width="44" height="28" rx="4" fill="#E05A3C" />
      <path
        d="M26 36 C28 28 32 26 32 26 C32 26 36 28 38 36"
        stroke="#F3CC45"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  blacksmithing: (
    <>
      <rect x="14" y="38" width="36" height="10" rx="2" fill="#714B67" />
      <rect x="22" y="28" width="20" height="12" rx="2" fill="#017E84" />
      <rect x="18" y="14" width="8" height="22" rx="2" fill="#F3CC45" transform="rotate(-20 22 25)" />
      <rect x="38" y="12" width="8" height="18" rx="2" fill="#F06A26" />
    </>
  ),
  kitchens: (
    <>
      <rect x="12" y="36" width="10" height="16" rx="2" fill="#017E84" />
      <rect x="27" y="26" width="10" height="26" rx="2" fill="#F3CC45" />
      <rect x="42" y="16" width="10" height="36" rx="2" fill="#F06A26" />
      <circle cx="17" cy="28" r="4" fill="#714B67" opacity="0.7" />
    </>
  ),
};
