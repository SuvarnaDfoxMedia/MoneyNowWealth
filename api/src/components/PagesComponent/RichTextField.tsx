import React, { useRef, useMemo, useCallback, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import JoditEditor from "jodit-react";
import { Jodit } from "jodit";
import type { IJodit } from "jodit/esm/types/jodit";

interface RichTextFieldProps {
  value: string;
  onChange: (val: string) => void;
  height?: number;
  readOnly?: boolean;
}

export const RichTextField: React.FC<RichTextFieldProps> = ({
  value,
  onChange,
  height = 500,
  readOnly = false,
}) => {
  const editorRef = useRef<IJodit | null>(null);
  const isEditingRef = useRef(false);
  const [draftValue, setDraftValue] = useState(value ?? "");

  const config = useMemo(
    () => ({
      readonly: readOnly,
      height,
      enter: "p" as const,
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
      controls: {
        font: {
          list: Jodit.atom({
            "Poppins, sans-serif": "Poppins",
            "Inter, sans-serif": "Inter",
            "Arial, Helvetica, sans-serif": "Arial",
            "'Times New Roman', Times, serif": "Times New Roman",
            "Georgia, Palatino, serif": "Georgia",
            "Tahoma, Geneva, sans-serif": "Tahoma",
            "Verdana, Geneva, sans-serif": "Verdana",
          }),
        },
      },
      style: {
        fontFamily: "Poppins, sans-serif",
        a: "color: #2563eb; text-decoration: underline;",
        "a:hover": "color: #1d4ed8;",
      },
    }),
    [height, readOnly],
  );

const cleanHtml = useCallback((html: string) => {
    const sanitized = DOMPurify.sanitize(html || "", {
      USE_PROFILES: { html: true },
    });

    if (!sanitized.trim()) {
      return "";
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = sanitized;

    const setFontFamily = (element: Element, fontFamily: string) => {
      const style = element.getAttribute("style");
      const styles = (style || "")
        .split(";")
        .map((rule) => rule.trim())
        .filter(Boolean)
        .filter((rule) => !rule.toLowerCase().startsWith("font-family:"));

      styles.push(`font-family: ${fontFamily}`);
      element.setAttribute("style", styles.join("; "));
    };

    tempDiv.querySelectorAll("*").forEach((element) => {
      element.classList.remove("MsoNormal");

      const style = element.getAttribute("style");
      if (!style) {
        return;
      }

      const styleMap = style
        .split(";")
        .map((rule) => rule.trim())
        .filter(Boolean)
        .map((rule) => {
          const [property, ...valueParts] = rule.split(":");
          return [property?.trim().toLowerCase(), valueParts.join(":").trim()] as const;
        })
        .filter(([property, value]) => property && value);

      const filteredStyles = styleMap.filter(([property]) => {
        return ![
          "font-family",
          "font-size",
          "line-height",
          "mso-bidi-font-family",
          "mso-fareast-font-family",
          "mso-ansi-language",
          "mso-fareast-language",
          "mso-bidi-language",
        ].includes(property);
      });

      if (filteredStyles.length === 0) {
        element.removeAttribute("style");
        return;
      }

      element.setAttribute(
        "style",
        filteredStyles
          .map(([property, value]) => `${property}: ${value}`)
          .join("; "),
      );
    });

    tempDiv
      .querySelectorAll("h1, h2, h3, h4, h5, h6")
      .forEach((heading) => setFontFamily(heading, "Inter, sans-serif"));

    tempDiv
      .querySelectorAll("p, li, td, th, blockquote")
      .forEach((element) => setFontFamily(element, "Poppins, sans-serif"));

    // Keep links safe and consistently styled without flattening paragraphs.
    tempDiv.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href")?.trim() ?? "";

      if (!href) {
        a.removeAttribute("target");
        a.removeAttribute("rel");
      } else {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }

      a.style.color = "#2563eb";
      a.style.textDecoration = "underline";
      a.style.fontFamily = "Poppins, sans-serif";
    });

    return tempDiv.innerHTML.replace(/&nbsp;/g, " ").trim();
  }, []);

  const handleChange = useCallback(
    (content: string) => {
      isEditingRef.current = true;
      if (editorRef.current && content !== editorRef.current.value) {
        editorRef.current.value = content || "";
      }
    },
    [],
  );

  const handleBlur = useCallback(
    (content: string) => {
      isEditingRef.current = false;
      const cleaned = cleanHtml(content || "");
      setDraftValue(cleaned);
      onChange(cleaned);
    },
    [cleanHtml, onChange],
  );

  useEffect(() => {
    const nextValue = value ?? "";
    if (!isEditingRef.current && nextValue !== draftValue) {
      setDraftValue(nextValue);
    }
  }, [draftValue, value]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (isEditingRef.current) return;

    const nextValue = value ?? "";
    if (editorRef.current.value !== nextValue) {
      editorRef.current.value = nextValue;
    }
  }, [value]);

  return (
    <JoditEditor
      ref={editorRef}
      className="rich-text-field"
      value={draftValue}
      config={config}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
