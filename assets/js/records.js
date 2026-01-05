// assets/js/records.js
const RECORDS_URL = "/assets/data/records.json";

function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchJSON(urlStr) {
  const url = new URL(urlStr, window.location.origin);
  url.searchParams.set("v", Date.now().toString());
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`No pude cargar ${url.pathname} (${res.status})`);
  return res.json();
}

function parseItems(json) {
  if (Array.isArray(json)) return json;
  return Array.isArray(json?.items) ? json.items : [];
}

function uniq(list) {
  return [...new Set(list.filter(Boolean).map(String))];
}

function sortItems(items, order) {
  const arr = [...items];
  if (order === "nota") arr.sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));
  else if (order === "anio") arr.sort((a, b) => (b.anio ?? 0) - (a.anio ?? 0));
  else if (order === "az") arr.sort((a, b) => String(a.album||"").localeCompare(String(b.album||""), "es"));
  else {
    // recientes: escuchado desc (si falta, queda al final)
    arr.sort((a, b) => (Date.parse(b.escuchado || "") || 0) - (Date.parse(a.escuchado || "") || 0));
  }
  return arr;
}

async function loadRecords() {
  const json = await fetchJSON(RECORDS_URL);
  const items = parseItems(json).map(r => ({
    album: r.album ?? "",
    artista: r.artista ?? "",
    anio: r.anio ?? null,
    genero: r.genero ?? "",
    cover: r.cover ?? "",
    nota: Number.isFinite(r.nota) ? r.nota : parseInt(r.nota || "0", 10) || 0,
    escuchado: r.escuchado ?? "",
    chips: Array.isArray(r.chips) ? r.chips : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    notas: r.notas ?? "",
  }));
  return items;
}

const state = { q: "", genero: "", orden: "recientes" };

export async function renderRecords({ mainEl, asideEl }) {
  const all = await loadRecords();

  const generos = uniq(all.map(x => x.genero)).sort((a,b)=>a.localeCompare(b,"es"));

  // sidebar (simple)
  if (asideEl) {
    asideEl.innerHTML = `
      <h2 class="side-title">Discos //</h2>
      <div class="muted">items: ${all.length}</div>
      <div class="divider"></div>
      <div class="badge" style="margin-bottom:8px;">Correo</div>
      <div class="muted">rodolfo.galaz@pregrado.uoh.cl</div>
    `;
  }

  // filtros
  const filtered = all.filter(r => {
    const q = state.q.trim().toLowerCase();
    if (state.genero && String(r.genero) !== String(state.genero)) return false;
    if (!q) return true;

    const hay = [
      r.album, r.artista, r.genero,
      (r.chips || []).join(" "),
      (r.tags || []).join(" "),
      r.notas
    ].join(" ").toLowerCase();

    return hay.includes(q);
  });

  const visible = sortItems(filtered, state.orden);

  mainEl.innerHTML = `
    <h1>Discos</h1>
    <div class="lede">Biblioteca del año: lo que escuché y lo que me dejó.</div>
    <div class="divider"></div>

    <div class="records-controls">
      <div class="field">
        <label>Buscar</label>
        <input id="rec-q" type="text" placeholder="artista, álbum, tag..." value="${esc(state.q)}">
      </div>

      <div class="field">
        <label>Género</label>
        <select id="rec-genero">
          <option value="">(todos)</option>
          ${generos.map(g => `<option value="${esc(g)}" ${state.genero===g?"selected":""}>${esc(g)}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>Orden</label>
        <select id="rec-orden">
          <option value="recientes" ${state.orden==="recientes"?"selected":""}>recientes</option>
          <option value="nota" ${state.orden==="nota"?"selected":""}>mejor nota</option>
          <option value="anio" ${state.orden==="anio"?"selected":""}>año</option>
          <option value="az" ${state.orden==="az"?"selected":""}>A–Z</option>
        </select>
      </div>
    </div>

    <div class="divider"></div>

    <div class="meta">
      <span class="badge">items: ${visible.length}/${all.length}</span>
      <span class="muted">ruta: ${esc(location.hash || "#/discos")}</span>
    </div>

    <div class="records-grid" style="margin-top:10px;">
      ${
        visible.length ? visible.map(r => {
          const pct = Math.max(0, Math.min(100, (r.nota || 0) * 10));
          return `
            <div class="record-card">
              <div class="record-cover">
                ${r.cover ? `<img src="${esc(r.cover)}" alt="">` : `<div style="height:160px;"></div>`}
              </div>
              <div class="record-body">
                <div class="record-title"><a href="javascript:void(0)">${esc(r.album || "(sin álbum)")}</a></div>
                <div class="record-artist">${esc(r.artista)}${r.anio ? ` • ${esc(r.anio)}` : ""}</div>

                <div style="display:flex; gap:10px; align-items:center; margin-top:8px;">
                  <div class="record-score">${esc(r.nota)}/10</div>
                </div>

                <div class="rating">
                  <div class="rating__fill" style="width:${pct}%"></div>
                </div>

                ${r.escuchado ? `<div class="badge">escuchado: ${esc(r.escuchado)}</div>` : ""}

                <div class="record-chips">
                  ${(r.chips||[]).map(c => `<span class="chip">${esc(c)}</span>`).join("")}
                  ${(r.tags||[]).map(t => `<span class="chip chip--tag">${esc(t)}</span>`).join("")}
                </div>

                ${r.notas ? `<div class="record-notes">${esc(r.notas)}</div>` : ""}
              </div>
            </div>
          `;
        }).join("") : `<div class="postitem">No hay resultados con esos filtros.</div>`
      }
    </div>
  `;

  // listeners
  const qEl = mainEl.querySelector("#rec-q");
  const gEl = mainEl.querySelector("#rec-genero");
  const oEl = mainEl.querySelector("#rec-orden");

  qEl?.addEventListener("input", () => { state.q = qEl.value; renderRecords({ mainEl, asideEl }); });
  gEl?.addEventListener("change", () => { state.genero = gEl.value; renderRecords({ mainEl, asideEl }); });
  oEl?.addEventListener("change", () => { state.orden = oEl.value; renderRecords({ mainEl, asideEl }); });
}
