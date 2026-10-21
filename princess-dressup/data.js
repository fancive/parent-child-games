// ==================== PRINCESS DRESS-UP DATA ====================
// All wearable items are SVG fragments drawn in the shared doll coordinate
// system: viewBox="0 0 320 520". Anchors (kept consistent across every item):
//   head circle center (160,128) r~68 · eyes (133,138)/(187,138)
//   torso y~214-300 · dress hem y~400 · legs to y~455 · shoes y~450-485
//   hair accessory top-of-head (160,68) · necklace (160,222)
//   wand in right hand (238,290) · bag hung near (78,300)
// Hair splits into `back` (behind head/body) and `front` (bangs, above face).
// `thumbBox` frames the item region for the wardrobe tray thumbnail.

const HAIR_THUMB = '58 28 204 340';

// ----- HAIR (mandatory, 5) -----
const PRINCESS_HAIR = [
  {
    id: 'h_twin',
    name: '双马尾',
    thumbBox: '50 46 220 220',
    back: '<path d="M160,48 C110,48 76,82 76,126 C76,150 84,166 98,170 C122,174 198,174 222,170 C236,166 244,150 244,126 C244,82 210,48 160,48 Z" fill="#A9754F"/><path d="M104,86 C82,88 66,106 62,134 C58,162 60,196 70,228 C76,248 74,268 84,278 C94,286 104,278 104,264 C104,248 96,236 98,214 C100,180 104,140 118,110 C122,96 118,82 104,86 Z" fill="#A9754F"/><path d="M216,86 C238,88 254,106 258,134 C262,162 260,196 250,228 C244,248 246,268 236,278 C226,286 216,278 216,264 C216,248 224,236 222,214 C220,180 216,140 202,110 C198,96 202,82 216,86 Z" fill="#A9754F"/><path d="M80,120 C72,152 74,200 84,238 C86,238 88,236 88,232 C80,196 78,152 86,124 C86,120 82,118 80,120 Z" fill="#CB9A72"/><path d="M240,120 C248,152 246,200 236,238 C234,238 232,236 232,232 C240,196 242,152 234,124 C234,120 238,118 240,120 Z" fill="#CB9A72"/>',
    front:
      '<path d="M94,118 C90,88 108,58 140,52 C150,50 170,50 180,52 C212,58 230,88 226,118 C222,124 216,126 210,124 C202,126 196,118 188,124 C182,126 176,118 168,124 C164,120 156,120 152,124 C146,126 138,118 132,124 C124,126 118,118 110,124 C104,126 98,124 94,118 Z" fill="#A9754F"/><path d="M116,64 C106,78 102,96 108,116 C112,116 116,114 116,110 C110,96 112,80 126,68 C124,63 119,62 116,64 Z" fill="#CB9A72"/><ellipse cx="103" cy="98" rx="7" ry="5" fill="#F08FB2"/><ellipse cx="117" cy="98" rx="7" ry="5" fill="#F08FB2"/><circle cx="110" cy="98" r="4" fill="#E36BA3"/><ellipse cx="203" cy="98" rx="7" ry="5" fill="#F08FB2"/><ellipse cx="217" cy="98" rx="7" ry="5" fill="#F08FB2"/><circle cx="210" cy="98" r="4" fill="#E36BA3"/>',
  },
  {
    id: 'h_long',
    name: '长直发',
    thumbBox: HAIR_THUMB,
    back: '<path d="M88,120 Q84,54 160,48 Q236,54 232,120 Q236,240 224,360 Q220,388 206,392 Q200,300 200,150 Q160,150 120,150 Q120,300 114,392 Q100,388 96,360 Q84,240 88,120 Z" fill="#2E2A33"/><path d="M104,130 Q98,250 112,350" stroke="#4A4550" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.55"/><path d="M216,130 Q222,250 208,350" stroke="#4A4550" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.55"/>',
    front:
      '<path d="M96,120 Q94,64 160,58 Q226,64 224,120 Q224,102 210,104 L210,122 Q196,106 182,112 L182,124 Q170,106 160,108 Q150,106 138,124 L138,112 Q124,106 110,122 L110,104 Q96,102 96,120 Z" fill="#2E2A33"/><path d="M116,92 Q160,80 204,92" stroke="#4A4550" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.55"/>',
  },
  {
    id: 'h_curl',
    name: '金色卷发',
    thumbBox: HAIR_THUMB,
    back: '<path d="M86,140 Q78,60 160,50 Q242,60 234,140 Q246,166 232,192 Q238,212 220,218 Q226,198 208,196 Q214,176 196,178 Q160,192 124,178 Q106,176 112,196 Q94,198 100,218 Q82,212 88,192 Q74,166 86,140 Z" fill="#F0C24B"/><circle cx="96" cy="150" r="8" fill="#FBDD8A" opacity="0.6"/><circle cx="224" cy="150" r="8" fill="#FBDD8A" opacity="0.6"/><circle cx="104" cy="196" r="7" fill="#FBDD8A" opacity="0.5"/><circle cx="216" cy="196" r="7" fill="#FBDD8A" opacity="0.5"/>',
    front:
      '<path d="M96,122 Q92,64 160,58 Q228,64 224,122 Q214,108 206,116 Q210,94 190,100 Q186,82 168,92 Q160,78 152,92 Q134,82 130,100 Q110,94 114,116 Q106,108 96,122 Z" fill="#F0C24B"/><circle cx="122" cy="100" r="6" fill="#FBDD8A" opacity="0.6"/><circle cx="198" cy="100" r="6" fill="#FBDD8A" opacity="0.6"/><circle cx="160" cy="86" r="6" fill="#FBDD8A" opacity="0.6"/>',
  },
  {
    id: 'h_bun',
    name: '丸子头',
    thumbBox: HAIR_THUMB,
    back: '<path d="M92,134 Q88,60 160,54 Q232,60 228,134 Q230,158 220,176 L100,176 Q90,158 92,134 Z" fill="#6E4A2E"/><path d="M118,176 Q160,196 202,176 Q206,210 188,224 L132,224 Q114,210 118,176 Z" fill="#6E4A2E"/>',
    front:
      '<ellipse cx="160" cy="54" rx="30" ry="26" fill="#6E4A2E"/><ellipse cx="160" cy="80" rx="20" ry="9" fill="#543722"/><path d="M148,46 Q160,40 172,46" stroke="#8A6440" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M98,120 Q96,70 160,64 Q224,70 222,120 Q206,100 176,104 Q168,86 150,92 Q120,92 110,110 Q102,110 98,120 Z" fill="#6E4A2E"/>',
  },
  {
    id: 'h_short',
    name: '粉色短发',
    thumbBox: HAIR_THUMB,
    back: '<path d="M90,128 Q86,58 160,50 Q234,58 230,128 Q234,180 220,210 Q212,190 206,150 Q160,168 114,150 Q108,190 100,210 Q86,180 90,128 Z" fill="#F49BC1"/>',
    front:
      '<path d="M94,126 Q92,64 160,58 Q228,64 226,126 Q210,102 190,108 Q176,88 160,92 Q144,88 130,108 Q110,102 94,126 Z" fill="#F49BC1"/><path d="M120,86 Q160,74 200,86" stroke="#FBC3DB" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>',
  },
];

