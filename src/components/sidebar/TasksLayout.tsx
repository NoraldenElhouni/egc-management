import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderKanban,
  Building2,
  Building,
  User,
  Layers,
  ListTodo,
  Users,
  Loader2,
  Settings,
  FileStack,
  Tag,
  Plus,
  AlertTriangle,
  X,
} from "lucide-react";
import { useSidebar } from "../../contexts/SidebarContext";
import { supabase } from "../../lib/supabaseClient";
import {
  useTasksSidebar,
  type SpaceNode,
  type FolderNode,
  type BoardWithCount,
  type SpaceType,
} from "../../hooks/tasks/useTasksSidebar";
import { useCreateTaskEntities, useProjectZoneOptions, useCreateZone } from "../../hooks/tasks/useCreateTaskEntities";
import { useClickOutside } from "../../hooks/tasks/useClickOutside";
import { extractErrorMessage } from "../../hooks/tasks/extractErrorMessage";
import { emitTaskError, setTaskErrorListener } from "../../hooks/tasks/taskErrorBus";
import NewSpaceModal from "./NewSpaceModal";

// A failed mutation anywhere in this module (most commonly the
// completion-gate trigger rejecting a status change, or the reparent
// cycle guard) used to fail completely silently — the click just did
// nothing. Rather than add an onError to every one of the ~70
// useMutation() calls across the module's hooks, this module gets its
// own QueryClient (nested inside the app's real one, still hitting the
// same Supabase client underneath) whose MutationCache reports every
// mutation error to one toast, for free, with no per-call-site changes.
const tasksQueryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => emitTaskError(extractErrorMessage(error)),
  }),
});

function TaskErrorToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setTaskErrorListener(setMessage);
    return () => setTaskErrorListener(null);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 6000);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] w-full max-w-sm -translate-x-1/2 px-4" dir="rtl">
      <div className="flex items-start gap-2 rounded-lg bg-red-600 px-3.5 py-2.5 text-sm text-white shadow-2xl">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="flex-1">{message}</span>
        <button onClick={() => setMessage(null)} className="shrink-0 rounded p-0.5 hover:bg-white/20">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// D1 — persistent Tasks sidebar (tasks/task-module-build-plan.md, Part 7).
// Spaces grouped by type, each expandable to folders/boards with an open
// count; department shortcuts; "My work"; a search box that searches
// tasks, not just navigation.
//
// Bespoke markup rather than the shared SidebarLayout — same call as
// BookkeeperLayout: the content here is a dynamic, expandable tree with
// live counts and search, not a static NavItem[] menu.
//
// Every destination below (board, department, my-work, a search hit)
// currently lands on TasksPage's placeholder — D2/D6/D7/D3 haven't been
// built yet. That's intentional, same as the main-menu card landing on
// a placeholder before this sidebar existed.
// =====================================================================

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  project: "مساحات المشاريع",
  department: "مساحات الأقسام",
  company: "مساحات الشركة",
  personal: "مساحتي الخاصة",
};

const SPACE_TYPE_ORDER: SpaceType[] = [
  "project",
  "department",
  "company",
  "personal",
];

const SPACE_TYPE_ICONS: Record<SpaceType, typeof FolderKanban> = {
  project: FolderKanban,
  department: Building2,
  company: Building,
  personal: User,
};

interface SearchHit {
  id: string;
  title: string;
  boardName: string;
  spaceName: string;
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="min-w-[1.25rem] rounded-full bg-slate-200 px-1.5 text-center text-xs font-medium text-slate-600">
      {count}
    </span>
  );
}

function BoardRow({ item }: { item: BoardWithCount }) {
  const location = useLocation();
  const path = `/tasks/board/${item.board.id}`;
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
        isActive
          ? "bg-primary-superLight text-primary font-medium"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Layers className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      <span className="flex-1 truncate">
        {item.board.name}
        {item.zoneName && <span className="text-xs text-gray-400"> ({item.zoneName})</span>}
      </span>
      <CountBadge count={item.openCount} />
    </Link>
  );
}

