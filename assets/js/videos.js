// assets/js/videos.js
const VIDEOS_URL = "/assets/data/videos.json";


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

async function loadVideos() {
  const json = await fetchJSON(VIDEOS_URL);
  return parseItems(json).map(v => ({
    title: v.title ?? "",
    date: v.date ?? "",
    tags: Array.isArray(v.tags) ? v.tags : [],
    src: v.src ?? "",
    poster: v.poster ?? "",
    desc: v.desc ?? "",
    publicado: v.publicado !== false,
  })).filter(v => v.publicado);
}

function getYouTubeId(input = "") {
  // acepta ID o URL (youtube.com / youtu.be)
  const s = String(input).trim();
  if (!s) return "";

  // si parece ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || "";
  } catch {}
  return "";
}

function renderVideoPlayer(item) {
  const type = item.type || (item.youtube ? "youtube" : "mp4");

  if (type === "youtube") {
    const id = getYouTubeId(item.youtube || item.url || "");
    if (!id) return `<div class="muted">YouTube inválido</div>`;

    const start = Number(item.start || 0) || 0;
    const src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${start ? `&start=${start}` : ""}`;

    return `
      <div class="record-cover">
        <iframe
          src="${src}"
          title="${(item.title || "YouTube").replaceAll('"', "&quot;")}"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          style="width:100%;aspect-ratio:16/9;border:0;border-radius:14px;"
        ></iframe>
      </div>
    `;
  }

  // MP4 local
  return `
    <div class="record-cover">
      <video
        controls
        preload="metadata"
        ${item.poster ? `poster="${item.poster}"` : ""}
        style="width:100%;border-radius:14px;display:block;"
      >
        <source src="${item.src}" type="video/mp4">
      </video>
    </div>
  `;
}


const state = { q: "" };

export async function renderVideos({ mainEl, asideEl }) {
  const all = await loadVideos();
  const q = state.q.trim().toLowerCase();

  const visible = all.filter(v => {
    if (!q) return true;
    const hay = [v.title, v.date, (v.tags||[]).join(" "), v.desc].join(" ").toLowerCase();
    return hay.includes(q);
  });

  if (asideEl) {
    asideEl.innerHTML = `
      <h2 class="side-title">Videos :33</h2>
      <div class="muted">items: ${all.length}</div>
      <div class="divider"></div>
      <div class="badge" style="margin-bottom:8px;">Info</div>
      <div class="muted">Videos que me gustan o cualquier cosa así</div>
    `;
  }

  mainEl.innerHTML = `
    <h1>Videos</h1>
    <div class="lede">LOS VIDEOS SON CLAVE</div>
    <div class="divider"></div>

    <div class="records-controls">
      <div class="field">
        <label>Buscar</label>
        <input id="vid-q" type="text" placeholder="título, tags..." value="${esc(state.q)}">
      </div>
      <div class="field">
        <label>&nbsp;</label>
        <div class="badge">videos: ${visible.length}/${all.length}</div>
      </div>
      <div class="field">
        <label>&nbsp;</label>
      </div>
    </div>

    <div class="divider"></div>

    <div class="records-grid" style="margin-top:10px;">
      ${
        visible.length ? visible.map(v => `
          <div class="record-card">
            <div class="record-cover" style="background:#fff;">
              ${
                v.src
                  ? `<video controls preload="metadata" playsinline style="width:100%; height:160px; object-fit:cover;" ${v.poster ? `poster="${esc(v.poster)}"` : ""}>
                       <source src="${esc(v.src)}" type="video/mp4">
                     </video>`
                  : `<div style="height:160px;"></div>`
              }
            </div>
            <div class="record-body">
              <div class="record-title"><a href="javascript:void(0)">${esc(v.title || "(sin título)")}</a></div>
              <div class="record-artist">${esc(v.date || "")}</div>
              <div class="record-chips">
                ${(v.tags||[]).map(t => `<span class="chip chip--tag">${esc(t)}</span>`).join("")}
              </div>
              ${v.desc ? `<div class="record-notes">${esc(v.desc)}</div>` : ""}
            </div>
          </div>
        `).join("") : `<div class="postitem">No hay videos con ese filtro.</div>`
      }
    </div>
  `;

  mainEl.querySelector("#vid-q")?.addEventListener("input", (e) => {
    state.q = e.target.value;
    renderVideos({ mainEl, asideEl });
  });
}
