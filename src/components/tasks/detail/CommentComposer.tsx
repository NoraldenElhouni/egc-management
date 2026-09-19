import { useState } from "react";
import { MessageSquare } from "lucide-react";
import MentionTextarea from "./MentionTextarea";

// The "write a comment" box, split out of CommentsSection — the list
// stays near the top of the panel (right after the description), but
// this lives further down, right before the Activity section, so
// composing a comment sits next to the rest of "things that happen to
// this task" instead of at the very top of the panel.

export default function CommentComposer({
  excludeTaskId,
  onAddComment,
}: {
  excludeTaskId: string;
  onAddComment: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(text);
    setDraft("");
  };

  return (
    <div className="flex items-start gap-2">
      <MessageSquare className="mt-1.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
      <div className="flex-1">
        <MentionTextarea
          value={draft}
          onChange={setDraft}
          excludeTaskId={excludeTaskId}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder="اكتب تعليقاً... (Ctrl+Enter للإرسال، @ للإشارة إلى مهمة)"
          rows={2}
          className="w-full resize-none rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none"
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="mt-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
        >
          إرسال
        </button>
      </div>
    </div>
  );
}
