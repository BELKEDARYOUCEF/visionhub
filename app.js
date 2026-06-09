const APP = {
  libraryUrl: "data/library.xml",
  storage: {
    additions: "visionhub-v2-additions",
    favorites: "visionhub-v2-favorites",
    active: "visionhub-v2-active"
  }
};

const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<library version="fallback"><categories><category id="web" title="Développement Web" icon="&lt;/&gt;">JavaScript, CSS et front-end.</category><category id="ia" title="Intelligence Artificielle" icon="AI">Prompts et agents IA.</category></categories><playlists><playlist id="demo" category="web" level="Débutant" title="Playlist démo" tags="Demo,YouTube"><description>Playlist locale de secours.</description><video id="html-crash" youtubeId="UB1O30fR-EE" duration="1:00:42" level="Débutant" title="HTML Crash Course" tags="HTML"><description>Vidéo publique YouTube de démonstration.</description></video></playlist></playlists><files></files><finance></finance></library>`;

let state = {
  categories: [],
  playlists: [],
  files: [],
  finance: [],
  favorites: readJson(APP.storage.favorites, []),
  active: readJson(APP.storage.active, {})
};

const page = document.body.dataset.page || "home";
const app = document.querySelector("#app");

init();

async function init() {
  bindHeader();
  markActiveNav();

  let xmlText = await loadXmlText();
  try {
    parseLibrary(xmlText);
  } catch (error) {
    console.error("Erreur dans data/library.xml. Fallback utilisé.", error);
    xmlText = fallbackXml;
    parseLibrary(xmlText);
  }

  mergeLocalAdditions();
  route();
}

async function loadXmlText() {
  if (location.protocol === "file:") return fallbackXml;
  try {
    const response = await fetch(APP.libraryUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`XML HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    console.warn("Base XML indisponible, fallback utilisé.", error);
    return fallbackXml;
  }
}

function parseLibrary(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) throw new Error("La base XML contient une erreur de syntaxe.");

  state.categories = [...doc.querySelectorAll("category")].map((node) => ({
    id: node.getAttribute("id"),
    title: node.getAttribute("title"),
    icon: node.getAttribute("icon") || node.getAttribute("title")?.slice(0, 2),
    color: node.getAttribute("color") || "cyan",
    description: clean(node.textContent)
  }));

  state.playlists = [...doc.querySelectorAll("playlists > playlist")].map((node) => {
    const playlist = {
      id: node.getAttribute("id"),
      title: node.getAttribute("title"),
      description: clean(node.querySelector("description")?.textContent),
      category: node.getAttribute("category"),
      level: node.getAttribute("level") || "Débutant",
      tags: splitTags(node.getAttribute("tags")),
      videos: []
    };
    playlist.videos = [...node.querySelectorAll("video")].map((videoNode) => ({
      id: videoNode.getAttribute("id"),
      playlistId: playlist.id,
      category: playlist.category,
      title: videoNode.getAttribute("title"),
      description: clean(videoNode.querySelector("description")?.textContent),
      youtubeId: normalizeYoutubeId(videoNode.getAttribute("youtubeId")),
      duration: videoNode.getAttribute("duration") || "0:00",
      level: videoNode.getAttribute("level") || playlist.level,
      tags: splitTags(videoNode.getAttribute("tags"))
    }));
    return playlist;
  });

  state.files = [...doc.querySelectorAll("files > folder")].map((node) => ({
    id: node.getAttribute("id"),
    title: node.getAttribute("title"),
    icon: node.getAttribute("icon") || "folder",
    tags: splitTags(node.getAttribute("tags")),
    files: [...node.querySelectorAll("file")].map((child) => ({
      id: child.getAttribute("id"),
      title: child.getAttribute("title"),
      type: child.getAttribute("type"),
      status: child.getAttribute("status")
    }))
  }));

  state.finance = [...doc.querySelectorAll("finance > metric")].map((node) => ({
    id: node.getAttribute("id"),
    title: node.getAttribute("title"),
    value: node.getAttribute("value") || "0",
    unit: node.getAttribute("unit") || ""
  }));
}

function mergeLocalAdditions() {
  const additions = readJson(APP.storage.additions, { playlists: [], videos: [] });
  additions.playlists?.forEach((playlist) => {
    if (!state.playlists.some((item) => item.id === playlist.id)) state.playlists.push({ ...playlist, videos: [] });
  });
  additions.videos?.forEach((video) => {
    const playlist = state.playlists.find((item) => item.id === video.playlistId);
    if (playlist && !playlist.videos.some((item) => item.id === video.id)) playlist.videos.push({ ...video, category: playlist.category });
  });
}

