import DOMPurify from "dompurify";

export const sanitizeHtml = (html: string): { __html: string } => {
  if (typeof window === "undefined") {
    // Server-side: strip all tags as a safe fallback
    return { __html: html.replace(/<[^>]*>/g, "") };
  }
  return {
    __html: DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p","br","strong","em","ul","ol","li","h1","h2","h3","h4","a","table","thead","tbody","tr","th","td","blockquote","span","div"],
      ALLOWED_ATTR: ["href","target","rel","class","style"],
    }),
  };
};
