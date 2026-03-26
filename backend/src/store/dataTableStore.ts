

import { create } from "zustand";

const DEFAULT_TABLE_STATE = {
  page: 1,
  recordsPerPage: 10,
  searchValue: "",
  sortField: "",
  sortOrder: "asc" as const,
};

interface TableState {
  page: number;
  recordsPerPage: number;
  searchValue: string;
  sortField: string;
  sortOrder: "asc" | "desc";

  // Simple module tracking
  currentModule: string | null;
  lastAction: "edit" | "view" | "tab-switch" | null;
  moduleCache: Record<
    string,
    {
      page: number;
      recordsPerPage: number;
      searchValue: string;
      sortField: string;
      sortOrder: "asc" | "desc";
    }
  >;

  setPage: (page: number) => void;
  setRecordsPerPage: (records: number) => void;
  setSearchValue: (value: string) => void;
  setSort: (field: string, order: "asc" | "desc") => void;

  // Module management
  setCurrentModule: (module: string) => void;
  cacheModuleState: (module: string) => void;
  restoreModuleState: (module: string) => void;
  markEditNavigation: () => void;
  markTabSwitch: () => void;
}

export const useDataTableStore = create<TableState>((set, get) => ({
  ...DEFAULT_TABLE_STATE,

  currentModule: null,
  lastAction: null,
  moduleCache: {},

  setPage: (page) => {
    const currentPage = get().page;
    if (currentPage === page) return;
    set({ page });
  },

  setRecordsPerPage: (recordsPerPage) => {
    const state = get();
    if (state.recordsPerPage === recordsPerPage && state.page === 1) return;
    set({ recordsPerPage, page: 1 });
  },

  setSearchValue: (searchValue) => {
    const state = get();
    if (state.searchValue === searchValue && state.page === 1) return;
    set({ searchValue, page: 1 });
  },

  setSort: (sortField, sortOrder) => {
    const state = get();
    if (state.sortField === sortField && state.sortOrder === sortOrder) return;
    set({ sortField, sortOrder });
  },

  setCurrentModule: (module) => {
    const state = get();
    if (state.currentModule === module) return;

    const cached = state.moduleCache[module];

    set({
      currentModule: module,
      lastAction:
        state.currentModule && state.currentModule !== module
          ? "tab-switch"
          : state.lastAction,
      page: cached?.page ?? DEFAULT_TABLE_STATE.page,
      recordsPerPage:
        cached?.recordsPerPage ?? DEFAULT_TABLE_STATE.recordsPerPage,
      searchValue: cached?.searchValue ?? DEFAULT_TABLE_STATE.searchValue,
      sortField: cached?.sortField ?? DEFAULT_TABLE_STATE.sortField,
      sortOrder: cached?.sortOrder ?? DEFAULT_TABLE_STATE.sortOrder,
    });
  },

  cacheModuleState: (module) => {
    const state = get();
    set({
      moduleCache: {
        ...state.moduleCache,
        [module]: {
          page: state.page,
          recordsPerPage: state.recordsPerPage,
          searchValue: state.searchValue,
          sortField: state.sortField,
          sortOrder: state.sortOrder,
        },
      },
    });
  },

  restoreModuleState: (module) => {
    const state = get();
    const cached = state.moduleCache[module];

    set({
      page: cached?.page ?? DEFAULT_TABLE_STATE.page,
      recordsPerPage:
        cached?.recordsPerPage ?? DEFAULT_TABLE_STATE.recordsPerPage,
      searchValue: cached?.searchValue ?? DEFAULT_TABLE_STATE.searchValue,
      sortField: cached?.sortField ?? DEFAULT_TABLE_STATE.sortField,
      sortOrder: cached?.sortOrder ?? DEFAULT_TABLE_STATE.sortOrder,
      lastAction: null,
    });
  },

  markEditNavigation: () => {
    set({ lastAction: "edit" });
  },

  markTabSwitch: () => {
    set({ lastAction: "tab-switch" });
  },
}));
