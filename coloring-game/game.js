/* global ColoringBook */
(() => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.querySelector('#drawing');
  const status = document.querySelector('#save-status');
  const colors = [
    ['珊瑚红', '#ef6b70'],
    ['橘子橙', '#f5a34d'],
    ['太阳黄', '#f5d65b'],
    ['嫩芽绿', '#a5cc65'],
    ['森林绿', '#55a888'],
    ['天空蓝', '#79c8e6'],
    ['海洋蓝', '#628edd'],
    ['葡萄紫', '#a28ad2'],
    ['樱花粉', '#f2b6cf'],
    ['可可棕', '#ad8064'],
    ['石墨灰', '#52616b'],
    ['云朵白', '#ffffff'],
  ];
  const pages = [
    ['garden', '🌷', '小花园', '花园里的好朋友'],
    ['cat', '🐱', '小猫咪', '小猫的午后时光'],
    ['rocket', '🚀', '小火箭', '去星星家做客'],
    ['blank', '✏️', '自由画', '这里装着你的想象'],
  ];
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem('pcg-coloring-v1') || '{}');
  } catch {
    status.textContent = '暂时无法读取作品，可以继续画';
  }
  const book = new ColoringBook(saved);
  let pageId = 'garden';
  let color = colors[0][1];
  let tool = 'fill';
  let active = null;
  function element(tag, attrs = {}) {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  function shape(tag, attrs, id, name) {
    const node = element(tag, {
      ...attrs,
      stroke: '#52616b',
      'stroke-width': 4,
      'stroke-linejoin': 'round',
      fill: id ? book.pages[pageId].fills[id] || '#ffffff' : 'none',
    });
    if (id) {
      node.dataset.region = id;
      node.setAttribute('tabindex', '0');
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', name);
      node.addEventListener('click', () => fill(id));
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fill(id);
        }
      });
    }
    svg.append(node);
  }
  function fill(id) {
    if (tool === 'brush') return;
    if (
      book.change(pageId, (p) => {
        p.fills[id] = tool === 'erase' ? '#ffffff' : color;
      })
    ) {
      svg.querySelector(`[data-region="${id}"]`).setAttribute('fill', book.pages[pageId].fills[id]);
      save();
    }
  }
  function render() {
    svg.replaceChildren(element('rect', { width: 720, height: 520, fill: '#ffffff' }));
    if (pageId === 'garden') {
      shape(
        'path',
        { d: 'M35 438 Q180 357 340 435 Q535 364 685 440 L685 495 L35 495 Z' },
        'grass',
        '草地',
      );
      shape('circle', { cx: 591, cy: 96, r: 46 }, 'sun', '太阳');
      shape(
        'path',
        {
          d: 'M73 107 C48 73 87 42 116 61 C131 17 190 34 193 67 C247 54 265 114 223 127 L93 127 Q73 127 73 107Z',
        },
        'cloud',
        '云朵',
      );
      shape('path', { d: 'M258 420 L258 266 M462 419 L462 245' });
      shape('path', { d: 'M256 363 Q174 359 174 306 Q255 306 256 363Z' }, 'leaf-left', '左边叶子');
      shape('path', { d: 'M463 343 Q544 338 544 291 Q466 287 463 343Z' }, 'leaf-right', '右边叶子');
      for (const [x, y, prefix] of [
        [258, 233, 'flower'],
        [462, 221, 'little'],
      ]) {
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          shape(
            'ellipse',
            { cx: x + Math.sin(a) * 43, cy: y + Math.cos(a) * 43, rx: 29, ry: 31 },
            `${prefix}-${i}`,
            `花瓣 ${i + 1}`,
          );
        }
        shape('circle', { cx: x, cy: y, r: 30 }, `${prefix}-center`, '花心');
        shape('path', { d: `M${x - 12} ${y + 6} Q${x} ${y + 20} ${x + 12} ${y + 6}` });
      }
    } else if (pageId === 'cat') {
      shape('ellipse', { cx: 360, cy: 454, rx: 215, ry: 35 }, 'rug', '小地毯');
      shape(
        'path',
        { d: 'M433 393 C580 447 586 298 539 308 C498 321 558 362 438 357 Z' },
        'tail',
        '猫尾巴',
      );
      shape('ellipse', { cx: 356, cy: 348, rx: 103, ry: 112 }, 'body', '猫咪身体');
      shape(
        'path',
        {
          d: 'M245 201 L240 83 L321 143 Q357 130 391 143 L475 83 L466 208 C510 349 207 344 245 201Z',
        },
        'head',
        '猫咪脑袋',
      );
      shape('path', { d: 'M259 116 L267 185 L303 155 Z' }, 'ear-left', '左耳朵');
      shape('path', { d: 'M455 116 L444 185 L409 155 Z' }, 'ear-right', '右耳朵');
      shape('ellipse', { cx: 319, cy: 432, rx: 40, ry: 24 }, 'paw-left', '左爪爪');
      shape('ellipse', { cx: 399, cy: 432, rx: 40, ry: 24 }, 'paw-right', '右爪爪');
      shape('path', {
        d: 'M300 235 Q314 212 328 235 M387 235 Q401 212 415 235 M345 259 L367 259 L356 270Z M356 270 Q339 289 327 271 M356 270 Q373 289 386 271 M287 255 L219 242 M287 270 L215 277 M426 255 L492 242 M426 270 L495 277',
      });
      shape('circle', { cx: 159, cy: 389, r: 37 }, 'ball', '毛线球');
      shape('path', { d: 'M139 358 Q187 383 151 425 M124 386 Q160 366 190 398' });
    } else if (pageId === 'rocket') {
      shape('circle', { cx: 140, cy: 140, r: 59 }, 'planet', '小行星');
      shape(
        'ellipse',
        { cx: 140, cy: 140, rx: 91, ry: 21, transform: 'rotate(-25 140 140)' },
        'ring',
        '行星光环',
      );
      shape('path', { d: 'M310 353 Q293 430 359 485 Q423 430 407 353Z' }, 'flame', '火箭火焰');
      shape('path', { d: 'M308 269 Q235 298 241 389 L313 358Z' }, 'fin-left', '左翅膀');
      shape('path', { d: 'M410 269 Q482 298 477 389 L407 358Z' }, 'fin-right', '右翅膀');
      shape('path', { d: 'M303 350 Q275 171 360 64 Q445 171 417 350Z' }, 'ship', '火箭船身');
      shape('path', { d: 'M310 156 Q324 107 360 64 Q397 109 410 156Z' }, 'nose', '火箭尖尖');
      shape('circle', { cx: 360, cy: 222, r: 39 }, 'window', '圆圆窗户');
      for (const [x, y, id] of [
        [572, 89, 'star-one'],
        [565, 300, 'star-two'],
        [141, 353, 'star-three'],
      ])
        shape(
          'path',
          { d: `M${x} ${y - 30} l9 20 23 3 -17 16 4 23 -19 -11 -20 11 4 -23 -17 -16 24 -3Z` },
          id,
          '小星星',
        );
    }
    const strokes = element('g', { id: 'strokes', 'pointer-events': 'none' });
    for (const stroke of book.pages[pageId].strokes) strokes.append(strokeNode(stroke));
    svg.append(strokes);
    updateButtons();
  }
  function strokeNode(s) {
    return element('path', {
      d: s.d,
      stroke: s.color,
      'stroke-width': s.width,
      fill: 'none',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
  }
  function updateButtons() {
    document.querySelector('#undo').disabled = !book.histories[pageId].length;
    document.querySelector('#redo').disabled = !book.futures[pageId].length;
  }
  function save() {
    updateButtons();
    try {
      localStorage.setItem('pcg-coloring-v1', JSON.stringify(book.pages));
      status.textContent = '✓ 已自动保存';
    } catch {
      status.textContent = '保存空间不足，请点“保存图片”留住作品';
    }
  }
  function selectTool(next) {
    finish();
    tool = next;
    document
      .querySelectorAll('[data-tool]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
    document.querySelector('#hint').textContent =
      tool === 'fill'
        ? '先选一支蜡笔，再点点画里的空白，颜色就住进去啦。'
        : tool === 'brush'
          ? '按住画纸画一画，试试画出自己的小故事。'
          : '点图案擦掉颜色；点画过的线，可以擦掉整笔。';
    svg.style.cursor = tool === 'brush' ? 'crosshair' : 'pointer';
    svg
      .querySelector('#strokes')
      .setAttribute('pointer-events', tool === 'erase' ? 'stroke' : 'none');
  }
  function point(e) {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const result = p.matrixTransform(svg.getScreenCTM().inverse());
    return `${Math.max(0, Math.min(720, result.x)).toFixed(1)} ${Math.max(0, Math.min(520, result.y)).toFixed(1)}`;
  }
  svg.addEventListener('pointerdown', (e) => {
    if (active || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (tool === 'erase' && e.target.parentNode?.id === 'strokes') {
      const index = Array.from(e.target.parentNode.children).indexOf(e.target);
      book.change(pageId, (p) => p.strokes.splice(index, 1));
      render();
      selectTool(tool);
      save();
      return;
    }
    if (tool !== 'brush') return;
    e.preventDefault();
    svg.setPointerCapture(e.pointerId);
    const pos = point(e);
    const stroke = {
      color,
      width: Number(document.querySelector('#size').value),
      d: `M${pos} L${pos}`,
    };
    active = { id: e.pointerId, stroke, node: strokeNode(stroke) };
    svg.querySelector('#strokes').append(active.node);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!active || active.id !== e.pointerId) return;
    if (active.stroke.d.length >= 99000) {
      finish();
      return;
    }
    active.stroke.d += ` L${point(e)}`;
    active.node.setAttribute('d', active.stroke.d);
  });
  function finish(e) {
    if (!active || (e && e.pointerId !== active.id)) return;
    const completed = active;
    active = null;
    book.change(pageId, (p) => {
      p.strokes.push(completed.stroke);
    });
    if (svg.hasPointerCapture(completed.id)) svg.releasePointerCapture(completed.id);
    save();
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) =>
    svg.addEventListener(name, finish),
  );
  window.addEventListener('pagehide', () => finish());
  for (const [id, emoji, label, title] of pages) {
    const button = document.createElement('button');
    button.innerHTML = `<span aria-hidden="true">${emoji}</span>${label}`;
    button.setAttribute('aria-pressed', String(id === pageId));
    button.addEventListener('click', () => {
      finish();
      pageId = id;
      document
        .querySelectorAll('#pages button')
        .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      document.querySelector('#page-title').textContent = title;
      render();
      selectTool(id === 'blank' ? 'brush' : 'fill');
    });
    document.querySelector('#pages').append(button);
  }
  for (const [name, hex] of colors) {
    const button = document.createElement('button');
    button.style.setProperty('--color', hex);
    button.setAttribute('aria-label', name);
    button.setAttribute('aria-pressed', String(hex === color));
    button.addEventListener('click', () => {
      color = hex;
      document
        .querySelectorAll('#colors button')
        .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      document.querySelector('#color-name').textContent = `正在用：${name}`;
      if (tool === 'erase') selectTool(pageId === 'blank' ? 'brush' : 'fill');
    });
    document.querySelector('#colors').append(button);
  }
  document
    .querySelectorAll('[data-tool]')
    .forEach((b) => b.addEventListener('click', () => selectTool(b.dataset.tool)));
  for (const action of ['undo', 'redo'])
    document.querySelector(`#${action}`).addEventListener('click', () => {
      finish();
      book[action](pageId);
      render();
      selectTool(tool);
      save();
    });
  const dialog = document.querySelector('#clear-dialog');
  document.querySelector('#clear').addEventListener('click', () => {
    finish();
    dialog.showModal();
  });
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'clear') {
      book.change(pageId, (p) => {
        p.fills = {};
        p.strokes = [];
      });
      render();
      selectTool(tool);
      save();
    }
  });
  document.querySelector('#download').addEventListener('click', () => {
    finish();
    const copy = svg.cloneNode(true);
    copy.setAttribute('width', '1440');
    copy.setAttribute('height', '1040');
    const picture = document.createElement('img');
    picture.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1440;
        canvas.height = 1040;
        canvas.getContext('2d').drawImage(picture, 0, 0);
        const link = document.createElement('a');
        link.download = `小小画室-${pages.find((p) => p[0] === pageId)[2]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        status.textContent = '图片已生成，请在下载中查看';
      } catch {
        status.textContent = '图片没有保存成功，请再试一次';
      }
    };
    picture.onerror = () => {
      status.textContent = '图片没有生成成功，请再试一次';
    };
    picture.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(copy.outerHTML)}`;
  });
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
})();
