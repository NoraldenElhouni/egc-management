// Pure helpers for the board's multi-select (BulkActionPanel). Kept apart
// from the hook so the table (confirm-dialog counts) and useTaskBoard's
// bulk mutations agree on what a "selection" means.

interface TreeTask {
  id: string;
  parent_task_id: string | null;
}

/** Every task under `rootIds`, the roots included. */
export function withDescendants(tasks: TreeTask[], rootIds: Iterable<string>): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const t of tasks) {
    if (!t.parent_task_id) continue;
    const list = childrenByParent.get(t.parent_task_id) ?? [];
    list.push(t.id);
    childrenByParent.set(t.parent_task_id, list);
  }
  const out = new Set<string>();
  const walk = (id: string) => {
    if (out.has(id)) return;
    out.add(id);
    for (const child of childrenByParent.get(id) ?? []) walk(child);
  };
  for (const id of rootIds) walk(id);
  return out;
}

/**
 * Drops every selected task that has a selected ancestor. Deleting a parent
 * cascades to its subtasks (tasks_parent_task_id_fkey is ON DELETE CASCADE),
 * so only the topmost ones need an explicit delete.
 */
export function topmostTaskIds(tasks: TreeTask[], selected: Set<string>): string[] {
  const parentById = new Map(tasks.map((t) => [t.id, t.parent_task_id]));
  const hasSelectedAncestor = (id: string) => {
    let current = parentById.get(id) ?? null;
    while (current) {
      if (selected.has(current)) return true;
      current = parentById.get(current) ?? null;
    }
    return false;
  };
  return Array.from(selected).filter((id) => parentById.has(id) && !hasSelectedAncestor(id));
}
