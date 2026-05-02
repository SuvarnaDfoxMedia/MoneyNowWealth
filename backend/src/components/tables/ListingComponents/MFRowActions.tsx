import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiClock, FiEdit, FiEye, FiMoreVertical, FiTrash2 } from "react-icons/fi";

type MFRowActionsProps = {
  onDelete: () => void;
  onEdit?: () => void;
  onView?: () => void;
  onHistory?: () => void;
  deleteLabel?: string;
};

export default function MFRowActions({
  onDelete,
  onEdit,
  onView,
  onHistory,
  deleteLabel = "Delete",
}: MFRowActionsProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative dropdown">
      <button
        onClick={(event) => {
          event.stopPropagation();
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          setMenuPos({
            top: rect.bottom + 6,
            left: rect.left - 100,
          });
          setOpen((prev) => !prev);
        }}
        className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100"
      >
        <FiMoreVertical size={18} />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed z-[99999] w-36 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {onView && (
              <button
                onClick={() => {
                  setOpen(false);
                  onView();
                }}
                className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                <FiEye className="text-lg" />
                <span>View</span>
              </button>
            )}

            {onHistory && (
              <button
                onClick={() => {
                  setOpen(false);
                  onHistory();
                }}
                className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                <FiClock className="text-lg" />
                <span>History</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                <FiEdit className="text-lg" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-red-600 transition hover:bg-red-50"
            >
              <FiTrash2 className="text-lg" />
              <span>{deleteLabel}</span>
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
