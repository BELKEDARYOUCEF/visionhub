const APP = {
  libraryUrl: "data/library.xml",
  workspaceUrl: "data/workspace.xml",
  resourcesUrl: "data/resources.xml",
  videoIntelligenceUrl: "data/video-intelligence.xml",
  financeUrl: "data/finance.xml",
  storage: {
    additions: "visionhub-v2-additions",
    library: "visionhub-v2-library",
    admin: "visionhub-v2-admin",
    favorites: "visionhub-v2-favorites",
    active: "visionhub-v2-active",
    workspace: "visionhub-v2-workspace",
    finance: "visionhub-v2-finance"
  }
};

const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<library version="fallback"><categories><category id="web" title="Développement Web" icon="&lt;/&gt;">JavaScript, CSS et front-end.</category><category id="ia" title="Intelligence Artificielle" icon="AI">Prompts et agents IA.</category></categories><playlists><playlist id="demo" category="web" level="Débutant" title="Playlist démo" tags="Demo,YouTube"><description>Playlist locale de secours.</description><video id="html-crash" youtubeId="UB1O30fR-EE" duration="1:00:42" level="Débutant" title="HTML Crash Course" tags="HTML"><description>Vidéo publique YouTube de démonstration.</description></video></playlist></playlists><files></files><finance></finance></library>`;

let state = {
  categories: [],
  playlists: [],
  files: [],
  importedVideos: [],
  videoIntelligence: {},
  finance: { transactions: [], goals: [] },
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
  applyLibraryOverride();
  await loadWorkspace();
  await loadResources();
  await loadVideoIntelligence();
  await loadFinance();
  mergeLocalWorkspace();
  mergeLocalFinance();
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

async function loadDataXml(url) {
  if (location.protocol === "file:") return "";
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`XML HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    console.warn(`${url} indisponible. Données intégrées conservées.`, error);
    return "";
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

  const financeMetrics = [...doc.querySelectorAll("finance > metric")].map((node) => ({
    id: node.getAttribute("id"),
    title: node.getAttribute("title"),
    value: node.getAttribute("value") || "0",
    unit: node.getAttribute("unit") || ""
  }));
  state.finance = {
    transactions: [
      { id: "seed-revenue", type: "revenue", title: "Revenus suivis", category: "Base", amount: Number(financeMetrics.find((item) => item.id === "revenue")?.value || 0), date: "2026-06-09" },
      { id: "seed-expense", type: "expense", title: "Dépenses prévues", category: "Base", amount: Number(financeMetrics.find((item) => item.id === "expenses")?.value || 0), date: "2026-06-09" }
    ].filter((item) => item.amount > 0),
    goals: []
  };
}

async function loadWorkspace() {
  const xmlText = await loadDataXml(APP.workspaceUrl);
  if (!xmlText) return;
  try {
    const doc = xmlDoc(xmlText);
    state.files = [...doc.querySelectorAll("folder")].map((node) => ({
      id: node.getAttribute("id"),
      title: node.getAttribute("title"),
      icon: node.getAttribute("icon") || "folder",
      status: node.getAttribute("status") || "Actif",
      tags: splitTags(node.getAttribute("tags")),
      description: clean(childElement(node, "description")?.textContent),
      files: childElements(node, "item").map((child) => ({
        id: child.getAttribute("id"),
        title: child.getAttribute("title"),
        type: child.getAttribute("type") || "note",
        status: child.getAttribute("status") || "Actif",
        url: child.getAttribute("url") || "",
        tags: splitTags(child.getAttribute("tags")),
        note: clean(child.textContent)
      }))
    }));
  } catch (error) {
    console.error("Erreur dans data/workspace.xml. Données fichiers intégrées conservées.", error);
  }
}

async function loadResources() {
  const xmlText = await loadDataXml(APP.resourcesUrl);
  if (!xmlText) return;
  try {
    const doc = xmlDoc(xmlText);
    const folders = [...doc.querySelectorAll("folder")].map((node) => ({
      id: node.getAttribute("id"),
      title: node.getAttribute("title"),
      icon: node.getAttribute("icon") || "link",
      status: node.getAttribute("status") || "Importé",
      tags: splitTags(node.getAttribute("tags")),
      description: clean(childElement(node, "description")?.textContent),
      files: childElements(node, "item").map((child) => ({
        id: child.getAttribute("id"),
        title: child.getAttribute("title"),
        type: child.getAttribute("type") || "lien",
        status: child.getAttribute("status") || "Importé",
        url: child.getAttribute("url") || "",
        source: child.getAttribute("source") || "",
        youtubeId: child.getAttribute("youtubeId") || "",
        tags: splitTags(child.getAttribute("tags")),
        note: clean(child.textContent)
      }))
    }));
    integrateImportedVideos(folders);
    folders.forEach((folder) => {
      const existing = state.files.find((item) => item.id === folder.id);
      if (existing) {
        existing.files = [...existing.files, ...folder.files.filter((file) => !existing.files.some((item) => item.id === file.id))];
        existing.tags = [...new Set([...(existing.tags || []), ...folder.tags])];
      } else {
        state.files.push(folder);
      }
    });
  } catch (error) {
    console.error("Erreur dans data/resources.xml. Catalogue ressources ignoré.", error);
  }
}

function integrateImportedVideos(folders) {
  const libraryYoutubeIds = new Set(allVideos().map((video) => video.youtubeId).filter(Boolean));
  const importedByYoutubeId = new Map();

  folders.forEach((folder) => {
    ensureCategoryFromResourceFolder(folder);
    folder.files
      .filter((file) => file.type === "video" || file.youtubeId || normalizeYoutubeId(file.url))
      .forEach((file) => {
        const youtubeId = normalizeYoutubeId(file.youtubeId || file.url);
        if (!youtubeId || libraryYoutubeIds.has(youtubeId) || importedByYoutubeId.has(youtubeId)) return;
        const playlistId = importedPlaylistId(folder.id);
        importedByYoutubeId.set(youtubeId, {
          id: uniqueAdminId(file.id || slug(file.title || youtubeId), [...importedByYoutubeId.values()]),
          playlistId,
          category: folder.id,
          title: clean(file.title) || `Vidéo YouTube ${youtubeId}`,
          description: clean(file.note) || "Vidéo YouTube importée depuis data/resources.xml.",
          youtubeId,
          duration: "À vérifier",
          level: "À classer",
          tags: [...new Set(["Importée", ...(file.tags || []).filter((tag) => tag.toLowerCase() !== "video")])],
          imported: true,
          source: file.source || folder.title,
          folderId: folder.id,
          folderTitle: folder.title
        });
      });
  });

  const importedByPlaylist = [...importedByYoutubeId.values()].reduce((groups, video) => {
    if (!groups.has(video.playlistId)) groups.set(video.playlistId, []);
    groups.get(video.playlistId).push(video);
    return groups;
  }, new Map());

  state.importedVideos = [...importedByYoutubeId.values()];
  importedByPlaylist.forEach((videos, playlistId) => {
    const folder = folders.find((item) => importedPlaylistId(item.id) === playlistId);
    if (!folder) return;
    const existing = state.playlists.find((item) => item.id === playlistId);
    const nextVideos = videos.map((video) => enrichVideoRecord(video));
    if (existing) {
      const currentIds = new Set(existing.videos.map((video) => video.youtubeId));
      existing.videos = [...existing.videos, ...nextVideos.filter((video) => !currentIds.has(video.youtubeId))];
    } else {
      state.playlists.push({
        id: playlistId,
        title: `Ressources importées — ${folder.title}`,
        description: `Vidéos YouTube importées depuis le dossier ${folder.title} de data/resources.xml.`,
        category: folder.id,
        level: "À classer",
        tags: [...new Set(["Importées", ...(folder.tags || [])])],
        imported: true,
        videos: nextVideos
      });
    }
  });
}

