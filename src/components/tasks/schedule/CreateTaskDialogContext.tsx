import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import CreateTaskDialog, { type CreateTaskDialogOptions } from "./CreateTaskDialog";

// Opens the create dialog from anywhere in the tasks module — the board's
// add row and subtask "+", the Gantt toolbar, the space page, the detail
// panel's subtasks — without threading a prop through every table and row.
// Mounted once in TasksLayout.

interface CreateTaskDialogApi {
  openCreateTask: (options: CreateTaskDialogOptions) => void;
}

const CreateTaskDialogContext = createContext<CreateTaskDialogApi | null>(null);

export function CreateTaskDialogProvider({ children }: { children: ReactNode }) {
  // `n` counts openings while one is open, so re-opening from another
  // entry point mounts a fresh dialog with fresh defaults.
  const [opened, setOpened] = useState<{ options: CreateTaskDialogOptions; n: number } | null>(null);
  const openCreateTask = useCallback(
    (options: CreateTaskDialogOptions) => setOpened((prev) => ({ options, n: (prev?.n ?? 0) + 1 })),
    [],
  );
  const api = useMemo(() => ({ openCreateTask }), [openCreateTask]);

  return (
    <CreateTaskDialogContext.Provider value={api}>
      {children}
      {opened && (
        <CreateTaskDialog
          key={opened.n}
          {...opened.options}
          onClose={() => setOpened(null)}
        />
      )}
    </CreateTaskDialogContext.Provider>
  );
}

export function useCreateTaskDialog(): CreateTaskDialogApi {
  const api = useContext(CreateTaskDialogContext);
  if (!api) throw new Error("useCreateTaskDialog outside CreateTaskDialogProvider");
  return api;
}
