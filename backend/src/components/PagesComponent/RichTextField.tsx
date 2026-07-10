import React, { useRef, useMemo, useCallback, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import JoditEditor from "jodit-react";
import { Jodit } from "jodit";
import type { IJodit } from "jodit/esm/types/jodit";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  hasLooseBulletLines,
  normalizeRichTextHtml,
} from "../../utils/normalizeRichTextHtml";

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
  const isPastedRef = useRef(false);
  const [initialValue] = useState(value ?? "");

  const { role } = useParams<{ role?: string }>();
  const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || "/api";
  
  const uploadUrl = role 
    ? `${API_BASE}/${role}/article/upload-section-image` 
    : `${API_BASE}/upload-article`;

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
        url: uploadUrl,
        format: "json",
        method: "POST",
        withCredentials: true,
        filesVariableName: () => "image",
        isSuccess: (resp: any) => resp.success,
        process: (resp: any) => {
          const fullUrl = (resp.url as string) || "";
          const filename = resp.filename || fullUrl.split('/').pop() || "";
          const baseurl = filename ? fullUrl.slice(0, fullUrl.lastIndexOf(filename)) : "";
          
          return {
            files: filename ? [filename] : [],
            isImages: [true],
            path: fullUrl,
            baseurl: baseurl,
            error: resp.success ? 0 : 1,
            msg: resp.message || "",
          };
        },
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
        ul: "list-style-type: disc; margin: 1em 0; padding-left: 1.5rem;",
        ol: "list-style-type: decimal; margin: 1em 0; padding-left: 1.5rem;",
        li: "margin: 0.35em 0;",
      },
    }),
    [height, readOnly, uploadUrl],
  );

  const cleanHtml = useCallback((html: string) => {
    const sanitized = DOMPurify.sanitize(html || "", {
      USE_PROFILES: { html: true },
    });

    if (!sanitized.trim()) {
      return "";
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = normalizeRichTextHtml(sanitized);

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
          return [
            property?.trim().toLowerCase(),
            valueParts.join(":").trim(),
          ] as const;
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

  const handleChange = useCallback(() => {
    isEditingRef.current = true;
  }, []);

  const handleBlur = useCallback(
    (content: string) => {
      isEditingRef.current = false;
      const nextContent = content || "";
      const shouldNormalize =
        isPastedRef.current || hasLooseBulletLines(nextContent);

      isPastedRef.current = false;

      if (shouldNormalize) {
        const cleaned = cleanHtml(nextContent);

        if (editorRef.current && editorRef.current.value !== cleaned) {
          editorRef.current.value = cleaned;
        }

        onChange(cleaned);
        return;
      }

      onChange(nextContent);
    },
    [cleanHtml, onChange],
  );

  useEffect(() => {
    if (isEditingRef.current) return;
    if (!editorRef.current) return;

    const nextValue = cleanHtml(value ?? "");
    if (editorRef.current.value !== nextValue) {
      editorRef.current.value = nextValue;
    }
  }, [cleanHtml, value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handlePaste = () => {
      isPastedRef.current = true;
    };

    editor.events.on("paste", handlePaste);

    return () => {
      editor.events.off("paste", handlePaste);
    };
  }, []);

  return (
    <JoditEditor
      ref={editorRef}
      className="rich-text-field"
      value={initialValue}
      config={config}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