function ensureCategoryFromResourceFolder(folder) {
  if (!folder?.id || state.categories.some((cat) => cat.id === folder.id)) return;
  state.categories.push({
    id: folder.id,
    title: folder.title || folder.id,
    icon: folder.icon || (folder.title || folder.id).slice(0, 2),
    color: "cyan",
    description: folder.description || "Catégorie importée depuis data/resources.xml."
  });
}

async function loadVideoIntelligence() {
  const xmlText = await loadDataXml(APP.videoIntelligenceUrl);
  if (!xmlText) return;
  try {
    const doc = xmlDoc(xmlText);
    state.videoIntelligence = Object.fromEntries([...doc.querySelectorAll("video")].map((node) => [
      node.getAttribute("youtubeId"),
      {
        youtubeId: node.getAttribute("youtubeId"),
        title: node.getAttribute("title"),
        originalTitle: node.getAttribute("originalTitle") || "",
        description: clean(childElement(node, "description")?.textContent),
        tags: splitTags(node.getAttribute("tags")),
        level: node.getAttribute("level") || "",
        topic: node.getAttribute("topic") || "",
        domain: node.getAttribute("domain") || "",
        intent: node.getAttribute("intent") || "",
        confidence: node.getAttribute("confidence") || ""
      }
    ]));
    applyVideoIntelligence();
  } catch (error) {
    console.error("Erreur dans data/video-intelligence.xml. Enrichissement vidéo ignoré.", error);
  }
}

function applyVideoIntelligence() {
  state.playlists.forEach((playlist) => {
    playlist.videos = playlist.videos.map((video) => enrichVideoRecord(video));
  });
  state.files.forEach((folder) => {
    folder.files = folder.files.map((file) => {
      if (!file.youtubeId) return file;
      const enriched = state.videoIntelligence[file.youtubeId];
      if (!enriched) return file;
      return {
        ...file,
        title: enriched.title || file.title,
        status: file.status === "Validé" ? "Enrichi" : file.status,
        tags: [...new Set([...(file.tags || []), ...enriched.tags])],
        topic: enriched.topic,
        domain: enriched.domain,
        intent: enriched.intent,
        note: enriched.description || file.note
      };
    });
  });
}

function enrichVideoRecord(video) {
  const enriched = state.videoIntelligence[video.youtubeId];
  if (!enriched) return video;
  return {
    ...video,
    rawTitle: video.title,
    title: enriched.title || video.title,
    description: enriched.description || video.description,
    level: enriched.level || video.level,
    tags: [...new Set([...(video.tags || []), ...enriched.tags])],
    topic: enriched.topic,
    domain: enriched.domain,
    intent: enriched.intent,
    confidence: enriched.confidence
  };
}

