import DOMPurify from "dompurify";

let counter = 0;

/**
 * Sanitizes a doll SVG for inline rendering and makes its ids unique, so several dolls
 * on one page don't share gradients. Inline (not <img>) because layered renders link
 * garment images, which browsers refuse to load inside an SVG shown with <img>.
 */
export function prepareSvg(svg: string): string {
  if (typeof window === "undefined") return "";
  const fragment = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["image"],
    ADD_ATTR: ["href", "preserveAspectRatio"],
    FORBID_TAGS: ["script", "foreignObject", "style"],
    RETURN_DOM_FRAGMENT: true,
  });
  const root = fragment.querySelector("svg");
  if (!root) return "";

  root.removeAttribute("width");
  root.removeAttribute("height");
  root.setAttribute("preserveAspectRatio", "xMidYMax meet");

  const prefix = `d${(++counter).toString(36)}-`;
  const ids = new Set<string>();
  root.querySelectorAll("[id]").forEach((el) => {
    ids.add(el.id);
    el.id = prefix + el.id;
  });
  if (root.id) root.id = prefix + root.id;
  if (ids.size) {
    root.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        if (attr.value.includes("url(#")) {
          el.setAttribute(attr.name, attr.value.replace(/url\(#([^)]+)\)/g, (m, id) => (ids.has(id) ? `url(#${prefix}${id})` : m)));
        } else if ((attr.name === "href" || attr.name === "xlink:href") && attr.value.startsWith("#")) {
          const id = attr.value.slice(1);
          if (ids.has(id)) el.setAttribute(attr.name, `#${prefix}${id}`);
        }
      }
    });
  }
  return root.outerHTML;
}

/**
 * Feed and list responses only carry `image_url`. On Cloudinary that is a PNG made from
 * the SVG, which can miss linked garment images, so we fetch the original SVG instead.
 */
export function svgSourceFor(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/\.svg(\?.*)?$/i.test(url)) return url;
  if (url.includes("res.cloudinary.com") && /\.png(\?.*)?$/i.test(url)) {
    return url.replace(/\/image\/upload\/(?:[a-z]{1,2}_[^/]+\/)+/, "/image/upload/").replace(/\.png(\?.*)?$/i, ".svg");
  }
  return null;
}
