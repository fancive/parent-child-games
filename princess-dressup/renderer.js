// ==================== RENDERING ====================
// Fixed doll body (skin: head, face, neck, arms, hands, torso, legs, feet).
// Drawn once between the hair-back and shoes layers; every wearable item is
// authored against these anchors. The `.doll-eyes` group blinks via CSS.
const BODY_SVG =
  '<g class="doll-body">' +
  // torso + hips (fully covered by the dress, kept so the neck reads as attached)
  '<path d="M132,212 C127,240 127,272 134,302 L186,302 C193,272 193,240 188,212 C170,205 150,205 132,212 Z" fill="#FFE1C6"/>' +
  // bare legs — only the shins below the hem show; ankles tuck under the shoes
  '<path d="M140,384 C138,410 138,434 141,453 C142,462 155,462 156,453 C158,434 158,410 157,384 C151,380 146,380 140,384 Z" fill="#FFE1C6"/>' +
  '<path d="M180,384 C182,410 182,434 179,453 C178,462 165,462 164,453 C162,434 162,410 163,384 C169,380 174,380 180,384 Z" fill="#FFE1C6"/>' +
  // arms swept outward so the rounded hands peek beyond the skirt silhouette
  '<path d="M130,214 C110,232 92,255 86,278 C81,292 90,306 104,304 C116,302 121,292 117,280 C126,260 140,240 149,222 C144,214 136,210 130,214 Z" fill="#FFE1C6"/>' +
  '<path d="M190,214 C210,232 228,255 234,278 C239,292 230,306 216,304 C204,302 199,292 203,280 C194,260 180,240 171,222 C176,214 184,210 190,214 Z" fill="#FFE1C6"/>' +
  // neck + soft chin shadow
  '<path d="M147,194 C145,203 146,211 153,216 C158,220 162,220 167,216 C174,211 175,203 173,194 Z" fill="#FFE1C6"/>' +
  '<ellipse cx="160" cy="200" rx="15" ry="5" fill="#F6CBA8" opacity="0.55"/>' +
  // round kawaii head (center 160,128)
  '<path d="M160,58 C199,58 230,89 230,128 C230,167 199,198 160,198 C121,198 90,167 90,128 C90,89 121,58 160,58 Z" fill="#FFE1C6"/>' +
  // blush
  '<ellipse cx="118" cy="156" rx="13" ry="8" fill="#F6A8BC" opacity="0.5"/>' +
  '<ellipse cx="202" cy="156" rx="13" ry="8" fill="#F6A8BC" opacity="0.5"/>' +
  // eyes (grouped for the CSS blink squash; anchors 133/187,138)
  '<g class="doll-eyes">' +
  '<ellipse cx="133" cy="138" rx="11.5" ry="15" fill="#5B4A57"/>' +
  '<ellipse cx="187" cy="138" rx="11.5" ry="15" fill="#5B4A57"/>' +
  '<circle cx="129" cy="132" r="5" fill="#FFFFFF"/>' +
  '<circle cx="183" cy="132" r="5" fill="#FFFFFF"/>' +
  '<circle cx="137" cy="144" r="2.6" fill="#FFFFFF"/>' +
  '<circle cx="191" cy="144" r="2.6" fill="#FFFFFF"/>' +
  '</g>' +
  // little nose + smile
  '<ellipse cx="160" cy="154" rx="2.6" ry="2" fill="#F2C1A0" opacity="0.8"/>' +
  '<path d="M151,164 C154,173 166,173 169,164 C165,169 155,169 151,164 Z" fill="#E58AA0"/>' +
  '</g>';

// Look up a wearable item by category key + id (null id → null).
function findItem(cat, id) {
  if (!id) return null;
  const category = PRINCESS_CATEGORIES.find((c) => c.key === cat);
  if (!category) return null;
  return category.items.find((it) => it.id === id) || null;
}