function route() {
  const routes = {
    home: renderHome,
    playlists: renderPlaylists,
    videos: renderVideos,
    files: renderFiles,
    finance: renderFinance,
    studio: renderStudio,
    about: renderAbout
  };
  app.innerHTML = (routes[page] || renderHome)();
  bindPage();
}

function renderHome() {
  const videos = allVideos();
  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="kicker">VisionHub OS</p>
        <h1>Ton centre vivant pour vidéos, fichiers, apprentissage et business.</h1>
        <p>Une base propre pour construire une application revendable : playlists dynamiques, lecteur YouTube robuste, dossiers façon workspace, finance légère et futur backend SQL.</p>
        <div class="hero-actions">
          <a class="btn primary" href="videos.html">Ouvrir le lecteur</a>
          <a class="btn" href="studio.html">Ajouter une vidéo</a>
          <a class="btn ghost" href="files.html">Organiser les fichiers</a>
        </div>
      </div>
      <div class="hero-board">
        <article class="screen-card featured"><p class="eyebrow">Video intelligence</p><strong>${videos.length} vidéos prêtes</strong><p>${state.playlists.length} playlists structurées par catégorie.</p></article>
        <div class="grid-2 mini-stack">${state.playlists.slice(0, 3).map((list) => `<a class="screen-card" href="videos.html?playlist=${list.id}"><span class="badge">${categoryName(list.category)}</span><strong>${escapeHtml(list.title)}</strong><p>${list.videos.length} vidéos</p></a>`).join("")}</div>
      </div>
    </section>
    <section class="section"><h2>Applications intégrées</h2><div class="grid-4">
      ${appCard("Bibliothèque vidéo", "Playlists, favoris, lecture 16:9 et tags.", "videos.html")}
      ${appCard("File OS", "Dossiers, notes, ressources et structure type Drive/Notion.", "files.html")}
      ${appCard("Finance cockpit", "Première base pour revenus, dépenses et budget.", "finance.html")}
      ${appCard("Studio", "Ajout local, export XML et préparation future SQL.", "studio.html")}
    </div></section>`;
}

function appCard(title, text, href) {
  return `<article class="content-card"><span class="tag">Module</span><h3>${title}</h3><p>${text}</p><a class="btn" href="${href}">Ouvrir</a></article>`;
}

function renderPlaylists() {
  const params = new URLSearchParams(location.search);
  const current = params.get("category") || "all";
  return `<section><div class="page-head"><div><p class="kicker">Bibliothèque</p><h1>Playlists dynamiques.</h1><p class="section-intro">Recherche, filtre par catégorie et lance directement la bonne vidéo.</p></div></div>
    <div class="filter-bar"><input class="search-input" id="playlistSearch" type="search" placeholder="Rechercher une playlist, tag ou catégorie"><div class="filter-tabs" id="playlistFilters">${filterButtons(current)}</div></div>
    <div class="playlist-grid" id="playlistGrid">${state.playlists.map(playlistCard).join("")}</div><div id="playlistEmpty"></div></section>`;
}

function filterButtons(current) {
  return `<button class="tab-btn ${current === "all" ? "active" : ""}" data-category="all">Tout</button>${state.categories.map((cat) => `<button class="tab-btn ${current === cat.id ? "active" : ""}" data-category="${cat.id}">${escapeHtml(cat.title)}</button>`).join("")}`;
}

function playlistCard(list) {
  const first = list.videos[0];
  const image = first?.youtubeId ? thumb(first.youtubeId) : "";
  const search = `${list.title} ${list.description} ${categoryName(list.category)} ${list.tags.join(" ")}`.toLowerCase();
  const href = first ? `videos.html?playlist=${encodeURIComponent(list.id)}&video=${encodeURIComponent(first.id)}` : "studio.html";
  return `<article class="playlist-card" data-playlist-card data-category="${list.category}" data-search="${escapeAttr(search)}"><div class="playlist-thumb" style="background-image:linear-gradient(180deg, transparent, rgba(7,10,18,.86)), url('${image}')"></div><div class="card-meta"><span class="badge">${categoryName(list.category)}</span><span class="level">${escapeHtml(list.level)}</span><span class="badge">${list.videos.length} vidéos</span></div><h3>${escapeHtml(list.title)}</h3><p>${escapeHtml(list.description)}</p><div class="chip-row">${list.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div><a class="btn primary" href="${href}">Explorer</a></article>`;
}

function renderVideos() {
  const params = new URLSearchParams(location.search);
  const playlist = getPlaylist(params.get("playlist") || state.active.playlistId) || firstPlaylist();
  const video = getVideo(playlist, params.get("video") || state.active.videoId) || playlist.videos[0];
  setActive(playlist?.id, video?.id, false);
  return `<section class="video-page"><div class="page-head"><div><p class="kicker">Lecteur robuste</p><h1>${escapeHtml(playlist.title)}</h1><p class="section-intro">Le lecteur ne charge qu’une iframe après action utilisateur. En <code>file://</code>, l’iframe est bloquée volontairement pour éviter l’écran YouTube Error 153.</p></div><select class="select-input" id="playlistSelect">${state.playlists.map((item) => `<option value="${item.id}" ${item.id === playlist.id ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}</select></div>
    <div class="player-layout">
      <article class="player-shell"><div class="player-frame" id="playerFrame">${renderPlayerPoster(video)}</div><div class="player-info" id="playerInfo">${videoInfo(video)}</div></article>
      <aside><input class="search-input video-search" id="videoSearch" type="search" placeholder="Rechercher une vidéo"><div class="video-list" id="videoList">${playlist.videos.map((item) => videoRow(item, playlist.id, item.id === video.id)).join("")}</div><div id="videoEmpty"></div></aside>
    </div></section>`;
}

function renderPlayerPoster(video) {
  if (!video?.youtubeId) return `<div class="empty-state"><strong>ID YouTube invalide</strong><p>Ajoute une URL YouTube publique depuis le Studio.</p></div>`;
  return `<div class="player-poster" style="background-image:url('${thumb(video.youtubeId, "maxresdefault")}')"><div class="play-stack"><button class="play-orb" data-load-youtube="${video.id}" aria-label="Lire ${escapeAttr(video.title)}">▶</button><strong>${escapeHtml(video.title)}</strong><small>Cliquer pour charger le lecteur YouTube</small></div></div>`;
}

function loadYoutubeIntoFrame(video) {
  const frame = document.querySelector("#playerFrame");
  if (!frame || !video?.youtubeId) return;
  if (location.protocol === "file:") {
    frame.innerHTML = `<div class="empty-state"><strong>Serveur local requis</strong><p>YouTube peut afficher Error 153 en ouverture directe car le navigateur n’envoie pas de Referer HTTP. Lance <code>npm run start</code>, puis ouvre <code>http://127.0.0.1:5502</code>.</p><a class="btn primary" href="${youtubeWatchUrl(video)}" target="_blank" rel="noreferrer">Ouvrir sur YouTube</a></div>`;
    return;
  }
  const src = youtubeEmbedUrl(video.youtubeId);
  frame.innerHTML = `<iframe src="${src}" title="${escapeAttr(video.title)}" referrerpolicy="strict-origin-when-cross-origin" loading="eager" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

function videoInfo(video) {
  return `<div class="card-meta"><span class="badge">${categoryName(video.category)}</span><span class="level">${escapeHtml(video.level)}</span><span class="badge">${escapeHtml(video.duration)}</span></div><h2>${escapeHtml(video.title)}</h2><p>${escapeHtml(video.description)}</p><div class="player-actions"><button class="btn primary" data-favorite="${video.id}">${state.favorites.includes(video.id) ? "Retirer des favoris" : "Ajouter aux favoris"}</button><a class="btn" href="${youtubeWatchUrl(video)}" target="_blank" rel="noreferrer">Ouvrir sur YouTube</a></div>`;
}

function videoRow(video, playlistId, isActive) {
  const search = `${video.title} ${video.description} ${video.level} ${video.tags.join(" ")}`.toLowerCase();
  return `<button class="video-row ${isActive ? "active" : ""}" data-video-row data-playlist="${playlistId}" data-video="${video.id}" data-search="${escapeAttr(search)}"><img class="video-thumb" src="${thumb(video.youtubeId)}" alt="Miniature ${escapeAttr(video.title)}" loading="lazy"><span><h3>${escapeHtml(video.title)}</h3><p>${escapeHtml(video.description)}</p><span class="video-meta"><span class="badge">${escapeHtml(video.duration)}</span><span class="level">${escapeHtml(video.level)}</span></span></span></button>`;
}

function renderFiles() {
  return `<section><div class="page-head"><div><p class="kicker">File OS</p><h1>Organisation des fichiers.</h1><p class="section-intro">Une structure inspirée Drive, Notion et Mega : dossiers, ressources, statuts et tags.</p></div></div><div class="file-grid">${state.files.map((folder) => `<article class="file-card"><span class="category-icon">${escapeHtml(folder.icon)}</span><h3>${escapeHtml(folder.title)}</h3><div class="chip-row">${folder.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div><div class="section">${folder.files.map((file) => `<p><strong>${escapeHtml(file.title)}</strong> · ${escapeHtml(file.type)} · <span class="level">${escapeHtml(file.status)}</span></p>`).join("")}</div></article>`).join("")}</div></section>`;
}

function renderFinance() {
  return `<section><div class="page-head"><div><p class="kicker">Finance cockpit</p><h1>Suivi finance léger.</h1><p class="section-intro">Première étape avant un vrai module SQL : revenus, dépenses, budget, objectifs et export.</p></div></div><div class="grid-3">${state.finance.map((metric) => `<article class="metric-card"><span class="eyebrow">${escapeHtml(metric.title)}</span><strong>${escapeHtml(metric.value)}${escapeHtml(metric.unit)}</strong><p>Valeur de démonstration à remplacer plus tard par une vraie base.</p></article>`).join("")}</div><section class="section"><article class="content-card"><h2>Roadmap finance</h2><p>Étape future : transactions, catégories, factures, objectifs mensuels, graphiques, import CSV et migration SQL.</p></article></section></section>`;
}

function renderStudio() {
  return `<section><div class="page-head"><div><p class="kicker">Studio local</p><h1>Ajouter, sauvegarder, exporter.</h1><p class="section-intro">GitHub Pages ne peut pas écrire dans le fichier XML. Le Studio sauvegarde donc dans localStorage et permet d’exporter une nouvelle base XML.</p></div><button class="btn danger" id="resetLocal">Réinitialiser local</button></div><div class="studio-grid"><article class="studio-panel"><h2>Nouvelle playlist</h2><form id="playlistForm" class="studio-form"><label>Titre<input class="search-input" name="title" required></label><label>Description<textarea name="description"></textarea></label><label>Catégorie<select class="select-input" name="category">${state.categories.map((cat) => `<option value="${cat.id}">${cat.title}</option>`).join("")}</select></label><label>Niveau<input class="search-input" name="level" value="Débutant"></label><label>Tags<input class="search-input" name="tags" placeholder="Coding, IA, Business"></label><button class="btn primary">Ajouter</button></form></article><article class="studio-panel"><h2>Nouvelle vidéo</h2><form id="videoForm" class="studio-form"><label>Playlist<select class="select-input" name="playlistId">${state.playlists.map((list) => `<option value="${list.id}">${escapeHtml(list.title)}</option>`).join("")}</select></label><label>Titre<input class="search-input" name="title" required></label><label>Description<textarea name="description"></textarea></label><label>Lien ou ID YouTube<input class="search-input" name="youtube" required placeholder="https://www.youtube.com/watch?v=..."></label><label>Durée<input class="search-input" name="duration" value="0:00"></label><label>Niveau<input class="search-input" name="level" value="Débutant"></label><label>Tags<input class="search-input" name="tags"></label><button class="btn primary">Ajouter</button></form></article></div><section class="section"><article class="studio-panel"><h2>Exporter la base XML</h2><p>Copie le XML généré dans <code>data/library.xml</code> pour versionner tes changements sur GitHub.</p><button class="btn" id="exportXml">Générer XML</button><pre class="code-box" id="xmlOutput">Clique sur “Générer XML”.</pre></article></section></section>`;
}

function renderAbout() {
  return `<section><div class="page-head"><div><p class="kicker">Architecture produit</p><h1>Un OS personnel modulaire, vendable et évolutif.</h1><p class="section-intro">La version statique pose les bases : pages séparées, XML, localStorage, design premium. La suite peut migrer vers SQLite, Supabase ou PostgreSQL.</p></div></div><div class="grid-3">${appCard("Phase 1", "Stabiliser vidéo + XML + GitHub Pages.", "videos.html")}${appCard("Phase 2", "File OS, ressources, notes et tags avancés.", "files.html")}${appCard("Phase 3", "Finance, CRM, projets et futur backend.", "finance.html")}</div></section>`;
}

function bindPage() {
  bindFavorites();
  if (page === "playlists") bindPlaylistFilters();
  if (page === "videos") bindVideos();
  if (page === "studio") bindStudio();
}

function bindHeader() {
  document.querySelector("#menuToggle")?.addEventListener("click", () => {
    const nav = document.querySelector("#mainNav");
    nav.classList.toggle("open");
    document.querySelector("#menuToggle").setAttribute("aria-expanded", nav.classList.contains("open"));
  });
}

function markActiveNav() {
  document.querySelector(`[data-page-link="${page}"]`)?.classList.add("active");
}

function bindFavorites() {
  document.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.favorite;
    state.favorites = state.favorites.includes(id) ? state.favorites.filter((item) => item !== id) : [...state.favorites, id];
    saveJson(APP.storage.favorites, state.favorites);
    route();
  }));
}

function bindPlaylistFilters() {
  const params = new URLSearchParams(location.search);
  setPlaylistFilter(params.get("category") || "all", false);
  document.querySelector("#playlistSearch")?.addEventListener("input", filterPlaylists);
  document.querySelector("#playlistFilters")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (button) setPlaylistFilter(button.dataset.category, true);
  });
}

function setPlaylistFilter(category, updateUrl) {
  document.querySelectorAll("#playlistFilters .tab-btn").forEach((button) => button.classList.toggle("active", button.dataset.category === category));
  if (updateUrl) history.replaceState(null, "", category === "all" ? "playlists.html" : `playlists.html?category=${encodeURIComponent(category)}`);
  filterPlaylists();
}

function filterPlaylists() {
  const query = (document.querySelector("#playlistSearch")?.value || "").toLowerCase();
  const category = document.querySelector("#playlistFilters .active")?.dataset.category || "all";
  let count = 0;
  document.querySelectorAll("[data-playlist-card]").forEach((card) => {
    const visible = (category === "all" || card.dataset.category === category) && card.dataset.search.includes(query);
    card.hidden = !visible;
    if (visible) count += 1;
  });
  document.querySelector("#playlistEmpty").innerHTML = count ? "" : `<div class="empty-state"><strong>Aucune playlist trouvée</strong></div>`;
}

function bindVideos() {
  document.querySelector("#playlistSelect")?.addEventListener("change", (event) => {
    const list = getPlaylist(event.target.value);
    const first = list?.videos?.[0];
    if (first) location.href = `videos.html?playlist=${encodeURIComponent(list.id)}&video=${encodeURIComponent(first.id)}`;
  });

  document.querySelector("#videoList")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-video-row]");
    if (!button) return;
    const list = getPlaylist(button.dataset.playlist);
    const video = getVideo(list, button.dataset.video);
    setActive(list.id, video.id, true);
    document.querySelectorAll("[data-video-row]").forEach((row) => row.classList.toggle("active", row === button));
    document.querySelector("#playerFrame").innerHTML = renderPlayerPoster(video);
    document.querySelector("#playerInfo").innerHTML = videoInfo(video);
    bindFavorites();
  });

  document.querySelector("#playerFrame")?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-load-youtube]");
    if (!trigger) return;
    const list = getPlaylist(state.active.playlistId);
    loadYoutubeIntoFrame(getVideo(list, state.active.videoId));
  });

  document.querySelector("#videoSearch")?.addEventListener("input", () => {
    const query = document.querySelector("#videoSearch").value.toLowerCase();
    let count = 0;
    document.querySelectorAll("[data-video-row]").forEach((row) => {
      const visible = row.dataset.search.includes(query);
      row.hidden = !visible;
      if (visible) count += 1;
    });
    document.querySelector("#videoEmpty").innerHTML = count ? "" : `<div class="empty-state"><strong>Aucune vidéo trouvée</strong></div>`;
  });
}

function bindStudio() {
  document.querySelector("#playlistForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const additions = readJson(APP.storage.additions, { playlists: [], videos: [] });
    const item = { id: slug(form.get("title")), title: form.get("title"), description: form.get("description"), category: form.get("category"), level: form.get("level"), tags: splitTags(form.get("tags")), videos: [] };
    additions.playlists.push(item);
    saveJson(APP.storage.additions, additions);
    location.reload();
  });

  document.querySelector("#videoForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const youtubeId = normalizeYoutubeId(form.get("youtube"));
    if (!youtubeId) { alert("Lien ou ID YouTube invalide."); return; }
    const additions = readJson(APP.storage.additions, { playlists: [], videos: [] });
    const list = getPlaylist(form.get("playlistId"));
    additions.videos.push({ id: slug(form.get("title")), playlistId: list.id, category: list.category, title: form.get("title"), description: form.get("description"), youtubeId, duration: form.get("duration"), level: form.get("level"), tags: splitTags(form.get("tags")) });
    saveJson(APP.storage.additions, additions);
    location.href = `videos.html?playlist=${encodeURIComponent(list.id)}`;
  });

  document.querySelector("#resetLocal")?.addEventListener("click", () => {
    localStorage.removeItem(APP.storage.additions);
    localStorage.removeItem(APP.storage.active);
    location.reload();
  });

  document.querySelector("#exportXml")?.addEventListener("click", () => {
    document.querySelector("#xmlOutput").textContent = exportXml();
  });
}

function exportXml() {
  const categoryXml = state.categories.map((cat) => `    <category id="${escXml(cat.id)}" title="${escXml(cat.title)}" icon="${escXml(cat.icon)}">${escXml(cat.description)}</category>`).join("\n");
  const playlistXml = state.playlists.map((list) => `    <playlist id="${escXml(list.id)}" category="${escXml(list.category)}" level="${escXml(list.level)}" title="${escXml(list.title)}" tags="${escXml(list.tags.join(","))}">\n      <description>${escXml(list.description)}</description>\n${list.videos.map((video) => `      <video id="${escXml(video.id)}" youtubeId="${escXml(video.youtubeId)}" duration="${escXml(video.duration)}" level="${escXml(video.level)}" title="${escXml(video.title)}" tags="${escXml(video.tags.join(","))}">\n        <description>${escXml(video.description)}</description>\n      </video>`).join("\n")}\n    </playlist>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<library version="1.0">\n  <categories>\n${categoryXml}\n  </categories>\n  <playlists>\n${playlistXml}\n  </playlists>\n</library>`;
}

function youtubeEmbedUrl(youtubeId) {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1", enablejsapi: "1", autoplay: "1" });
  if (location.origin && location.origin.startsWith("http")) params.set("origin", location.origin);
  return `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}?${params.toString()}`;
}

function youtubeWatchUrl(video) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(video.youtubeId)}`;
}

