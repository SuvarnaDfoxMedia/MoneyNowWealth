

// import React, { useRef, useMemo, useCallback } from "react";
// import JoditEditor from "jodit-react";

// interface RichTextFieldProps {
//   value: string;
//   onChange: (val: string) => void;
//   height?: number;
//   readOnly?: boolean;
// }

// export const RichTextField: React.FC<RichTextFieldProps> = ({
//   value,
//   onChange,
//   height = 600,
//   readOnly = false,
// }) => {
//   const editorRef = useRef<any>(null);

//   const config = useMemo(
//     () => ({
//       readonly: readOnly,
//       height,
//       toolbarSticky: true,
//       link: {
//         noFollowCheckbox: false,
//         openInNewTabCheckbox: true,
//         processVideoLink: true,
//       },
//       askBeforePasteHTML: false,
//       askBeforePasteFromWord: false,
//       uploader: {
//         insertImageAsBase64URI: true,
//       },
//     }),
//     [height, readOnly]
//   );

//   // ---------------- Cleaning HTML ----------------
//   const cleanHtml = useCallback((html: string) => {
//     const tempDiv = document.createElement("div");
//     tempDiv.innerHTML = html;

//     // Remove empty <p> or <p><br></p>
//     tempDiv.querySelectorAll("p").forEach((p) => {
//       if (!p.textContent?.trim() && p.childElementCount === 0) p.remove();
//       if (p.childElementCount === 1 && p.firstElementChild?.tagName === "BR") p.remove();
//     });

//     // Unwrap <p> that only has <a>
//     tempDiv.querySelectorAll("p").forEach((p) => {
//       if (p.childElementCount === 1 && p.firstElementChild?.tagName === "A") {
//         p.replaceWith(p.firstElementChild);
//       }
//     });

//     return tempDiv.innerHTML;
//   }, []);

//   const handleBlur = useCallback(
//     (content: string) => {
//       const cleaned = cleanHtml(content || "");
//       onChange(cleaned);
//     },
//     [cleanHtml, onChange]
//   );

//   return (
//     <JoditEditor
//       ref={editorRef}
//       value={value || ""}
//       config={config}
//       onBlur={handleBlur}
//     />
//   );
// };


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
  height = 600,
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
      // ---------------- Inject CSS for links ----------------
      style: {
        // This adds CSS inside the editor so links appear blue
        'a': 'color: #2563eb; text-decoration: underline;', // Tailwind blue-600
        'a:hover': 'color: #1d4ed8;' // Tailwind blue-800
      }
    }),
    [height, readOnly]
  );

  // ---------------- Cleaning HTML ----------------
  const cleanHtml = useCallback((html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Remove empty <p> or <p><br></p>
    tempDiv.querySelectorAll("p").forEach((p) => {
      if (!p.textContent?.trim() && p.childElementCount === 0) p.remove();
      if (p.childElementCount === 1 && p.firstElementChild?.tagName === "BR") p.remove();
    });

    // Unwrap <p> that only has <a>
    tempDiv.querySelectorAll("p").forEach((p) => {
      if (p.childElementCount === 1 && p.firstElementChild?.tagName === "A") {
        p.replaceWith(p.firstElementChild);
      }
    });

    // ---------------- Force links to have blue color ----------------
    tempDiv.querySelectorAll("a").forEach((a) => {
      a.style.color = "#2563eb"; // Tailwind blue-600
      a.style.textDecoration = "underline";
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });

    return tempDiv.innerHTML;
  }, []);

  const handleBlur = useCallback(
    (content: string) => {
      const cleaned = cleanHtml(content || "");
      onChange(cleaned);
    },
    [cleanHtml, onChange]
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
