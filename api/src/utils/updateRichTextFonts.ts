import { JSDOM } from "jsdom";

const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";
const HEADING_FONT = "Inter, sans-serif";
const BODY_FONT = "Poppins, sans-serif";

const headingTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const bodyTags = new Set(["p", "li", "td", "th", "blockquote", "span", "div"]);

const getTargetFont = (element: Element): string | null => {
  const tagName = element.tagName.toLowerCase();

  if (headingTags.has(tagName) || element.closest(HEADING_SELECTOR)) {
    return HEADING_FONT;
  }

  if (bodyTags.has(tagName)) {
    return BODY_FONT;
  }

  return null;
};

const applyFontFamily = (element: Element, fontFamily: string): void => {
  const htmlElement = element as HTMLElement;

  htmlElement.style.removeProperty("font-family");
  htmlElement.style.setProperty("font-family", fontFamily);

  if (!htmlElement.getAttribute("style")?.trim()) {
    htmlElement.removeAttribute("style");
  }
};

export const updateRichTextFonts = (html: string): string => {
  if (!html || !html.trim()) {
    return html;
  }

  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  const { document } = dom.window;

  document.body.querySelectorAll("*").forEach((element) => {
    const targetFont = getTargetFont(element);

    if (!targetFont) {
      return;
    }

    applyFontFamily(element, targetFont);
  });

  return document.body.innerHTML;
};

export default updateRichTextFonts;
