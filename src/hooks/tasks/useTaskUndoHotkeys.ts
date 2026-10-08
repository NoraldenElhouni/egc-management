import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { runUndoRedo } from "./taskUndo";

// Ctrl/Cmd+Z → undo, Ctrl/Cmd+Shift+Z or Ctrl+Y → redo, for task edits.
//
// Matched on `code`, not `key`: with the Arabic keyboard layout the Z key's
// `key` is an Arabic letter, so a `key === "z"` check would never fire for
// the people using this app.
//
// While focus is in a text field the browser's own text undo must win —
// someone typing a title and pressing Ctrl+Z wants the last word back, not a
// status reverted.
function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function useTaskUndoHotkeys() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (isTextEditingTarget(e.target)) return;

      let direction: "undo" | "redo" | null = null;
      if (e.code === "KeyZ") direction = e.shiftKey ? "redo" : "undo";
      else if (e.code === "KeyY" && e.ctrlKey && !e.metaKey) direction = "redo";
      if (!direction) return;

      e.preventDefault();
      void runUndoRedo(queryClient, direction);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [queryClient]);
}
