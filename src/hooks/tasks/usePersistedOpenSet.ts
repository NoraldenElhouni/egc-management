import { useEffect, useState } from "react";

// Which tree nodes (space/folder/board ids) are expanded, persisted per
// browser like the sidebar's own "which spaces are open" state
// (TasksLayout.tsx) — same reasoning: everything defaults collapsed (an
// id not yet in the set reads as closed), and node ids are real UUIDs
// from separate tables, so sharing one storage key across space/folder/
// board ids can't collide.

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
  const [openIds, setOpenIds] = useState<Set<string>>(() => load(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(openIds)));
    } catch {
      // private window / storage blocked — collapse state just won't persist
    }
  }, [storageKey, openIds]);

  const isOpen = (id: string) => openIds.has(id);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAll = (ids: string[]) => setOpenIds(new Set(ids));
  const closeAll = () => setOpenIds(new Set());

  return { isOpen, toggle, openAll, closeAll };
}
