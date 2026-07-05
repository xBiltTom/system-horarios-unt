'use client';
import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket(onMensaje: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL;
    const wsUrl = wsBaseUrl ? `${wsBaseUrl}/ws` : 'ws://localhost:4000/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ tipo: 'suscribir_disponibilidad' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMensaje(data);
      } catch {}
    };

    return () => ws.close();
  }, [onMensaje]);

  return wsRef.current;
}