// Assemble the full doll SVG for a given outfit, back-to-front.
function buildDollSvg(outfit) {
  const hair = findItem('hair', outfit.hair);
  const hairAcc = findItem('hairAcc', outfit.hairAcc);
  const dress = findItem('dress', outfit.dress);
  const shoes = findItem('shoes', outfit.shoes);
  const acc = findItem('acc', outfit.acc);
  const wingsBack = acc && acc.layer === 'wingsBack' ? acc.svg : '';
  const accFront = acc && acc.layer === 'accFront' ? acc.svg : '';

  return (
    '<svg class="doll-svg" viewBox="0 0 320 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="小公主">' +
    '<g class="layer-wingsBack">' +
    wingsBack +
    '</g>' +
    '<g class="layer-hairBack">' +
    (hair ? hair.back : '') +
    '</g>' +
    BODY_SVG +
    '<g class="layer-shoes">' +
    (shoes ? shoes.svg : '') +
    '</g>' +
    '<g class="layer-dress">' +
    (dress ? dress.svg : '') +
    '</g>' +
    '<g class="layer-accFront">' +
    accFront +
    '</g>' +
    '<g class="layer-hairFront">' +
    (hair ? hair.front : '') +
    '</g>' +
    '<g class="layer-hairAcc">' +
    (hairAcc ? hairAcc.svg : '') +
    '</g>' +
    '</svg>'
  );
}

function renderDoll(outfit) {
  const el = document.getElementById('doll');
  if (el) el.innerHTML = buildDollSvg(outfit);
}

// ---- Illustrated stage scenes -------------------------------------------
// Each background class maps to a set of absolutely-positioned decor elements
// (flat-kawaii inline SVG + a few emoji movers) layered behind the doll. Some
// carry a slow ambient animation class (defined in styles.css); the master
// prefers-reduced-motion switch stops them all. Kept id-free so nothing can
// collide with the doll's composited item SVGs.
const SCENE_CLOUD =
  '<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg"><g fill="#ffffff">' +
  '<ellipse cx="40" cy="44" rx="26" ry="20"/><ellipse cx="70" cy="37" rx="30" ry="24"/>' +
  '<ellipse cx="97" cy="46" rx="22" ry="17"/><rect x="34" y="44" width="70" height="21" rx="10"/>' +
  '</g></svg>';

const SCENE_CASTLE =
  '<svg viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M34,54 L50,26 L66,54 Z" fill="#B39DE6"/>' +
  '<path d="M154,54 L170,26 L186,54 Z" fill="#B39DE6"/>' +
  '<path d="M92,42 L110,8 L128,42 Z" fill="#B39DE6"/>' +
  '<circle cx="110" cy="12" r="3.4" fill="#FFD24C"/>' +
  '<g fill="#CDBBEE"><rect x="34" y="52" width="32" height="82"/><rect x="154" y="52" width="32" height="82"/>' +
  '<rect x="94" y="40" width="32" height="94"/><rect x="60" y="80" width="100" height="54"/></g>' +
  '<path d="M100,134 L100,106 Q110,95 120,106 L120,134 Z" fill="#B39DE6"/>' +
  '<rect x="45" y="68" width="10" height="14" rx="4" fill="#B39DE6"/>' +
  '<rect x="165" y="68" width="10" height="14" rx="4" fill="#B39DE6"/></svg>';

const SCENE_RAINBOW =
  '<svg viewBox="0 0 200 106" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round">' +
  '<path d="M18,100 A82,82 0 0 1 182,100" stroke="#FF9AA2" stroke-width="11"/>' +
  '<path d="M30,100 A70,70 0 0 1 170,100" stroke="#FFCF9E" stroke-width="11"/>' +
  '<path d="M42,100 A58,58 0 0 1 158,100" stroke="#FFF2A6" stroke-width="11"/>' +
  '<path d="M54,100 A46,46 0 0 1 146,100" stroke="#B9E7B0" stroke-width="11"/>' +
  '<path d="M66,100 A34,34 0 0 1 134,100" stroke="#A9D2F0" stroke-width="11"/>' +
  '<path d="M78,100 A22,22 0 0 1 122,100" stroke="#C9B6EC" stroke-width="11"/></svg>';

const SCENE_SUN =
  '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
  '<g fill="#FFE07A"><rect x="46" y="2" width="8" height="16" rx="4"/><rect x="46" y="82" width="8" height="16" rx="4"/>' +
  '<rect x="82" y="46" width="16" height="8" rx="4"/><rect x="2" y="46" width="16" height="8" rx="4"/>' +
  '<rect x="72" y="14" width="8" height="16" rx="4" transform="rotate(45 76 22)"/>' +
  '<rect x="20" y="70" width="8" height="16" rx="4" transform="rotate(45 24 78)"/>' +
  '<rect x="72" y="70" width="8" height="16" rx="4" transform="rotate(-45 76 78)"/>' +
  '<rect x="20" y="14" width="8" height="16" rx="4" transform="rotate(-45 24 22)"/></g>' +
  '<circle cx="50" cy="50" r="26" fill="#FFD24C"/><circle cx="41" cy="42" r="8" fill="#FFE888"/></svg>';

