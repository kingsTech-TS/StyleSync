export interface Swatch {
  hex: string;
  name: string;
}

export const HAIR: Swatch[] = [
  { hex: "#0f0b0a", name: "Black" },
  { hex: "#2b1b12", name: "Espresso" },
  { hex: "#4a2c1d", name: "Dark brown" },
  { hex: "#6b4226", name: "Chestnut" },
  { hex: "#8d5a33", name: "Light brown" },
  { hex: "#a0522d", name: "Auburn" },
  { hex: "#b5651d", name: "Copper" },
  { hex: "#c19a6b", name: "Dark blonde" },
  { hex: "#e3c08c", name: "Blonde" },
  { hex: "#efe1bf", name: "Platinum" },
  { hex: "#9e9e9e", name: "Grey" },
  { hex: "#e8e6e1", name: "White" },
  { hex: "#6d2f7a", name: "Plum" },
  { hex: "#2f5d8a", name: "Blue" },
  { hex: "#d14f7a", name: "Pink" },
  { hex: "#3f7a5a", name: "Green" },
];

export const SKIN: Swatch[] = [
  { hex: "#fde3cf", name: "Porcelain" },
  { hex: "#f3cfb1", name: "Fair" },
  { hex: "#e8b893", name: "Light" },
  { hex: "#d9a07a", name: "Light medium" },
  { hex: "#c68642", name: "Medium" },
  { hex: "#ad7448", name: "Tan" },
  { hex: "#8d5524", name: "Brown" },
  { hex: "#6b3e26", name: "Dark brown" },
  { hex: "#4f2c1d", name: "Deep" },
  { hex: "#3b2219", name: "Ebony" },
];

export const EYES: Swatch[] = [
  { hex: "#2b1d14", name: "Dark brown" },
  { hex: "#4b3621", name: "Brown" },
  { hex: "#6b4e2e", name: "Hazel" },
  { hex: "#8a6d3b", name: "Amber" },
  { hex: "#4f7a4a", name: "Green" },
  { hex: "#3a6b8c", name: "Blue" },
  { hex: "#5a7d9a", name: "Blue grey" },
  { hex: "#7d858c", name: "Grey" },
];

export const HAIR_STYLES = ["short", "buzz cut", "curly", "wavy", "long straight", "bob", "braids", "locs", "afro", "ponytail", "bun", "pixie"];
export const FACE_SHAPES = ["oval", "round", "square", "heart", "long"];
export const BUILDS = ["slim", "average", "athletic", "curvy", "broad"];

/** Same groups the backend recolors (app/services/rendering/svg.py). */
const GROUPS: Record<"hair_color" | "skin_tone" | "eye_color", string[]> = {
  hair_color: ["hair", "hair-back", "brows"],
  skin_tone: ["skin"],
  eye_color: ["eyes"],
};

/** Instant local recolor so the doll changes before the server answers. */
export function recolorLocally(svg: string, feature: keyof typeof GROUPS, color: string): string {
  if (typeof window === "undefined") return svg;
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (doc.querySelector("parsererror")) return svg;
  for (const id of GROUPS[feature]) {
    const group = doc.getElementById(id);
    if (!group) continue;
    for (const el of [group, ...Array.from(group.querySelectorAll("*"))]) {
      const fill = el.getAttribute("fill");
      if (fill && fill.toLowerCase() !== "none" && !fill.startsWith("url(")) el.setAttribute("fill", color);
    }
  }
  return new XMLSerializer().serializeToString(doc);
}
