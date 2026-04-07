import React from "react";
import { FiPlus } from "react-icons/fi";

type MFListingHeaderProps = {
  title: string;
  onAdd: () => void;
};

export default function MFListingHeader({ title, onAdd }: MFListingHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-medium">{title}</h2>
      <button
        onClick={onAdd}
        className="bg-[#043f79] text-white px-3 py-2 rounded-md flex items-center gap-2"
      >
        <FiPlus /> Add
      </button>
    </div>
  );
}
