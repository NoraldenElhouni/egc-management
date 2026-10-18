// Where each box goes in the link diagram (TaskFlow.tsx). Pure, no React.
//
// A port of Construction Flow's "Tidy up" (its second layout(), see
// plans/construction-flow-comparison/01-construction-flow-inventory.md §7),
// for finish → start links only:
//
//   1. Columns by link depth: a task sits one column after the latest of the
//      tasks it waits for. A task that only has tasks waiting on it moves to
//      the column just before its nearest one, so starting tasks don't all
//      pile up in the first column.
//   2. A link that skips columns gets a small hidden node in each column it
//      crosses, so its line bends around the boxes instead of through them.
//   3. Order inside each column: rounds of moving every node to the average
//      position of its neighbours (barycenter), forwards then backwards —
//      fewer crossings.
//   4. Heights: rounds of pulling every node toward its neighbours' centre
//      while keeping the gap between boxes.
//   5. Ours, not CF's: boxes with no links at all are packed in rows under
//      the chart instead of piling into column 0 — on the whole-board diagram
//      that's every parent and every unlinked subtask (38 of the template's
//      92 tasks), which made one column taller than the screen at any zoom.
//      The rows are about screen-shaped, so a board with no links is a grid.
//
// Columns run right → left (the page is dir="rtl"): column 0 is at the right.
// The caller's node order is the starting order inside a column and the order
// of the packed rows (the diagram passes tasks in outline order), and the
// result is deterministic.

export interface FlowLayoutOptions {
  nodeW: number;
  nodeH: number;
  /** Between columns. */
  gapX: number;
  /** Between boxes in a column. */
  gapY: number;
}

export interface FlowPoint {
  x: number;
  y: number;
}

export interface FlowLayoutResult {
  /** Top-left corner of each box. */
  nodes: Map<string, FlowPoint & { column: number }>;
  /** Bend points of each link that skips columns (centres of its hidden
   * nodes, in order from the waited-on task), keyed "from>to". */
  bends: Map<string, FlowPoint[]>;
  width: number;
  height: number;
}

interface LayoutNode {
  key: string;
  h: number;
  layer: number;
  y: number;
  r: number;
}

const DUMMY_H = 14;
const ORDER_ROUNDS = 6;
const PLACE_ROUNDS = 8;
/** Width ÷ height the packed rows aim for — about a screen. */
const GRID_ASPECT = 16 / 9;

export function flowLayout(
  ids: string[],
  links: { from: string; to: string }[],
  { nodeW, nodeH, gapX, gapY }: FlowLayoutOptions,
): FlowLayoutResult {
  const known = new Set(ids);
  const edges = links.filter((l) => known.has(l.from) && known.has(l.to) && l.from !== l.to);
  if (ids.length === 0) return { nodes: new Map(), bends: new Map(), width: 0, height: 0 };

  const touched = new Set(edges.flatMap((e) => [e.from, e.to]));
  const chart = layered(
    ids.filter((id) => touched.has(id)),
    edges,
    nodeH,
    gapY,
  );
  const loose = ids.filter((id) => !touched.has(id));

  // 5. the loose boxes, in rows under the chart, as wide as the chart or
  // about screen-shaped, whichever is wider
  const shaped = Math.round(Math.sqrt((loose.length * GRID_ASPECT * (nodeH + gapY)) / (nodeW + gapX)));
  const perRow = loose.length ? Math.max(1, chart.columns, shaped) : 0;
  const columns = Math.max(chart.columns, Math.min(perRow, loose.length));
  const xOf = (column: number) => (columns - 1 - column) * (nodeW + gapX);

  const nodes = new Map<string, FlowPoint & { column: number }>();
  for (const [id, n] of chart.nodes) nodes.set(id, { x: xOf(n.column), y: n.y, column: n.column });
  const bends = new Map<string, FlowPoint[]>();
  for (const [key, points] of chart.bends) bends.set(key, points.map((p) => ({ x: xOf(p.column) + nodeW / 2, y: p.y })));
  let height = chart.height;
  const gridTop = chart.height ? chart.height + gapY * 2 : 0;
  loose.forEach((id, i) => {
    const column = i % perRow;
    const y = gridTop + Math.floor(i / perRow) * (nodeH + gapY);
    nodes.set(id, { x: xOf(column), y, column });
    height = Math.max(height, y + nodeH);
  });
  return { nodes, bends, width: columns * (nodeW + gapX) - gapX, height };
}

/** Steps 1–4, for boxes that have links. Columns and heights only — the
 * caller turns columns into x. */
