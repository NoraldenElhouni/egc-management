import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableConfigRowProps {
  id: string;
  children: React.ReactNode;
}

const SortableConfigRow: React.FC<SortableConfigRowProps> = ({
  id,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border-b last:border-b-0 py-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        title="اسحب لإعادة الترتيب"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 flex items-center gap-2 min-w-0">{children}</div>
    </li>
  );
};

export default SortableConfigRow;
