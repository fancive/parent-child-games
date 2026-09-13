import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const ColoringBook = vm.runInNewContext(
  `${readFileSync(new URL('../coloring-game/model.js', import.meta.url), 'utf8')}\nColoringBook`,
);
test('page switching keeps each drawing and independent undo history', () => {
  const book = new ColoringBook();
  book.change('garden', (p) => {
    p.fills.sun = '#f5d65b';
  });
  book.change('cat', (p) => {
    p.fills.head = '#ef6b70';
  });
  book.undo('garden');
  assert.equal(book.pages.garden.fills.sun, undefined);
  assert.equal(book.pages.cat.fills.head, '#ef6b70');
  book.redo('garden');
  assert.equal(book.pages.garden.fills.sun, '#f5d65b');
});
test('clear is reversible and a new drawing discards only redo', () => {
  const book = new ColoringBook();
  book.change('blank', (p) => p.strokes.push({ color: '#ef6b70', width: 14, d: 'M1 2 L3 4' }));
  book.change('blank', (p) => {
    p.strokes = [];
  });
  book.undo('blank');
  assert.equal(book.pages.blank.strokes.length, 1);
  book.change('blank', (p) => p.strokes.push({ color: '#ef6b70', width: 6, d: 'M4 5 L8 9' }));
  book.redo('blank');
  assert.equal(book.pages.blank.strokes.length, 2);
});
test('reload restores fills and strokes, but rejects corrupt entries', () => {
  const book = new ColoringBook({
    garden: {
      fills: { sun: '#f5d65b', bad: 'url(external)' },
      strokes: [
        null,
        { color: '#ef6b70', width: 14, d: 'M1 2 L3 4' },
        { color: '#ef6b70', width: 14, d: '<script>' },
      ],
    },
  });
  assert.equal(book.pages.garden.fills.sun, '#f5d65b');
  assert.equal(book.pages.garden.fills.bad, undefined);
  assert.equal(book.pages.garden.strokes.length, 1);
  const restored = new ColoringBook(JSON.parse(JSON.stringify(book.pages)));
  assert.equal(JSON.stringify(restored.pages), JSON.stringify(book.pages));
  assert.doesNotThrow(() => new ColoringBook(null));
  assert.doesNotThrow(() => new ColoringBook({ cat: { fills: null, strokes: [] } }));
});
test('repeated same color does not consume undo; history stays bounded', () => {
  const book = new ColoringBook();
  book.change('garden', (p) => {
    p.fills.sun = '#f5d65b';
  });
  assert.equal(
    book.change('garden', (p) => {
      p.fills.sun = '#f5d65b';
    }),
    false,
  );
  assert.equal(book.histories.garden.length, 1);
  for (let i = 0; i < 100; i++)
    book.change('garden', (p) => {
      p.fills.sun = i % 2 ? '#ffffff' : '#ef6b70';
    });
  assert.equal(book.histories.garden.length, 40);
});