function normalizeYoutubeId(input) {
  const value = String(input || "").trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return normalizeYoutubeId(url.pathname.split("/").filter(Boolean)[0]);
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (url.pathname === "/watch") return normalizeYoutubeId(url.searchParams.get("v"));
      if (url.pathname.startsWith("/embed/")) return normalizeYoutubeId(url.pathname.split("/")[2]);
      if (url.pathname.startsWith("/shorts/")) return normalizeYoutubeId(url.pathname.split("/")[2]);
    }
  } catch { return ""; }
  return "";
}

function allVideos() { return state.playlists.flatMap((list) => list.videos.map((video) => ({ ...video, playlistId: list.id, playlistTitle: list.title, category: list.category }))); }
function firstPlaylist() { return state.playlists.find((list) => list.videos.length) || state.playlists[0]; }
function getPlaylist(id) { return state.playlists.find((list) => list.id === id) || firstPlaylist(); }
function getVideo(list, id) { return list?.videos?.find((video) => video.id === id) || list?.videos?.[0]; }
function setActive(playlistId, videoId, updateUrl) { if (!playlistId || !videoId) return; state.active = { playlistId, videoId }; saveJson(APP.storage.active, state.active); if (updateUrl) history.replaceState(null, "", `videos.html?playlist=${encodeURIComponent(playlistId)}&video=${encodeURIComponent(videoId)}`); }
function categoryName(id) { return state.categories.find((cat) => cat.id === id)?.title || id || "Sans catégorie"; }
function thumb(id, quality = "hqdefault") { return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${quality}.jpg`; }
function splitTags(value) { return String(value || "").split(",").map((tag) => tag.trim()).filter(Boolean); }
function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function slug(value) { return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `item-${Date.now()}`; }
function readJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function saveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
function escXml(value) { return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char])); }
