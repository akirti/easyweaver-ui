import { renderHook, act } from '@testing-library/react';
import { progressReducer, initialState, useProgressState } from '@/hooks/use-progress-state';
import type { ProgressState } from '@/hooks/use-progress-state';
import type { WsServerMessage } from '@/types';

describe('progressReducer', () => {
  it('returns initial state for unknown action', () => {
    const result = progressReducer(initialState, { type: 'unknown' } as never);
    expect(result).toBe(initialState);
  });

  it('resets to initial state', () => {
    const modified: ProgressState = { ...initialState, runId: 'abc', paused: true };
    const result = progressReducer(modified, { type: 'reset' });
    expect(result).toEqual(initialState);
  });

  describe('run_started', () => {
    const action: WsServerMessage = {
      type: 'run_started',
      run_id: 'run-1',
      phases: ['fetch', 'join', 'transform'],
      datasets: ['ds_a', 'ds_b'],
      dag: { ds_a: [], ds_b: ['ds_a'] },
    };

    it('initializes run state', () => {
      const result = progressReducer(initialState, action);
      expect(result.runId).toBe('run-1');
      expect(result.totalPhases).toBe(3);
      expect(result.dag).toEqual({ ds_a: [], ds_b: ['ds_a'] });
      expect(Object.keys(result.datasets)).toEqual(['ds_a', 'ds_b']);
      expect(result.datasets.ds_b.depends_on).toEqual(['ds_a']);
      expect(result.datasets.ds_a.status).toBe('waiting');
    });
  });

  describe('phase', () => {
    it('updates phase info', () => {
      const result = progressReducer(initialState, {
        type: 'phase',
        phase: 'fetch',
        phase_index: 0,
        total_phases: 3,
      });
      expect(result.phase).toBe('fetch');
      expect(result.phaseIndex).toBe(0);
      expect(result.totalPhases).toBe(3);
      expect(result.currentOperation).toBe('fetch');
    });
  });

  describe('fetch_started', () => {
    it('sets dataset to fetching', () => {
      const state: ProgressState = {
        ...initialState,
        datasets: { ds_a: { ...initialState.datasets.ds_a!, status: 'waiting', rows_fetched: 0, total_rows: null, batch_number: 0, batch_size: 0, batch_time_ms: 0, depends_on: [], waiting_for: ['ds_b'] } },
      };
      const result = progressReducer(state, { type: 'fetch_started', dataset: 'ds_a', binding_resolved: false });
      expect(result.datasets.ds_a.status).toBe('fetching');
      expect(result.datasets.ds_a.waiting_for).toEqual([]);
    });

    it('creates dataset entry if not present', () => {
      const result = progressReducer(initialState, { type: 'fetch_started', dataset: 'new_ds', binding_resolved: true });
      expect(result.datasets.new_ds.status).toBe('fetching');
    });
  });

  describe('fetch_progress', () => {
    it('updates dataset batch info', () => {
      const state: ProgressState = {
        ...initialState,
        datasets: { ds_a: { status: 'fetching', rows_fetched: 0, total_rows: null, batch_number: 0, batch_size: 1000, batch_time_ms: 0, depends_on: [], waiting_for: [] } },
      };
      const result = progressReducer(state, {
        type: 'fetch_progress',
        dataset: 'ds_a',
        rows_fetched: 2000,
        batch_number: 2,
        batch_size: 1000,
        batch_time_ms: 450,
        status: 'fetching',
        depends_on: null,
      });
      expect(result.datasets.ds_a.rows_fetched).toBe(2000);
      expect(result.datasets.ds_a.batch_number).toBe(2);
      expect(result.datasets.ds_a.batch_time_ms).toBe(450);
    });
  });

  describe('fetch_complete', () => {
    it('marks dataset completed with total rows', () => {
      const state: ProgressState = {
        ...initialState,
        datasets: { ds_a: { status: 'fetching', rows_fetched: 5000, total_rows: null, batch_number: 5, batch_size: 1000, batch_time_ms: 300, depends_on: [], waiting_for: [] } },
      };
      const result = progressReducer(state, {
        type: 'fetch_complete',
        dataset: 'ds_a',
        total_rows: 5000,
      });
      expect(result.datasets.ds_a.status).toBe('completed');
      expect(result.datasets.ds_a.total_rows).toBe(5000);
      expect(result.datasets.ds_a.rows_fetched).toBe(5000);
    });
  });

  describe('fetch_waiting', () => {
    it('marks dataset as waiting with dependencies', () => {
      const state: ProgressState = {
        ...initialState,
        datasets: { ds_b: { status: 'fetching', rows_fetched: 0, total_rows: null, batch_number: 0, batch_size: 0, batch_time_ms: 0, depends_on: ['ds_a'], waiting_for: [] } },
      };
      const result = progressReducer(state, {
        type: 'fetch_waiting',
        dataset: 'ds_b',
        waiting_for: ['ds_a'],
      });
      expect(result.datasets.ds_b.status).toBe('waiting');
      expect(result.datasets.ds_b.waiting_for).toEqual(['ds_a']);
    });
  });

  describe('join_progress + join_complete', () => {
    it('sets join step info', () => {
      const result = progressReducer(initialState, {
        type: 'join_progress',
        step_key: 'j1',
        left: 'ds_a',
        right: 'ds_b',
        status: 'running',
      });
      expect(result.currentOperation).toBe('join');
      expect(result.joinStep).toEqual({ key: 'j1', left: 'ds_a', right: 'ds_b', status: 'running', rows: null });
    });

    it('marks join completed with row count', () => {
      const state: ProgressState = {
        ...initialState,
        joinStep: { key: 'j1', left: 'ds_a', right: 'ds_b', status: 'running', rows: null },
      };
      const result = progressReducer(state, { type: 'join_complete', step_key: 'j1', rows: 4200 });
      expect(result.joinStep!.status).toBe('completed');
      expect(result.joinStep!.rows).toBe(4200);
    });
  });

  describe('transform_progress', () => {
    it('sets transform step info', () => {
      const result = progressReducer(initialState, {
        type: 'transform_progress',
        operation: 'uppercase',
        step: 2,
        total_steps: 5,
      });
      expect(result.currentOperation).toBe('transform');
      expect(result.transformStep).toEqual({ operation: 'uppercase', step: 2, totalSteps: 5 });
    });
  });

  describe('batch_adjusted', () => {
    it('updates dataset batch_size', () => {
      const state: ProgressState = {
        ...initialState,
        datasets: { ds_a: { status: 'fetching', rows_fetched: 1000, total_rows: null, batch_number: 1, batch_size: 1000, batch_time_ms: 500, depends_on: [], waiting_for: [] } },
      };
      const result = progressReducer(state, {
        type: 'batch_adjusted',
        dataset: 'ds_a',
        old_batch_size: 1000,
        new_batch_size: 2000,
        reason: 'adaptive',
      });
      expect(result.datasets.ds_a.batch_size).toBe(2000);
    });
  });

  describe('paused / resumed', () => {
    it('toggles paused state', () => {
      let state = progressReducer(initialState, { type: 'paused' });
      expect(state.paused).toBe(true);
      state = progressReducer(state, { type: 'resumed' });
      expect(state.paused).toBe(false);
    });
  });

  describe('completed', () => {
    it('sets completed and total rows, clears transient state', () => {
      const state: ProgressState = {
        ...initialState,
        currentOperation: 'transform',
        joinStep: { key: 'j1', left: 'a', right: 'b', status: 'completed', rows: 100 },
        transformStep: { operation: 'trim', step: 1, totalSteps: 1 },
      };
      const result = progressReducer(state, { type: 'completed', run_id: 'run-1', total_rows: 9500 });
      expect(result.completed).toBe(true);
      expect(result.totalRows).toBe(9500);
      expect(result.currentOperation).toBeNull();
      expect(result.joinStep).toBeNull();
      expect(result.transformStep).toBeNull();
    });
  });

  describe('error', () => {
    it('sets error message', () => {
      const result = progressReducer(initialState, { type: 'error', message: 'Connection lost' });
      expect(result.error).toBe('Connection lost');
    });
  });

  describe('cancelled', () => {
    it('sets cancelled flag', () => {
      const result = progressReducer(initialState, { type: 'cancelled' });
      expect(result.cancelled).toBe(true);
      expect(result.currentOperation).toBeNull();
    });
  });

  describe('state_snapshot', () => {
    it('replays full state from server snapshot', () => {
      const result = progressReducer(initialState, {
        type: 'state_snapshot',
        progress: { runId: 'run-99', phase: 'join' },
        control: { paused: true },
      });
      expect(result.runId).toBe('run-99');
      expect(result.phase).toBe('join');
      expect(result.paused).toBe(true);
    });
  });

  describe('attached', () => {
    it('sets runId', () => {
      const result = progressReducer(initialState, { type: 'attached', run_id: 'run-42' });
      expect(result.runId).toBe('run-42');
    });
  });
});

describe('useProgressState', () => {
  it('returns initial state and a dispatch function', () => {
    const { result } = renderHook(() => useProgressState());
    expect(result.current.state).toEqual(initialState);
    expect(typeof result.current.dispatch).toBe('function');
  });

  it('dispatches actions and updates state', () => {
    const { result } = renderHook(() => useProgressState());

    act(() => {
      result.current.dispatch({
        type: 'run_started',
        run_id: 'r1',
        phases: ['fetch'],
        datasets: ['d1'],
        dag: { d1: [] },
      });
    });

    expect(result.current.state.runId).toBe('r1');
    expect(result.current.state.datasets.d1).toBeDefined();
  });
});
