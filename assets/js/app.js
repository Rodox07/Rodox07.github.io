import { renderPosts, renderPostDetail } from "./posts.js";
import { renderRecords } from "./records.js";
import { renderVideos } from "./videos.js";

function renderAbout({ mainEl, asideEl }) {
  mainEl.innerHTML = `
    <h1>Acerca</h1>
    <div class="lede">Un poco sobre mí.</div>
    <div class="divider"></div>
    <div class="postitem">
      <div class="sub">
        Aquí va tu texto, links, redes, etc.
      </div>
    </div>
  `;
  if (asideEl) asideEl.innerHTML = ""; // o deja tu panel de contacto si quieres
}

async function router() {
  const mainEl = findMainEl();
  const asideEl = findAsideEl();
  if (!mainEl) return;

  const hash = location.hash || "#/";
  setActiveNav(hash);

  try {
    if (hash.startsWith("#/post/")) {
      const slug = decodeURIComponent(hash.replace("#/post/", ""));
      await renderPostDetail({ mainEl, asideEl }, slug);
      return;
    }

    if (hash.startsWith("#/discos")) {
      await renderRecords({ mainEl, asideEl });
      return;
    }

    if (hash.startsWith("#/videos")) {
      await renderVideos({ mainEl, asideEl });
      return;
    }

    // ✅ ACERCA / ABOUT
    if (hash === "#/acerca" || hash === "#/about") {
      renderAbout({ mainEl, asideEl });
      return;
    }

    // default: inicio (posts)
    await renderPosts({ mainEl, asideEl }, state);
  } catch (e) {
    mainEl.innerHTML = `
      <div class="content">
        <h1>Error</h1>
        <pre style="white-space:pre-wrap">${String(e?.message || e)}</pre>
      </div>
    `;
    if (asideEl) asideEl.innerHTML = "";
  }
}
