import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Move, Pencil, Trash2 } from "lucide-react";
import { HeroSlide, getHeroSlideUrl } from "../../hooks/website/useHeroSlides";

type SortableHeroSlideTileProps = {
  slide: HeroSlide;
  onEdit: (slide: HeroSlide) => void;
  onDelete: (slide: HeroSlide) => void;
};

const SortableHeroSlideTile: React.FC<SortableHeroSlideTileProps> = ({
  slide,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

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
      className="group relative aspect-[16/9] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm cursor-grab active:cursor-grabbing touch-none"
    >
      <img
        src={getHeroSlideUrl(slide.storage_path)}
        alt={slide.alt_ar}
        className="w-full h-full object-cover pointer-events-none"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition" />

      <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition">
        <Move className="w-3.5 h-3.5" />
        اسحب لإعادة الترتيب
      </div>

      <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(slide)}
          className="inline-flex items-center justify-center rounded-lg bg-white/90 px-2 py-1.5 text-gray-700 hover:bg-white transition"
          title="تعديل النص البديل"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(slide)}
          className="inline-flex items-center justify-center rounded-lg bg-white/90 px-2 py-1.5 text-red-600 hover:bg-white transition"
          title="حذف"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition">
        <p className="text-xs font-medium text-white truncate">
          {slide.alt_ar}
        </p>
        <p className="text-[11px] text-white/80 truncate">{slide.alt_en}</p>
      </div>
    </div>
  );
};

export default SortableHeroSlideTile;
