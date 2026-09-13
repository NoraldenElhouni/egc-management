// Tiny pub-sub bridging a plain callback (TanStack Query's MutationCache
// onError, which runs outside React) to the one <TaskErrorToast/> mounted
// by TasksLayout — see its own comment for why a global MutationCache
// hook is used instead of adding onError to every individual mutation.
type Listener = (message: string) => void;

let listener: Listener | null = null;

export function setTaskErrorListener(next: Listener | null): void {
  listener = next;
}

export function emitTaskError(message: string): void {
  listener?.(message);
}
