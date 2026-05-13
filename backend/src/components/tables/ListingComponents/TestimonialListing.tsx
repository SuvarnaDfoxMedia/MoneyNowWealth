import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiEdit, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { DataTable, type TableColumn } from "../../PagesComponent/DataTable";

export type TestimonialItem = {
  _id: string;
  image: string;
  name: string;
  designation: string;
  description: string;
  rating: number;
  isActive: boolean;
  order: number;
};

type Props = {
  data: TestimonialItem[];
  total?: number;
  loading?: boolean;
  onEdit: (item: TestimonialItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export default function TestimonialListing({
  data,
  total,
  loading = false,
  onEdit,
  onDelete,
  onToggle,
}: Props) {
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const sortedData = useMemo(
    () => [...data].sort((a, b) => Number(a.order || 0) - Number(b.order || 0)),
    [data],
  );

  const totalRecords = total ?? sortedData.length;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    }
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * recordsPerPage;
    return sortedData.slice(start, start + recordsPerPage);
  }, [page, recordsPerPage, sortedData]);

  const columns: TableColumn<TestimonialItem>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    {
      key: "profile",
      label: "Profile",
      render: (item) =>
        item.image ? (
          <img src={item.image} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
            {item.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        ),
    },
    { key: "name", label: "Name", render: (item) => <span className="font-medium text-gray-900">{item.name}</span> },
    { key: "designation", label: "Designation", render: (item) => item.designation },
    {
      key: "description",
      label: "Description",
      render: (item) => (
        <p className="max-w-[320px] truncate text-gray-700" title={stripHtml(item.description || "")}>
          {stripHtml(item.description || "") || "-"}
        </p>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      render: (item) => (
        <span className="text-[#043f79]">
          {"\u2605".repeat(Math.max(0, Math.min(5, Number(item.rating || 0))))}
          {"\u2606".repeat(5 - Math.max(0, Math.min(5, Number(item.rating || 0))))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Activation",
      render: (item) => (
        <button
          onClick={async () => {
            try {
              onToggle(item._id);
            } catch (err: unknown) {
              const message =
                err instanceof Error ? err.message : "Failed to update status";
              toast.error(message);
            }
          }}
          className={`px-4 py-1 rounded-md text-white ${
            item.isActive ? "bg-green-600" : "bg-gray-600"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setDropdownPos({ top: rect.bottom + 6, left: rect.left - 90 });
              setOpenDropdownId((prev) => (prev === item._id ? null : item._id));
            }}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiMoreVertical size={18} />
          </button>

          {openDropdownId === item._id &&
            createPortal(
              <div
                ref={dropdownRef}
                className="fixed z-[99999] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
                style={{ top: dropdownPos.top, left: dropdownPos.left, width: "9rem" }}
              >
                <button
                  onClick={() => {
                    onEdit(item);
                    setOpenDropdownId(null);
                  }}
                  className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
                >
                  <FiEdit /> Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(item._id);
                    setOpenDropdownId(null);
                  }}
                  className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>,
              document.body,
            )}
        </>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={paginatedData}
      loading={loading}
      page={page}
      totalPages={totalPages}
      totalRecords={totalRecords}
      recordsPerPage={recordsPerPage}
      onPageChange={setPage}
      onRecordsPerPageChange={(value) => {
        setRecordsPerPage(value);
        setPage(1);
      }}
    />
  );
}
