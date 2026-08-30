import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, Search } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";
import Button from "../../../components/ui/Button";
import SortableProjectRow from "../../../components/website/SortableProjectRow";
import {
  useProjectsQuery,
  useReorderProjects,
  withSortOrder,
} from "../../../hooks/website/useProjects";

const WebsiteProjectsPage = () => {
  const { data: projects, isLoading, error } = useProjectsQuery();
  const { mutate: reorderProjects } = useReorderProjects();
  const [query, setQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const isSearching = query.trim().length > 0;

  const filteredProjects = useMemo(() => {
    const all = projects ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((p) =>
      [p.title_ar, p.title_en, p.categories?.name_ar, p.categories?.name_en]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [projects, query]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (isSearching) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredProjects.findIndex((p) => p.id === active.id);
    const newIndex = filteredProjects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderProjects(
      withSortOrder(arrayMove(filteredProjects, oldIndex, newIndex)),
    );
  };

  if (isLoading) return <LoadingPage label="جاري تحميل المشاريع..." />;
  if (error)
    return <ErrorPage error={error.message} label="خطأ في تحميل المشاريع" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  المشاريع
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  إدارة المشاريع المعروضة في الموقع — اسحب الصفوف لإعادة
                  ترتيبها
                </p>
              </div>
            </div>

            <Link to="/settings/website/projects/new">
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                مشروع جديد
              </Button>
            </Link>
          </div>

          <div className="mt-3 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالعنوان أو التصنيف..."
              className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          {filteredProjects.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {isSearching ? "لا توجد نتائج مطابقة." : "لا توجد مشاريع بعد."}
            </div>
          ) : (
            <table className="min-w-full border-collapse table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 font-semibold text-sm border-b border-gray-200 w-10" />
                  <th className="py-3 px-4 font-semibold text-sm border-b border-gray-200 text-right">
                    العنوان
                  </th>
                  <th className="py-3 px-4 font-semibold text-sm border-b border-gray-200 text-right">
                    التصنيف
                  </th>
                  <th className="py-3 px-4 font-semibold text-sm border-b border-gray-200 text-right">
                    السنة
                  </th>
                  <th className="py-3 px-4 font-semibold text-sm border-b border-gray-200 text-right">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredProjects.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredProjects.map((project) => (
                      <SortableProjectRow
                        key={project.id}
                        project={project}
                        draggable={!isSearching}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebsiteProjectsPage;
