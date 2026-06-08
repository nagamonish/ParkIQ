import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "../api.js";
import { WS_URL } from "../config.js";
import { useWebSocket } from "./useWebSocket.js";

function sortSlots(slots) {
  return [...slots].sort((a, b) => String(a.slot_id).localeCompare(String(b.slot_id)));
}

// Central operator state: camera summaries + per-camera slots, kept live over
// the WebSocket, plus actions every page shares.
export function useOperator() {
  const { status: wsStatus, lastMessage } = useWebSocket(WS_URL);
  const [summary, setSummary] = useState([]);
  const [slotsByCamera, setSlotsByCamera] = useState({});
  const [selectedId, setSelectedId] = useState("");
  const [events, setEvents] = useState([]);
  const [reachable, setReachable] = useState(true);
  const seededSelection = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const cams = await api.listCameras();
      setSummary(cams);
      setReachable(true);
      const pairs = await Promise.all(
        cams.map(async (c) => {
          try {
            return [c.camera_id, sortSlots(await api.getSlots(c.camera_id))];
          } catch {
            return [c.camera_id, []];
          }
        }),
      );
      setSlotsByCamera(Object.fromEntries(pairs));
      if (!seededSelection.current && cams[0]) {
        setSelectedId((cur) => cur || cams[0].camera_id);
        seededSelection.current = true;
      }
    } catch {
      setReachable(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Apply realtime messages.
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "full_state") {
      if (lastMessage.cameras) {
        setSlotsByCamera((prev) => {
          const next = { ...prev };
          for (const [id, slots] of Object.entries(lastMessage.cameras)) next[id] = sortSlots(slots);
          return next;
        });
      }
      if (lastMessage.summary) setSummary(lastMessage.summary);
    } else if (lastMessage.type === "occupancy_update") {
      const { camera_id, slots = [], summary: sum } = lastMessage;
      setSlotsByCamera((prev) => {
        const byId = new Map((prev[camera_id] || []).map((s) => [s.slot_id, s]));
        slots.forEach((s) => byId.set(s.slot_id, { ...byId.get(s.slot_id), ...s }));
        return { ...prev, [camera_id]: sortSlots([...byId.values()]) };
      });
      if (sum) setSummary(sum);
      const changed = slots.filter((s) => s.occupied !== undefined);
      if (changed.length) {
        setEvents((prev) =>
          [
            ...changed.map((s) => ({
              id: `${camera_id}-${s.slot_id}-${s.last_changed}`,
              camera_id,
              slot_id: s.slot_id,
              occupied: s.occupied,
              at: s.last_changed || Date.now() / 1000,
            })),
            ...prev,
          ].slice(0, 40),
        );
      }
    }
  }, [lastMessage]);

  const selected = useMemo(
    () => summary.find((c) => c.camera_id === selectedId) || null,
    [summary, selectedId],
  );
  const selectedSlots = slotsByCamera[selectedId] || [];

  const addCamera = useCallback(
    async (payload) => {
      const result = await api.addCamera(payload);
      setSelectedId(payload.camera_id);
      seededSelection.current = true;
      await refresh();
      return result;
    },
    [refresh],
  );

  const removeCamera = useCallback(
    async (id) => {
      await api.deleteCamera(id);
      if (selectedId === id) setSelectedId("");
      await refresh();
    },
    [refresh, selectedId],
  );

  const saveSlots = useCallback(
    async (id, slots) => {
      const saved = await api.saveSlots(id, slots);
      setSlotsByCamera((prev) => ({ ...prev, [id]: sortSlots(saved) }));
      return saved;
    },
    [],
  );

  return {
    wsStatus,
    reachable,
    summary,
    slotsByCamera,
    selectedId,
    setSelectedId,
    selected,
    selectedSlots,
    events,
    refresh,
    addCamera,
    removeCamera,
    saveSlots,
  };
}
