const BLOCK_SELECTOR = "p, div";
const BULLET_CHARS = "\\u2022\\u25CF\\u25AA\\u25E6\\u00B7\\*\\-";
const BULLET_LINE_PATTERN = new RegExp(
  `^[\\s\\u00A0]*(?:[${BULLET_CHARS}]\\s+|o\\s+)`,
  "i",
);

const toElementHtml = (node: Node) => {
  const temp = document.createElement("div");
  temp.appendChild(node.cloneNode(true));
  return temp.innerHTML;
};

const hasBulletMarker = (text: string) =>
  BULLET_LINE_PATTERN.test(text.replace(/\u00A0/g, " ").trim());

const stripLeadingBulletMarkup = (element: HTMLElement) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let markerRemoved = false;
  const markerRegex = new RegExp(`^[${BULLET_CHARS}]$`, "i");
  const markerWithContentRegex = new RegExp(
    `^[\\s\\u00A0]*(?:[${BULLET_CHARS}]|o)(?:\\s|\\u00A0)+`,
    "i",
  );

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    const text = textNode.textContent ?? "";

    if (!markerRemoved) {
      if (!text.trim()) {
        textNode.textContent = "";
        continue;
      }

      const compact = text.replace(/\u00A0/g, " ").trim();
      if (markerRegex.test(compact) || /^o$/i.test(compact)) {
        textNode.textContent = "";
        markerRemoved = true;
        continue;
      }

      if (markerWithContentRegex.test(text)) {
        textNode.textContent = text.replace(markerWithContentRegex, "");
        markerRemoved = true;
      }
    }

    if (markerRemoved) {
      textNode.textContent = (textNode.textContent ?? "").replace(
        /^[\s\u00A0]+/,
        "",
      );
      break;
    }
  }

  element.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (!node.textContent?.trim() && node.children.length === 0) {
      node.remove();
    }
  });
};

const extractLineHtmlSegments = (element: HTMLElement) => {
  const lines: string[] = [];
  let currentNodes: string[] = [];

  const pushLine = () => {
    const html = currentNodes.join("").trim();
    currentNodes = [];
    if (!html) return;

    const temp = document.createElement("div");
    temp.innerHTML = html;
    if (!temp.textContent?.replace(/\u00A0/g, " ").trim()) return;
    lines.push(html);
  };

  Array.from(element.childNodes).forEach((node) => {
    if (node.nodeName === "BR") {
      pushLine();
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const parts = (node.textContent ?? "").split(/\r?\n/);
      parts.forEach((part, index) => {
        if (part) {
          const textNode = document.createTextNode(part);
          currentNodes.push(toElementHtml(textNode));
        }

        if (index < parts.length - 1) {
          pushLine();
        }
      });
      return;
    }

    currentNodes.push(toElementHtml(node));
  });

  pushLine();
  return lines;
};

const splitMixedBulletBlocks = (root: HTMLElement) => {
  Array.from(root.children).forEach((child) => {
    if (!(child instanceof HTMLElement) || !child.matches(BLOCK_SELECTOR)) {
      return;
    }

    const lines = extractLineHtmlSegments(child);
    if (lines.length <= 1 || !lines.some((line) => hasBulletMarker(line))) {
      return;
    }

    const fragment = document.createDocumentFragment();
    let currentList: HTMLUListElement | null = null;

    lines.forEach((line) => {
      const temp = document.createElement("div");
      temp.innerHTML = line;
      const text = temp.textContent?.replace(/\u00A0/g, " ").trim() ?? "";
      if (!text) return;

      if (hasBulletMarker(text)) {
        if (!currentList) {
          currentList = document.createElement("ul");
          currentList.style.listStyleType = "disc";
          fragment.appendChild(currentList);
        }

        const item = document.createElement("li");
        item.innerHTML = line;
        stripLeadingBulletMarkup(item);
        currentList.appendChild(item);
        return;
      }

      currentList = null;
      const paragraph = document.createElement(child.tagName.toLowerCase());
      paragraph.innerHTML = line;
      fragment.appendChild(paragraph);
    });

    child.replaceWith(fragment);
  });
};

const convertAdjacentBulletBlocks = (root: HTMLElement) => {
  let currentNode = root.firstElementChild;

  while (currentNode) {
    const nextNode = currentNode.nextElementSibling;

    if (
      !currentNode.matches(BLOCK_SELECTOR) ||
      !hasBulletMarker(currentNode.textContent ?? "")
    ) {
      currentNode = nextNode;
      continue;
    }

    const list = document.createElement("ul");
    list.style.listStyleType = "disc";

    let walker: Element | null = currentNode;
    while (
      walker &&
      walker.matches(BLOCK_SELECTOR) &&
      hasBulletMarker(walker.textContent ?? "")
    ) {
      const item = document.createElement("li");
      item.innerHTML = (walker as HTMLElement).innerHTML;
      stripLeadingBulletMarkup(item);
      list.appendChild(item);

      const nodeToRemove = walker;
      walker = walker.nextElementSibling;
      nodeToRemove.remove();
    }

    root.insertBefore(list, walker);
    currentNode = walker;
  }
};

export const normalizeRichTextHtml = (html: string) => {
  if (typeof document === "undefined" || !html?.trim()) return html || "";

  const root = document.createElement("div");
  root.innerHTML = html;

  splitMixedBulletBlocks(root);
  convertAdjacentBulletBlocks(root);

  return root.innerHTML;
};
