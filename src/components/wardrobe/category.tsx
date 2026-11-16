import type { Category } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const CATEGORY_LABEL: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessories",
  bag: "Bags",
  headwear: "Headwear",
  other: "Other",
};

/** Suggested starter collections for an empty wardrobe. */
export const PRESETS: { name: string; category: Category }[] = [
  { name: "Tops", category: "top" },
  { name: "Trousers", category: "bottom" },
  { name: "Dresses", category: "dress" },
  { name: "Outerwear", category: "outerwear" },
  { name: "Shoes", category: "shoes" },
  { name: "Accessories", category: "accessory" },
  { name: "Bags", category: "bag" },
  { name: "Headwear", category: "headwear" },
];

const PATHS: Record<Category, React.ReactNode> = {
  top: <path d="M8 4 4.5 6.5 3 11l3 1.2V20h12v-7.8l3-1.2-1.5-4.5L16 4c-.6 1.4-2.1 2.3-4 2.3S8.6 5.4 8 4Z" />,
  bottom: <path d="M6.5 3h11l1 17.5h-4.2L12 9.5l-2.3 11H5.5l1-17.5ZM6.5 6.5h11" />,
  dress: <path d="M9 3h6l-.8 4.2L18.5 20h-13l4.3-12.8L9 3ZM9.6 7.4h4.8" />,
  outerwear: (
    <path d="M8.5 3.5 12 6l3.5-2.5L20 6l.5 13.5H17V12m-10 7.5H3.5L4 6l4.5-2.5M7 12v8h10M12 6v14" />
  ),
  shoes: <path d="M3 15.5V8.5h4.5l1.5 3 5 1.6c3.3.9 6.5 1.5 7 3.4v1H3v-2Zm0 2h18" />,
  accessory: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M9.5 8.3 10 3.5h4l.5 4.8M9.5 15.7l.5 4.8h4l.5-4.8M12 10v2l1.3 1" />
    </>
  ),
  bag: <path d="M4.5 8.5h15l-1 11.5h-13l-1-11.5ZM9 8.5V7a3 3 0 0 1 6 0v1.5" />,
  headwear: <path d="M4 15.5c0-4.7 3.6-8.5 8-8.5s8 3.8 8 8.5M2.5 15.5h14.5c2 0 4.5.5 4.5 1.8H2.5v-1.8ZM12 7V5.5" />,
  other: (
    <>
      <circle cx="7" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="17" cy="12" r="1.2" />
    </>
  ),
};

/** Line glyph for a clothing category, drawn to match lucide's stroke style. */
export function CategoryGlyph({ category, className }: { category: Category; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      aria-hidden
    >
      {PATHS[category] ?? PATHS.other}
    </svg>
  );
}
