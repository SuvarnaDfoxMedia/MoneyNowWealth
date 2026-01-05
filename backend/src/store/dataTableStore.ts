

import { create } from "zustand";

interface TableState {
  page: number;
  recordsPerPage: number;
  searchValue: string;
  sortField: string;
  sortOrder: "asc" | "desc";

  setPage: (page: number) => void;
  setRecordsPerPage: (records: number) => void;
  setSearchValue: (value: string) => void;
  setSort: (field: string, order: "asc" | "desc") => void;
}

export const useDataTableStore = create<TableState>((set) => ({
  page: 1,
  recordsPerPage: 10,
  searchValue: "",
  sortField: "",
  sortOrder: "asc",

  setPage: (page) => set({ page }),
  setRecordsPerPage: (recordsPerPage) =>
    set({ recordsPerPage }), // Remove page: 1
  setSearchValue: (searchValue) =>
    set({ searchValue }),   // Remove page: 1
  setSort: (sortField, sortOrder) =>
    set({ sortField, sortOrder }), // Remove page: 1
}));
