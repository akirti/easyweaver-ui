import { create } from 'zustand';
import type { FilterCondition, SortSpec, JoinConfig, TransformSpec } from '@/types';

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
}

export interface JoinStep {
  config: JoinConfig | null;
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
});

const createJoinStep = (): JoinStep => ({
  config: null,
  runId: null,
  status: 'idle',
  rowCount: null,
  error: null,
});

interface QueryState {
  datasets: DatasetState[];
  joinSteps: JoinStep[];      // joinSteps[i] joins (i===0 ? dataset[0] : joinSteps[i-1].result) with dataset[i+1]
  postJoinFilters: FilterCondition[];
  postJoinFilterLogic: 'and' | 'or';
  postJoinSorts: SortSpec[];
  postJoinTransforms: TransformSpec[];

  // Dataset actions (indexed)
  addDataset: () => void;
  removeDataset: (index: number) => void;
  setDatasetSource: (index: number, sourceId: string | null) => void;
  setDatasetTable: (index: number, table: string | null) => void;
  setDatasetColumns: (index: number, columns: string[]) => void;
  setDatasetFilters: (index: number, filters: FilterCondition[]) => void;
  setDatasetFilterLogic: (index: number, logic: 'and' | 'or') => void;
  setDatasetRun: (index: number, runId: string | null, status: DatasetState['status'], rowCount?: number | null, error?: string | null) => void;

  // Join step actions (indexed)
  setJoinConfig: (stepIndex: number, config: JoinConfig | null) => void;
  setJoinResult: (stepIndex: number, runId: string | null, status: JoinStep['status'], rowCount?: number | null, error?: string | null) => void;

  // Post-join
  setPostJoinFilters: (filters: FilterCondition[]) => void;
  setPostJoinFilterLogic: (logic: 'and' | 'or') => void;
  setPostJoinSorts: (sorts: SortSpec[]) => void;
  setPostJoinTransforms: (transforms: TransformSpec[]) => void;

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
      // Remove the join step that connected this dataset
      // joinSteps[i] connects result-of-(i-1) with dataset[i+1]
      // When removing dataset[index], we remove joinSteps[index-1]
      const joinSteps = s.joinSteps.filter((_, i) => i !== index - 1);
      // Invalidate from the removed position onwards
      const invalidated = invalidateJoinStepsFrom(joinSteps, Math.max(0, index - 1));
      return {
        datasets,
        joinSteps: invalidated,
        postJoinFilters: [],
        postJoinFilterLogic: 'and' as const,
        postJoinSorts: [],
        postJoinTransforms: [],
      };
    }),

  setDatasetSource: (index, sourceId) =>
    set((s) => {
      const datasets = s.datasets.map((ds, i) =>
        i === index ? { ...createDataset(), sourceId } : ds
      );
      // Invalidate join steps involving this dataset
      const joinFrom = Math.max(0, index - 1);
      const joinSteps = invalidateJoinStepsFrom(s.joinSteps, joinFrom);
      return { datasets, joinSteps, postJoinFilters: [], postJoinFilterLogic: 'and' as const, postJoinSorts: [], postJoinTransforms: [] };
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
      return { datasets, joinSteps, postJoinFilters: [], postJoinFilterLogic: 'and' as const, postJoinSorts: [], postJoinTransforms: [] };
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
      // Invalidate downstream join steps when a dataset reruns
      const joinFrom = Math.max(0, index - 1);
      const joinSteps = invalidateJoinStepsFrom(s.joinSteps, joinFrom);
      return { datasets, joinSteps, postJoinFilters: [], postJoinFilterLogic: 'and' as const, postJoinSorts: [], postJoinTransforms: [] };
    }),

  // --- Join step actions ---

  setJoinConfig: (stepIndex, config) =>
    set((s) => ({
      joinSteps: s.joinSteps.map((step, i) => (i === stepIndex ? { ...step, config } : step)),
    })),

  setJoinResult: (stepIndex, runId, status, rowCount = null, error = null) =>
    set((s) => {
      const joinSteps = s.joinSteps.map((step, i) =>
        i === stepIndex ? { ...step, runId, status, rowCount, error } : step
      );
      // Invalidate downstream join steps when an upstream join result changes
      const invalidated = invalidateJoinStepsFrom(joinSteps, stepIndex + 1);
      return { joinSteps: invalidated, postJoinFilters: [], postJoinFilterLogic: 'and' as const, postJoinSorts: [], postJoinTransforms: [] };
    }),

  // --- Post-join ---

  setPostJoinFilters: (filters) => set({ postJoinFilters: filters }),
  setPostJoinFilterLogic: (logic) => set({ postJoinFilterLogic: logic }),
  setPostJoinSorts: (sorts) => set({ postJoinSorts: sorts }),
  setPostJoinTransforms: (transforms) => set({ postJoinTransforms: transforms }),

  reset: () =>
    set({
      datasets: [createDataset(), createDataset()],
      joinSteps: [createJoinStep()],
      postJoinFilters: [],
      postJoinFilterLogic: 'and' as const,
      postJoinSorts: [],
      postJoinTransforms: [],
    }),
}));