// ----- HAIR ACCESSORY (optional, 4) -----
const PRINCESS_HAIRACC = [
  {
    id: 'ha_crown',
    name: '小皇冠',
    thumbBox: '120 42 80 58',
    svg: '<path d="M130,84 Q160,92 190,84 Q188,89 160,90 Q132,89 130,84 Z" fill="#E3A836"/><path d="M130,84 Q131,64 139,60 Q145,70 150,75 Q152,54 160,52 Q168,54 170,75 Q175,70 181,60 Q189,64 190,84 Q184,89 160,89 Q136,89 130,84 Z" fill="#F5C43F"/><ellipse cx="140" cy="70" rx="2.4" ry="3.4" fill="#FBE08A" opacity="0.9"/><circle cx="160" cy="66" r="3.6" fill="#F49AB8"/><circle cx="145" cy="74" r="2.8" fill="#7FC0E8"/><circle cx="175" cy="74" r="2.8" fill="#7FC0E8"/><circle cx="160" cy="82" r="2.6" fill="#F49AB8"/><path d="M160,48 Q161,52 165,53 Q161,54 160,58 Q159,54 155,53 Q159,52 160,48 Z" fill="#FFF6D8"/>',
  },
  {
    id: 'ha_bow',
    name: '蝴蝶结',
    thumbBox: '120 46 80 42',
    svg: '<path d="M160,66 Q131,49 125,66 Q131,83 160,71 Z" fill="#EF6F6F"/><path d="M160,66 Q189,49 195,66 Q189,83 160,71 Z" fill="#EF6F6F"/><path d="M154,60 Q150,68 156,78 L164,78 Q170,68 166,60 Z" fill="#D9504C"/><circle cx="160" cy="68" r="6" fill="#D9504C"/>',
  },
  {
    id: 'ha_flower',
    name: '小红花',
    thumbBox: '184 84 44 44',
    svg: '<circle cx="204" cy="92" r="6" fill="#F79AC2"/><circle cx="216" cy="100" r="6" fill="#F79AC2"/><circle cx="211" cy="114" r="6" fill="#F79AC2"/><circle cx="197" cy="114" r="6" fill="#F79AC2"/><circle cx="192" cy="100" r="6" fill="#F79AC2"/><circle cx="204" cy="104" r="5" fill="#FFE07A"/>',
  },
  {
    id: 'ha_star',
    name: '星星发卡',
    thumbBox: '96 86 40 40',
    svg: '<path d="M116,90 L120,102 L133,103 L123,111 L127,123 L116,115 L105,123 L109,111 L99,103 L112,102 Z" fill="#FFD24C" stroke="#E0A828" stroke-width="1.5" stroke-linejoin="round"/>',
  },
];

