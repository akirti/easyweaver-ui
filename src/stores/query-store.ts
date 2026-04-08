import { create } from 'zustand';
import type {
  FilterCondition,
  SortSpec,
  JoinConfig,
  TransformSpec,
  GroupBySpec,
  DistinctSpec,
  DerivedColumnSpec,
  DataBinding,
} from '@/types';

export interface DatasetState {
  sourceId: string | null;
  table: string | null;
  columns: string[];
  filters: FilterCondition[];
  filterLogic: 'and' | 'or';
  runId: string | null;
  status: 'idle' | 'pending' | 'running' | 'completed' | 'failed';
  rowCount: number | null;
  error: string | null;
  bindings: DataBinding[];
}

export interface JoinStep {
  config: JoinConfig | null;
  selectColumns: string[];
  runId: string | null;
  status: 'idle' | 'pending' | 'running' | 'completed' | 'failed';
  rowCount: number | null;
  error: string | null;
}

const createDataset = (): DatasetState => ({
  sourceId: null,
  table: null,
  columns: [],
  filters: [],
  filterLogic: 'and',
  runId: null,
  status: 'idle',
  rowCount: null,
  error: null,
  bindings: [],
});

const createJoinStep = (): JoinStep => ({
  config: null,
  selectColumns: [],
  runId: null,
  status: 'idle',
  rowCount: null,
  error: null,
});

const clearPostJoin = () => ({
  postJoinFilters: [] as FilterCondition[],
  postJoinFilterLogic: 'and' as const,
  postJoinSorts: [] as SortSpec[],
  postJoinTransforms: [] as TransformSpec[],
  postJoinGroupBy: null as GroupBySpec | null,
  postJoinDistinct: null as DistinctSpec | null,
  postJoinDerivedColumns: [] as DerivedColumnSpec[],
});

interface QueryState {
  datasets: DatasetState[];
  joinSteps: JoinStep[];      // joinSteps[i] joins (i===0 ? dataset[0] : joinSteps[i-1].result) with dataset[i+1]
  postJoinFilters: FilterCondition[];
  postJoinFilterLogic: 'and' | 'or';
  postJoinSorts: SortSpec[];
  postJoinTransforms: TransformSpec[];
  postJoinGroupBy: GroupBySpec | null;
  postJoinDistinct: DistinctSpec | null;
  postJoinDerivedColumns: DerivedColumnSpec[];

  // Dataset actions (indexed)
  addDataset: () => void;
  removeDataset: (index: number) => void;
  setDatasetSource: (index: number, sourceId: string | null) => void;
  setDatasetTable: (index: number, table: string | null) => void;
  setDatasetColumns: (index: number, columns: string[]) => void;
  setDatasetFilters: (index: number, filters: FilterCondition[]) => void;
  setDatasetFilterLogic: (index: number, logic: 'and' | 'or') => void;
  setDatasetRun: (index: number, runId: string | null, status: DatasetState['status'], rowCount?: number | null, error?: string | null) => void;
  setDatasetBindings: (index: number, bindings: DataBinding[]) => void;

  // Join step actions (indexed)
  setJoinConfig: (stepIndex: number, config: JoinConfig | null) => void;
  setJoinSelectColumns: (stepIndex: number, columns: string[]) => void;
  setJoinResult: (stepIndex: number, runId: string | null, status: JoinStep['status'], rowCount?: number | null, error?: string | null, preservePostJoin?: boolean) => void;

  // Post-join
  setPostJoinFilters: (filters: FilterCondition[]) => void;
  setPostJoinFilterLogic: (logic: 'and' | 'or') => void;
  setPostJoinSorts: (sorts: SortSpec[]) => void;
  setPostJoinTransforms: (transforms: TransformSpec[]) => void;
  setPostJoinGroupBy: (spec: GroupBySpec | null) => void;
  setPostJoinDistinct: (spec: DistinctSpec | null) => void;
  setPostJoinDerivedColumns: (cols: DerivedColumnSpec[]) => void;

  reset: () => void;
}

/** Invalidate join steps from `fromIndex` onwards (set to idle, clear results). */
function invalidateJoinStepsFrom(joinSteps: JoinStep[], fromIndex: number): JoinStep[] {
  return joinSteps.map((step, i) =>
    i >= fromIndex ? createJoinStep() : step
  );
}