function AddBoardInline({
  spaceId,
  folderId,
  projectId,
  onDone,
}: {
  spaceId: string;
  folderId: string | null;
  projectId: string | null;
  onDone: () => void;
}) {
  const { createBoard, creatingBoard } = useCreateTaskEntities();
  const { createZone, creatingZone } = useCreateZone();
  const zones = useProjectZoneOptions(projectId);
  const [name, setName] = useState("");
  const [step, setStep] = useState<"name" | "zone">("name");
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");

  const finish = async (zoneId: string | null) => {
    await createBoard({ spaceId, folderId, name: name.trim(), zoneId });
    onDone();
  };

  const submitName = () => {
    const trimmed = name.trim();
    if (!trimmed) return onDone();
    // A project-type space always gets asked which zone — including when
    // it has none yet, since "no zones" should offer adding one, not
    // silently create a zoneless board.
    if (projectId) {
      setStep("zone");
    } else {
      finish(null);
    }
  };

  const submitNewZone = async () => {
    const trimmed = newZoneName.trim();
    if (!trimmed || !projectId) return setAddingZone(false);
    const zone = await createZone({ projectId, name: trimmed });
    await finish(zone.id);
  };

  if (step === "zone") {
    return (
      <div className="px-2 py-1.5">
        <div className="mb-1 text-xs text-gray-500">
          {zones.length === 0
            ? `لا توجد مناطق لهذا المشروع بعد. أي منطقة تريد ربط "${name.trim()}" بها؟`
            : `أي منطقة تريد ربط "${name.trim()}" بها؟`}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => finish(null)}
            disabled={creatingBoard}
            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200"
          >
            بدون منطقة
          </button>
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => finish(z.id)}
              disabled={creatingBoard}
              className="rounded-full bg-primary-superLight px-2.5 py-1 text-xs text-primary hover:bg-primary/20"
            >
              {z.name}
            </button>
          ))}
          {!addingZone && (
            <button
              onClick={() => setAddingZone(true)}
              className="flex items-center gap-0.5 rounded-full border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700"
            >
              <Plus className="h-3 w-3" />
              منطقة جديدة
            </button>
          )}
        </div>
        {addingZone && (
          <input
            autoFocus
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewZone();
              if (e.key === "Escape") setAddingZone(false);
            }}
            onBlur={submitNewZone}
            disabled={creatingZone || creatingBoard}
            placeholder="اسم المنطقة الجديدة..."
            className="mt-1.5 w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <Layers className="h-3.5 w-3.5 shrink-0 text-gray-300" />
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitName();
          if (e.key === "Escape") onDone();
        }}
        onBlur={submitName}
        placeholder="اسم اللوحة..."
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

function AddFolderInline({ spaceId, onDone }: { spaceId: string; onDone: () => void }) {
  const { createFolder } = useCreateTaskEntities();
  const [name, setName] = useState("");

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return onDone();
    await createFolder({ spaceId, name: trimmed });
    onDone();
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <Folder className="h-3.5 w-3.5 shrink-0 text-gray-300" />
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onDone();
        }}
        onBlur={submit}
        placeholder="اسم المجلد..."
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