// ----- DRESS (mandatory, 6) -----
const DRESS_THUMB = '56 208 208 216';
const PRINCESS_DRESS = [
  {
    id: 'd_pink',
    name: '粉色公主裙',
    thumbBox: '60 200 200 214',
    svg: '<path d="M136,248 C116,252 106,300 94,342 C86,366 78,386 76,400 C86,408 98,405 108,399 C118,407 128,401 137,406 C146,412 153,404 160,406 C167,404 174,412 183,406 C192,401 202,407 212,399 C222,405 234,408 244,400 C242,386 234,366 226,342 C214,300 204,252 184,248 C168,244 152,244 136,248 Z" fill="#EC85AE"/><path d="M138,250 C122,254 113,298 104,334 C99,352 90,368 86,378 C98,385 110,381 122,377 C131,383 141,379 150,383 C157,387 164,379 172,383 C182,379 194,383 206,377 C218,381 230,385 234,378 C230,368 222,352 216,334 C207,298 198,254 182,250 C168,246 152,246 138,250 Z" fill="#F6A9CC"/><path d="M142,252 C130,256 121,290 113,318 C109,334 100,348 96,356 C108,362 120,358 132,356 C140,360 150,356 160,358 C170,356 180,360 188,356 C200,358 212,362 224,356 C220,348 211,334 207,318 C199,290 190,256 178,252 C166,248 154,248 142,252 Z" fill="#FCD3E3"/><ellipse cx="92" cy="404" rx="13" ry="9" fill="#FFF2F8"/><ellipse cx="116" cy="407" rx="13" ry="9" fill="#FFF2F8"/><ellipse cx="140" cy="408" rx="13" ry="9" fill="#FFF2F8"/><ellipse cx="164" cy="408" rx="13" ry="9" fill="#FFF2F8"/><ellipse cx="188" cy="407" rx="13" ry="9" fill="#FFF2F8"/><ellipse cx="212" cy="405" rx="13" ry="9" fill="#FFF2F8"/><ellipse cx="234" cy="402" rx="13" ry="9" fill="#FFF2F8"/><circle cx="120" cy="322" r="3" fill="#FFFFFF" opacity="0.7"/><circle cx="152" cy="342" r="3" fill="#FFFFFF" opacity="0.7"/><circle cx="184" cy="322" r="3" fill="#FFFFFF" opacity="0.7"/><circle cx="134" cy="368" r="3" fill="#FFFFFF" opacity="0.7"/><circle cx="176" cy="366" r="3" fill="#FFFFFF" opacity="0.7"/><path d="M110,348 Q111,353 116,354 Q111,355 110,360 Q109,355 104,354 Q109,353 110,348 Z" fill="#FFFFFF" opacity="0.92"/><path d="M210,348 Q211,353 216,354 Q211,355 210,360 Q209,355 204,354 Q209,353 210,348 Z" fill="#FFFFFF" opacity="0.92"/><path d="M160,384 Q161,389 166,390 Q161,391 160,396 Q159,391 154,390 Q159,389 160,384 Z" fill="#FFFFFF" opacity="0.92"/><path d="M128,300 C126,296 121,297 121,301 C121,305 128,309 128,309 C128,309 135,305 135,301 C135,297 130,296 128,300 Z" fill="#FFFFFF" opacity="0.85"/><path d="M192,300 C190,296 185,297 185,301 C185,305 192,309 192,309 C192,309 199,305 199,301 C199,297 194,296 192,300 Z" fill="#FFFFFF" opacity="0.85"/><path d="M132,214 C132,206 140,204 150,206 C155,214 165,214 170,206 C180,204 188,206 188,214 C190,230 189,244 185,254 C176,260 144,260 135,254 C131,244 130,230 132,214 Z" fill="#E981AC"/><path d="M138,210 C146,208 154,214 160,214 C166,214 174,208 182,210" stroke="#FBC5DC" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M116,206 C104,208 96,220 100,232 C104,242 118,244 126,236 C132,228 132,214 126,208 C123,205 119,205 116,206 Z" fill="#F6A9CC"/><path d="M204,206 C216,208 224,220 220,232 C216,242 202,244 194,236 C188,228 188,214 194,208 C197,205 201,205 204,206 Z" fill="#F6A9CC"/><path d="M158,250 C146,242 132,244 130,254 C132,264 146,262 158,256 Z" fill="#E36BA3"/><path d="M162,250 C174,242 188,244 190,254 C188,264 174,262 162,256 Z" fill="#E36BA3"/><path d="M156,257 C152,270 150,282 156,288 C160,284 160,270 160,260 Z" fill="#E36BA3"/><path d="M164,257 C168,270 170,282 164,288 C160,284 160,270 160,260 Z" fill="#E36BA3"/><ellipse cx="160" cy="253" rx="6" ry="9" fill="#C9538A"/>',
  },
  {
    id: 'd_ice',
    name: '冰雪蓝纱裙',
    thumbBox: DRESS_THUMB,
    svg: '<ellipse cx="126" cy="228" rx="13" ry="11" fill="#A9DCF5"/><ellipse cx="194" cy="228" rx="13" ry="11" fill="#A9DCF5"/><path d="M134,296 Q112,340 92,404 Q160,420 228,404 Q208,340 186,296 Q160,306 134,296 Z" fill="#A9DCF5"/><path d="M108,344 Q160,366 212,344 Q206,362 198,372 Q160,386 122,372 Q114,362 108,344 Z" fill="#E4F5FF" opacity="0.85"/><path d="M96,378 Q160,402 224,378 Q218,396 210,406 Q160,420 110,406 Q102,396 96,378 Z" fill="#E4F5FF" opacity="0.85"/><path d="M136,222 Q160,214 184,222 L188,300 Q160,312 132,300 Z" fill="#A9DCF5"/><path d="M138,225 Q160,237 182,225" stroke="#E4F5FF" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="128" y="296" width="64" height="10" rx="5" fill="#7FC0E8"/><circle cx="140" cy="330" r="3" fill="#FFFFFF"/><circle cx="180" cy="336" r="3" fill="#FFFFFF"/><circle cx="160" cy="356" r="3" fill="#FFFFFF"/><circle cx="126" cy="388" r="3" fill="#FFFFFF"/><circle cx="196" cy="390" r="3" fill="#FFFFFF"/>',
  },
  {
    id: 'd_daisy',
    name: '黄色小雏菊裙',
    thumbBox: DRESS_THUMB,
    svg: '<ellipse cx="126" cy="228" rx="13" ry="11" fill="#FFE07A"/><ellipse cx="194" cy="228" rx="13" ry="11" fill="#FFE07A"/><path d="M134,296 Q110,342 90,404 Q160,420 230,404 Q210,342 186,296 Q160,306 134,296 Z" fill="#FFE07A"/><path d="M90,404 Q160,420 230,404 L228,413 Q160,429 92,413 Z" fill="#F5C542"/><path d="M136,222 Q160,214 184,222 L188,300 Q160,312 132,300 Z" fill="#FFE07A"/><rect x="128" y="296" width="64" height="10" rx="5" fill="#F5C542"/><circle cx="128" cy="342" r="4" fill="#fff"/><circle cx="136" cy="348" r="4" fill="#fff"/><circle cx="133" cy="357" r="4" fill="#fff"/><circle cx="123" cy="357" r="4" fill="#fff"/><circle cx="120" cy="348" r="4" fill="#fff"/><circle cx="128" cy="350" r="3.5" fill="#F5C542"/><circle cx="184" cy="336" r="4" fill="#fff"/><circle cx="192" cy="342" r="4" fill="#fff"/><circle cx="189" cy="351" r="4" fill="#fff"/><circle cx="179" cy="351" r="4" fill="#fff"/><circle cx="176" cy="342" r="4" fill="#fff"/><circle cx="184" cy="344" r="3.5" fill="#F5C542"/><circle cx="158" cy="380" r="4" fill="#fff"/><circle cx="166" cy="386" r="4" fill="#fff"/><circle cx="163" cy="395" r="4" fill="#fff"/><circle cx="153" cy="395" r="4" fill="#fff"/><circle cx="150" cy="386" r="4" fill="#fff"/><circle cx="158" cy="388" r="3.5" fill="#F5C542"/>',
  },
  {
    id: 'd_star',
    name: '紫色星空裙',
    thumbBox: DRESS_THUMB,
    svg: '<ellipse cx="126" cy="228" rx="13" ry="11" fill="#B39DE6"/><ellipse cx="194" cy="228" rx="13" ry="11" fill="#B39DE6"/><path d="M134,296 Q108,344 86,398 Q104,410 120,398 Q140,412 160,400 Q180,412 200,398 Q216,410 234,398 Q212,344 186,296 Q160,306 134,296 Z" fill="#B39DE6"/><path d="M136,222 Q160,214 184,222 L188,300 Q160,312 132,300 Z" fill="#B39DE6"/><rect x="128" y="296" width="64" height="10" rx="5" fill="#8E77D1"/><path d="M128,337 L130,343 L136,343 L131,347 L133,353 L128,349 L123,353 L125,347 L120,343 L126,343 Z" fill="#FFF3B0"/><path d="M180,325 L182,331 L188,331 L183,335 L185,341 L180,337 L175,341 L177,335 L172,331 L178,331 Z" fill="#FFF3B0"/><path d="M150,371 L152,377 L158,377 L153,381 L155,387 L150,383 L145,387 L147,381 L142,377 L148,377 Z" fill="#FFF3B0"/><path d="M200,361 L202,367 L208,367 L203,371 L205,377 L200,373 L195,377 L197,371 L192,367 L198,367 Z" fill="#FFF3B0"/>',
  },
  {
    id: 'd_red',
    name: '红色蓬蓬裙',
    thumbBox: DRESS_THUMB,
    svg: '<ellipse cx="126" cy="228" rx="15" ry="13" fill="#F0736F"/><ellipse cx="194" cy="228" rx="15" ry="13" fill="#F0736F"/><path d="M134,292 Q106,300 86,356 Q74,388 68,406 Q160,424 252,406 Q246,388 234,356 Q214,300 186,292 Q160,304 134,292 Z" fill="#F0736F"/><path d="M68,406 Q86,397 102,406 Q120,397 136,406 Q154,397 170,406 Q188,397 204,406 Q222,397 238,406 Q248,401 252,406 L252,416 Q160,432 68,416 Z" fill="#D9504C"/><path d="M136,222 Q160,214 184,222 L188,300 Q160,312 132,300 Z" fill="#F0736F"/><rect x="128" y="296" width="64" height="12" rx="6" fill="#D9504C"/><circle cx="118" cy="350" r="3" fill="#FFB3AE"/><circle cx="160" cy="362" r="3" fill="#FFB3AE"/><circle cx="202" cy="350" r="3" fill="#FFB3AE"/><circle cx="138" cy="388" r="3" fill="#FFB3AE"/><circle cx="182" cy="388" r="3" fill="#FFB3AE"/>',
  },
  {
    id: 'd_mint',
    name: '薄荷绿花边裙',
    thumbBox: DRESS_THUMB,
    svg: '<ellipse cx="126" cy="228" rx="13" ry="11" fill="#A9E6C8"/><ellipse cx="194" cy="228" rx="13" ry="11" fill="#A9E6C8"/><path d="M134,296 Q112,342 92,402 Q160,418 228,402 Q208,342 186,296 Q160,306 134,296 Z" fill="#A9E6C8"/><path d="M92,402 Q104,414 116,402 Q128,414 140,402 Q152,414 164,402 Q176,414 188,402 Q200,414 212,402 Q220,409 228,402 L226,411 Q160,425 94,411 Z" fill="#E0FFF0"/><path d="M136,222 Q160,214 184,222 L188,300 Q160,312 132,300 Z" fill="#A9E6C8"/><rect x="128" y="296" width="64" height="10" rx="5" fill="#7CCFA6"/><circle cx="132" cy="339" r="3.5" fill="#F79AC2"/><circle cx="137" cy="343" r="3.5" fill="#F79AC2"/><circle cx="135" cy="349" r="3.5" fill="#F79AC2"/><circle cx="129" cy="349" r="3.5" fill="#F79AC2"/><circle cx="127" cy="343" r="3.5" fill="#F79AC2"/><circle cx="132" cy="344" r="2.5" fill="#FFE07A"/><circle cx="184" cy="333" r="3.5" fill="#F79AC2"/><circle cx="189" cy="337" r="3.5" fill="#F79AC2"/><circle cx="187" cy="343" r="3.5" fill="#F79AC2"/><circle cx="181" cy="343" r="3.5" fill="#F79AC2"/><circle cx="179" cy="337" r="3.5" fill="#F79AC2"/><circle cx="184" cy="338" r="2.5" fill="#FFE07A"/><circle cx="158" cy="377" r="3.5" fill="#F79AC2"/><circle cx="163" cy="381" r="3.5" fill="#F79AC2"/><circle cx="161" cy="387" r="3.5" fill="#F79AC2"/><circle cx="155" cy="387" r="3.5" fill="#F79AC2"/><circle cx="153" cy="381" r="3.5" fill="#F79AC2"/><circle cx="158" cy="382" r="2.5" fill="#FFE07A"/>',
  },
];

