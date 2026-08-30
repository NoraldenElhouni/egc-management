import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Project } from "../../hooks/website/useProjects";

type SortableProjectRowProps = {
  project: Project;
  draggable?: boolean;
};

const SortableProjectRow: React.FC<SortableProjectRowProps> = ({
  project,
  draggable = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled: !draggable });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-gray-50 transition-colors"
    >
      <td className="py-3 px-4 align-top text-sm border-b border-gray-100 w-10">
        {draggable && (
          <button
            type="button"
            className="flex items-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
            aria-label="سحب لإعادة الترتيب"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </td>

      <td className="py-3 px-4 align-top text-sm border-b border-gray-100">
        <div className="font-medium text-gray-900">{project.title_ar}</div>
        <div className="text-xs text-gray-500">{project.title_en}</div>
      </td>

      <td className="py-3 px-4 align-top text-sm border-b border-gray-100">
        {project.categories?.name_ar ?? "-"}
      </td>

      <td className="py-3 px-4 align-top text-sm border-b border-gray-100">
        {project.year ?? "-"}
      </td>

      <td className="py-3 px-4 align-top text-sm border-b border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              project.is_active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {project.is_active ? "مفعّل" : "غير مفعّل"}
          </span>
          {project.is_featured && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              مميز
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

export default SortableProjectRow;
