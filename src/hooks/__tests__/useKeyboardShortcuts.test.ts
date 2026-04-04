import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function fireKey(
  key: string,
  options: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean } = {}
) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  // spy on preventDefault so we can assert it was called
  const preventSpy = vi.spyOn(event, 'preventDefault');
  window.dispatchEvent(event);
  return { preventSpy };
}

describe('useKeyboardShortcuts', () => {
  it('calls handler on matching key press', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', handler }])
    );

    fireKey('k');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('requires meta key when meta=true', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', meta: true, handler }])
    );

    fireKey('k');
    expect(handler).not.toHaveBeenCalled();

    fireKey('k', { metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('supports ctrlKey as meta alternative', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', meta: true, handler }])
    );

    fireKey('k', { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('requires shift key when shift=true', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'p', shift: true, handler }])
    );

    fireKey('p');
    expect(handler).not.toHaveBeenCalled();

    fireKey('p', { shiftKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire when enabled=false', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', handler, enabled: false }])
    );

    fireKey('k');
    expect(handler).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', handler }])
    );

    unmount();
    fireKey('k');
    expect(handler).not.toHaveBeenCalled();
  });

  it('prevents default on matched shortcuts', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([{ key: 'k', meta: true, handler }])
    );

    const { preventSpy } = fireKey('k', { metaKey: true });
    expect(preventSpy).toHaveBeenCalled();
  });
});
