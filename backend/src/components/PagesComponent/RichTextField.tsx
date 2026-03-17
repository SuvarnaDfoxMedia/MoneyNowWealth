import React, { useRef, useMemo, useCallback } from "react";
import JoditEditor from "jodit-react";

interface RichTextFieldProps {
  value: string;
  onChange: (val: string) => void;
  height?: number;
  readOnly?: boolean;
}

export const RichTextField: React.FC<RichTextFieldProps> = ({
  value,
  onChange,
  height = 1200,
  readOnly = false,
}) => {
  const editorRef = useRef<any>(null);

  const config = useMemo(
    () => ({
      readonly: readOnly,
      height,
      toolbarSticky: true,
      link: {
        noFollowCheckbox: false,
        openInNewTabCheckbox: true,
        processVideoLink: true,
      },
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      uploader: {
        insertImageAsBase64URI: true,
      },
      style: {
        a: "color: #2563eb; text-decoration: underline;",
        "a:hover": "color: #1d4ed8;",
      },
    }),
    [height, readOnly],
  );

  // const cleanHtml = useCallback((html: string) => {
  //   const tempDiv = document.createElement("div");
  //   tempDiv.innerHTML = html;

  //   tempDiv.querySelectorAll("p").forEach((p) => {
  //     if (!p.textContent?.trim() && p.childElementCount === 0) p.remove();
  //     if (p.childElementCount === 1 && p.firstElementChild?.tagName === "BR")
  //       p.remove();
  //   });

  //   tempDiv.querySelectorAll("p").forEach((p) => {
  //     if (p.childElementCount === 1 && p.firstElementChild?.tagName === "A") {
  //       p.replaceWith(p.firstElementChild);
  //     }
  //   });

  //   tempDiv.querySelectorAll("a").forEach((a) => {
  //     a.style.color = "#2563eb";
  //     a.style.textDecoration = "underline";
  //     a.setAttribute("target", "_blank");
  //     a.setAttribute("rel", "noopener noreferrer");
  //   });

  //   // return tempDiv.innerHTML;
  //   return tempDiv.innerHTML.replace(/&nbsp;/g, " ").trim();
  // }, []);

  const cleanHtml = useCallback((html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Remove empty paragraphs
    tempDiv.querySelectorAll("p").forEach((p) => {
      if (!p.textContent?.trim() && p.childElementCount === 0) p.remove();
      if (p.childElementCount === 1 && p.firstElementChild?.tagName === "BR")
        p.remove();
    });

    // Replace <p><a></a></p> → <a></a>
    tempDiv.querySelectorAll("p").forEach((p) => {
      if (p.childElementCount === 1 && p.firstElementChild?.tagName === "A") {
        p.replaceWith(p.firstElementChild);
      }
    });

    // Style links
    tempDiv.querySelectorAll("a").forEach((a) => {
      a.style.color = "#2563eb";
      a.style.textDecoration = "underline";
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });

    let cleaned = tempDiv.innerHTML.replace(/&nbsp;/g, " ").trim();

    // ⭐ Remove single wrapping <p>
    const match = cleaned.match(/^<p>(.*?)<\/p>$/i);
    if (match) {
      cleaned = match[1];
    }

    return cleaned;
  }, []);

  const handleBlur = useCallback(
    (content: string) => {
      const cleaned = cleanHtml(content || "");
      onChange(cleaned);
    },
    [cleanHtml, onChange],
  );

  return (
    <JoditEditor
      ref={editorRef}
      value={value || ""}
      config={config}
      onBlur={handleBlur}
    />
  );
};
