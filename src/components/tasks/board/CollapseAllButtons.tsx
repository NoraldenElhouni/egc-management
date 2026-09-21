import { ChevronsDown, ChevronsUp } from "lucide-react";

// The expand/collapse pair for the directory views' group sections.
//
// The same two buttons already exist on the board (TaskTable.tsx) and in
// the template builder, each a separate copy. This is the shared one, so
// the four directory pages don't make it six copies.
//
// Styled like the "فلترة وترتيب" button it sits beside (rounded-lg,
// text-sm, white) rather than TaskTable's smaller borderless pills —
// matching its actual neighbours matters more here than matching a
// button on a different screen.
interface CollapseAllButtonsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  /** True while a search term is active. Every page computes
   *  `collapsed = !searching && collapsedKeys.has(key)`, so collapsing
   *  during a search changes state that nothing reads — the button would
   *  look broken rather than disabled. */
  searching?: boolean;
}

const BUTTON_CLASS =
  "flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function CollapseAllButtons({
  onExpandAll,
  onCollapseAll,
  searching = false,
}: CollapseAllButtonsProps) {
  return (
    <>
      <button
        onClick={onExpandAll}
        disabled={searching}
        className={BUTTON_CLASS}
        title={searching ? "أثناء البحث تظهر كل الأقسام موسّعة" : "توسيع كل الأقسام"}
      >
        <ChevronsDown className="h-3.5 w-3.5" />
        توسيع الكل
      </button>
      <button
        onClick={onCollapseAll}
        disabled={searching}
        className={BUTTON_CLASS}
        title={searching ? "أثناء البحث تظهر كل الأقسام موسّعة" : "طي كل الأقسام"}
      >
        <ChevronsUp className="h-3.5 w-3.5" />
        طي الكل
      </button>
    </>
  );
}
