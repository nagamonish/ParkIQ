import { useCallback, useEffect, useRef, useState } from "react";

import { wsUrl } from "../config.js";

const BASE_RECONNECT_MS = 1200;
const MAX_RECONNECT_MS = 10000;

// Maintains a live WebSocket to the Sightline cloud and exposes a map of the
// freshest availability per location plus the latest global stats. Components
// merge `live[id]` over their (server-filtered) search results so the numbers
// keep ticking without re-querying.
export function useLiveData() {
  const [status, setStatus] = useState("connecting");
  const [live, setLive] = useState({});
  const [stats, setStats] = useState(null);
  const socketRef = useRef(null);
  const retryRef = useRef(0);
  const reconnectTimer = useRef(null);
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    setStatus((current) => (current === "connected" ? current : "connecting"));
    let socket;
    try {
      socket = new WebSocket(wsUrl());
    } catch {
      setStatus("error");
      return;
    }
    socketRef.current = socket;

    socket.onopen = () => {
      retryRef.current = 0;
      setStatus("connected");
    };

    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg.type === "snapshot") {
        if (msg.stats) setStats(msg.stats);
        if (Array.isArray(msg.locations)) {
          setLive((prev) => {
            const next = { ...prev };
            for (const loc of msg.locations) next[loc.id] = loc.availability;
            return next;
          });
        }
      } else if (msg.type === "availability" && msg.location_id) {
        setLive((prev) => ({ ...prev, [msg.location_id]: msg.availability }));
      } else if (msg.type === "stats" && msg.stats) {
        setStats(msg.stats);
      }
    };

    socket.onerror = () => {
      if (socketRef.current === socket) setStatus("error");
    };

    socket.onclose = () => {
      if (socketRef.current !== socket) return;
      socketRef.current = null;
      if (!shouldReconnect.current) {
        setStatus("closed");
        return;
      }
      setStatus("reconnecting");
      const delay = Math.min(BASE_RECONNECT_MS * 2 ** retryRef.current, MAX_RECONNECT_MS);
      retryRef.current += 1;
      reconnectTimer.current = window.setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
    };
  }, [connect]);

  return { status, live, stats };
}
