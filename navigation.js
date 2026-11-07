// Navigation advice only: static water clearance, never an autopilot or traffic guarantee.
(function (root) {
  function waterRoute(start, goal, width, height, clear) {
    if (clear(start, goal)) return [start, goal];
    const cell = 48, cols = Math.ceil(width / cell), rows = Math.ceil(height / cell);
    const point = id => ({ x: (id % cols + 0.5) * cell, y: (Math.floor(id / cols) + 0.5) * cell });
    const free = new Map();
    const pass = id => { if (!free.has(id)) { const p = point(id); free.set(id, p.x < width && p.y < height && clear(p, p)); } return free.get(id); };
    const nearest = p => {
      const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell);
      let best = -1, dist = Infinity;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const id = y * cols + x, q = point(id), d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < dist && pass(id) && clear(p, q)) { best = id; dist = d; }
      }
      return best;
    };
    const first = nearest(start), last = nearest(goal);
    if (first < 0 || last < 0) return [];
    const cost = new Map([[first, 0]]), parent = new Map(), closed = new Set();
    const h = id => Math.hypot(point(id).x - point(last).x, point(id).y - point(last).y);
    // Binary heap keeps long routes affordable on phones.
    const heap = [];
    const push = item => { heap.push(item); let i = heap.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (heap[j].f <= item.f) break; heap[i] = heap[j]; i = j; } heap[i] = item; };
    const pop = () => { const result = heap[0], tail = heap.pop(); if (heap.length) { let i = 0; while (i * 2 + 1 < heap.length) { let j = i * 2 + 1; if (j + 1 < heap.length && heap[j + 1].f < heap[j].f) j++; if (heap[j].f >= tail.f) break; heap[i] = heap[j]; i = j; } heap[i] = tail; } return result.id; };
    push({ id: first, f: h(first) });
    while (heap.length) {
      const id = pop(); if (closed.has(id)) continue;
      if (id === last) {
        const path = [goal]; for (let at = last; at !== undefined; at = parent.get(at)) path.push(point(at)); path.push(start); path.reverse();
        const result = [start]; let i = 0;
        while (i < path.length - 1) { let j = path.length - 1; while (j > i + 1 && !clear(path[i], path[j])) j--; result.push(path[j]); i = j; }
        return result;
      }
      closed.add(id); const x = id % cols, y = Math.floor(id / cols);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || x + dx < 0 || y + dy < 0 || x + dx >= cols || y + dy >= rows) continue;
        const next = (y + dy) * cols + x + dx;
        if (closed.has(next) || !pass(next) || !clear(point(id), point(next))) continue;
        const g = cost.get(id) + Math.hypot(dx, dy) * cell;
        if (g < (cost.get(next) ?? Infinity)) { cost.set(next, g); parent.set(next, id); push({ id: next, f: g + h(next) }); }
      }
    }
    return [];
  }
  function placeLabel(boxes, x, y, width, height, bounds) {
    for (const dy of [0, -20, 20, -40, 40, -60, 60]) {
      const b = { x: Math.max(bounds.x, Math.min(bounds.x + bounds.w - width, x - width / 2)), y: Math.max(bounds.y, Math.min(bounds.y + bounds.h - height, y + dy)), w: width, h: height };
      if (!boxes.some(a => b.x < a.x + a.w + 4 && b.x + b.w + 4 > a.x && b.y < a.y + a.h + 3 && b.y + b.h + 3 > a.y)) { boxes.push(b); return b; }
    }
    return null;
  }
  const api = { waterRoute, placeLabel }; root.BunkerNavigation = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
