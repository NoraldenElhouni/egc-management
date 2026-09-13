import { splitMentionText } from "../../../hooks/tasks/mentionUtils";

// Renders a comment body that may contain "@[Title](uuid)" mention
// tokens (see mentionUtils.ts) as clickable inline pills instead of raw
// markup — used for the posted/read view of a comment. The description
// field has no equivalent read view (it's always a plain textarea, no
// rich-text editor in this repo), so its mentions stay as raw tokens
// while editing; only the relationship they create is automatic there.
export default function MentionText({
  text,
  onNavigateToTask,
}: {
  text: string;
  onNavigateToTask: (taskId: string) => void;
}) {
  const parts = splitMentionText(text);
  return (
    <p className="whitespace-pre-wrap text-gray-700">
      {parts.map((part, i) =>
        part.type === "text" ? (
          <span key={i}>{part.value}</span>
        ) : (
          <button
            key={i}
            onClick={() => onNavigateToTask(part.taskId)}
            className="rounded bg-primary-superLight px-1 font-medium text-primary hover:underline"
          >
            @{part.title}
          </button>
        ),
      )}
    </p>
  );
}