// ----- SHOES (mandatory, 4) -----
const SHOES_THUMB = '118 444 84 54';
const PRINCESS_SHOES = [
  {
    id: 's_crystal',
    name: '水晶鞋',
    thumbBox: '124 434 72 72',
    svg: '<path d="M138,452 C131,454 127,463 130,471 C132,479 141,483 151,482 C159,481 165,476 164,468 C163,459 158,451 150,450 C145,449 141,450 138,452 Z" fill="#CFEAF7"/><ellipse cx="144" cy="463" rx="7" ry="3.5" fill="#EAF7FE" opacity="0.9"/><circle cx="147" cy="455" r="3" fill="#A9D2EC"/><path d="M136,468 Q137,471 140,472 Q137,473 136,476 Q135,473 132,472 Q135,471 136,468 Z" fill="#FFFFFF"/><path d="M182,452 C189,454 193,463 190,471 C188,479 179,483 169,482 C161,481 155,476 156,468 C157,459 162,451 170,450 C175,449 179,450 182,452 Z" fill="#CFEAF7"/><ellipse cx="176" cy="463" rx="7" ry="3.5" fill="#EAF7FE" opacity="0.9"/><circle cx="173" cy="455" r="3" fill="#A9D2EC"/><path d="M184,468 Q185,471 188,472 Q185,473 184,476 Q183,473 180,472 Q183,471 184,468 Z" fill="#FFFFFF"/>',
  },
  {
    id: 's_mary',
    name: '红色小皮鞋',
    thumbBox: SHOES_THUMB,
    svg: '<path d="M128,462 Q125,478 140,482 L162,482 Q166,470 159,462 Q145,455 128,462 Z" fill="#E0524E"/><path d="M140,463 Q150,457 159,463" stroke="#B83A37" stroke-width="3" fill="none"/><circle cx="150" cy="461" r="2.5" fill="#F5C542"/><path d="M192,462 Q195,478 180,482 L158,482 Q154,470 161,462 Q175,455 192,462 Z" fill="#E0524E"/><path d="M180,463 Q170,457 161,463" stroke="#B83A37" stroke-width="3" fill="none"/><circle cx="170" cy="461" r="2.5" fill="#F5C542"/>',
  },
  {
    id: 's_ballet',
    name: '粉色芭蕾鞋',
    thumbBox: SHOES_THUMB,
    svg: '<path d="M130,466 Q127,480 141,483 L160,483 Q164,472 157,466 Q145,460 130,466 Z" fill="#F7A9C6"/><path d="M140,466 L150,449 M152,466 L140,449" stroke="#E77BA6" stroke-width="2.5" stroke-linecap="round"/><circle cx="146" cy="452" r="3" fill="#E77BA6"/><path d="M190,466 Q193,480 179,483 L160,483 Q156,472 163,466 Q175,460 190,466 Z" fill="#F7A9C6"/><path d="M180,466 L170,449 M168,466 L180,449" stroke="#E77BA6" stroke-width="2.5" stroke-linecap="round"/><circle cx="174" cy="452" r="3" fill="#E77BA6"/>',
  },
  {
    id: 's_boot',
    name: '黄色小靴子',
    thumbBox: SHOES_THUMB,
    svg: '<path d="M130,452 L130,474 Q131,482 143,483 L160,483 L160,452 Q145,448 130,452 Z" fill="#F6C445"/><rect x="127" y="449" width="35" height="6" rx="3" fill="#E0A828"/><path d="M190,452 L190,474 Q189,482 177,483 L160,483 L160,452 Q175,448 190,452 Z" fill="#F6C445"/><rect x="158" y="449" width="35" height="6" rx="3" fill="#E0A828"/>',
  },
];