async function loadFinance() {
  const xmlText = await loadDataXml(APP.financeUrl);
  if (!xmlText) return;
  try {
    const doc = xmlDoc(xmlText);
    state.finance = {
      transactions: [...doc.querySelectorAll("transaction")].map((node) => ({
        id: node.getAttribute("id"),
        type: node.getAttribute("type") || "expense",
        title: node.getAttribute("title"),
        category: node.getAttribute("category") || "Général",
        amount: Number(node.getAttribute("amount") || 0),
        date: node.getAttribute("date") || "",
        note: clean(node.textContent)
      })),
      goals: [...doc.querySelectorAll("goal")].map((node) => ({
        id: node.getAttribute("id"),
        title: node.getAttribute("title"),
        target: Number(node.getAttribute("target") || 0),
        current: Number(node.getAttribute("current") || 0),
        deadline: node.getAttribute("deadline") || "",
        category: node.getAttribute("category") || "Objectif"
      }))
    };
  } catch (error) {
    console.error("Erreur dans data/finance.xml. Données finance intégrées conservées.", error);
  }
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

function applyLibraryOverride() {
  const override = readJson(APP.storage.library, null);
  if (!override?.categories?.length || !Array.isArray(override.playlists)) return;
  state.categories = override.categories.map((cat) => ({
    id: slug(cat.id || cat.title),
    title: cat.title || "Catégorie",
    icon: cat.icon || cat.title?.slice(0, 2) || "VH",
    color: cat.color || "cyan",
    description: cat.description || ""
  }));
  state.playlists = override.playlists
    .filter((list) => state.categories.some((cat) => cat.id === list.category))
    .map((list) => {
      const playlistId = slug(list.id || list.title);
      return {
        id: playlistId,
        title: list.title || "Playlist",
        description: list.description || "",
        category: list.category,
        level: list.level || "Débutant",
        tags: Array.isArray(list.tags) ? list.tags : splitTags(list.tags),
        imported: Boolean(list.imported),
        videos: (list.videos || []).map((video) => ({
          id: slug(video.id || video.title),
          playlistId,
          category: list.category,
          title: video.title || "Vidéo",
          description: video.description || "",
          youtubeId: normalizeYoutubeId(video.youtubeId || video.youtube),
          duration: video.duration || "0:00",
          level: video.level || list.level || "Débutant",
          tags: Array.isArray(video.tags) ? video.tags : splitTags(video.tags),
          imported: Boolean(video.imported || list.imported),
          source: video.source || "",
          folderId: video.folderId || list.category,
          folderTitle: video.folderTitle || categoryName(list.category)
        })).filter((video) => video.youtubeId)
      };
    });
}

function saveLibraryOverride() {
  state.playlists.forEach((list) => {
    list.videos = list.videos.map((video) => ({ ...video, playlistId: list.id, category: list.category }));
  });
  saveJson(APP.storage.library, { categories: state.categories, playlists: state.playlists });
}

function mergeLocalWorkspace() {
  const additions = readJson(APP.storage.workspace, { folders: [], files: [] });
  additions.folders?.forEach((folder) => {
    if (!state.files.some((item) => item.id === folder.id)) state.files.push({ ...folder, files: [] });
  });
  additions.files?.forEach((file) => {
    const folder = state.files.find((item) => item.id === file.folderId);
    if (folder && !folder.files.some((item) => item.id === file.id)) folder.files.push(file);
  });
}

function mergeLocalFinance() {
  const additions = readJson(APP.storage.finance, { transactions: [], goals: [] });
  additions.transactions?.forEach((item) => {
    if (!state.finance.transactions.some((tx) => tx.id === item.id)) state.finance.transactions.push(item);
  });
  additions.goals?.forEach((item) => {
    if (!state.finance.goals.some((goal) => goal.id === item.id)) state.finance.goals.push(item);
  });
}

function route() {
  const routes = {
    home: renderHome,
    playlists: renderPlaylists,
    videos: renderVideos,
    files: renderFiles,
    finance: renderFinance,
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
        <p>Une bibliothèque claire pour organiser vidéos, fichiers, apprentissage et suivi business au même endroit.</p>
        <div class="hero-actions">
          <a class="btn primary" href="videos.html">Ouvrir le lecteur</a>
          <a class="btn" href="playlists.html">Gérer les playlists</a>
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
      ${appCard("Administration", "Gestion progressive de la bibliothèque.", "playlists.html")}
    </div></section>`;
}

function appCard(title, text, href) {
  return `<article class="content-card"><span class="tag">Module</span><h3>${title}</h3><p>${text}</p><a class="btn" href="${href}">Ouvrir</a></article>`;
}

function renderPlaylists() {
  const params = new URLSearchParams(location.search);
  const current = params.get("category") || "all";
  return `<section><div class="page-head"><div><p class="kicker">Bibliothèque</p><h1>Playlists dynamiques.</h1><p class="section-intro">Recherche, filtre par catégorie et lance directement la bonne vidéo.</p></div><div class="hero-actions"><button class="btn primary" id="openAdminPanel">Administration</button><button class="btn" id="exportLibraryFromPlaylists">Exporter XML</button></div></div>
    <div class="filter-bar"><input class="search-input" id="playlistSearch" type="search" placeholder="Rechercher une playlist, tag ou catégorie"><div class="filter-tabs" id="playlistFilters">${filterButtons(current)}</div></div>
    <div class="playlist-grid" id="playlistGrid">${state.playlists.map(playlistCard).join("")}</div><div id="playlistEmpty"></div>${renderImportedVideosSection("playlists")}${renderAdminDrawer()}<pre class="code-box export-box" id="playlistXmlOutput" hidden></pre></section>`;
}

function filterButtons(current) {
  return `<button class="tab-btn ${current === "all" ? "active" : ""}" data-category="all">Tout</button>${state.categories.map((cat) => `<button class="tab-btn ${current === cat.id ? "active" : ""}" data-category="${cat.id}">${escapeHtml(cat.title)}</button>`).join("")}`;
}

function playlistCard(list) {
  const first = list.videos[0];
  const image = first?.youtubeId ? thumb(first.youtubeId) : "";
  const search = `${list.title} ${list.description} ${categoryName(list.category)} ${list.tags.join(" ")}`.toLowerCase();
  const href = first ? `videos.html?playlist=${encodeURIComponent(list.id)}&video=${encodeURIComponent(first.id)}` : "playlists.html?admin=imports";
  const imported = list.imported ? `<span class="tag">Importées</span>` : "";
  return `<article class="playlist-card" data-playlist-card data-category="${list.category}" data-search="${escapeAttr(search)}"><div class="playlist-thumb" style="background-image:linear-gradient(180deg, transparent, rgba(7,10,18,.86)), url('${image}')"></div><div class="card-meta"><span class="badge">${categoryName(list.category)}</span><span class="level">${escapeHtml(list.level)}</span><span class="badge">${list.videos.length} vidéos</span>${imported}</div><h3>${escapeHtml(list.title)}</h3><p>${escapeHtml(list.description)}</p><div class="chip-row">${list.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div><a class="btn primary" href="${href}">Explorer</a></article>`;
}

function renderAdminDrawer() {
  const admin = readJson(APP.storage.admin, {});
  const selectedCategoryId = admin.categoryId || state.categories[0]?.id || "";
  const selectedPlaylist = getPlaylist(admin.playlistId) || state.playlists[0];
  const selectedPlaylistId = selectedPlaylist?.id || "";
  const selectedVideo = getVideo(selectedPlaylist, admin.videoId);
  const selectedVideoId = selectedVideo?.id || "";
  return `<div class="admin-overlay" id="adminOverlay" hidden></div>
    <aside class="admin-drawer" id="adminDrawer" aria-label="Administration de la bibliothèque" hidden>
      <div class="admin-head"><div><p class="kicker">Administration</p><h2>Bibliothèque</h2></div><button class="btn ghost" id="closeAdminPanel">Fermer</button></div>
      <div class="admin-grid">
        <section class="admin-section">
          <div class="admin-section-head"><h3>Catégories</h3><span class="badge">${state.categories.length}</span></div>
          <form id="categoryAdminForm" class="studio-form">
            <label>Catégorie<select class="select-input" name="id" id="categoryAdminSelect"><option value="__new__">Nouvelle catégorie</option>${state.categories.map((cat) => `<option value="${cat.id}" ${cat.id === selectedCategoryId ? "selected" : ""}>${escapeHtml(cat.title)}</option>`).join("")}</select></label>
            <label>Nom<input class="search-input" name="title" required></label>
            <label>Icône<input class="search-input" name="icon" maxlength="8"></label>
            <label>Couleur<input class="search-input" name="color" placeholder="cyan, violet, orange"></label>
            <label>Description<textarea name="description"></textarea></label>
            <div class="admin-actions"><button class="btn primary">Enregistrer</button><button class="btn danger" type="button" data-admin-delete="category">Supprimer</button></div>
          </form>
          <form id="mergeCategoryForm" class="studio-form compact-admin-form">
            <label>Fusionner<select class="select-input" name="from">${state.categories.map((cat) => `<option value="${cat.id}">${escapeHtml(cat.title)}</option>`).join("")}</select></label>
            <label>Vers<select class="select-input" name="to">${state.categories.map((cat) => `<option value="${cat.id}">${escapeHtml(cat.title)}</option>`).join("")}</select></label>
            <button class="btn" type="submit">Fusionner</button>
          </form>
          <div class="admin-list" id="categoryAdminList">${state.categories.map((cat) => adminRow("category", cat.id, cat.title, `${playlistsByCategory(cat.id).length} playlists`)).join("")}</div>
        </section>

        <section class="admin-section">
          <div class="admin-section-head"><h3>Playlists</h3><span class="badge">${state.playlists.length}</span></div>
          <form id="playlistAdminForm" class="studio-form">
            <label>Playlist<select class="select-input" name="id" id="playlistAdminSelect"><option value="__new__">Nouvelle playlist</option>${state.playlists.map((list) => `<option value="${list.id}" ${list.id === selectedPlaylistId ? "selected" : ""}>${escapeHtml(list.title)}</option>`).join("")}</select></label>
            <label>Titre<input class="search-input" name="title" required></label>
            <label>Catégorie<select class="select-input" name="category">${state.categories.map((cat) => `<option value="${cat.id}">${escapeHtml(cat.title)}</option>`).join("")}</select></label>
            <label>Niveau<input class="search-input" name="level" value="Débutant"></label>
            <label>Tags<input class="search-input" name="tags"></label>
            <label>Description<textarea name="description"></textarea></label>
            <div class="admin-actions"><button class="btn primary">Enregistrer</button><button class="btn danger" type="button" data-admin-delete="playlist">Supprimer</button></div>
          </form>
          <div class="admin-list" id="playlistAdminList">${state.playlists.map((list) => adminRow("playlist", list.id, list.title, `${categoryName(list.category)} · ${list.videos.length} vidéos`)).join("")}</div>
        </section>

        <section class="admin-section">
          <div class="admin-section-head"><h3>Vidéos</h3><span class="badge">${allVideos().length}</span></div>
          <form id="videoAdminForm" class="studio-form">
            <label>Playlist<select class="select-input" name="playlistId" id="videoPlaylistSelect">${state.playlists.map((list) => `<option value="${list.id}" ${list.id === selectedPlaylistId ? "selected" : ""}>${escapeHtml(list.title)}</option>`).join("")}</select></label>
            <label>Vidéo<select class="select-input" name="id" id="videoAdminSelect"><option value="__new__">Nouvelle vidéo</option>${(selectedPlaylist?.videos || []).map((video) => `<option value="${video.id}" ${video.id === selectedVideoId ? "selected" : ""}>${escapeHtml(video.title)}</option>`).join("")}</select></label>
            <label>Titre<input class="search-input" name="title" required></label>
            <label>Lien ou ID YouTube<input class="search-input" name="youtube" required></label>
            <label>Déplacer vers<select class="select-input" name="targetPlaylistId">${state.playlists.map((list) => `<option value="${list.id}" ${list.id === selectedPlaylistId ? "selected" : ""}>${escapeHtml(list.title)}</option>`).join("")}</select></label>
            <label>Durée<input class="search-input" name="duration" value="0:00"></label>
            <label>Niveau<input class="search-input" name="level" value="Débutant"></label>
            <label>Tags<input class="search-input" name="tags"></label>
            <label>Description<textarea name="description"></textarea></label>
            <div class="admin-actions"><button class="btn primary">Enregistrer</button><button class="btn danger" type="button" data-admin-delete="video">Supprimer</button></div>
          </form>
          <div class="admin-list" id="videoAdminList">${(selectedPlaylist?.videos || []).map((video) => adminRow("video", video.id, video.title, video.duration || "0:00", selectedPlaylistId)).join("")}</div>
        </section>

        <section class="admin-section">
          <div class="admin-section-head"><h3>Importées non classées</h3><span class="badge">${unorganizedImportedVideos().length}</span></div>
          <form id="organizeImportedForm" class="studio-form">
            <label>Vidéo<select class="select-input" name="videoKey">${unorganizedImportedVideos().map((video) => `<option value="${importedVideoKey(video)}">${escapeHtml(video.title)}</option>`).join("")}</select></label>
            <label>Catégorie<select class="select-input" name="categoryId">${state.categories.map((cat) => `<option value="${cat.id}">${escapeHtml(cat.title)}</option>`).join("")}</select></label>
            <label>Playlist<select class="select-input" name="playlistId"><option value="__new__">Nouvelle playlist</option>${regularPlaylists().map((list) => `<option value="${list.id}">${escapeHtml(list.title)}</option>`).join("")}</select></label>
            <label>Nom nouvelle playlist<input class="search-input" name="newPlaylistTitle" placeholder="Ex. À regarder — IA"></label>
            <button class="btn primary">Ajouter à la playlist</button>
          </form>
          <div class="admin-list">${unorganizedImportedVideos().slice(0, 80).map((video) => adminRow("imported", importedVideoKey(video), video.title, `${categoryName(video.category)} · ${video.source || "resources.xml"}`)).join("") || `<div class="empty-state"><strong>Aucune vidéo importée non classée</strong></div>`}</div>
        </section>
      </div>
    </aside>`;
}

function adminRow(kind, id, title, meta, parentId = "") {
  return `<div class="admin-row" draggable="true" data-admin-row="${kind}" data-id="${escapeAttr(id)}" data-parent="${escapeAttr(parentId)}"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(meta)}</small></span><span class="admin-row-actions"><button class="mini-btn" type="button" data-admin-edit="${kind}" data-id="${escapeAttr(id)}" data-parent="${escapeAttr(parentId)}">Éditer</button><button class="mini-btn" type="button" data-admin-move="up" data-kind="${kind}" data-id="${escapeAttr(id)}" data-parent="${escapeAttr(parentId)}">↑</button><button class="mini-btn" type="button" data-admin-move="down" data-kind="${kind}" data-id="${escapeAttr(id)}" data-parent="${escapeAttr(parentId)}">↓</button></span></div>`;
}

function renderVideos() {
  const params = new URLSearchParams(location.search);
  const playlist = getPlaylist(params.get("playlist") || state.active.playlistId) || firstPlaylist();
  const video = getVideo(playlist, params.get("video") || state.active.videoId) || playlist.videos[0];
  setActive(playlist?.id, video?.id, false);
  return `<section class="video-page"><div class="page-head"><div><p class="kicker">Lecteur vidéo</p><h1>${escapeHtml(playlist.title)}</h1><p class="section-intro">Choisis une vidéo, lance la lecture et garde ta progression organisée par playlist.</p></div><select class="select-input" id="playlistSelect">${state.playlists.map((item) => `<option value="${item.id}" ${item.id === playlist.id ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}</select></div>
    <div class="player-layout">
      <article class="player-shell"><div class="player-frame" id="playerFrame">${renderPlayerPoster(video)}</div><div class="player-info" id="playerInfo">${videoInfo(video)}</div></article>
      <aside><input class="search-input video-search" id="videoSearch" type="search" placeholder="Rechercher une vidéo"><div class="video-list" id="videoList">${playlist.videos.map((item) => videoRow(item, playlist.id, item.id === video.id)).join("")}</div><div id="videoEmpty"></div></aside>
    </div>${renderImportedVideosSection("videos")}</section>`;
}

function renderImportedVideosSection(context) {
  const imported = importedVideosForUi();
  if (!imported.length) return "";
  const categories = [...new Set(imported.map((video) => video.category))];
  const sources = [...new Set(imported.map((video) => sourceFolder(video.source)).filter(Boolean))].slice(0, 80);
  return `<section class="section imported-section" data-imported-section="${context}">
    <div class="page-head"><div><p class="kicker">Vidéos importées</p><h2>Ressources YouTube importées.</h2><p class="section-intro">${imported.length} vidéos issues de data/resources.xml, sans backend ni API YouTube.</p></div></div>
    <div class="filter-bar imported-tools">
      <input class="search-input" id="importedSearch" type="search" placeholder="Rechercher une vidéo importée">
      <select class="select-input" id="importedCategory"><option value="all">Toutes les catégories</option>${categories.map((id) => `<option value="${id}">${escapeHtml(categoryName(id))}</option>`).join("")}</select>
      <select class="select-input" id="importedSource"><option value="all">Toutes les sources</option>${sources.map((source) => `<option value="${escapeAttr(source)}">${escapeHtml(source)}</option>`).join("")}</select>
    </div>
    <div class="imported-video-grid" id="importedVideoGrid">${imported.map(importedVideoCard).join("")}</div>
    <div id="importedEmpty"></div>
  </section>`;
}

function importedVideoCard(video) {
  const search = `${video.title} ${video.description} ${categoryName(video.category)} ${video.source || ""} ${video.tags.join(" ")}`.toLowerCase();
  const source = sourceFolder(video.source);
  return `<article class="imported-video-card" data-imported-video data-category="${escapeAttr(video.category)}" data-source="${escapeAttr(source)}" data-search="${escapeAttr(search)}">
    <img class="media-thumb" src="${thumb(video.youtubeId)}" alt="Miniature ${escapeAttr(video.title)}" loading="lazy">
    <div class="card-meta"><span class="badge">${escapeHtml(categoryName(video.category))}</span><span class="level">${escapeHtml(video.level)}</span></div>
    <h3>${escapeHtml(video.title)}</h3>
    <p>${escapeHtml(source || video.source || "resources.xml")}</p>
    <div class="card-actions"><a class="btn primary" href="videos.html?playlist=${encodeURIComponent(video.playlistId)}&video=${encodeURIComponent(video.id)}">Regarder</a><a class="btn" href="playlists.html?admin=imports">Organiser</a></div>
  </article>`;
}

function renderPlayerPoster(video) {
  if (!video?.youtubeId) return `<div class="empty-state"><strong>ID YouTube invalide</strong><p>Ajoute une URL YouTube publique depuis l'administration.</p></div>`;
  return `<div class="player-poster" style="background-image:url('${thumb(video.youtubeId, "maxresdefault")}')"><div class="play-stack"><button class="play-orb" data-load-youtube="${video.id}" aria-label="Lire ${escapeAttr(video.title)}">▶</button><strong>${escapeHtml(video.title)}</strong><small>Cliquer pour charger le lecteur YouTube</small></div></div>`;
}

function loadYoutubeIntoFrame(video) {
  const frame = document.querySelector("#playerFrame");
  if (!frame || !video?.youtubeId) return;
  if (location.protocol === "file:") {
    frame.innerHTML = `<div class="empty-state"><strong>Lecture indisponible ici</strong><p>Ouvre la vidéo sur YouTube ou lance VisionHub depuis le serveur local.</p><a class="btn primary" href="${youtubeWatchUrl(video)}" target="_blank" rel="noreferrer">Ouvrir sur YouTube</a></div>`;
    return;
  }
  const src = youtubeEmbedUrl(video.youtubeId);
  frame.innerHTML = `<iframe src="${src}" title="${escapeAttr(video.title)}" referrerpolicy="strict-origin-when-cross-origin" loading="eager" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

function videoInfo(video) {
  const topic = video.topic ? `<span class="badge">${escapeHtml(video.topic)}</span>` : "";
  const domain = video.domain ? `<span class="badge">${escapeHtml(video.domain)}</span>` : "";
  const intent = video.intent ? `<span class="badge">${escapeHtml(video.intent)}</span>` : "";
  return `<div class="card-meta"><span class="badge">${categoryName(video.category)}</span>${domain}${topic}${intent}<span class="level">${escapeHtml(video.level)}</span><span class="badge">${escapeHtml(video.duration)}</span></div><h2>${escapeHtml(video.title)}</h2><p>${escapeHtml(video.description)}</p><div class="player-actions"><button class="btn primary" data-favorite="${video.id}">${state.favorites.includes(video.id) ? "Retirer des favoris" : "Ajouter aux favoris"}</button><a class="btn" href="${youtubeWatchUrl(video)}" target="_blank" rel="noreferrer">Ouvrir sur YouTube</a></div>`;
}

function videoRow(video, playlistId, isActive) {
  const search = `${video.title} ${video.description} ${video.level} ${video.topic || ""} ${video.domain || ""} ${video.intent || ""} ${video.tags.join(" ")}`.toLowerCase();
  const topic = video.topic ? `<span class="badge">${escapeHtml(video.topic)}</span>` : "";
  const domain = video.domain ? `<span class="badge">${escapeHtml(video.domain)}</span>` : "";
  return `<button class="video-row ${isActive ? "active" : ""}" data-video-row data-playlist="${playlistId}" data-video="${video.id}" data-search="${escapeAttr(search)}"><img class="video-thumb" src="${thumb(video.youtubeId)}" alt="Miniature ${escapeAttr(video.title)}" loading="lazy"><span><h3>${escapeHtml(video.title)}</h3><p>${escapeHtml(video.description)}</p><span class="video-meta">${domain}${topic}<span class="badge">${escapeHtml(video.duration)}</span><span class="level">${escapeHtml(video.level)}</span></span></span></button>`;
}

function renderFiles() {
  return `<section><div class="page-head"><div><p class="kicker">File OS</p><h1>Organisation des fichiers.</h1><p class="section-intro">Dossiers, notes, liens, tags, statuts, recherche et export versionnable.</p></div><button class="btn" id="exportWorkspace">Exporter XML</button></div>
    <div class="filter-bar workspace-tools"><input class="search-input" id="fileSearch" type="search" placeholder="Rechercher un dossier, lien, note, tag ou statut"><div class="filter-tabs" id="fileView"><button class="tab-btn active" data-view="grid">Grille</button><button class="tab-btn" data-view="list">Liste</button></div></div>
    <div class="workspace-layout">
      <div><div class="file-grid" id="fileGrid">${state.files.map(folderCard).join("")}</div><div id="fileEmpty"></div></div>
      <aside class="studio-panel"><h2>Ajouter localement</h2><form id="folderForm" class="studio-form"><label>Dossier<input class="search-input" name="title" required></label><label>Description<textarea name="description"></textarea></label><label>Tags<input class="search-input" name="tags" placeholder="Clients, Docs, Priorité"></label><button class="btn primary">Créer dossier</button></form><hr class="soft-line"><form id="fileForm" class="studio-form"><label>Dans<select class="select-input" name="folderId">${state.files.map((folder) => `<option value="${folder.id}">${escapeHtml(folder.title)}</option>`).join("")}</select></label><label>Titre<input class="search-input" name="title" required></label><label>Type<select class="select-input" name="type"><option>note</option><option>lien</option><option>document</option><option>table</option></select></label><label>URL<input class="search-input" name="url" placeholder="https://..."></label><label>Statut<input class="search-input" name="status" value="Actif"></label><label>Tags<input class="search-input" name="tags"></label><button class="btn primary">Ajouter item</button></form></aside>
    </div><pre class="code-box export-box" id="workspaceOutput" hidden></pre></section>`;
}

function renderFinance() {
  const revenue = financeTotal("revenue");
  const expenses = financeTotal("expense");
  const balance = revenue - expenses;
  return `<section><div class="page-head"><div><p class="kicker">Finance cockpit</p><h1>Suivi finance léger.</h1><p class="section-intro">Revenus, dépenses, budget, objectifs et export. Ce module n’est pas une comptabilité officielle.</p></div><div class="hero-actions"><button class="btn" id="exportFinanceCsv">CSV</button><button class="btn" id="exportFinanceXml">XML</button></div></div>
    <div class="grid-3"><article class="metric-card"><span class="eyebrow">Revenus</span><strong>${money(revenue)}</strong><p>Total des entrées suivies.</p></article><article class="metric-card"><span class="eyebrow">Dépenses</span><strong>${money(expenses)}</strong><p>Total des sorties prévues ou payées.</p></article><article class="metric-card"><span class="eyebrow">Solde</span><strong>${money(balance)}</strong><p>Budget disponible estimé.</p></article></div>
    <div class="finance-layout section"><article class="studio-panel"><h2>Transactions</h2><form id="transactionForm" class="studio-form compact-form"><select class="select-input" name="type"><option value="revenue">Revenu</option><option value="expense">Dépense</option></select><input class="search-input" name="title" placeholder="Libellé" required><input class="search-input" name="category" placeholder="Catégorie" required><input class="search-input" name="amount" type="number" min="0" step="0.01" placeholder="Montant" required><input class="search-input" name="date" type="date" required><button class="btn primary">Ajouter</button></form><div class="transaction-list">${state.finance.transactions.map(transactionRow).join("") || `<div class="empty-state"><strong>Aucune transaction</strong></div>`}</div></article>
    <aside class="studio-panel"><h2>Objectifs</h2><form id="goalForm" class="studio-form"><label>Objectif<input class="search-input" name="title" required></label><label>Cible<input class="search-input" name="target" type="number" min="0" step="0.01" required></label><label>Actuel<input class="search-input" name="current" type="number" min="0" step="0.01" value="0"></label><label>Échéance<input class="search-input" name="deadline" type="date"></label><button class="btn primary">Ajouter objectif</button></form><div class="goal-list">${state.finance.goals.map(goalCard).join("") || `<p class="meta">Ajoute un objectif pour suivre sa progression.</p>`}</div></aside></div><pre class="code-box export-box" id="financeOutput" hidden></pre></section>`;
}

function folderCard(folder) {
  const search = `${folder.title} ${folder.description} ${folder.status} ${folder.tags.join(" ")} ${folder.files.map((file) => `${file.title} ${file.type} ${file.status} ${file.tags?.join(" ")} ${file.note}`).join(" ")}`.toLowerCase();
  return `<article class="file-card" data-file-card data-search="${escapeAttr(search)}"><div class="file-card-head"><span class="category-icon">${escapeHtml(folder.icon)}</span><span class="level">${escapeHtml(folder.status || "Actif")}</span></div><h3>${escapeHtml(folder.title)}</h3><p>${escapeHtml(folder.description || "Dossier de travail VisionHub.")}</p><div class="chip-row">${folder.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div><div class="resource-list">${folder.files.map(resourceRow).join("") || `<p class="meta">Aucun item.</p>`}</div></article>`;
}

function resourceRow(file) {
  const title = escapeHtml(file.title);
  const source = file.source ? ` · ${escapeHtml(file.source)}` : "";
  const label = `<strong>${title}</strong><span>${escapeHtml(file.type)} · ${escapeHtml(file.status)}${source}</span>`;
  return file.url ? `<a class="resource-row" href="${escapeAttr(file.url)}" target="_blank" rel="noreferrer">${label}</a>` : `<div class="resource-row">${label}</div>`;
}

function transactionRow(item) {
  return `<div class="transaction-row"><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.date)}</small></span><strong class="${item.type === "revenue" ? "amount-good" : "amount-bad"}">${item.type === "revenue" ? "+" : "-"}${money(item.amount)}</strong></div>`;
}

function goalCard(goal) {
  const percent = goal.target ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  return `<article class="goal-card"><div class="card-meta"><strong>${escapeHtml(goal.title)}</strong><span>${percent}%</span></div><div class="progress"><span style="width:${percent}%"></span></div><p>${money(goal.current)} / ${money(goal.target)}${goal.deadline ? ` · ${escapeHtml(goal.deadline)}` : ""}</p></article>`;
}

function renderAbout() {
  return `<section><div class="page-head"><div><p class="kicker">Architecture produit</p><h1>Un OS personnel modulaire, vendable et évolutif.</h1><p class="section-intro">La version statique pose les bases : pages séparées, XML, localStorage, design premium. La suite peut migrer vers SQLite, Supabase ou PostgreSQL.</p></div></div><div class="grid-3">${appCard("Phase 1", "Stabiliser vidéo + XML + GitHub Pages.", "videos.html")}${appCard("Phase 2", "File OS, ressources, notes et tags avancés.", "files.html")}${appCard("Phase 3", "Finance, CRM, projets et futur backend.", "finance.html")}</div></section>`;
}

function bindPage() {
  bindFavorites();
  if (page === "playlists") bindPlaylistFilters();
  if (page === "videos") bindVideos();
  if (page === "files") bindFiles();
  if (page === "finance") bindFinance();
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
  document.querySelector("#exportLibraryFromPlaylists")?.addEventListener("click", () => showExport("#playlistXmlOutput", exportXml()));
  bindImportedFilters();
  bindAdminPanel();
  if (params.get("admin") === "imports") document.querySelector("#openAdminPanel")?.click();
}

function bindAdminPanel() {
  const drawer = document.querySelector("#adminDrawer");
  const overlay = document.querySelector("#adminOverlay");
  if (!drawer || !overlay) return;

  const setOpen = (open) => {
    drawer.hidden = !open;
    overlay.hidden = !open;
    document.body.classList.toggle("admin-open", open);
    saveJson(APP.storage.admin, { ...readJson(APP.storage.admin, {}), open });
  };

  document.querySelector("#openAdminPanel")?.addEventListener("click", () => setOpen(true));
  document.querySelector("#closeAdminPanel")?.addEventListener("click", () => setOpen(false));
  overlay.addEventListener("click", () => setOpen(false));
  if (readJson(APP.storage.admin, {}).open) setOpen(true);

  fillAdminForms();
  bindCategoryAdmin();
  bindPlaylistAdmin();
  bindVideoAdmin();
  bindImportedAdmin();
  bindAdminRows();
}

function fillAdminForms() {
  const admin = readJson(APP.storage.admin, {});
  fillCategoryForm(admin.categoryId || state.categories[0]?.id);
  fillPlaylistForm(admin.playlistId || state.playlists[0]?.id);
  fillVideoForm(admin.playlistId || state.playlists[0]?.id, admin.videoId);
}

function bindCategoryAdmin() {
  document.querySelector("#categoryAdminSelect")?.addEventListener("change", (event) => {
    saveAdminSelection({ categoryId: event.target.value === "__new__" ? "" : event.target.value });
    fillCategoryForm(event.target.value);
  });
  document.querySelector("#categoryAdminForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const existingId = form.get("id");
    const title = clean(form.get("title"));
    if (!title) return;
    const next = {
      id: existingId === "__new__" ? uniqueAdminId(slug(title), state.categories) : existingId,
      title,
      icon: clean(form.get("icon")) || title.slice(0, 2),
      color: clean(form.get("color")) || "cyan",
      description: clean(form.get("description"))
    };
    const index = state.categories.findIndex((cat) => cat.id === next.id);
    if (index >= 0) state.categories[index] = next;
    else state.categories.push(next);
    saveAdminSelection({ categoryId: next.id });
    persistAdminChanges(true, true);
  });
  document.querySelector("[data-admin-delete='category']")?.addEventListener("click", () => {
    const id = document.querySelector("#categoryAdminSelect")?.value;
    if (!id || id === "__new__") return;
    if (state.categories.length <= 1) { alert("Il faut conserver au moins une catégorie."); return; }
    state.categories = state.categories.filter((cat) => cat.id !== id);
    state.playlists = state.playlists.filter((list) => list.category !== id);
    saveAdminSelection({ categoryId: state.categories[0]?.id || "", playlistId: state.playlists[0]?.id || "", videoId: "" });
    persistAdminChanges(true, true);
  });
  document.querySelector("#mergeCategoryForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const from = form.get("from");
    const to = form.get("to");
    if (!from || !to || from === to) return;
    state.playlists.forEach((list) => { if (list.category === from) list.category = to; });
    state.categories = state.categories.filter((cat) => cat.id !== from);
    saveAdminSelection({ categoryId: to });
    persistAdminChanges(true, true);
  });
}

function bindPlaylistAdmin() {
  document.querySelector("#playlistAdminSelect")?.addEventListener("change", (event) => {
    const id = event.target.value === "__new__" ? "" : event.target.value;
    saveAdminSelection({ playlistId: id, videoId: "" });
    fillPlaylistForm(event.target.value);
  });
  document.querySelector("#playlistAdminForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const existingId = form.get("id");
    const title = clean(form.get("title"));
    if (!title || !form.get("category")) return;
    const previous = state.playlists.find((list) => list.id === existingId);
    const next = {
      id: existingId === "__new__" ? uniqueAdminId(slug(title), state.playlists) : existingId,
      title,
      description: clean(form.get("description")),
      category: form.get("category"),
      level: clean(form.get("level")) || "Débutant",
      tags: splitTags(form.get("tags")),
      videos: previous?.videos || []
    };
    next.videos = next.videos.map((video) => ({ ...video, playlistId: next.id, category: next.category }));
    const index = state.playlists.findIndex((list) => list.id === next.id);
    if (index >= 0) state.playlists[index] = next;
    else state.playlists.push(next);
    saveAdminSelection({ playlistId: next.id, videoId: "" });
    persistAdminChanges(true, true);
  });
  document.querySelector("[data-admin-delete='playlist']")?.addEventListener("click", () => {
    const id = document.querySelector("#playlistAdminSelect")?.value;
    if (!id || id === "__new__") return;
    state.playlists = state.playlists.filter((list) => list.id !== id);
    saveAdminSelection({ playlistId: state.playlists[0]?.id || "", videoId: "" });
    persistAdminChanges(true, true);
  });
}

function bindVideoAdmin() {
  document.querySelector("#videoPlaylistSelect")?.addEventListener("change", (event) => {
    saveAdminSelection({ playlistId: event.target.value, videoId: "" });
    persistAdminChanges(false);
  });
  document.querySelector("#videoAdminSelect")?.addEventListener("change", (event) => {
    saveAdminSelection({ videoId: event.target.value === "__new__" ? "" : event.target.value });
    fillVideoForm(document.querySelector("#videoPlaylistSelect")?.value, event.target.value);
  });
  document.querySelector("#videoAdminForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sourceList = getPlaylist(form.get("playlistId"));
    const targetList = getPlaylist(form.get("targetPlaylistId"));
    const youtubeId = normalizeYoutubeId(form.get("youtube"));
    const title = clean(form.get("title"));
    if (!sourceList || !targetList || !youtubeId || !title) return;
    const existingId = form.get("id");
    const next = {
      id: existingId === "__new__" ? uniqueAdminId(slug(title), targetList.videos) : existingId,
      playlistId: targetList.id,
      category: targetList.category,
      title,
      description: clean(form.get("description")),
      youtubeId,
      duration: clean(form.get("duration")) || "0:00",
      level: clean(form.get("level")) || targetList.level || "Débutant",
      tags: splitTags(form.get("tags"))
    };
    state.playlists.forEach((list) => {
      list.videos = list.videos.filter((video) => video.id !== existingId);
    });
    targetList.videos.push(next);
    saveAdminSelection({ playlistId: targetList.id, videoId: next.id });
    persistAdminChanges(true, true);
  });
  document.querySelector("[data-admin-delete='video']")?.addEventListener("click", () => {
    const playlist = getPlaylist(document.querySelector("#videoPlaylistSelect")?.value);
    const id = document.querySelector("#videoAdminSelect")?.value;
    if (!playlist || !id || id === "__new__") return;
    playlist.videos = playlist.videos.filter((video) => video.id !== id);
    saveAdminSelection({ playlistId: playlist.id, videoId: "" });
    persistAdminChanges(true, true);
  });
}

function bindImportedAdmin() {
  document.querySelector("#organizeImportedForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const video = importedVideosForUi().find((item) => importedVideoKey(item) === form.get("videoKey"));
    if (!video) return;

    let targetList = getPlaylist(form.get("playlistId"));
    if (form.get("playlistId") === "__new__") {
      const categoryId = form.get("categoryId") || video.category || state.categories[0]?.id;
      const title = clean(form.get("newPlaylistTitle")) || `À organiser — ${categoryName(categoryId)}`;
      targetList = {
        id: uniqueAdminId(slug(title), state.playlists),
        title,
        description: "Playlist créée localement depuis les vidéos importées.",
        category: categoryId,
        level: "À classer",
        tags: ["Importées"],
        videos: []
      };
      state.playlists.push(targetList);
    }
    if (!targetList || targetList.imported) return;

    const nextVideo = {
      ...video,
      id: uniqueAdminId(slug(video.title), targetList.videos),
      playlistId: targetList.id,
      category: targetList.category,
      imported: false
    };
    targetList.videos = targetList.videos.filter((item) => item.youtubeId !== nextVideo.youtubeId);
    targetList.videos.push(nextVideo);
    state.playlists.forEach((list) => {
      if (list.id !== targetList.id) list.videos = list.videos.filter((item) => item.youtubeId !== nextVideo.youtubeId);
    });
    state.importedVideos = state.importedVideos.filter((item) => item.youtubeId !== nextVideo.youtubeId);
    saveAdminSelection({ playlistId: targetList.id, videoId: nextVideo.id });
    persistAdminChanges(true, false);
  });
}

function bindAdminRows() {
  document.querySelectorAll("[data-admin-edit]").forEach((button) => button.addEventListener("click", () => {
    const kind = button.dataset.adminEdit;
    if (kind === "category") saveAdminSelection({ categoryId: button.dataset.id });
    if (kind === "playlist") saveAdminSelection({ playlistId: button.dataset.id, videoId: "" });
    if (kind === "video") saveAdminSelection({ playlistId: button.dataset.parent, videoId: button.dataset.id });
    persistAdminChanges(false);
  }));
  document.querySelectorAll("[data-admin-move]").forEach((button) => button.addEventListener("click", () => {
    moveAdminItem(button.dataset.kind, button.dataset.id, button.dataset.adminMove, button.dataset.parent);
  }));
  document.querySelectorAll("[data-admin-row]").forEach((row) => {
    row.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", JSON.stringify({ kind: row.dataset.adminRow, id: row.dataset.id, parent: row.dataset.parent }));
    });
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      const source = JSON.parse(event.dataTransfer.getData("text/plain") || "{}");
      const target = { kind: row.dataset.adminRow, id: row.dataset.id, parent: row.dataset.parent };
      reorderAdminItem(source, target);
    });
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
  bindImportedFilters();
}

function bindImportedFilters() {
  document.querySelector("#importedSearch")?.addEventListener("input", filterImportedVideos);
  document.querySelector("#importedCategory")?.addEventListener("change", filterImportedVideos);
  document.querySelector("#importedSource")?.addEventListener("change", filterImportedVideos);
}

function filterImportedVideos() {
  const query = (document.querySelector("#importedSearch")?.value || "").toLowerCase();
  const category = document.querySelector("#importedCategory")?.value || "all";
  const source = document.querySelector("#importedSource")?.value || "all";
  let count = 0;
  document.querySelectorAll("[data-imported-video]").forEach((card) => {
    const visible = card.dataset.search.includes(query)
      && (category === "all" || card.dataset.category === category)
      && (source === "all" || card.dataset.source === source);
    card.hidden = !visible;
    if (visible) count += 1;
  });
  const empty = document.querySelector("#importedEmpty");
  if (empty) empty.innerHTML = count ? "" : `<div class="empty-state"><strong>Aucune vidéo importée trouvée</strong></div>`;
}

function bindFiles() {
  document.querySelector("#fileSearch")?.addEventListener("input", filterFiles);
  document.querySelector("#fileView")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    document.querySelectorAll("#fileView .tab-btn").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelector("#fileGrid")?.classList.toggle("list-view", button.dataset.view === "list");
  });
  document.querySelector("#folderForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const additions = readJson(APP.storage.workspace, { folders: [], files: [] });
    additions.folders.push({ id: uniqueId(slug(form.get("title"))), title: form.get("title"), icon: "folder", status: "Actif", description: form.get("description"), tags: splitTags(form.get("tags")) });
    saveJson(APP.storage.workspace, additions);
    location.reload();
  });
  document.querySelector("#fileForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const additions = readJson(APP.storage.workspace, { folders: [], files: [] });
    additions.files.push({ id: uniqueId(slug(form.get("title"))), folderId: form.get("folderId"), title: form.get("title"), type: form.get("type"), url: form.get("url"), status: form.get("status"), tags: splitTags(form.get("tags")), note: "" });
    saveJson(APP.storage.workspace, additions);
    location.reload();
  });
  document.querySelector("#exportWorkspace")?.addEventListener("click", () => showExport("#workspaceOutput", exportWorkspaceXml()));
}

function filterFiles() {
  const query = (document.querySelector("#fileSearch")?.value || "").toLowerCase();
  let count = 0;
  document.querySelectorAll("[data-file-card]").forEach((card) => {
    const visible = card.dataset.search.includes(query);
    card.hidden = !visible;
    if (visible) count += 1;
  });
  document.querySelector("#fileEmpty").innerHTML = count ? "" : `<div class="empty-state"><strong>Aucun fichier trouvé</strong></div>`;
}

function bindFinance() {
  document.querySelector("#transactionForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const additions = readJson(APP.storage.finance, { transactions: [], goals: [] });
    additions.transactions.push({ id: uniqueId(slug(form.get("title"))), type: form.get("type"), title: form.get("title"), category: form.get("category"), amount: Number(form.get("amount")), date: form.get("date"), note: "" });
    saveJson(APP.storage.finance, additions);
    location.reload();
  });
  document.querySelector("#goalForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const additions = readJson(APP.storage.finance, { transactions: [], goals: [] });
    additions.goals.push({ id: uniqueId(slug(form.get("title"))), title: form.get("title"), target: Number(form.get("target")), current: Number(form.get("current")), deadline: form.get("deadline"), category: "Objectif" });
    saveJson(APP.storage.finance, additions);
    location.reload();
  });
  document.querySelector("#exportFinanceCsv")?.addEventListener("click", () => showExport("#financeOutput", exportFinanceCsv()));
  document.querySelector("#exportFinanceXml")?.addEventListener("click", () => showExport("#financeOutput", exportFinanceXml()));
}

function showExport(selector, value) {
  const output = document.querySelector(selector);
  output.hidden = false;
  output.textContent = value;
  output.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function exportXml() {
  const categoryXml = state.categories.map((cat) => `    <category id="${escXml(cat.id)}" title="${escXml(cat.title)}" icon="${escXml(cat.icon)}" color="${escXml(cat.color || "cyan")}">${escXml(cat.description)}</category>`).join("\n");
  const playlistXml = state.playlists.map((list) => `    <playlist id="${escXml(list.id)}" category="${escXml(list.category)}" level="${escXml(list.level)}" title="${escXml(list.title)}" tags="${escXml(list.tags.join(","))}">\n      <description>${escXml(list.description)}</description>\n${list.videos.map((video) => `      <video id="${escXml(video.id)}" youtubeId="${escXml(video.youtubeId)}" duration="${escXml(video.duration)}" level="${escXml(video.level)}" title="${escXml(video.title)}" tags="${escXml(video.tags.join(","))}">\n        <description>${escXml(video.description)}</description>\n      </video>`).join("\n")}\n    </playlist>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<library version="1.0">\n  <categories>\n${categoryXml}\n  </categories>\n  <playlists>\n${playlistXml}\n  </playlists>\n</library>`;
}

function exportWorkspaceXml() {
  const folders = state.files.map((folder) => `    <folder id="${escXml(folder.id)}" title="${escXml(folder.title)}" icon="${escXml(folder.icon)}" status="${escXml(folder.status || "Actif")}" tags="${escXml(folder.tags.join(","))}">\n      <description>${escXml(folder.description)}</description>\n${folder.files.map((file) => `      <item id="${escXml(file.id)}" title="${escXml(file.title)}" type="${escXml(file.type)}" status="${escXml(file.status)}" url="${escXml(file.url)}" tags="${escXml((file.tags || []).join(","))}">${escXml(file.note)}</item>`).join("\n")}\n    </folder>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<workspace version="1.0" updated="2026-06-09">\n  <folders>\n${folders}\n  </folders>\n</workspace>`;
}

function exportFinanceXml() {
  const transactions = state.finance.transactions.map((item) => `    <transaction id="${escXml(item.id)}" type="${escXml(item.type)}" title="${escXml(item.title)}" category="${escXml(item.category)}" amount="${escXml(item.amount)}" date="${escXml(item.date)}">${escXml(item.note)}</transaction>`).join("\n");
  const goals = state.finance.goals.map((goal) => `    <goal id="${escXml(goal.id)}" title="${escXml(goal.title)}" category="${escXml(goal.category)}" target="${escXml(goal.target)}" current="${escXml(goal.current)}" deadline="${escXml(goal.deadline)}" />`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<finance version="1.0" updated="2026-06-09">\n  <transactions>\n${transactions}\n  </transactions>\n  <goals>\n${goals}\n  </goals>\n</finance>`;
}

function exportFinanceCsv() {
  const rows = [["type", "title", "category", "amount", "date"], ...state.finance.transactions.map((item) => [item.type, item.title, item.category, item.amount, item.date])];
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

function youtubeEmbedUrl(youtubeId) {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1", enablejsapi: "1", autoplay: "1" });
  if (location.origin && location.origin.startsWith("http")) params.set("origin", location.origin);
  return `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}?${params.toString()}`;
}

function youtubeWatchUrl(video) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(video.youtubeId)}`;
}

function fillCategoryForm(id) {
  const form = document.querySelector("#categoryAdminForm");
  if (!form) return;
  const cat = state.categories.find((item) => item.id === id);
  form.elements.id.value = cat?.id || "__new__";
  form.elements.title.value = cat?.title || "";
  form.elements.icon.value = cat?.icon || "";
  form.elements.color.value = cat?.color || "";
  form.elements.description.value = cat?.description || "";
}

function fillPlaylistForm(id) {
  const form = document.querySelector("#playlistAdminForm");
  if (!form) return;
  const list = id && id !== "__new__" ? getPlaylist(id) : null;
  form.elements.id.value = list?.id || "__new__";
  form.elements.title.value = list?.title || "";
  form.elements.category.value = list?.category || state.categories[0]?.id || "";
  form.elements.level.value = list?.level || "Débutant";
  form.elements.tags.value = list?.tags?.join(", ") || "";
  form.elements.description.value = list?.description || "";
}

function fillVideoForm(playlistId, videoId) {
  const form = document.querySelector("#videoAdminForm");
  if (!form) return;
  const playlist = getPlaylist(playlistId);
  const video = videoId && videoId !== "__new__" ? getVideo(playlist, videoId) : null;
  form.elements.playlistId.value = playlist?.id || "";
  form.elements.id.value = video?.id || "__new__";
  form.elements.title.value = video?.title || "";
  form.elements.youtube.value = video?.youtubeId || "";
  form.elements.targetPlaylistId.value = playlist?.id || "";
  form.elements.duration.value = video?.duration || "0:00";
  form.elements.level.value = video?.level || playlist?.level || "Débutant";
  form.elements.tags.value = video?.tags?.join(", ") || "";
  form.elements.description.value = video?.description || "";
}

function persistAdminChanges(rerender = true, closePanel = false) {
  saveLibraryOverride();
  if (closePanel) saveJson(APP.storage.admin, { ...readJson(APP.storage.admin, {}), open: false });
  if (rerender) route();
  else route();
}

function saveAdminSelection(partial) {
  saveJson(APP.storage.admin, { ...readJson(APP.storage.admin, {}), open: true, ...partial });
}

function uniqueAdminId(base, collection) {
  const cleanBase = base || "item";
  let next = cleanBase;
  let index = 2;
  while ((collection || []).some((item) => item.id === next)) {
    next = `${cleanBase}-${index}`;
    index += 1;
  }
  return next;
}

function playlistsByCategory(categoryId) {
  return state.playlists.filter((list) => list.category === categoryId);
}

function moveAdminItem(kind, id, direction, parentId = "") {
  const collection = adminCollection(kind, parentId);
  const index = collection.findIndex((item) => item.id === id);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= collection.length) return;
  const [item] = collection.splice(index, 1);
  collection.splice(nextIndex, 0, item);
  persistAdminChanges(true, true);
}

function reorderAdminItem(source, target) {
  if (!source.kind || source.kind !== target.kind) return;
  if (source.kind === "video" && source.parent !== target.parent) return;
  const collection = adminCollection(source.kind, source.parent);
  const from = collection.findIndex((item) => item.id === source.id);
  const to = collection.findIndex((item) => item.id === target.id);
  if (from < 0 || to < 0 || from === to) return;
  const [item] = collection.splice(from, 1);
  collection.splice(to, 0, item);
  persistAdminChanges(true, true);
}

function adminCollection(kind, parentId = "") {
  if (kind === "category") return state.categories;
  if (kind === "playlist") return state.playlists;
  if (kind === "video") return getPlaylist(parentId)?.videos || [];
  return [];
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

function allVideos() { return state.playlists.flatMap((list) => list.videos.map((video) => ({ ...video, tags: video.tags || [], playlistId: list.id, playlistTitle: list.title, category: video.category || list.category, imported: Boolean(video.imported || list.imported) }))); }
function regularPlaylists() { return state.playlists.filter((list) => !list.imported); }
function importedVideosForUi() { return allVideos().filter((video) => video.imported && video.youtubeId); }
function unorganizedImportedVideos() {
  const organizedIds = new Set(regularPlaylists().flatMap((list) => list.videos.map((video) => video.youtubeId).filter(Boolean)));
  return importedVideosForUi().filter((video) => !organizedIds.has(video.youtubeId));
}
function importedVideoKey(video) { return `${video.playlistId}:${video.id}`; }
function importedPlaylistId(folderId) { return `imported-${slug(folderId)}`; }
function sourceFolder(source) { return String(source || "").split("/").filter(Boolean).slice(0, 2).join("/") || ""; }
function financeTotal(type) { return state.finance.transactions.filter((item) => item.type === type).reduce((total, item) => total + Number(item.amount || 0), 0); }
function money(value) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(value || 0)); }
function xmlDoc(xmlText) { const doc = new DOMParser().parseFromString(xmlText, "application/xml"); if (doc.querySelector("parsererror")) throw new Error("XML invalide."); return doc; }
function childElements(node, tagName) { return [...node.children].filter((child) => child.tagName === tagName); }
function childElement(node, tagName) { return childElements(node, tagName)[0]; }
function uniqueId(base) { return `${base || "item"}-${Date.now().toString(36)}`; }
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
