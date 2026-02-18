import { create } from 'zustand';
import type { FilterCondition, SortSpec, JoinConfig } from '@/types';

interface QueryState {
  // Left source
  leftSourceId: string | null;
  leftTable: string | null;
  leftColumns: string[];

  // Right source (for joins)
  rightSourceId: string | null;
  rightTable: string | null;
  rightColumns: string[];

  // Join
  isJoin: boolean;
  joinConfig: JoinConfig | null;

  // Filters & sorts
  leftFilters: FilterCondition[];
  rightFilters: FilterCondition[];
  sorts: SortSpec[];

  // Current run
  currentRunId: string | null;

  // Actions
  setLeftSource: (sourceId: string | null, table?: string | null) => void;
  setLeftTable: (table: string | null) => void;
  setLeftColumns: (columns: string[]) => void;
  setRightSource: (sourceId: string | null, table?: string | null) => void;
  setRightTable: (table: string | null) => void;
  setRightColumns: (columns: string[]) => void;
  setIsJoin: (isJoin: boolean) => void;
  setJoinConfig: (config: JoinConfig | null) => void;
  setLeftFilters: (filters: FilterCondition[]) => void;
  setRightFilters: (filters: FilterCondition[]) => void;
  setSorts: (sorts: SortSpec[]) => void;
  setCurrentRunId: (runId: string | null) => void;
  reset: () => void;
}

const initialState = {
  leftSourceId: null,
  leftTable: null,
  leftColumns: [],
  rightSourceId: null,
  rightTable: null,
  rightColumns: [],
  isJoin: false,
  joinConfig: null,
  leftFilters: [],
  rightFilters: [],
  sorts: [],
  currentRunId: null,
};

export const useQueryStore = create<QueryState>((set) => ({
  ...initialState,

  setLeftSource: (sourceId, table = null) =>
    set({ leftSourceId: sourceId, leftTable: table, leftColumns: [] }),
  setLeftTable: (table) => set({ leftTable: table, leftColumns: [] }),
  setLeftColumns: (columns) => set({ leftColumns: columns }),
  setRightSource: (sourceId, table = null) =>
    set({ rightSourceId: sourceId, rightTable: table, rightColumns: [] }),
  setRightTable: (table) => set({ rightTable: table, rightColumns: [] }),
  setRightColumns: (columns) => set({ rightColumns: columns }),
  setIsJoin: (isJoin) =>
    set({
      isJoin,
      ...(isJoin ? {} : { rightSourceId: null, rightTable: null, rightColumns: [], joinConfig: null, rightFilters: [] }),
    }),
  setJoinConfig: (config) => set({ joinConfig: config }),
  setLeftFilters: (filters) => set({ leftFilters: filters }),
  setRightFilters: (filters) => set({ rightFilters: filters }),
  setSorts: (sorts) => set({ sorts }),
  setCurrentRunId: (runId) => set({ currentRunId: runId }),
  reset: () => set(initialState),
}));