function FolderSection({
  spaceId,
  projectId,
  folderNode,
}: {
  spaceId: string;
  projectId: string | null;
  folderNode: FolderNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [addingBoard, setAddingBoard] = useState(false);
  const openCount = folderNode.boards.reduce((sum, b) => sum + b.openCount, 0);

  return (
    <div className="group/folder">
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 overflow-hidden text-right"
        >
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-gray-400 transition-transform ${
              isOpen ? "" : "-rotate-90"
            }`}
          />
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{folderNode.folder.name}</span>
        </button>
        <CountBadge count={openCount} />
        <button
          onClick={() => {
            setIsOpen(true);
            setAddingBoard(true);
          }}
          className="rounded p-0.5 text-gray-300 opacity-0 hover:bg-gray-200 hover:text-gray-600 group-hover/folder:opacity-100"
          title="إضافة لوحة"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {isOpen && (
        <div className="mr-4 space-y-0.5">
          {addingBoard && (
            <AddBoardInline
              spaceId={spaceId}
              folderId={folderNode.folder.id}
              projectId={projectId}
              onDone={() => setAddingBoard(false)}
            />
          )}
          {folderNode.boards.map((b) => (
            <BoardRow key={b.board.id} item={b} />
          ))}
          {folderNode.boards.length === 0 && !addingBoard && (
            <div className="px-2 py-1 text-xs text-gray-400">لا توجد لوحات</div>
          )}
        </div>
      )}
    </div>
  );
}

function SpaceSection({ node }: { node: SpaceNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMode, setAddMode] = useState<"board" | "folder" | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(addMenuRef, () => setAddMenuOpen(false));
  const Icon = SPACE_TYPE_ICONS[node.space.space_type];
  const totalOpen =
    node.boards.reduce((sum, b) => sum + b.openCount, 0) +
    node.folders.reduce(
      (sum, f) => sum + f.boards.reduce((s, b) => s + b.openCount, 0),
      0,
    );

  return (
    <div className="group/space">
      <div className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 overflow-hidden text-right"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${
              isOpen ? "" : "-rotate-90"
            }`}
          />
          <Icon className="h-4 w-4 shrink-0 text-gray-500" />
          <span className="flex-1 truncate text-right">{node.space.name}</span>
        </button>
        <CountBadge count={totalOpen} />
        <div ref={addMenuRef} className="relative shrink-0">
          <button
            onClick={() => {
              setIsOpen(true);
              setAddMenuOpen((v) => !v);
            }}
            className="rounded p-0.5 text-gray-300 opacity-0 hover:bg-gray-200 hover:text-gray-600 group-hover/space:opacity-100"
            title="إضافة"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {addMenuOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setAddMode("board");
                  setAddMenuOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-right text-xs hover:bg-gray-50"
              >
                لوحة جديدة
              </button>
              <button
                onClick={() => {
                  setAddMode("folder");
                  setAddMenuOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-right text-xs hover:bg-gray-50"
              >
                مجلد جديد
              </button>
            </div>
          )}
        </div>
        <Link
          to={`/tasks/space/${node.space.id}/settings`}
          className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 hover:bg-gray-200 hover:text-gray-600 group-hover/space:opacity-100"
          title="إعدادات المساحة"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isOpen && (
        <div className="mr-5 space-y-0.5 border-r border-gray-100 pr-2">
          {addMode === "folder" && <AddFolderInline spaceId={node.space.id} onDone={() => setAddMode(null)} />}
          {node.folders.map((folderNode) => (
            <FolderSection
              key={folderNode.folder.id}
              spaceId={node.space.id}
              projectId={node.space.project_id}
              folderNode={folderNode}
            />
          ))}
          {addMode === "board" && (
            <AddBoardInline
              spaceId={node.space.id}
              folderId={null}
              projectId={node.space.project_id}
              onDone={() => setAddMode(null)}
            />
          )}
          {node.boards.map((b) => (
            <BoardRow key={b.board.id} item={b} />
          ))}
          {node.folders.length === 0 && node.boards.length === 0 && addMode === null && (
            <div className="px-2 py-1 text-xs text-gray-400">لا توجد لوحات</div>
          )}
        </div>
      )}
    </div>
  );
}