// ----- ACCESSORY (optional, 4) — `layer` picks the doll layer -----
const PRINCESS_ACC = [
  {
    id: 'a_pearl',
    name: '珍珠项链',
    layer: 'accFront',
    thumbBox: '128 210 64 34',
    svg: '<path d="M138,220 Q160,238 182,220" stroke="#E9D8A6" stroke-width="2" fill="none"/><circle cx="140" cy="221" r="3.4" fill="#FDF6E3" stroke="#E9D8A6" stroke-width="1"/><circle cx="149" cy="228" r="3.4" fill="#FDF6E3" stroke="#E9D8A6" stroke-width="1"/><circle cx="160" cy="231" r="4" fill="#FDF6E3" stroke="#E9D8A6" stroke-width="1"/><circle cx="171" cy="228" r="3.4" fill="#FDF6E3" stroke="#E9D8A6" stroke-width="1"/><circle cx="180" cy="221" r="3.4" fill="#FDF6E3" stroke="#E9D8A6" stroke-width="1"/>',
  },
  {
    id: 'a_wand',
    name: '魔法棒',
    layer: 'accFront',
    thumbBox: '226 230 48 80',
    svg: '<path d="M234,300 L250,250" stroke="#E0A828" stroke-width="5" stroke-linecap="round"/><path d="M250,235 L255,247 L268,248 L258,257 L261,270 L250,262 L239,270 L242,257 L232,248 L245,247 Z" fill="#FFE07A" stroke="#E0A828" stroke-width="1.5" stroke-linejoin="round"/><circle cx="250" cy="252" r="3" fill="#FFFFFF" opacity="0.85"/>',
  },
  {
    id: 'a_bag',
    name: '小挎包',
    layer: 'accFront',
    thumbBox: '48 224 64 116',
    svg: '<path d="M108,232 Q86,268 74,300" stroke="#E77BA6" stroke-width="4" fill="none"/><path d="M58,302 Q56,328 74,334 Q92,328 90,302 Q74,294 58,302 Z" fill="#F7A9C6"/><path d="M58,302 Q74,290 90,302" stroke="#E77BA6" stroke-width="3" fill="none"/><circle cx="74" cy="314" r="4" fill="#FFE07A"/>',
  },
  {
    id: 'a_wings',
    name: '蝴蝶翅膀',
    layer: 'wingsBack',
    thumbBox: '34 208 252 152',
    svg: '<path d="M158,244 Q96,204 56,240 Q38,262 62,290 Q42,320 80,344 Q122,340 158,300 Z" fill="#F7A9C6" opacity="0.55"/><path d="M158,252 Q112,226 80,246 Q66,264 86,284 Q72,306 98,322 Q128,318 158,292 Z" fill="#E4F5FF" opacity="0.5"/><circle cx="86" cy="262" r="5" fill="#FFFFFF" opacity="0.7"/><circle cx="100" cy="300" r="4" fill="#FFFFFF" opacity="0.7"/><path d="M162,244 Q224,204 264,240 Q282,262 258,290 Q278,320 240,344 Q198,340 162,300 Z" fill="#F7A9C6" opacity="0.55"/><path d="M162,252 Q208,226 240,246 Q254,264 234,284 Q248,306 222,322 Q192,318 162,292 Z" fill="#E4F5FF" opacity="0.5"/><circle cx="234" cy="262" r="5" fill="#FFFFFF" opacity="0.7"/><circle cx="220" cy="300" r="4" fill="#FFFFFF" opacity="0.7"/>',
  },
];

