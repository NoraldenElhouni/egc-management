import React, { memo, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronDown, Loader2, ShieldCheck } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FlatPermission {
  id: string;
  name: string;
  parent_permission_id: string | null;
}

export interface PermissionNode extends FlatPermission {
  children: PermissionNode[];
}

interface AssignedPermission {
  permissions: { id: string; name: string };
}

// ── Tree builder ──────────────────────────────────────────────────────────────

export function buildPermissionTree(flat: FlatPermission[]): PermissionNode[] {
  const map = new Map<string, PermissionNode>();

  for (const p of flat) {
    map.set(p.id, { ...p, children: [] });
  }

  const roots: PermissionNode[] = [];

  for (const node of map.values()) {
    if (node.parent_permission_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(node.parent_permission_id);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node); // orphaned node → treat as root
      }
    }
  }

  return roots;
}

// ── PermissionTreeNode ────────────────────────────────────────────────────────

interface PermissionTreeNodeProps {
  node: PermissionNode;
  assignedIds: Set<string>;
  userId: string;
  projectId: string;
  grantPermission: (args: {
    user_id: string;
    project_id: string;
    permission_id: string;
  }) => Promise<{ error: unknown }>;
  revokePermission: (args: {
    user_id: string;
    project_id: string;
    permission_id: string;
  }) => Promise<{ error: unknown }>;
  depth?: number;
}

const PermissionTreeNode = memo(function PermissionTreeNode({
  node,
  assignedIds,
  userId,
  projectId,
  grantPermission,
  revokePermission,
  depth = 0,
}: PermissionTreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isChecked = assignedIds.has(node.id);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleExpand = useCallback(() => {
    if (hasChildren) setExpanded((prev) => !prev);
  }, [hasChildren]);

  const handleCheck = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoading(true);
      if (e.target.checked) {
        await grantPermission({
          user_id: userId,
          project_id: projectId,
          permission_id: node.id,
        });
      } else {
        await revokePermission({
          user_id: userId,
          project_id: projectId,
          permission_id: node.id,
        });
      }
      setLoading(false);
    },
    [grantPermission, revokePermission, userId, projectId, node.id]
  );

  const indentStyle = { paddingRight: `${depth * 20}px` };

  return (
    <li>
      {/* Row */}
      <div
        className={[
          "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-indigo-50/60",
          depth === 0 ? "border-b border-gray-100 last:border-b-0" : "",
        ].join(" ")}
        style={indentStyle}
      >
        {/* Expand / collapse toggle */}
        <button
          type="button"
          onClick={toggleExpand}
          aria-label={expanded ? "طي" : "توسيع"}
          className={[
            "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-400 transition-colors",
            hasChildren
              ? "hover:text-indigo-600 hover:bg-indigo-100 cursor-pointer"
              : "invisible pointer-events-none",
          ].join(" ")}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Checkbox / spinner */}
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {loading ? (
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
          ) : (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={handleCheck}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer text-indigo-600 accent-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
            />
          )}
        </div>

        {/* Permission name */}
        <span
          onClick={toggleExpand}
          className={[
            "text-sm select-none",
            hasChildren ? "cursor-pointer" : "",
            depth === 0
              ? "font-semibold text-gray-800"
              : "font-medium text-gray-700",
          ].join(" ")}
        >
          {node.name}
        </span>

        {/* Children count badge — pushed to far left in RTL */}
        {hasChildren && (
          <span className="mr-auto text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">
            {node.children.length}
          </span>
        )}
      </div>

      {/* Recursive children with vertical guide line */}
      {hasChildren && expanded && (
        <ul
          className="border-r-2 border-indigo-100"
          style={{ marginRight: `${depth * 20 + 28}px` }}
        >
          {node.children.map((child) => (
            <PermissionTreeNode
              key={child.id}
              node={child}
              assignedIds={assignedIds}
              userId={userId}
              projectId={projectId}
              grantPermission={grantPermission}
              revokePermission={revokePermission}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

// ── PermissionTree (main export) ──────────────────────────────────────────────

interface PermissionTreeProps {
  /** All permissions from usePermissions() */
  allPermissions: FlatPermission[];
  /** Currently assigned permissions from getUserProjectPermissions() */
  assignedPermissions: AssignedPermission[];
  userId: string;
  projectId: string;
  grantPermission: (args: {
    user_id: string;
    project_id: string;
    permission_id: string;
  }) => Promise<{ error: unknown }>;
  revokePermission: (args: {
    user_id: string;
    project_id: string;
    permission_id: string;
  }) => Promise<{ error: unknown }>;
  /** Called after every successful grant or revoke — use your refetch() here */
  onPermissionChange?: () => void;
}

export default function PermissionTree({
  allPermissions,
  assignedPermissions,
  userId,
  projectId,
  grantPermission,
  revokePermission,
  onPermissionChange,
}: PermissionTreeProps) {
  const tree = useMemo(
    () => buildPermissionTree(allPermissions),
    [allPermissions]
  );

  // Set<string> for O(1) checked-state lookups
  const assignedIds = useMemo(
    () => new Set(assignedPermissions.map((p) => p.permissions.id)),
    [assignedPermissions]
  );

  const wrappedGrant = useCallback(
    async (args: Parameters<typeof grantPermission>[0]) => {
      const result = await grantPermission(args);
      if (!result.error) onPermissionChange?.();
      return result;
    },
    [grantPermission, onPermissionChange]
  );

  const wrappedRevoke = useCallback(
    async (args: Parameters<typeof revokePermission>[0]) => {
      const result = await revokePermission(args);
      if (!result.error) onPermissionChange?.();
      return result;
    },
    [revokePermission, onPermissionChange]
  );

  if (tree.length === 0) {
    return (
      <div
        dir="rtl"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center text-gray-400 text-sm"
      >
        لا توجد صلاحيات متاحة
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Card header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">شجرة الصلاحيات</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {assignedIds.size} صلاحية مفعّلة من أصل {allPermissions.length}
          </p>
        </div>
      </div>

      {/* Tree */}
      <ul className="py-1">
        {tree.map((root) => (
          <PermissionTreeNode
            key={root.id}
            node={root}
            assignedIds={assignedIds}
            userId={userId}
            projectId={projectId}
            grantPermission={wrappedGrant}
            revokePermission={wrappedRevoke}
            depth={0}
          />
        ))}
      </ul>
    </div>
  );
}