const SCENE_FLOWERBED =
  '<svg viewBox="0 0 200 74" xmlns="http://www.w3.org/2000/svg">' +
  '<g stroke="#7CCFA6" stroke-width="5" stroke-linecap="round"><path d="M28,72 L28,44"/><path d="M64,72 L64,38"/>' +
  '<path d="M104,72 L104,46"/><path d="M144,72 L144,40"/><path d="M178,72 L178,48"/></g>' +
  '<circle cx="28" cy="38" r="12" fill="#F79AC2"/><circle cx="28" cy="38" r="5" fill="#FFE07A"/>' +
  '<circle cx="64" cy="32" r="13" fill="#B39DE6"/><circle cx="64" cy="32" r="5" fill="#FFE07A"/>' +
  '<circle cx="104" cy="40" r="12" fill="#F0736F"/><circle cx="104" cy="40" r="5" fill="#FFE07A"/>' +
  '<circle cx="144" cy="34" r="13" fill="#FFD24C"/><circle cx="144" cy="34" r="5" fill="#F5A742"/>' +
  '<circle cx="178" cy="42" r="11" fill="#7FC0E8"/><circle cx="178" cy="42" r="5" fill="#FFE07A"/></svg>';

const SCENE_CHANDELIER =
  '<svg viewBox="0 0 120 96" xmlns="http://www.w3.org/2000/svg">' +
  '<rect x="57" y="0" width="6" height="18" rx="3" fill="#E9C868"/>' +
  '<path d="M18,30 Q60,8 102,30 Q102,48 60,54 Q18,48 18,30 Z" fill="#F5D77A"/>' +
  '<path d="M18,30 Q60,20 102,30" stroke="#E9C868" stroke-width="3" fill="none"/>' +
  '<circle cx="30" cy="50" r="6" fill="#FFE9A8"/><circle cx="60" cy="56" r="6" fill="#FFE9A8"/>' +
  '<circle cx="90" cy="50" r="6" fill="#FFE9A8"/>' +
  '<path d="M30,56 L30,74" stroke="#E9C868" stroke-width="2"/><circle cx="30" cy="78" r="5" fill="#FFF3C6"/>' +
  '<path d="M60,62 L60,82" stroke="#E9C868" stroke-width="2"/><circle cx="60" cy="86" r="5" fill="#FFF3C6"/>' +
  '<path d="M90,56 L90,74" stroke="#E9C868" stroke-width="2"/><circle cx="90" cy="78" r="5" fill="#FFF3C6"/></svg>';

function decor(cls, style, inner) {
  return `<span class="decor ${cls}" style="${style}">${inner}</span>`;
}

const STAGE_SCENES = {
  'bg-castle':
    decor('d-scene-hero', 'left:14%;bottom:-2%;width:72%;opacity:.55', SCENE_CASTLE) +
    decor('d-cloud', 'left:6%;top:14%;width:32%;opacity:.9', SCENE_CLOUD) +
    decor('d-cloud d-cloud-slow', 'right:4%;top:30%;width:26%;opacity:.75', SCENE_CLOUD) +
    decor('d-twinkle', 'right:16%;top:9%;font-size:26px', '✨') +
    decor('d-twinkle d-twinkle-b', 'left:12%;top:44%;font-size:20px', '⭐'),
  'bg-garden':
    decor('d-pulse', 'right:8%;top:8%;width:24%', SCENE_SUN) +
    decor('d-scene-hero', 'left:6%;bottom:-1%;width:88%;opacity:.9', SCENE_FLOWERBED) +
    decor('d-flutter', 'left:16%;top:30%;font-size:30px', '🦋') +
    decor('d-flutter d-flutter-b', 'right:20%;top:46%;font-size:24px', '🦋') +
    decor('d-petal', 'left:44%;top:-6%;font-size:20px', '🌸'),
  'bg-ball':
    decor('d-pulse', 'left:34%;top:-3%;width:32%', SCENE_CHANDELIER) +
    decor('d-glow', 'left:6%;bottom:8%;width:40%;height:46%', '') +
    decor('d-glow d-glow-b', 'right:4%;top:20%;width:36%;height:42%', '') +
    decor('d-float', 'left:16%;bottom:2%;font-size:26px', '🎶') +
    decor('d-float d-float-b', 'right:20%;bottom:0%;font-size:22px', '🎵') +
    decor('d-twinkle', 'right:12%;top:12%;font-size:22px', '✨'),
  'bg-rainbow':
    decor('d-scene-hero', 'left:16%;top:6%;width:68%;opacity:.85', SCENE_RAINBOW) +
    decor('d-cloud', 'left:4%;top:40%;width:30%;opacity:.95', SCENE_CLOUD) +
    decor('d-cloud d-cloud-slow', 'right:2%;bottom:20%;width:26%;opacity:.9', SCENE_CLOUD) +
    decor('d-float', 'left:22%;bottom:-4%;font-size:30px', '🎈') +
    decor('d-float d-float-b', 'right:24%;bottom:-6%;font-size:26px', '🎈'),
};