// ----- BACKGROUND (mandatory, 4) — CSS class on the stage, no doll SVG -----
const PRINCESS_BG = [
  {
    id: 'bg_castle',
    name: '城堡',
    cls: 'bg-castle',
    swatch: 'linear-gradient(180deg,#efd9ff,#fbcfe8)',
    emoji: '🏰',
  },
  {
    id: 'bg_garden',
    name: '花园',
    cls: 'bg-garden',
    swatch: 'linear-gradient(180deg,#d7f2df,#fff6cf)',
    emoji: '🌷',
  },
  {
    id: 'bg_ball',
    name: '舞会',
    cls: 'bg-ball',
    swatch: 'linear-gradient(180deg,#5b4a86,#caa24d)',
    emoji: '✨',
  },
  {
    id: 'bg_rainbow',
    name: '彩虹天空',
    cls: 'bg-rainbow',
    swatch: 'linear-gradient(180deg,#c4e8ff,#eafaff)',
    emoji: '🌈',
  },
];

// ----- CATEGORIES (tab order) -----
const PRINCESS_CATEGORIES = [
  { key: 'hair', label: '发型', emoji: '💇', optional: false, items: PRINCESS_HAIR },
  { key: 'hairAcc', label: '发饰', emoji: '👑', optional: true, items: PRINCESS_HAIRACC },
  { key: 'dress', label: '裙子', emoji: '👗', optional: false, items: PRINCESS_DRESS },
  { key: 'shoes', label: '鞋子', emoji: '👟', optional: false, items: PRINCESS_SHOES },
  { key: 'acc', label: '配饰', emoji: '💎', optional: true, items: PRINCESS_ACC },
  { key: 'bg', label: '背景', emoji: '🏰', optional: false, items: PRINCESS_BG },
];

const PRINCESS_DEFAULT_OUTFIT = {
  hair: 'h_twin',
  hairAcc: null,
  dress: 'd_pink',
  shoes: 's_crystal',
  acc: null,
  bg: 'bg_castle',
};

const PRINCESS_PRAISES = [
  '哇，真漂亮！',
  '太美啦，像仙女一样！',
  '这套搭配真棒！',
  '小公主闪闪发光！',
  '好看极了，转个圈吧！',
  '美美的小公主诞生啦！',
];
