/* 5案の共通部品。地図データ（data.js）を読んで、SVGの地図とカード一覧を組み立てる。
   見た目は各案のCSSで変える。ここでは形だけ作る。 */

const CATCHAR = { "ごはん":"食", "カフェ":"茶", "海・絶景":"海", "買い物":"買", "体験":"体", "夜":"夜" };
const NAMES   = { h:"広明", e:"絵梨香", both:"ふたり" };
const catChar = c => CATCHAR[c] || "・";

/* 地図。opts.labels: 出す地名の数 / opts.pins: "dot" | "cat" | "none" */
function renderMap(el, opts){
  const o = Object.assign({ labels:true, pins:"cat", venue:true, wave:true }, opts||{});
  const M = window.OKI;

  const isles = M.isles.map(d => `<path class="isle" d="${d}"/>`).join("");
  const places = !o.labels ? "" : M.places.map(p =>
    `<text class="place" x="${p.x}" y="${p.y}" text-anchor="${p.a}">${p.t}</text>`).join("");

  let pins = "";
  if(o.pins === "cat"){
    pins = M.spots.map((s,i) =>
      `<g class="pin" data-i="${i}" transform="translate(${s.x},${s.y})">
         <circle class="pinbg" r="15"/><text class="pintx" y="5" text-anchor="middle">${catChar(s.cat)}</text>
       </g>`).join("");
  } else if(o.pins === "dot"){
    pins = M.spots.map((s,i) =>
      `<g class="pin" data-i="${i}" transform="translate(${s.x},${s.y})">
         <circle class="pinbg" r="7"/><circle class="pinhit" r="18" fill="transparent"/>
       </g>`).join("");
  }

  const venue = !o.venue ? "" :
    `<g class="venue" transform="translate(${M.venue.x},${M.venue.y})">
       <circle class="vring" r="20"/><circle class="vdot" r="7"/>
       <text class="vtx" x="26" y="5">${M.venue.name}</text>
     </g>`;

  const waves = !o.wave ? "" : `<g class="waves">
      <path d="M70,150 c 7,-5 14,5 21,0 c 7,-5 14,5 21,0"/>
      <path d="M560,250 c 7,-5 14,5 21,0 c 7,-5 14,5 21,0"/>
      <path d="M120,430 c 7,-5 14,5 21,0 c 7,-5 14,5 21,0"/>
      <path d="M600,560 c 7,-5 14,5 21,0 c 7,-5 14,5 21,0"/>
      <path d="M520,760 c 7,-5 14,5 21,0 c 7,-5 14,5 21,0"/>
    </g>`;

  el.innerHTML =
    `<svg viewBox="0 0 ${M.W} ${M.H}" preserveAspectRatio="xMidYMid meet" aria-label="沖縄本島の地図">
       <rect class="sea" x="0" y="0" width="${M.W}" height="${M.H}"/>
       ${waves}
       <path class="land" d="${M.coast}"/>
       <g class="isles">${isles}</g>
       ${places}
       ${venue}
       <g class="pins">${pins}</g>
     </svg>`;
}


/* ピンが重ならないように、少しずつずらして置く。
   返り値は元の位置と置いた位置の両方。ずれた分は細い線でつなぐと分かりやすい。 */
function spread(pts, gap, seed){
  const placed = (seed||[]).slice();
  return pts.map(p => {
    let q = { x:p.x, y:p.y };
    for(let n = 0; n < 200; n++){
      if(placed.every(o => Math.hypot(o.x-q.x, o.y-q.y) >= gap)) break;
      const ang = n * 2.399, rad = gap * (0.5 + n * 0.075);
      q = { x: p.x + Math.cos(ang)*rad, y: p.y + Math.sin(ang)*rad };
    }
    placed.push(q);
    return { x:q.x, y:q.y, ox:p.x, oy:p.y, moved: Math.hypot(q.x-p.x, q.y-p.y) };
  });
}

/* カード一覧。tpl(spot, index) が 1件分のHTMLを返す */
function renderList(el, tpl, n){
  const list = n ? window.OKI.spots.slice(0, n) : window.OKI.spots;
  el.innerHTML = list.map((s,i) => tpl(s,i)).join("");
}

/* 詳細を開く（5案とも同じ簡易シート。中身の見た目はCSSで） */
function wireSheet(){
  const sheet = document.getElementById("sheet");
  if(!sheet) return;
  const bg = document.getElementById("sheetbg");
  const close = () => { sheet.classList.remove("on"); bg.classList.remove("on"); };
  bg.addEventListener("click", close);
  sheet.querySelector("[data-close]").addEventListener("click", close);
  window.openSpot = i => {
    const s = window.OKI.spots[i];
    sheet.querySelector("[data-name]").textContent = s.name;
    sheet.querySelector("[data-meta]").textContent =
      `${NAMES[s.by]}のおすすめ ／ ${s.cat} ／ ${s.area}` + (s.min ? ` ／ 会場から車で約${s.min}分` : "");
    sheet.querySelector("[data-comment]").textContent = s.comment || "";
    sheet.querySelector("[data-tags]").innerHTML = (s.tags||[]).map(t => `<span>${t}</span>`).join("");
    sheet.querySelector("[data-gmap]").href =
      s.gmap || ("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s.name + " 沖縄"));
    sheet.classList.add("on"); bg.classList.add("on");
  };
  document.addEventListener("click", e => {
    const p = e.target.closest("[data-i]");
    if(p) window.openSpot(+p.dataset.i);
  });
}