function renderStageBg(bgId) {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const bg = findItem('bg', bgId);
  const cls = bg ? bg.cls : '';
  stage.className = 'stage' + (cls ? ' ' + cls : '');
  const decorBox = document.getElementById('stage-decor');
  if (decorBox && decorBox.dataset.scene !== cls) {
    decorBox.dataset.scene = cls;
    decorBox.innerHTML = STAGE_SCENES[cls] || '';
  }
}

// ==================== WARDROBE ====================
function renderTabs(activeCat) {
  const el = document.getElementById('tabs');
  if (!el) return;
  const frag = document.createDocumentFragment();
  for (const c of PRINCESS_CATEGORIES) {
    const isActive = c.key === activeCat;
    const b = document.createElement('button');
    b.className = 'tab' + (isActive ? ' active' : '');
    b.dataset.cat = c.key;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    b.innerHTML =
      `<span class="tab-emoji" aria-hidden="true">${c.emoji}</span>` +
      `<span class="tab-label">${c.label}</span>`;
    frag.appendChild(b);
  }
  el.innerHTML = '';
  el.appendChild(frag);
}

// Small SVG (or gradient swatch) preview shown inside a tray cell.
function thumbMarkup(cat, item) {
  if (cat === 'bg') {
    return (
      `<span class="bg-swatch" style="background:${item.swatch}">` +
      `<span class="bg-emoji" aria-hidden="true">${item.emoji}</span></span>`
    );
  }
  if (cat === 'hair') {
    return (
      `<svg class="thumb" viewBox="${item.thumbBox}" xmlns="http://www.w3.org/2000/svg">` +
      item.back +
      '<ellipse cx="160" cy="128" rx="60" ry="64" fill="#FFE9D6"/>' +
      item.front +
      '</svg>'
    );
  }
  return `<svg class="thumb" viewBox="${item.thumbBox}" xmlns="http://www.w3.org/2000/svg">${item.svg}</svg>`;
}

function buildItemCell(cat, item, isSel) {
  const b = document.createElement('button');
  b.className = 'cell' + (isSel ? ' selected' : '');
  b.dataset.cell = '1';
  b.dataset.cat = cat;
  b.dataset.id = item.id;
  b.setAttribute('aria-label', item.name);
  b.setAttribute('aria-pressed', isSel ? 'true' : 'false');
  b.innerHTML =
    thumbMarkup(cat, item) +
    (isSel ? '<span class="check" aria-hidden="true">✓</span>' : '') +
    `<span class="cell-name">${item.name}</span>`;
  return b;
}

function buildNoneCell(cat, isSel) {
  const b = document.createElement('button');
  b.className = 'cell none-cell' + (isSel ? ' selected' : '');
  b.dataset.cell = '1';
  b.dataset.cat = cat;
  b.dataset.none = '1';
  b.setAttribute('aria-label', '不戴');
  b.setAttribute('aria-pressed', isSel ? 'true' : 'false');
  b.innerHTML =
    '<span class="none-mark" aria-hidden="true">🚫</span>' +
    (isSel ? '<span class="check" aria-hidden="true">✓</span>' : '') +
    '<span class="cell-name">不戴</span>';
  return b;
}

function renderTray(activeCat, outfit) {
  const el = document.getElementById('tray');
  if (!el) return;
  const category = PRINCESS_CATEGORIES.find((c) => c.key === activeCat);
  if (!category) return;

  const selected = outfit[activeCat];
  const frag = document.createDocumentFragment();
  if (category.optional) {
    frag.appendChild(buildNoneCell(activeCat, selected === null));
  }
  for (const item of category.items) {
    frag.appendChild(buildItemCell(activeCat, item, selected === item.id));
  }
  el.innerHTML = '';
  el.appendChild(frag);
}

// ==================== SCREEN MANAGEMENT ====================
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = document.getElementById(name);
  if (target) target.classList.add('active');
}
