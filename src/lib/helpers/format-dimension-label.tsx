import type { ReactNode } from "react";
import { Diameter } from "lucide-react";
import type { ProductDimension } from "@/types/product";

type DimensionLike = Pick<ProductDimension, "length" | "depth" | "diameter" | "height">;

/**
 * Formats a product dimension as `"120 × 60 × 30 cm"` or `"⌀45 × 30 cm"` (plain text).
 */
export function formatDimensionLabelText(dimension: DimensionLike, unit: string): string {
  if (dimension.diameter != null) return `⌀${dimension.diameter} × ${dimension.height} ${unit}`;
  else return `${dimension.length} × ${dimension.depth} × ${dimension.height} ${unit}`;
}

/**
 * Formats a product dimension for UI display. Diameter uses Lucide's Diameter icon.
 */
export function formatDimensionLabel(dimension: DimensionLike, unit: string): ReactNode {
  if (dimension.diameter != null)
    return (
      <span className="inline-flex items-center gap-0.5">
        <Diameter className="me-0.5 size-2.5 text-gray-500" aria-hidden />
        {`${dimension.diameter} × ${dimension.height} ${unit}`}
      </span>
    );

  return `${dimension.length} × ${dimension.depth} × ${dimension.height} ${unit}`;
}
