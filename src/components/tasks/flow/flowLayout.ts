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
//
// Columns run right → left (the page is dir="rtl"): column 0 is at the right.
// The caller's node order is the starting order inside a column (the diagram
// passes tasks by start date), and the result is deterministic.

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

export function flowLayout(
  ids: string[],
  links: { from: string; to: string }[],
  { nodeW, nodeH, gapX, gapY }: FlowLayoutOptions,
): FlowLayoutResult {
  const known = new Set(ids);
  const edges = links.filter((l) => known.has(l.from) && known.has(l.to) && l.from !== l.to);
  if (ids.length === 0) return { nodes: new Map(), bends: new Map(), width: 0, height: 0 };

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
  const lastColumn = columns.length - 1;
  const xOf = (layer: number) => (lastColumn - layer) * (nodeW + gapX);

  const out = new Map<string, FlowPoint & { column: number }>();
  let height = 0;
  for (const id of ids) {
    const n = nodes.get(`t${id}`) as LayoutNode;
    const y = Math.round(n.y - top);
    out.set(id, { x: xOf(n.layer), y, column: n.layer });
    height = Math.max(height, y + nodeH);
  }
  const bends = new Map<string, FlowPoint[]>();
  for (const { key, dummies } of chains) {
    bends.set(
      key,
      dummies.map((k) => {
        const n = nodes.get(k) as LayoutNode;
        return { x: xOf(n.layer) + nodeW / 2, y: Math.round(n.y - top + n.h / 2) };
      }),
    );
  }
  return { nodes: out, bends, width: columns.length * (nodeW + gapX) - gapX, height };
}
