import { useReducer } from 'react';
import type { WsServerMessage } from '@/types';

export interface DatasetProgress {
  status: 'waiting' | 'fetching' | 'paused' | 'completed' | 'failed';
  rows_fetched: number;
  total_rows: number | null;
  batch_number: number;
  batch_size: number;
  batch_time_ms: number;
  depends_on: string[];
  waiting_for: string[];
}

export interface JoinStep {
  key: string;
  left: string;
  right: string;
  status: string;
  rows: number | null;
}

export interface TransformStep {
  operation: string;
  step: number;
  totalSteps: number;
}

export interface ProgressState {
  phase: string | null;
  phaseIndex: number;
  totalPhases: number;
  datasets: Record<string, DatasetProgress>;
  paused: boolean;
  cancelled: boolean;
  adaptiveEnabled: boolean;
  batchSizeOverride: number | null;
  targetSeconds: number;
  runId: string | null;
  dag: Record<string, string[]> | null;
  completed: boolean;
  error: string | null;
  totalRows: number | null;
  currentOperation: string | null;
  joinStep: JoinStep | null;
  transformStep: TransformStep | null;
}

export type ProgressAction = WsServerMessage | { type: 'reset' };

function makeDatasetEntry(): DatasetProgress {
  return {
    status: 'waiting',
    rows_fetched: 0,
    total_rows: null,
    batch_number: 0,
    batch_size: 0,
    batch_time_ms: 0,
    depends_on: [],
    waiting_for: [],
  };
}

export const initialState: ProgressState = {
  phase: null,
  phaseIndex: 0,
  totalPhases: 0,
  datasets: {},
  paused: false,
  cancelled: false,
  adaptiveEnabled: false,
  batchSizeOverride: null,
  targetSeconds: 10,
  runId: null,
  dag: null,
  completed: false,
  error: null,
  totalRows: null,
  currentOperation: null,
  joinStep: null,
  transformStep: null,
};

export function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'run_started': {
      const datasets: Record<string, DatasetProgress> = {};
      for (const ds of action.datasets) {
        datasets[ds] = {
          ...makeDatasetEntry(),
          depends_on: action.dag[ds] ?? [],
        };
      }
      return {
        ...initialState,
        runId: action.run_id,
        dag: action.dag,
        datasets,
        totalPhases: action.phases.length,
      };
    }

    case 'phase':
      return {
        ...state,
        phase: action.phase,
        phaseIndex: action.phase_index,
        totalPhases: action.total_phases,
        currentOperation: action.phase,
      };

    case 'fetch_started': {
      const ds = state.datasets[action.dataset] ?? makeDatasetEntry();
      return {
        ...state,
        datasets: {
          ...state.datasets,
          [action.dataset]: { ...ds, status: 'fetching', waiting_for: [] },
        },
      };
    }

    case 'fetch_progress': {
      const ds = state.datasets[action.dataset] ?? makeDatasetEntry();
      return {
        ...state,
        datasets: {
          ...state.datasets,
          [action.dataset]: {
            ...ds,
            status: 'fetching',
            rows_fetched: action.rows_fetched,
            batch_number: action.batch_number,
            batch_size: action.batch_size,
            batch_time_ms: action.batch_time_ms,
          },
        },
      };
    }

    case 'fetch_complete': {
      const ds = state.datasets[action.dataset] ?? makeDatasetEntry();
      return {
        ...state,
        datasets: {
          ...state.datasets,
          [action.dataset]: {
            ...ds,
            status: 'completed',
            total_rows: action.total_rows,
            rows_fetched: action.total_rows,
          },
        },
      };
    }

    case 'fetch_waiting': {
      const ds = state.datasets[action.dataset] ?? makeDatasetEntry();
      return {
        ...state,
        datasets: {
          ...state.datasets,
          [action.dataset]: {
            ...ds,
            status: 'waiting',
            waiting_for: action.waiting_for,
          },
        },
      };
    }

    case 'join_progress':
      return {
        ...state,
        currentOperation: 'join',
        joinStep: {
          key: action.step_key,
          left: action.left,
          right: action.right,
          status: action.status,
          rows: null,
        },
      };

    case 'join_complete':
      return {
        ...state,
        joinStep: state.joinStep
          ? { ...state.joinStep, rows: action.rows, status: 'completed' }
          : { key: action.step_key, left: '', right: '', status: 'completed', rows: action.rows },
      };

    case 'transform_progress':
      return {
        ...state,
        currentOperation: 'transform',
        transformStep: {
          operation: action.operation,
          step: action.step,
          totalSteps: action.total_steps,
        },
      };

    case 'batch_adjusted': {
      const ds = state.datasets[action.dataset] ?? makeDatasetEntry();
      return {
        ...state,
        datasets: {
          ...state.datasets,
          [action.dataset]: { ...ds, batch_size: action.new_batch_size },
        },
      };
    }

    case 'paused':
      return { ...state, paused: true };

    case 'resumed':
      return { ...state, paused: false };

    case 'completed':
      return {
        ...state,
        completed: true,
        totalRows: action.total_rows,
        currentOperation: null,
        joinStep: null,
        transformStep: null,
      };

    case 'error':
      return { ...state, error: action.message };

    case 'cancelled':
      return { ...state, cancelled: true, currentOperation: null };

    case 'state_snapshot': {
      // Replay full state from reconnection snapshot
      const snap = action as Extract<WsServerMessage, { type: 'state_snapshot' }>;
      return {
        ...state,
        ...(snap.progress as Partial<ProgressState>),
        paused: !!(snap.control as Record<string, unknown>).paused,
      };
    }

    case 'attached':
      return { ...state, runId: action.run_id };

    case 'reset':
      return { ...initialState };

    default:
      return state;
  }
}

export function useProgressState() {
  const [state, dispatch] = useReducer(progressReducer, initialState);
  return { state, dispatch };
}
