// import { create } from "zustand";

// interface TableState {
//   page: number;
//   recordsPerPage: number;
//   searchValue: string;
//   sortField: string;
//   sortOrder: "asc" | "desc";

//   setPage: (page: number) => void;
//   setRecordsPerPage: (records: number) => void;
//   setSearchValue: (value: string) => void;
//   setSort: (field: string, order: "asc" | "desc") => void;
// }

// export const useDataTableStore = create<TableState>((set) => ({
//   page: 1,
//   recordsPerPage: 10,
//   searchValue: "",
//   sortField: "",
//   sortOrder: "asc",

//   setPage: (page) => set({ page }),
//   setRecordsPerPage: (recordsPerPage) => set({ recordsPerPage }), // Remove page: 1
//   setSearchValue: (searchValue) => set({ searchValue }), // Remove page: 1
//   setSort: (sortField, sortOrder) => set({ sortField, sortOrder }), // Remove page: 1
// }));

import { create } from "zustand";

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
  page: 1,
  recordsPerPage: 10,
  searchValue: "",
  sortField: "",
  sortOrder: "asc",

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

    // If switching to a different module, mark as tab switch
    if (state.currentModule && state.currentModule !== module) {
      set({ lastAction: "tab-switch", currentModule: module, page: 1 });
    } else {
      if (state.currentModule !== module) {
        set({ currentModule: module });
      }
    }
  },

  cacheModuleState: (module) => {
    const state = get();
    set({
      moduleCache: {
        ...state.moduleCache,
        [module]: {
          page: state.page,
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

    if (cached && state.lastAction === "edit") {
      // Restore from cache if we just edited
      set({
        page: cached.page,
        searchValue: cached.searchValue,
        sortField: cached.sortField,
        sortOrder: cached.sortOrder,
        lastAction: null, // Reset after restore
      });
    }
  },

  markEditNavigation: () => {
    set({ lastAction: "edit" });
  },

  markTabSwitch: () => {
    set({ lastAction: "tab-switch" });
  },
}));
