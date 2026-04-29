import { useCallback, useEffect, useRef, useState } from 'react';
import type { WsServerMessage } from '@/types';

export interface QueryWsCommand {
  type: string;
  [key: string]: unknown;
}

export interface UseQueryWebSocketReturn {
  sendCommand: (msg: QueryWsCommand) => void;
  lastMessage: WsServerMessage | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

function buildWsUrl(): string {
  const loc = window.location;
  const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  const token = localStorage.getItem('access_token') ?? '';
  return `${protocol}//${loc.host}/api/v1/queries/run/ws?token=${encodeURIComponent(token)}`;
}

export function useQueryWebSocket(): UseQueryWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const intentionalClose = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsServerMessage | null>(null);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current !== null) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    intentionalClose.current = true;
    clearReconnectTimer();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [clearReconnectTimer]);

  const openSocket = useCallback(() => {
    const url = buildWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptRef.current = 0;
      setIsConnected(true);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as WsServerMessage;
        setLastMessage(parsed);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;

      if (!intentionalClose.current) {
        // Schedule reconnect with exponential backoff
        const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attemptRef.current), MAX_BACKOFF_MS);
        attemptRef.current += 1;
        reconnectTimer.current = setTimeout(() => {
          openSocket();
        }, delay);
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror, which handles reconnection
    };
  }, []);

  const connect = useCallback(() => {
    // Tear down any existing connection
    if (wsRef.current) {
      intentionalClose.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }

    intentionalClose.current = false;
    attemptRef.current = 0;
    clearReconnectTimer();

    openSocket();
  }, [openSocket, clearReconnectTimer]);

  const sendCommand = useCallback((msg: QueryWsCommand) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      intentionalClose.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [clearReconnectTimer]);

  return { sendCommand, lastMessage, isConnected, connect, disconnect };
}
