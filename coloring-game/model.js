/* exported ColoringBook */
class ColoringBook {
  constructor(saved = {}) {
    this.pages = {};
    this.histories = {};
    this.futures = {};
    for (const id of ['garden', 'cat', 'rocket', 'blank']) {
      const page = saved?.[id];
      this.pages[id] =
        page && typeof page.fills === 'object' && page.fills !== null && Array.isArray(page.strokes)
          ? {
              fills: Object.fromEntries(
                Object.entries(page.fills).filter(
                  ([key, value]) => /^[a-z0-9-]+$/.test(key) && /^#[0-9a-f]{6}$/i.test(value),
                ),
              ),
              strokes: page.strokes.filter(
                (s) =>
                  s &&
                  /^#[0-9a-f]{6}$/i.test(s.color) &&
                  [6, 14, 26].includes(s.width) &&
                  typeof s.d === 'string' &&
                  /^[ML0-9., -]+$/.test(s.d) &&
                  s.d.length < 100000,
              ),
            }
          : { fills: {}, strokes: [] };
      this.histories[id] = [];
      this.futures[id] = [];
    }
  }
  change(id, update) {
    const before = JSON.stringify(this.pages[id]);
    update(this.pages[id]);
    if (JSON.stringify(this.pages[id]) === before) return false;
    this.histories[id].push(before);
    if (this.histories[id].length > 40) this.histories[id].shift();
    this.futures[id] = [];
    return true;
  }
  undo(id) {
    this.travel(id, this.histories, this.futures);
  }
  redo(id) {
    this.travel(id, this.futures, this.histories);
  }
  travel(id, from, to) {
    if (!from[id].length) return;
    to[id].push(JSON.stringify(this.pages[id]));
    this.pages[id] = JSON.parse(from[id].pop());
  }
}
