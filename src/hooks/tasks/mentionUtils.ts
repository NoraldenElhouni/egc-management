// @mention encoding shared by MentionTextarea (composing) and MentionText
// (rendering). Plain-text token, not a rich-text editor — this app has
// none yet ("no rich-text editor exists in this repo yet", per the
// description field's own comment) — so a mention is just
// "@[Title](uuid)" embedded directly in the stored text. Build plan §4.13:
// "reference rows are created automatically when someone @mentions a task
// elsewhere" — extractMentionedTaskIds is what makes that automatic.
const MENTION_TOKEN = /@\[([^\]]+)\]\(([0-9a-f-]{36})\)/g;

export function mentionToken(title: string, taskId: string): string {
  // "]" and ")" would break the token's own delimiters if a title ever
  // contained them — strip rather than escape, titles doing that are rare
  // enough that this is simpler than a real escaping scheme.
  const safeTitle = title.replace(/[[\]()]/g, "");
  return `@[${safeTitle}](${taskId})`;
}

export function extractMentionedTaskIds(text: string): string[] {
  const ids = new Set<string>();
  for (const match of text.matchAll(MENTION_TOKEN)) ids.add(match[2]);
  return Array.from(ids);
}

export type MentionTextPart =
  | { type: "text"; value: string }
  | { type: "mention"; title: string; taskId: string };

export function splitMentionText(text: string): MentionTextPart[] {
  const parts: MentionTextPart[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(MENTION_TOKEN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push({ type: "text", value: text.slice(lastIndex, index) });
    parts.push({ type: "mention", title: match[1], taskId: match[2] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });
  return parts;
}
