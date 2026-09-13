import { useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { mentionToken } from "../../../hooks/tasks/mentionUtils";

// Typing "@word" anywhere in the textarea opens a task search dropdown;
// picking a result replaces "@word" with the "@[Title](id)" token
// mentionUtils.ts parses back out. Same search query shape as
// RelationshipsSection.tsx's manual "ربط بمهمة أخرى" picker, kept
// separate rather than shared since the trigger/replace logic here is
// specific to a free-text cursor position, not a fixed "+" button.
//
// The dropdown anchors under the textarea's bottom edge, not the caret —
// precise caret-relative positioning needs a mirror-div measurement this
// app has no existing infrastructure for, and this app's other pickers
// don't do it either (see AssigneeCell, ColumnEditorModal).
export default function MentionTextarea({
  value,
  onChange,
  onBlur,
  onKeyDown,
  excludeTaskId,
  placeholder,
  rows = 3,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  excludeTaskId?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
}) {
  const [results, setResults] = useState<{ id: string; title: string }[]>([]);
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimer = useRef<number | null>(null);
  const mentionStart = useRef<number | null>(null);

  const runSearch = (term: string) => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(async () => {
      let query = supabase.schema("tasks").from("tasks").select("id, title").eq("is_archived", false).ilike("title", `%${term}%`).limit(8);
      if (excludeTaskId) query = query.neq("id", excludeTaskId);
      const { data } = await query;
      setResults(data ?? []);
    }, 250);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    const cursor = e.target.selectionStart;
    const beforeCursor = text.slice(0, cursor);
    const match = beforeCursor.match(/@([^\s@]*)$/);
    if (match) {
      mentionStart.current = cursor - match[0].length;
      setOpen(true);
      runSearch(match[1]);
    } else {
      setOpen(false);
    }
  };

  const pick = (task: { id: string; title: string }) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStart.current === null) return;
    const cursor = textarea.selectionStart;
    const before = value.slice(0, mentionStart.current);
    const after = value.slice(cursor);
    const inserted = `${mentionToken(task.title, task.id)} `;
    const next = `${before}${inserted}${after}`;
    onChange(next);
    setOpen(false);
    setResults([]);
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = before.length + inserted.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={() => {
          // A click on a dropdown result fires this blur first — delay so
          // the result's own onClick still lands before we hide the list.
          window.setTimeout(() => setOpen(false), 150);
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          onKeyDown?.(e);
        }}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={className}
      />
      {open && results.length > 0 && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => pick(r)}
              className="block w-full truncate px-3 py-1.5 text-right text-sm hover:bg-gray-50"
            >
              {r.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
