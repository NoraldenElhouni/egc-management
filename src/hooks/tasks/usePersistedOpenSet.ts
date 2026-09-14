import { useEffect, useState } from "react";

// Which tree nodes (project/space/folder/board group ids) are collapsed,
// persisted per browser like the sidebar's own "which spaces are open"
// state (TasksLayout.tsx) — except here everything defaults OPEN (an id
// not yet in the set reads as expanded); only ids the user explicitly
// collapsed get remembered. Node ids are namespaced per level
// ("board:<uuid>", "status:<uuid>", ...) so they can never collide
// across different grouping dimensions or pages.

function load(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export function usePersistedOpenSet(storageKey: string) {
  const [closedIds, setClosedIds] = useState<Set<string>>(() => load(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(closedIds)));
    } catch {
      // private window / storage blocked — collapse state just won't persist
    }
  }, [storageKey, closedIds]);

  const isOpen = (id: string) => !closedIds.has(id);

  const toggle = (id: string) => {
    setClosedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAll = () => setClosedIds(new Set());
  const closeAll = (ids: string[]) => setClosedIds(new Set(ids));

  return { isOpen, toggle, openAll, closeAll };
}
