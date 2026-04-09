import { renderHook, act } from '@testing-library/react';
import { useProcessWebSocket } from '@/hooks/use-process-ws';

// ---------- Mock WebSocket ----------

type WsHandler = ((ev: { data: string }) => void) | null;

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: WsHandler = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // Simulate async open
    queueMicrotask(() => this.onopen?.());
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    queueMicrotask(() => this.onclose?.());
  }

  // Test helpers
  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  simulateError() {
    this.onerror?.();
  }
}

// Install mock
beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
  vi.useFakeTimers();
  localStorage.clear();
  localStorage.setItem('access_token', 'test-jwt-token');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useProcessWebSocket', () => {
  it('builds the correct WS URL with token', () => {
    const { result } = renderHook(() => useProcessWebSocket('cfg-123'));

    act(() => {
      result.current.connect();
    });

    const ws = MockWebSocket.instances[0];
    expect(ws.url).toContain('/api/v1/processes/cfg-123/run/ws');
    expect(ws.url).toContain('token=test-jwt-token');
    expect(ws.url).toMatch(/^ws:\/\//);
  });

  it('sets isConnected to true after connect', async () => {
    const { result } = renderHook(() => useProcessWebSocket('cfg-1'));

    act(() => {
      result.current.connect();
    });

    // Flush microtask for onopen
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('sends commands as JSON when connected', async () => {
    const { result } = renderHook(() => useProcessWebSocket('cfg-1'));

    act(() => {
      result.current.connect();
    });
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.sendCommand({ type: 'pause' });
    });

    const ws = MockWebSocket.instances[0];
    expect(ws.sent).toEqual([JSON.stringify({ type: 'pause' })]);
  });

  it('exposes lastMessage from server', async () => {
    const { result } = renderHook(() => useProcessWebSocket('cfg-1'));

    act(() => {
      result.current.connect();
    });
    await act(async () => {
      await Promise.resolve();
    });

    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.simulateMessage({ type: 'paused' });
    });

    expect(result.current.lastMessage).toEqual({ type: 'paused' });
  });

  it('disconnect sets isConnected to false and prevents reconnect', async () => {
    const { result } = renderHook(() => useProcessWebSocket('cfg-1'));

    act(() => {
      result.current.connect();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      result.current.disconnect();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isConnected).toBe(false);

    // Advance timers — should NOT create a new WS instance
    const countBefore = MockWebSocket.instances.length;
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(MockWebSocket.instances.length).toBe(countBefore);
  });

  it('reconnects with exponential backoff on unexpected close', async () => {
    const { result } = renderHook(() => useProcessWebSocket('cfg-1'));

    act(() => {
      result.current.connect();
    });
    await act(async () => {
      await Promise.resolve();
    });

    const firstWs = MockWebSocket.instances[0];

    // Simulate unexpected close
    act(() => {
      firstWs.simulateClose();
    });
    expect(result.current.isConnected).toBe(false);

    // First reconnect after 1s
    expect(MockWebSocket.instances.length).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(MockWebSocket.instances.length).toBe(2);

    // Simulate second close
    act(() => {
      MockWebSocket.instances[1].simulateClose();
    });

    // Second reconnect after 2s
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(MockWebSocket.instances.length).toBe(2);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(MockWebSocket.instances.length).toBe(3);
  });

  it('cleans up WebSocket on unmount', async () => {
    const { result, unmount } = renderHook(() => useProcessWebSocket('cfg-1'));

    act(() => {
      result.current.connect();
    });
    await act(async () => {
      await Promise.resolve();
    });

    const ws = MockWebSocket.instances[0];
    expect(ws.readyState).toBe(MockWebSocket.OPEN);

    unmount();

    // The ws.close() was called
    expect(ws.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('ignores malformed messages without crashing', async () => {
    const { result } = renderHook(() => useProcessWebSocket('cfg-1'));

    act(() => {
      result.current.connect();
    });
    await act(async () => {
      await Promise.resolve();
    });

    const ws = MockWebSocket.instances[0];
    // Send invalid JSON
    act(() => {
      ws.onmessage?.({ data: 'not json{{{' });
    });

    // lastMessage should remain null
    expect(result.current.lastMessage).toBeNull();
  });

  it('does not send when WebSocket is not open', () => {
    const { result } = renderHook(() => useProcessWebSocket('cfg-1'));

    // Not connected — sendCommand should be a no-op
    act(() => {
      result.current.sendCommand({ type: 'pause' });
    });

    // No instances created, no crash
    expect(MockWebSocket.instances.length).toBe(0);
  });
});