function layered(
  ids: string[],
  edges: { from: string; to: string }[],
  nodeH: number,
  gapY: number,
): {
  nodes: Map<string, { column: number; y: number }>;
  bends: Map<string, { column: number; y: number }[]>;
  columns: number;
  height: number;
} {
  if (ids.length === 0) return { nodes: new Map(), bends: new Map(), columns: 0, height: 0 };

  // 1. columns by link depth
  const lay = new Map(ids.map((id) => [id, 0]));
  for (let pass = 0; pass < ids.length * 3 + 5; pass++) {
    let changed = false;
    for (const e of edges) {
      const want = (lay.get(e.from) as number) + 1;
      if ((lay.get(e.to) as number) < want) {
        lay.set(e.to, want);
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const id of ids) {
    const incoming = edges.some((e) => e.to === id);
    const outgoing = edges.filter((e) => e.from === id);
    if (!incoming && outgoing.length > 0) {
      const nearest = Math.min(...outgoing.map((e) => lay.get(e.to) as number));
      lay.set(id, Math.max(lay.get(id) as number, nearest - 1));
    }
  }
  const used = Array.from(new Set(lay.values())).sort((a, b) => a - b);
  for (const id of ids) lay.set(id, used.indexOf(lay.get(id) as number));

  // 2. nodes per column, hidden nodes for long links
  const nodes = new Map<string, LayoutNode>();
  const columns: LayoutNode[][] = [];
  const up = new Map<string, string[]>();
  const down = new Map<string, string[]>();
  const add = (key: string, layer: number, h: number) => {
    const n: LayoutNode = { key, h, layer, y: 0, r: 0 };
    nodes.set(key, n);
    (columns[layer] = columns[layer] ?? []).push(n);
    return n;
  };
  const segment = (u: string, v: string) => {
    down.set(u, [...(down.get(u) ?? []), v]);
    up.set(v, [...(up.get(v) ?? []), u]);
  };
  for (const id of ids) add(`t${id}`, lay.get(id) as number, nodeH);
  const chains: { key: string; dummies: string[] }[] = [];
  for (const e of edges) {
    const a = lay.get(e.from) as number;
    const b = lay.get(e.to) as number;
    let prev = `t${e.from}`;
    const dummies: string[] = [];
    for (let x = a + 1; x < b; x++) {
      const key = `d${e.from}>${e.to}#${x}`;
      add(key, x, DUMMY_H);
      dummies.push(key);
      segment(prev, key);
      prev = key;
    }
    segment(prev, `t${e.to}`);
    if (dummies.length) chains.push({ key: `${e.from}>${e.to}`, dummies });
  }
  for (let i = 0; i < columns.length; i++) columns[i] = columns[i] ?? [];

  // 3. order inside each column
  const setRanks = () => columns.forEach((c) => c.forEach((n, i) => (n.r = (i + 0.5) / c.length)));
  setRanks();
  const sweep = (forward: boolean) => {
    const order = columns.map((_, i) => i);
    if (!forward) order.reverse();
    for (const li of order) {
      const c = columns[li];
      const key = new Map(
        c.map((n) => {
          const nb = (forward ? up.get(n.key) : down.get(n.key)) ?? [];
          return [n.key, nb.length ? nb.reduce((s, k) => s + (nodes.get(k) as LayoutNode).r, 0) / nb.length : n.r];
        }),
      );
      // Stable: ties keep their current order.
      const indexed = c.map((n, i) => ({ n, i }));
      indexed.sort((p, q) => (key.get(p.n.key) as number) - (key.get(q.n.key) as number) || p.i - q.i);
      columns[li] = indexed.map((x) => x.n);
      columns[li].forEach((n, i) => (n.r = (i + 0.5) / columns[li].length));
    }
  };
  for (let i = 0; i < ORDER_ROUNDS; i++) {
    sweep(true);
    sweep(false);
  }

  // 4. heights: stack, then pull toward neighbours while keeping the gap
  const total = (c: LayoutNode[]) => c.reduce((s, n) => s + n.h, 0) + gapY * Math.max(0, c.length - 1);
  const tallest = Math.max(...columns.map(total));
  for (const c of columns) {
    let y = (tallest - total(c)) / 2;
    for (const n of c) {
      n.y = y;
      y += n.h + gapY;
    }
  }
  const centre = (key: string) => {
    const n = nodes.get(key) as LayoutNode;
    return n.y + n.h / 2;
  };
  const place = (c: LayoutNode[], wanted: number[]) => {
    const fwd = wanted.slice();
    const back = wanted.slice();
    for (let i = 1; i < c.length; i++) fwd[i] = Math.max(fwd[i], fwd[i - 1] + c[i - 1].h + gapY);
    for (let i = c.length - 2; i >= 0; i--) back[i] = Math.min(back[i], back[i + 1] - c[i].h - gapY);
    c.forEach((n, i) => (n.y = (fwd[i] + back[i]) / 2));
  };
  for (let round = 0; round < PLACE_ROUNDS; round++) {
    for (const forward of [true, false]) {
      const order = columns.map((_, i) => i);
      if (!forward) order.reverse();
      for (const li of order) {
        const c = columns[li];
        place(
          c,
          c.map((n) => {
            const nb = (forward ? up.get(n.key) : down.get(n.key)) ?? [];
            return nb.length ? nb.reduce((s, k) => s + centre(k), 0) / nb.length - n.h / 2 : n.y;
          }),
        );
      }
    }
  }
  // (fwd + back) / 2 can leave two neighbours closer than the gap when
  // their wishes cross — push them apart, top to bottom.
  for (const c of columns) {
    for (let i = 1; i < c.length; i++) {
      const min = c[i - 1].y + c[i - 1].h + gapY;
      if (c[i].y < min) c[i].y = min;
    }
  }

  const top = Math.min(...Array.from(nodes.values(), (n) => n.y));
  const out = new Map<string, { column: number; y: number }>();
  let height = 0;
  for (const id of ids) {
    const n = nodes.get(`t${id}`) as LayoutNode;
    const y = Math.round(n.y - top);
    out.set(id, { column: n.layer, y });
    height = Math.max(height, y + nodeH);
  }
  const bends = new Map<string, { column: number; y: number }[]>();
  for (const { key, dummies } of chains) {
    bends.set(
      key,
      dummies.map((k) => {
        const n = nodes.get(k) as LayoutNode;
        return { column: n.layer, y: Math.round(n.y - top + n.h / 2) };
      }),
    );
  }
  return { nodes: out, bends, columns: columns.length, height };
}
