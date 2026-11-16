import { Footprints, Gem, LayoutGrid, Shirt, ShoppingBag } from "lucide-react";
import type { Category } from "@/lib/api/types";

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function TrousersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 3h10l1 18h-4l-2-11-2 11H6z" />
      <path d="M7 6h10" />
    </Svg>
  );
}

export function DressIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 3l1 4-3 4 -2 10h14l-2-10-3-4 1-4" />
      <path d="M9 3c1 1 5 1 6 0" />
    </Svg>
  );
}

export function JacketIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 3l4 3 4-3 4 3v15h-5V12" />
      <path d="M8 3L4 6v15h5V12" />
      <path d="M12 6v15" />
    </Svg>
  );
}

export function HatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 15c0-5 2-9 6-9s6 4 6 9" />
      <path d="M3 15.5c3 2 15 2 18 0" />
    </Svg>
  );
}

export type RailKey = "all" | "top" | "bottom" | "dress" | "outerwear" | "shoes" | "headwear" | "bag" | "accessory";

export const RAIL: { key: RailKey; label: string; icon: React.ComponentType<IconProps>; categories: Category[] }[] = [
  { key: "all", label: "All", icon: LayoutGrid, categories: [] },
  { key: "top", label: "Tops", icon: Shirt, categories: ["top"] },
  { key: "bottom", label: "Bottoms", icon: TrousersIcon, categories: ["bottom"] },
  { key: "dress", label: "Dresses", icon: DressIcon, categories: ["dress"] },
  { key: "outerwear", label: "Outerwear", icon: JacketIcon, categories: ["outerwear"] },
  { key: "shoes", label: "Shoes", icon: Footprints, categories: ["shoes"] },
  { key: "headwear", label: "Headwear", icon: HatIcon, categories: ["headwear"] },
  { key: "bag", label: "Bags", icon: ShoppingBag, categories: ["bag"] },
  { key: "accessory", label: "Accessories", icon: Gem, categories: ["accessory", "other"] },
];