export const useQueryStore = create<QueryState>((set) => ({
  datasets: [createDataset(), createDataset()],
  joinSteps: [createJoinStep()],
  postJoinFilters: [],
  postJoinFilterLogic: 'and',
  postJoinSorts: [],
  postJoinTransforms: [],
  postJoinGroupBy: null,
  postJoinDistinct: null,
  postJoinDerivedColumns: [],

  // --- Dataset actions ---

  addDataset: () =>
    set((s) => ({
      datasets: [...s.datasets, createDataset()],
      joinSteps: [...s.joinSteps, createJoinStep()],
    })),

  removeDataset: (index) =>
    set((s) => {
      if (s.datasets.length <= 2 || index < 2) return s; // can't remove first two
      const datasets = s.datasets.filter((_, i) => i !== index);
      const joinSteps = s.joinSteps.filter((_, i) => i !== index - 1);
      const invalidated = invalidateJoinStepsFrom(joinSteps, Math.max(0, index - 1));
      return { datasets, joinSteps: invalidated, ...clearPostJoin() };
    }),

  setDatasetSource: (index, sourceId) =>
    set((s) => {
      const datasets = s.datasets.map((ds, i) =>
        i === index ? { ...createDataset(), sourceId } : ds
      );
      const joinFrom = Math.max(0, index - 1);
      const joinSteps = invalidateJoinStepsFrom(s.joinSteps, joinFrom);
      return { datasets, joinSteps, ...clearPostJoin() };
    }),

  setDatasetTable: (index, table) =>
    set((s) => {
      const datasets = s.datasets.map((ds, i) =>
        i === index
          ? { ...ds, table, columns: [], filters: [], runId: null, status: 'idle' as const, rowCount: null, error: null }
          : ds
      );
      const joinFrom = Math.max(0, index - 1);
      const joinSteps = invalidateJoinStepsFrom(s.joinSteps, joinFrom);
      return { datasets, joinSteps, ...clearPostJoin() };
    }),

  setDatasetColumns: (index, columns) =>
    set((s) => ({
      datasets: s.datasets.map((ds, i) => (i === index ? { ...ds, columns } : ds)),
    })),

  setDatasetFilters: (index, filters) =>
    set((s) => ({
      datasets: s.datasets.map((ds, i) => (i === index ? { ...ds, filters } : ds)),
    })),

  setDatasetFilterLogic: (index, logic) =>
    set((s) => ({
      datasets: s.datasets.map((ds, i) => (i === index ? { ...ds, filterLogic: logic } : ds)),
    })),

  setDatasetRun: (index, runId, status, rowCount = null, error = null) =>
    set((s) => {
      const datasets = s.datasets.map((ds, i) =>
        i === index ? { ...ds, runId, status, rowCount, error } : ds
      );
      const joinFrom = Math.max(0, index - 1);
      const joinSteps = invalidateJoinStepsFrom(s.joinSteps, joinFrom);
      return { datasets, joinSteps, ...clearPostJoin() };
    }),

  setDatasetBindings: (index, bindings) =>
    set((s) => ({
      datasets: s.datasets.map((ds, i) => (i === index ? { ...ds, bindings } : ds)),
    })),

  // --- Join step actions ---

  setJoinConfig: (stepIndex, config) =>
    set((s) => ({
      joinSteps: s.joinSteps.map((step, i) => (i === stepIndex ? { ...step, config } : step)),
    })),

  setJoinSelectColumns: (stepIndex, columns) =>
    set((s) => ({
      joinSteps: s.joinSteps.map((step, i) =>
        i === stepIndex ? { ...step, selectColumns: columns } : step
      ),
    })),

  setJoinResult: (stepIndex, runId, status, rowCount = null, error = null, preservePostJoin = false) =>
    set((s) => {
      const joinSteps = s.joinSteps.map((step, i) =>
        i === stepIndex ? { ...step, runId, status, rowCount, error } : step
      );
      const invalidated = invalidateJoinStepsFrom(joinSteps, stepIndex + 1);
      if (preservePostJoin) {
        return { joinSteps: invalidated };
      }
      return { joinSteps: invalidated, ...clearPostJoin() };
    }),

  // --- Post-join ---

  setPostJoinFilters: (filters) => set({ postJoinFilters: filters }),
  setPostJoinFilterLogic: (logic) => set({ postJoinFilterLogic: logic }),
  setPostJoinSorts: (sorts) => set({ postJoinSorts: sorts }),
  setPostJoinTransforms: (transforms) => set({ postJoinTransforms: transforms }),
  setPostJoinGroupBy: (spec) => set({ postJoinGroupBy: spec }),
  setPostJoinDistinct: (spec) => set({ postJoinDistinct: spec }),
  setPostJoinDerivedColumns: (cols) => set({ postJoinDerivedColumns: cols }),

  reset: () =>
    set({
      datasets: [createDataset(), createDataset()],
      joinSteps: [createJoinStep()],
      ...clearPostJoin(),
    }),
}));
