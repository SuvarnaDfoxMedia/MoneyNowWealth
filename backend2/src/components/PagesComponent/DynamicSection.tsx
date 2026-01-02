// import { FiPlus } from "react-icons/fi";
// import { RichTextField } from "./RichTextField";

// interface DynamicSectionProps<T> {
//   label: string;
//   items: T[];
//   fieldNames: { title: keyof T; content: keyof T };
//   placeholders: { title: string; content: string };
//   onAdd: () => void;
//   onChange: (index: number, field: keyof T, value: string) => void;
//   onRemove: (index: number) => void;
// }

// export function DynamicSection<T extends Record<string, string>>({
//   label,
//   items,
//   fieldNames,
//   placeholders,
//   onAdd,
//   onChange,
//   onRemove,
// }: DynamicSectionProps<T>) {
//   const singularLabel =
//     typeof label === "string" ? label.replace(/s$/, "") : "";

//   return (
//     <div className="p-4 rounded-lg bg-gray-50 space-y-3">
//       <div className="flex justify-between items-center">
//         <h2 className="font-semibold text-gray-800">{label}</h2>
//         <button
//           type="button"
//           onClick={onAdd}
//           className="flex items-center text-blue-600 hover:underline"
//         >
//           <FiPlus className="mr-1" /> Add {singularLabel}
//         </button>
//       </div>

//       {items && items.length > 0 ? (
//         items.map((item, index) => (
//           <RichTextField
//             key={index}
//             index={index}
//             data={item}
//             fieldNames={fieldNames}
//             placeholders={placeholders}
//             onChange={onChange}
//             onRemove={onRemove}
//           />
//         ))
//       ) : (
//         <p className="text-gray-500 text-sm">
//           No {typeof label === "string" ? label.toLowerCase() : ""} added yet.
//         </p>
//       )}
//     </div>
//   );
// }


import React from "react";
import { FiPlus } from "react-icons/fi";
import { RichTextField } from "./RichTextField";

interface DynamicSectionProps<T> {
  label: string;
  items: T[];
  fieldNames: { title: keyof T; content: keyof T };
  placeholders: { title: string; content: string };
  onAdd: () => void;
  onChange: (index: number, field: keyof T, value: string) => void;
  onRemove: (index: number) => void;
}

export function DynamicSection<T extends Record<string, string>>({
  label,
  items,
  fieldNames,
  placeholders,
  onAdd,
  onChange,
  onRemove,
}: DynamicSectionProps<T>) {
  const singularLabel = typeof label === "string" ? label.replace(/s$/, "") : "";

  return (
    <div className="p-4 rounded-lg bg-gray-50 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">{label}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center text-blue-600 hover:underline"
        >
          <FiPlus className="mr-1" /> Add {singularLabel}
        </button>
      </div>

      {items.length > 0 ? (
        items.map((item, index) => (
          <div key={index} className="space-y-2 border p-3 rounded-md bg-white">
            {/* Title Input */}
            <input
              type="text"
              placeholder={placeholders.title}
              value={item[fieldNames.title]}
              onChange={(e) => onChange(index, fieldNames.title, e.target.value)}
              className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />

            {/* Content Rich Text Editor */}
            <RichTextField
              value={item[fieldNames.content]}
              onChange={(val) => onChange(index, fieldNames.content, val)}
              height={300} // optional, can be customized
            />

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-red-600 hover:underline text-sm"
            >
              Remove {singularLabel}
            </button>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm">
          No {typeof label === "string" ? label.toLowerCase() : ""} added yet.
        </p>
      )}
    </div>
  );
}
