import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../stores/auth';

export const useWebSocket = (channel?: string) => {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const wsUrl = `${WS_BASE}/ws`;

    if (!WS_BASE || WS_BASE === 'undefined') {
      console.error('VITE_WS_URL is not defined. WebSocket connection aborted.');
      return;
    }

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnected(true);
      if (token) {
        ws.current?.send(JSON.stringify({ type: 'AUTH', token }));
      }
      if (channel) {
        ws.current?.send(JSON.stringify({ type: 'SUBSCRIBE', channel }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [token, channel]);

  const sendMessage = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const subscribe = useCallback((newChannel: string) => {
    sendMessage({ type: 'SUBSCRIBE', channel: newChannel });
  }, [sendMessage]);

  const unsubscribe = useCallback((oldChannel: string) => {
    sendMessage({ type: 'UNSUBSCRIBE', channel: oldChannel });
  }, [sendMessage]);

  return { lastMessage, connected, sendMessage, subscribe, unsubscribe };
};