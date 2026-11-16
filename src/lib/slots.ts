import type { Category, ItemOut, Slot } from "@/lib/api/types";

export const SLOT_ORDER: Slot[] = [
  "headwear",
  "top",
  "outerwear",
  "dress",
  "bottom",
  "shoes",
  "bag",
  "accessory_1",
  "accessory_2",
  "accessory_3",
];

export const SLOT_LABELS: Record<Slot, string> = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  outerwear: "Outerwear",
  shoes: "Shoes",
  headwear: "Headwear",
  bag: "Bag",
  accessory_1: "Accessory 1",
  accessory_2: "Accessory 2",
  accessory_3: "Accessory 3",
};

const ACCESSORY_SLOTS: Slot[] = ["accessory_1", "accessory_2", "accessory_3"];

/** Slot → item id. */
export type Wearing = Partial<Record<Slot, string>>;

export function slotFor(category: Category, wearing: Wearing): Slot {
  switch (category) {
    case "top":
    case "bottom":
    case "dress":
    case "outerwear":
    case "shoes":
    case "headwear":
    case "bag":
      return category;
    default:
      return ACCESSORY_SLOTS.find((s) => !wearing[s]) ?? "accessory_3";
  }
}

export function slotOf(wearing: Wearing, itemId: string): Slot | undefined {
  return (Object.keys(wearing) as Slot[]).find((s) => wearing[s] === itemId);
}

/**
 * Put an item on, or take it off if it is already worn.
 * Same rule as the backend: a dress and a bottom can't be worn together (a top over a dress is fine).
 */
export function toggleWear(wearing: Wearing, item: Pick<ItemOut, "id" | "category">): Wearing {
  const current = slotOf(wearing, item.id);
  if (current) {
    const next = { ...wearing };
    delete next[current];
    return next;
  }
  const slot = slotFor(item.category, wearing);
  const next: Wearing = { ...wearing, [slot]: item.id };
  if (slot === "dress") delete next.bottom;
  if (slot === "bottom") delete next.dress;
  return next;
}

export function wearingToItems(wearing: Wearing): { item_id: string; slot: Slot }[] {
  return SLOT_ORDER.filter((s) => wearing[s]).map((s) => ({ item_id: wearing[s]!, slot: s }));
}

export function itemsToWearing(items: { item_id: string; slot: Slot }[]): Wearing {
  const w: Wearing = {};
  for (const i of items) w[i.slot] = i.item_id;
  return w;
}
