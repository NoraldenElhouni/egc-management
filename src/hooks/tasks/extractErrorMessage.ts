// Shared across the tasks module wherever a caught error needs to become
// human-readable Arabic text — Postgres/PostgREST errors (including a
// trigger's RAISE EXCEPTION message, e.g. the completion gate or the
// reparent cycle guard) surface as a plain `.message` string, but a
// thrown value isn't guaranteed to be an Error instance.
export function extractErrorMessage(err: unknown, fallback = "حدث خطأ، حاول مرة أخرى"): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  if (typeof err === "string") return err;
  return fallback;
}
