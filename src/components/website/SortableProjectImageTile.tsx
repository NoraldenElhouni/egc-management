import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Move, Pencil, Star, Trash2 } from "lucide-react";
import {
  ProjectImage,
  getProjectImageUrl,
} from "../../hooks/website/useProjectImages";

type SortableProjectImageTileProps = {
  image: ProjectImage;
  onEdit: (image: ProjectImage) => void;
  onDelete: (image: ProjectImage) => void;
  onSetCover: (image: ProjectImage) => void;
};

const SortableProjectImageTile: React.FC<SortableProjectImageTileProps> = ({
  image,
  onEdit,
  onDelete,
  onSetCover,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm cursor-grab active:cursor-grabbing touch-none"
    >
      <img
        src={getProjectImageUrl(image.storage_path)}
        alt={image.alt_ar}
        className="w-full h-full object-cover pointer-events-none"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition" />

      <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition">
        <Move className="w-3.5 h-3.5" />
        اسحب لإعادة الترتيب
      </div>

      {image.is_cover && (
        <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-medium text-white">
          <Star className="w-3 h-3" />
          الغلاف
        </div>
      )}

      <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onSetCover(image)}
          disabled={image.is_cover}
          className={`inline-flex items-center justify-center rounded-lg px-2 py-1.5 transition ${
            image.is_cover
              ? "bg-amber-400 text-white cursor-default"
              : "bg-white/90 text-gray-700 hover:bg-white"
          }`}
          title={image.is_cover ? "صورة الغلاف الحالية" : "تعيين كصورة غلاف"}
        >
          <Star className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(image)}
          className="inline-flex items-center justify-center rounded-lg bg-white/90 px-2 py-1.5 text-gray-700 hover:bg-white transition"
          title="تعديل النص البديل"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(image)}
          className="inline-flex items-center justify-center rounded-lg bg-white/90 px-2 py-1.5 text-red-600 hover:bg-white transition"
          title="حذف"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition">
        <p className="text-xs font-medium text-white truncate">
          {image.alt_ar}
        </p>
        <p className="text-[11px] text-white/80 truncate">{image.alt_en}</p>
      </div>
    </div>
  );
};

export default SortableProjectImageTile;