const TasksLayoutInner = () => {
  const { isCollapsed, toggle } = useSidebar();
  const { data, loading } = useTasksSidebar();
  const navigate = useNavigate();
  const [showNewSpace, setShowNewSpace] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<number | null>(null);

  // board_id -> { boardName, spaceName }, flattened once per sidebar fetch,
  // used only to decorate search hits (which come back as bare rows).
  const boardContext = useMemo(() => {
    const map = new Map<string, { boardName: string; spaceName: string }>();
    if (!data) return map;
    for (const nodes of Object.values(data.spacesByType)) {
      for (const node of nodes) {
        const allBoards = [
          ...node.boards,
          ...node.folders.flatMap((f) => f.boards),
        ];
        for (const b of allBoards) {
          map.set(b.board.id, {
            boardName: b.board.name,
            spaceName: node.space.name,
          });
        }
      }
    }
    return map;
  }, [data]);

  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);

    const term = searchInput.trim();
    if (term.length < 2 || boardContext.size === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = window.setTimeout(async () => {
      const boardIds = Array.from(boardContext.keys());
      const { data: rows, error } = await supabase
        .schema("tasks")
        .from("tasks")
        .select("id, title, board_id")
        .in("board_id", boardIds)
        .eq("is_archived", false)
        .ilike("title", `%${term}%`)
        .limit(8);

      if (!error) {
        setSearchResults(
          (rows ?? []).map((row) => ({
            id: row.id,
            title: row.title,
            boardName: boardContext.get(row.board_id)?.boardName ?? "",
            spaceName: boardContext.get(row.board_id)?.spaceName ?? "",
          })),
        );
      }
      setSearching(false);
    }, 300);

    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [searchInput, boardContext]);

  const openSearchHit = (hit: SearchHit) => {
    setSearchInput("");
    setSearchResults([]);
    navigate(`/tasks/task/${hit.id}`);
  };

  const spaceGroups = data
    ? SPACE_TYPE_ORDER.map((type) => ({
        type,
        nodes: data.spacesByType[type],
      })).filter((g) => g.nodes.length > 0)
    : [];

  if (isCollapsed) {
    return (
      <div className="flex h-[calc(100vh-64px)] bg-gray-50">
        <aside className="fixed right-0 top-16 bottom-0 flex w-20 flex-col items-center gap-2 border-l border-gray-200 bg-white py-4">
          <button
            onClick={toggle}
            className="rounded-full p-2 hover:bg-gray-100"
            title="توسيع القائمة"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <Link
            to="/tasks"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            title="المهام"
          >
            <ListTodo className="h-5 w-5" />
          </Link>
          <Link
            to="/tasks/my-work"
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            title="أعمالي"
          >
            <Users className="h-5 w-5" />
            {!!data?.myWorkCount && (
              <span className="absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
        </aside>
        <main className="mr-20 flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <aside className="fixed right-0 top-16 bottom-0 flex w-72 flex-col border-l border-gray-200 bg-white">
        <div className="relative flex-shrink-0 border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">المهام</h2>
          <p className="mt-1 text-sm text-gray-500">
            المساحات، اللوحات، وأعمالي
          </p>
          <button
            onClick={() => setShowNewSpace(true)}
            className="mt-2 flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-3 w-3" />
            مساحة جديدة
          </button>
          <button
            onClick={toggle}
            className="absolute top-4 left-4 rounded-full p-1 hover:bg-gray-100"
            title="طي القائمة"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Search — searches tasks, not navigation */}
        <div className="relative flex-shrink-0 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في المهام..."
              className="w-full bg-transparent text-sm outline-none"
              aria-label="بحث عن مهمة"
            />
            {searching && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
            )}
          </div>

          {searchInput.trim().length >= 2 && (
            <div className="absolute right-3 left-3 z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {searchResults.length === 0 && !searching ? (
                <div className="p-3 text-sm text-gray-400">لا توجد نتائج</div>
              ) : (
                searchResults.map((hit) => (
                  <button
                    key={hit.id}
                    onClick={() => openSearchHit(hit)}
                    className="flex w-full flex-col items-start gap-0.5 border-b border-gray-100 px-3 py-2 text-right hover:bg-gray-50 last:border-b-0"
                  >
                    <span className="truncate text-sm font-medium text-gray-800">
                      {hit.title}
                    </span>
                    <span className="truncate text-xs text-gray-400">
                      {hit.spaceName} · {hit.boardName}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-3 scrollbar-hide">
          {loading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-7 animate-pulse rounded-md bg-slate-100" />
              ))}
            </div>
          ) : (
            <>
              {spaceGroups.map((group) => (
                <div key={group.type} className="space-y-1">
                  <div className="px-2 text-xs font-semibold text-gray-400">
                    {SPACE_TYPE_LABELS[group.type]}
                  </div>
                  {group.nodes.map((node) => (
                    <SpaceSection key={node.space.id} node={node} />
                  ))}
                </div>
              ))}
              {spaceGroups.length === 0 && (
                <div className="px-2 text-sm text-gray-400">
                  لا توجد مساحات متاحة
                </div>
              )}

              {!!data?.departments.length && (
                <div className="space-y-1 border-t border-gray-100 pt-3">
                  <div className="px-2 text-xs font-semibold text-gray-400">
                    الأقسام
                  </div>
                  {data.departments.map((dept) => (
                    <Link
                      key={dept.id}
                      to={`/tasks/department/${dept.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="flex-1 truncate">
                        {dept.name_ar ?? dept.name}
                      </span>
                      <CountBadge count={dept.openCount} />
                    </Link>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-3">
                <Link
                  to="/tasks/my-work"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100"
                >
                  <Users className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="flex-1 truncate">أعمالي</span>
                  <CountBadge count={data?.myWorkCount ?? 0} />
                </Link>
              </div>

              <div className="space-y-1 border-t border-gray-100 pt-3">
                <div className="px-2 text-xs font-semibold text-gray-400">الإدارة</div>
                <Link
                  to="/tasks/admin/templates"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <FileStack className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="flex-1 truncate">القوالب</span>
                </Link>
                <Link
                  to="/tasks/admin/fields"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <Tag className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="flex-1 truncate">الحقول والوسوم وأنواع المهام</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>

      <main className="mr-72 flex-1 overflow-y-auto scrollbar-hide">
        <Outlet />
      </main>

      {showNewSpace && <NewSpaceModal onClose={() => setShowNewSpace(false)} />}
    </div>
  );
};

const TasksLayout = () => (
  <QueryClientProvider client={tasksQueryClient}>
    <TasksLayoutInner />
    <TaskErrorToast />
  </QueryClientProvider>
);

export default TasksLayout;
