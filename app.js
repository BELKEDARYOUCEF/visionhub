const APP = {
  libraryUrl: "data/library.xml",
  workspaceUrl: "data/workspace.xml",
  resourcesUrl: "data/resources.xml",
  videoIntelligenceUrl: "data/video-intelligence.xml",
  financeUrl: "data/finance.xml",
  storage: {
    additions: "lumen-v2-additions",
    library: "lumen-v2-library",
    admin: "lumen-v2-admin",
    favorites: "lumen-v2-favorites",
    active: "lumen-v2-active",
    workspace: "lumen-v2-workspace",
    finance: "lumen-v2-finance"
  },
  legacyStorage: {
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

migrateLocalStorageKeys();
init();

function migrateLocalStorageKeys() {
  const keys = Object.keys(APP.storage);
  for (const k of keys) {
    const newKey = APP.storage[k];
    const oldKey = APP.legacyStorage[k];
    if (localStorage.getItem(newKey) === null && localStorage.getItem(oldKey) !== null) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey));
    }
  }
}

async function init() {
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
    icon: cat.icon || cat.title?.slice(0, 2) || "LM",
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
  document.body.classList.add("vd-mode");
  app.innerHTML = (routes[page] || renderHome)();
  bindPage();
}

function renderHome() {
  const totalVideos = allVideos().length;
  const totalCats   = state.categories.length;

  const features = [
    { icon: 'ti-drag-drop',    title: 'Glisser-déposer',        desc: 'Attrapez une vidéo et déposez-la dans une playlist depuis la barre latérale. Le classement se fait en direct.', c: 1 },
    { icon: 'ti-wand',         title: 'Classement intelligent',  desc: "Vos vidéos importées reçoivent une catégorie et une playlist suggérées d'après leur titre, leurs tags et leur source.", c: 2 },
    { icon: 'ti-tags',         title: 'Hiérarchie claire',       desc: "Catégorie, puis playlist, puis vidéo. Une structure simple qui passe à l'échelle, de 11 à 1000 vidéos.", c: 3 },
    { icon: 'ti-list-check',   title: 'Lecteur robuste',         desc: "Miniature d'abord, iframe au clic, et toujours un bouton « Ouvrir sur YouTube ». Fini l'erreur 153.", c: 4 },
    { icon: 'ti-search',       title: 'Recherche & filtres',     desc: 'Cherchez dans les titres, tags, catégories et descriptions. Filtrez par périmètre, source ou playlist.', c: 5 },
    { icon: 'ti-file-export',  title: 'Export XML',              desc: "Toutes vos modifications restent locales, puis s'exportent en XML propre. Vos données restent les vôtres.", c: 1 },
  ];

  const catColors = ['--accent-2', '--amber', '--rose', '--green', '--cyan', '--text-2'];
  const catIcons  = ['ti-code', 'ti-cpu', 'ti-palette', 'ti-trending-up', 'ti-brain', 'ti-rocket'];

  const modules = [
    { icon: 'ti-player-play', label: 'Vidéos',    href: 'videos.html' },
    { icon: 'ti-stack-2',     label: 'Playlists', href: 'playlists.html' },
    { icon: 'ti-folder',      label: 'Fichiers',  href: 'files.html' },
    { icon: 'ti-wallet',      label: 'Finance',   href: 'finance.html' },
  ];

  const centerHtml = `
<div class="home-hero" id="homeHero">
  <canvas id="homeCanvas" aria-hidden="true"></canvas>
  <div class="home-glow" id="homeGlow" aria-hidden="true"></div>
  <div class="home-inner">
    <p class="home-eyebrow"><span class="home-dot"></span> Votre bibliothèque personnelle de savoir</p>
    <h1>Tout ce que vous regardez,<br><span class="home-grad">rangé et retrouvable.</span></h1>
    <p class="home-sub">Organisez vos vidéos YouTube, vos playlists, vos ressources importées, vos fichiers et vos notes. Catégories, playlists et classement intelligent — une base claire qui vit sur GitHub Pages, sans serveur.</p>
    <div class="home-actions">
      <a class="home-btn-primary" href="videos.html"><i class="ti ti-sparkles"></i> Ouvrir ma bibliothèque</a>
      <a class="home-btn-ghost" href="videos.html"><i class="ti ti-player-play"></i> Voir la démo</a>
    </div>
    <div class="home-stats">
      <div class="home-stat"><span class="home-stat-n">${totalVideos || '—'}</span><span class="home-stat-l">Vidéos rangées</span></div>
      <div class="home-stat"><span class="home-stat-n">${totalCats || '—'}</span><span class="home-stat-l">Catégories</span></div>
      <div class="home-stat"><span class="home-stat-n">∞</span><span class="home-stat-l">Playlists</span></div>
      <div class="home-stat"><span class="home-stat-n">XML</span><span class="home-stat-l">Vos données</span></div>
    </div>
  </div>
  <div class="home-scroll-hint" aria-hidden="true"><i class="ti ti-chevron-down"></i></div>
</div>

<section class="home-section" id="home-features">
  <div class="home-wrap">
    <div class="home-section-head reveal">
      <p class="home-label">Conçu pour le flux</p>
      <h2>Une organisation qui suit votre rythme</h2>
      <p>Chaque vidéo trouve sa place. Glissez, classez, retrouvez — sans friction.</p>
    </div>
    <div class="home-fgrid">
      ${features.map(f => `
      <div class="home-fcard c${f.c} reveal" data-spotlight>
        <div class="home-fcard-ic"><i class="ti ${f.icon}"></i></div>
        <h3>${f.title}</h3>
        <p>${f.desc}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="home-section home-section-alt" id="home-categories">
  <div class="home-wrap">
    <div class="home-section-head reveal">
      <p class="home-label">Vos catégories</p>
      <h2>Un savoir bien rangé</h2>
      <p>Vos vidéos se classent dans des catégories claires, chacune avec sa couleur.</p>
    </div>
    <div class="home-catrow">
      ${state.categories.length > 0
        ? state.categories.map((cat, i) => `
          <div class="home-catcard reveal" style="--cc:var(${catColors[i % catColors.length]})">
            <span class="home-catbadge"><i class="ti ${catIcons[i % catIcons.length]}"></i> ${escapeHtml(cat.id.toUpperCase().slice(0, 4))}</span>
            <h4>${escapeHtml(cat.title)}</h4>
            <p>${escapeHtml(cat.description || 'Contenu classé par catégorie.')}</p>
          </div>`).join('')
        : '<p style="color:var(--text-2);text-align:center">Chargez la bibliothèque pour voir vos catégories.</p>'}
    </div>
  </div>
</section>

<section class="home-section" id="home-modules">
  <div class="home-wrap">
    <div class="home-section-head reveal">
      <p class="home-label">Les modules</p>
      <h2>Tout votre univers, par espace</h2>
      <p>Chaque type de contenu a sa page, le même moteur d'organisation partout.</p>
    </div>
    <div class="home-modrow">
      ${modules.map(m => `<a class="home-modpill reveal" href="${m.href}"><i class="ti ${m.icon}"></i> ${m.label}</a>`).join('')}
    </div>
  </div>
</section>`;

  return renderShell({ active: "home", centerHtml });
}

const VD_PL_COLORS = ["pc1", "pc2", "pc3", "pc4", "pc5"];
const VD_PL_ICONS = ["ti-code", "ti-cpu", "ti-palette", "ti-trending-up", "ti-device-desktop", "ti-brain"];

function renderShell({ active, icon = "ti-sparkles", title = "", subtitle = "", topbarRight = "", subheaderHtml = "", centerHtml = "", rightHtml = "" }) {
  const videos = allVideos();
  const playlists = regularPlaylists();
  const navLink = (key, href, navIcon, label, count) => `<a class="vd-nav-link ${active === key ? "active" : ""}" href="${href}"><i class="ti ${navIcon}"></i><span>${label}</span>${count === undefined ? "" : `<span class="vd-nav-count">${count}</span>`}</a>`;
  return `<div class="vd-app">
  <header class="vd-topnav">
    <a class="vd-brand" href="index.html">
      <img src="assets/lumen-icon-glass.svg" class="vd-brand-mark" alt="" width="26" height="26">
      <span>Lumen</span>
    </a>
    <nav class="vd-nav">
      ${navLink("home", "index.html", "ti-home", "Accueil")}
      ${navLink("videos", "videos.html", "ti-player-play", "Vidéos", videos.length)}
      ${navLink("playlists", "playlists.html", "ti-stack-2", "Playlists", playlists.length)}
      ${navLink("files", "files.html", "ti-folder", "Fichiers")}
      ${navLink("finance", "finance.html", "ti-wallet", "Finance")}
      ${navLink("about", "about.html", "ti-info-circle", "À propos")}
    </nav>
    <div class="vd-topnav-end">
      <div class="vd-avatar">YB</div>
    </div>
  </header>
  <div class="vd-body${rightHtml ? " has-right" : ""}">
    <main class="vd-main">
      ${title ? `<div class="vd-topbar">
        <div class="vd-topbar-title">
          <i class="ti ${icon}"></i>
          <div><h1>${escapeHtml(title)}</h1>${subtitle ? `<div class="vd-topbar-sub">${subtitle}</div>` : ""}</div>
        </div>
        ${topbarRight ? `<div class="vd-topbar-actions">${topbarRight}</div>` : ""}
      </div>` : ""}
      ${subheaderHtml}
      <div class="vd-scroll">${centerHtml}</div>
    </main>
    ${rightHtml ? `<aside class="vd-right">${rightHtml}</aside>` : ""}
  </div>
</div>`;
}

function vdPlaylistItem(list, i) {
  const cc = VD_PL_COLORS[i % VD_PL_COLORS.length];
  const ic = VD_PL_ICONS[i % VD_PL_ICONS.length];
  return `<div class="vd-pl" data-drop-playlist-id="${escapeAttr(list.id)}">
    <div class="vd-pl-ic ${cc}"><i class="ti ${ic}"></i></div>
    <div class="vd-pl-info">
      <div class="vd-pl-name">${escapeHtml(list.title)}</div>
      <div class="vd-pl-meta">${escapeHtml(categoryName(list.category))}</div>
    </div>
    <span class="vd-pl-count" data-pl-count="${escapeAttr(list.id)}">${list.videos.length}</span>
  </div>`;
}

function vdCard(video) {
  const isLib = !video.imported;
  const href = `videos.html?playlist=${encodeURIComponent(video.playlistId)}&video=${encodeURIComponent(video.id)}`;
  const tags = (video.tags || []).slice(0, 2);
  const searchData = `${video.title} ${categoryName(video.category)} ${video.playlistTitle} ${tags.join(" ")}`.toLowerCase();
  return `<a class="vd-vcard" href="${href}" draggable="true"
    data-vcard data-video-id="${escapeAttr(video.id)}"
    data-youtube-id="${escapeAttr(video.youtubeId)}"
    data-playlist-id="${escapeAttr(video.playlistId)}"
    data-category="${escapeAttr(video.category)}"
    data-source="${isLib ? "library" : "imported"}"
    data-search="${escapeAttr(searchData)}">
    <div class="vd-thumb">
      <img src="${thumb(video.youtubeId)}" alt="" loading="lazy">
      <div class="vd-play-orb"><i class="ti ti-player-play-filled"></i></div>
      <span class="vd-thumb-src ${isLib ? "vd-src-lib" : "vd-src-imp"}">
        <span class="vd-dot"></span>${isLib ? "Bibliothèque" : "Importée"}
      </span>
      ${video.duration ? `<span class="vd-thumb-dur">${escapeHtml(video.duration)}</span>` : ""}
    </div>
    <div class="vd-vbody">
      <h3>${escapeHtml(video.title)}</h3>
      <div class="vd-vmeta">
        <span>${escapeHtml(categoryName(video.category))}</span>
        <span>·</span>
        <span>${escapeHtml(video.playlistTitle)}</span>
      </div>
      ${tags.length ? `<div class="vd-vtags">${tags.map((t) => `<span class="vd-tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
    </div>
  </a>`;
}

function renderPlaylistsList() {
  const playlists = regularPlaylists();
  return `<div class="vd-right-head"><h2>Playlists</h2></div>
    <div class="vd-hint"><i class="ti ti-drag-drop"></i> Glissez une vidéo pour la classer</div>
    ${playlists.map((list, i) => vdPlaylistItem(list, i)).join("")}`;
}

function renderVideoAdminBox() {
  return `<div class="vd-admin-box">
    <div class="vd-admin-box-title"><i class="ti ti-adjustments"></i> Administration</div>
    <p>Modifications locales uniquement. Exportez un nouveau <strong>library.xml</strong> pour le dépôt.</p>
    <div class="vd-admin-btns">
      <button class="vd-adm-btn primary" id="vdOpenAdmin2"><i class="ti ti-pencil"></i> Organiser la bibliothèque</button>
      <button class="vd-adm-btn" id="vdExportXml"><i class="ti ti-file-export"></i> Exporter XML</button>
      <button class="vd-adm-btn" id="vdCopyXml"><i class="ti ti-copy"></i> Copier XML</button>
    </div>
    <pre class="vd-export-box" id="vdXmlOutput" hidden></pre>
  </div>`;
}

function renderShortcutsPanel() {
  const videos = allVideos();
  const playlists = regularPlaylists();
  const shortcuts = [
    { href: "videos.html", icon: "ti-player-play", cc: "pc1", label: "Vidéos", meta: `${videos.length} vidéos` },
    { href: "playlists.html", icon: "ti-stack-2", cc: "pc2", label: "Playlists", meta: `${playlists.length} playlists` },
    { href: "files.html", icon: "ti-folder", cc: "pc3", label: "Fichiers", meta: `${state.files.length} dossiers` },
    { href: "finance.html", icon: "ti-wallet", cc: "pc4", label: "Finance", meta: "Suivi léger" }
  ];
  return `<div class="vd-right-head"><h2>Raccourcis</h2></div>
    <div class="vd-hint"><i class="ti ti-bolt"></i> Navigation rapide</div>
    ${shortcuts.map((s) => `<a class="vd-pl" href="${s.href}">
      <div class="vd-pl-ic ${s.cc}"><i class="ti ${s.icon}"></i></div>
      <div class="vd-pl-info"><div class="vd-pl-name">${s.label}</div><div class="vd-pl-meta">${escapeHtml(s.meta)}</div></div>
    </a>`).join("")}`;
}

function appCard(title, text, href) {
  return `<article class="content-card"><span class="tag">Module</span><h3>${title}</h3><p>${text}</p><a class="btn" href="${href}">Ouvrir</a></article>`;
}

function renderPlaylists() {
  const params = new URLSearchParams(location.search);
  const current = params.get("category") || "all";
  const topbarRight = `<button class="btn primary" id="openAdminPanel">Administration</button><button class="btn" id="exportLibraryFromPlaylists">Exporter XML</button>`;
  const subheaderHtml = `<div class="vd-subbar"><div class="filter-bar"><input class="search-input" id="playlistSearch" type="search" placeholder="Rechercher une playlist, tag ou catégorie"><div class="filter-tabs" id="playlistFilters">${filterButtons(current)}</div></div></div>`;
  const centerHtml = `<p class="section-intro">Recherche, filtre par catégorie et lance directement la bonne vidéo.</p>
    <div class="playlist-grid" id="playlistGrid">${state.playlists.map(playlistCard).join("")}</div><div id="playlistEmpty"></div>${renderImportedVideosSection("playlists")}<pre class="code-box export-box" id="playlistXmlOutput" hidden></pre>`;
  return renderShell({
    active: "playlists",
    icon: "ti-stack-2",
    title: "Playlists dynamiques.",
    subtitle: `${state.playlists.length} playlists · ${state.categories.length} catégories`,
    topbarRight,
    subheaderHtml,
    centerHtml
  }) + renderAdminDrawer();
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
  const unorganizedImports = unorganizedImportedVideos();
  const importedStatus = importedStatusCounts();
  const organizedVideos = organizedVideosForAdmin();
  return `<div class="admin-overlay" id="adminOverlay" hidden></div>
    <aside class="admin-drawer" id="adminDrawer" aria-label="Administration de la bibliothèque" hidden>
      <div class="admin-head"><div><p class="kicker">Administration</p><h2>Bibliothèque</h2></div><button class="btn ghost" id="closeAdminPanel">Fermer</button></div>
      <div class="admin-grid">
        ${renderLibraryHierarchy()}
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
            <label>Catégorie cible<select class="select-input" name="targetCategoryId"><option value="__new__">Nouvelle catégorie</option>${state.categories.map((cat) => `<option value="${cat.id}" ${cat.id === selectedPlaylist?.category ? "selected" : ""}>${escapeHtml(cat.title)}</option>`).join("")}</select></label>
            <label>Nom nouvelle catégorie<input class="search-input" name="newCategoryTitle" placeholder="Ex. Business IA"></label>
            <label>Déplacer vers<select class="select-input" name="targetPlaylistId"><option value="__new__">Nouvelle playlist</option>${regularPlaylists().map((list) => `<option value="${list.id}" ${list.id === selectedPlaylistId ? "selected" : ""}>${escapeHtml(list.title)}</option>`).join("")}</select></label>
            <label>Nom nouvelle playlist<input class="search-input" name="newPlaylistTitle" placeholder="Ex. À regarder — IA"></label>
            <label>Durée<input class="search-input" name="duration" value="0:00"></label>
            <label>Niveau<input class="search-input" name="level" value="Débutant"></label>
            <label>Tags<input class="search-input" name="tags"></label>
            <label>Description<textarea name="description"></textarea></label>
            <div class="admin-notice" data-admin-notice hidden></div>
            <div class="admin-actions"><button class="btn primary">Enregistrer</button><button class="btn danger" type="button" data-admin-delete="video">Supprimer</button></div>
          </form>
          <div class="admin-list" id="videoAdminList">${(selectedPlaylist?.videos || []).map((video) => adminRow("video", video.id, video.title, video.duration || "0:00", selectedPlaylistId)).join("")}</div>
        </section>

        <section class="admin-section organized-admin-section">
          <div class="admin-section-head"><h3>Vidéos déjà organisées</h3><span class="badge">${organizedVideos.length}</span></div>
          <div class="organized-video-list">${organizedVideos.map(organizedVideoRow).join("") || `<div class="empty-state"><strong>Aucune vidéo organisée</strong></div>`}</div>
        </section>

        <section class="admin-section imported-admin-section">
          <div class="admin-section-head"><h3>Vidéos importées</h3><span class="badge">${importedVideosForUi().length}</span></div>
          <div class="status-strip"><span class="level">${unorganizedImports.length} non classées</span><span class="badge">${importedStatus.organized} déjà organisées</span></div>
          <form id="organizeImportedForm" class="studio-form">
            <label>Vidéo<select class="select-input" name="videoKey">${unorganizedImports.map((video) => `<option value="${importedVideoKey(video)}">${escapeHtml(video.title)}</option>`).join("")}</select></label>
            <label>Catégorie<select class="select-input" name="categoryId"><option value="__new__">Nouvelle catégorie</option>${state.categories.map((cat) => `<option value="${cat.id}">${escapeHtml(cat.title)}</option>`).join("")}</select></label>
            <label>Nom nouvelle catégorie<input class="search-input" name="newCategoryTitle" placeholder="Ex. Business IA"></label>
            <label>Playlist<select class="select-input" name="playlistId"><option value="__new__">Nouvelle playlist</option>${regularPlaylists().map((list) => `<option value="${list.id}">${escapeHtml(list.title)}</option>`).join("")}</select></label>
            <label>Nom nouvelle playlist<input class="search-input" name="newPlaylistTitle" placeholder="Ex. À regarder — IA"></label>
            <div class="admin-notice" data-admin-notice hidden></div>
            <button class="btn primary">Ajouter à la playlist</button>
          </form>
          <div class="filter-tabs imported-status-tabs"><button class="tab-btn active" type="button" data-import-admin-status="all">Toutes</button><button class="tab-btn" type="button" data-import-admin-status="unorganized">Non classées</button><button class="tab-btn" type="button" data-import-admin-status="organized">Déjà organisées</button></div>
          <div class="admin-list" id="importedAdminList">${importedVideosForUi().slice(0, 140).map(importedAdminRow).join("") || `<div class="empty-state"><strong>Aucune vidéo importée</strong></div>`}</div>
        </section>
      </div>
    </aside>`;
}

function renderLibraryHierarchy() {
  return `<section class="admin-section hierarchy-section">
    <div class="admin-section-head"><h3>Hiérarchie</h3><span class="badge">Catégorie > Playlist > Vidéos</span></div>
    <div class="hierarchy-tree">
      ${state.categories.map((category) => {
        const lists = playlistsByCategory(category.id);
        return `<details class="hierarchy-category" open>
          <summary><span><strong>${escapeHtml(category.title)}</strong><small>${lists.length} playlists · ${lists.reduce((total, list) => total + list.videos.length, 0)} vidéos</small></span><button class="mini-btn" type="button" data-admin-edit="category" data-id="${escapeAttr(category.id)}">Éditer</button></summary>
          <div class="hierarchy-playlists">
            ${lists.map((list) => `<details class="hierarchy-playlist">
              <summary><span><strong>${escapeHtml(list.title)}</strong><small>${list.imported ? "Playlist importée" : "Playlist bibliothèque"} · ${list.videos.length} vidéos</small></span><button class="mini-btn" type="button" data-admin-edit="playlist" data-id="${escapeAttr(list.id)}">Éditer</button></summary>
              <div class="hierarchy-videos">${list.videos.map((video) => `<div class="hierarchy-video"><span><strong>${escapeHtml(video.title)}</strong><small>${escapeHtml(video.youtubeId)} · ${escapeHtml(video.level || list.level || "À classer")}</small></span><span class="admin-row-actions"><a class="mini-btn" href="videos.html?playlist=${encodeURIComponent(list.id)}&video=${encodeURIComponent(video.id)}">Voir</a><button class="mini-btn" type="button" data-admin-edit="video" data-id="${escapeAttr(video.id)}" data-parent="${escapeAttr(list.id)}">Éditer</button></span></div>`).join("") || `<p class="meta">Aucune vidéo.</p>`}</div>
            </details>`).join("") || `<p class="meta">Aucune playlist dans cette catégorie.</p>`}
          </div>
        </details>`;
      }).join("")}
    </div>
  </section>`;
}

function adminRow(kind, id, title, meta, parentId = "") {
  return `<div class="admin-row" draggable="true" data-admin-row="${kind}" data-id="${escapeAttr(id)}" data-parent="${escapeAttr(parentId)}"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(meta)}</small></span><span class="admin-row-actions"><button class="mini-btn" type="button" data-admin-edit="${kind}" data-id="${escapeAttr(id)}" data-parent="${escapeAttr(parentId)}">Éditer</button><button class="mini-btn" type="button" data-admin-move="up" data-kind="${kind}" data-id="${escapeAttr(id)}" data-parent="${escapeAttr(parentId)}">↑</button><button class="mini-btn" type="button" data-admin-move="down" data-kind="${kind}" data-id="${escapeAttr(id)}" data-parent="${escapeAttr(parentId)}">↓</button></span></div>`;
}

function organizedVideoRow(video) {
  return `<article class="organized-video-row" data-organized-video="${escapeAttr(video.id)}" data-parent="${escapeAttr(video.playlistId)}">
    <div class="organized-video-main">
      <span class="badge">${escapeHtml(categoryName(video.category))}</span>
      <span class="badge">${escapeHtml(video.playlistTitle)}</span>
      <strong>${escapeHtml(video.title)}</strong>
      <small>${escapeHtml(video.duration || "0:00")} · ${(video.tags || []).map((tag) => `#${escapeHtml(tag)}`).join(" ") || "Sans tags"}</small>
    </div>
    <div class="admin-row-actions">
      <button class="mini-btn" type="button" data-organized-move data-id="${escapeAttr(video.id)}" data-parent="${escapeAttr(video.playlistId)}">Déplacer</button>
      <button class="mini-btn" type="button" data-admin-edit="video" data-id="${escapeAttr(video.id)}" data-parent="${escapeAttr(video.playlistId)}">Modifier</button>
      <button class="mini-btn danger-mini" type="button" data-organized-remove data-id="${escapeAttr(video.id)}" data-parent="${escapeAttr(video.playlistId)}">Retirer</button>
    </div>
  </article>`;
}

function renderVideos() {
  const params = new URLSearchParams(location.search);
  const playlistParam = params.get("playlist");
  const videoParam = params.get("video");

  if (playlistParam && videoParam) {
    document.body.classList.remove("vd-mode");
    const playlist = getPlaylist(playlistParam || state.active.playlistId) || firstPlaylist();
    const video = getVideo(playlist, videoParam || state.active.videoId) || playlist.videos[0];
    setActive(playlist?.id, video?.id, false);
    return `<section class="video-page"><a href="videos.html" class="player-back-link">Tableau de bord</a><div class="page-head"><div><p class="kicker">Lecteur vidéo</p><h1>${escapeHtml(playlist.title)}</h1><p class="section-intro">Choisis une vidéo, lance la lecture et garde ta progression organisée par playlist.</p></div><select class="select-input" id="playlistSelect">${state.playlists.map((item) => `<option value="${item.id}" ${item.id === playlist.id ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}</select></div>
    <div class="player-layout">
      <article class="player-shell"><div class="player-frame" id="playerFrame">${renderPlayerPoster(video)}</div><div class="player-info" id="playerInfo">${videoInfo(video)}</div></article>
      <aside>
        <div class="video-tools">
          <input class="search-input video-search" id="videoSearch" type="search" placeholder="Rechercher une vidéo">
          <select class="select-input" id="videoScope"><option value="current">Playlist active</option><option value="library">Bibliothèque</option><option value="imported">Importées</option><option value="all">Toutes les vidéos</option></select>
          <select class="select-input" id="videoPlaylistFilter"><option value="all">Toutes les playlists</option>${state.playlists.map((item) => `<option value="${item.id}" ${item.id === playlist.id ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}</select>
          <select class="select-input" id="videoSort"><option value="category">Tri par catégorie</option><option value="title">Tri par titre</option><option value="source">Tri par source</option></select>
        </div>
        <div class="video-list" id="videoList">${playlist.videos.map((item) => videoRow(item, playlist.id, item.id === video.id)).join("")}</div><div id="videoEmpty"></div>
      </aside>
    </div>${renderImportedVideosSection("videos")}</section>`;
  }

  return renderVideoDashboard();
}

function renderVideoDashboard() {
  const videos = allVideos();
  const playlists = regularPlaylists();

  const topbarRight = `<div class="vd-search">
      <i class="ti ti-search"></i>
      <input id="vdSearch" type="search" placeholder="Rechercher une vidéo…" autocomplete="off">
    </div>
    <button class="vd-add-btn" id="openAdminPanel"><i class="ti ti-pencil"></i> Organiser</button>`;

  const subheaderHtml = `<div class="vd-filters" id="vdFilters">
      <button class="vd-chip active" data-filter="all"><i class="ti ti-apps"></i> Toutes <span class="vd-chip-count">${videos.length}</span></button>
      <button class="vd-chip" data-filter="library"><i class="ti ti-books"></i> Bibliothèque</button>
      <button class="vd-chip" data-filter="imported"><i class="ti ti-download"></i> Importées</button>
      ${state.categories.map((cat) => `<button class="vd-chip" data-filter="cat:${escapeAttr(cat.id)}"><i class="ti ti-tag"></i> ${escapeHtml(cat.title)}</button>`).join("")}
    </div>`;

  const centerHtml = `<div class="vd-grid" id="vdGrid">${videos.map(vdCard).join("")}</div>
    <div id="vdEmpty"></div>`;

  return renderShell({
    active: "videos",
    icon: "ti-player-play",
    title: "Vidéos",
    subtitle: `${videos.length} vidéos · ${playlists.length} playlists · ${state.categories.length} catégories`,
    topbarRight,
    subheaderHtml,
    centerHtml,
    rightHtml: renderPlaylistsList() + renderVideoAdminBox()
  }) + `<div class="vd-toast" id="vdToast"><i class="ti ti-check" id="vdToastIcon"></i> <span id="vdToastMsg"></span></div>${renderAdminDrawer()}`;
}

function renderImportedVideosSection(context) {
  const imported = importedVideosForUi();
  if (!imported.length) return "";
  const categories = [...new Set(imported.map((video) => video.category))];
  const sources = [...new Set(imported.map((video) => sourceFolder(video.source)).filter(Boolean))].slice(0, 80);
  const status = importedStatusCounts();
  return `<section class="section imported-section" data-imported-section="${context}">
    <div class="page-head"><div><p class="kicker">Vidéos importées</p><h2>Ressources YouTube importées.</h2><p class="section-intro">${imported.length} vidéos issues de data/resources.xml, sans backend ni API YouTube.</p><div class="status-strip"><span class="level">${status.unorganized} non classées</span><span class="badge">${status.organized} déjà organisées</span></div></div></div>
    <div class="filter-bar imported-tools">
      <input class="search-input" id="importedSearch" type="search" placeholder="Rechercher une vidéo importée">
      <select class="select-input" id="importedCategory"><option value="all">Toutes les catégories</option>${categories.map((id) => `<option value="${id}">${escapeHtml(categoryName(id))}</option>`).join("")}</select>
      <select class="select-input" id="importedSource"><option value="all">Toutes les sources</option>${sources.map((source) => `<option value="${escapeAttr(source)}">${escapeHtml(source)}</option>`).join("")}</select>
      <select class="select-input" id="importedStatus"><option value="all">Tous les états</option><option value="unorganized">Non classées</option><option value="organized">Déjà organisées</option></select>
    </div>
    <div class="imported-video-grid" id="importedVideoGrid">${imported.map(importedVideoCard).join("")}</div>
    <div id="importedEmpty"></div>
  </section>`;
}

function importedVideoCard(video) {
  const organization = importedOrganization(video.youtubeId);
  const status = organization ? "organized" : "unorganized";
  const statusLabel = organization ? `Ajoutée à ${organization.title}` : "Non classée";
  const search = `${video.title} ${video.description} ${categoryName(video.category)} ${video.source || ""} ${statusLabel} ${video.tags.join(" ")}`.toLowerCase();
  const source = sourceFolder(video.source);
  return `<article class="imported-video-card" data-imported-video data-category="${escapeAttr(video.category)}" data-source="${escapeAttr(source)}" data-status="${status}" data-search="${escapeAttr(search)}">
    <img class="media-thumb" src="${thumb(video.youtubeId)}" alt="Miniature ${escapeAttr(video.title)}" loading="lazy">
    <div class="card-meta"><span class="badge">${escapeHtml(categoryName(video.category))}</span><span class="${organization ? "badge" : "level"}">${escapeHtml(statusLabel)}</span></div>
    <h3>${escapeHtml(video.title)}</h3>
    <p>${escapeHtml(source || video.source || "resources.xml")}</p>
    <div class="card-actions"><a class="btn primary" href="videos.html?playlist=${encodeURIComponent(video.playlistId)}&video=${encodeURIComponent(video.id)}">Regarder</a><a class="btn" href="playlists.html?admin=imports">Organiser</a></div>
  </article>`;
}

function renderPlayerPoster(video) {
  if (!video?.youtubeId) return `<div class="empty-state"><strong>ID YouTube invalide</strong><p>Ajoute une URL YouTube publique depuis l'administration.</p></div>`;
  return `<div class="player-poster" style="background-image:url('${thumb(video.youtubeId, "maxresdefault")}')"><div class="play-stack"><button class="play-orb" data-load-youtube="${video.id}" aria-label="Lire ${escapeAttr(video.title)}">▶</button><strong>${escapeHtml(video.title)}</strong><small>Cliquer pour charger le lecteur YouTube</small><a class="btn ghost player-yt-link" href="${youtubeWatchUrl(video)}" target="_blank" rel="noreferrer">Ouvrir sur YouTube ↗</a></div></div>`;
}

function loadYoutubeIntoFrame(video) {
  const frame = document.querySelector("#playerFrame");
  if (!frame || !video?.youtubeId) return;
  if (location.protocol === "file:") {
    frame.innerHTML = `<div class="empty-state"><strong>Lecture indisponible ici</strong><p>Ouvre la vidéo sur YouTube ou lance Lumen depuis le serveur local.</p><a class="btn primary" href="${youtubeWatchUrl(video)}" target="_blank" rel="noreferrer">Ouvrir sur YouTube</a></div>`;
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
  const topbarRight = `<button class="btn" id="exportWorkspace">Exporter XML</button>`;
  const subheaderHtml = `<div class="vd-subbar"><div class="filter-bar workspace-tools">
      <input class="search-input" id="fileSearch" type="search" placeholder="Rechercher un dossier, lien, note, tag ou statut">
      <select class="select-input" id="fileTypeFilter"><option value="all">Tous les types</option><option value="video">Vidéos</option><option value="lien">Liens</option><option value="document">Documents</option><option value="note">Notes</option><option value="local">Fichiers locaux</option></select>
      <div class="filter-tabs" id="fileView"><button class="tab-btn active" data-view="grid">Grille</button><button class="tab-btn" data-view="list">Liste</button></div>
    </div></div>`;
  const centerHtml = `<div class="file-grid" id="fileGrid">${state.files.map(folderCard).join("")}</div><div id="fileEmpty"></div><pre class="code-box export-box" id="workspaceOutput" hidden></pre>
    <div class="studio-grid section">
      <article class="studio-panel"><h3>Créer un dossier</h3><form id="folderForm" class="studio-form"><label>Nom<input class="search-input" name="title" required></label><label>Description<textarea name="description"></textarea></label><label>Tags<input class="search-input" name="tags" placeholder="Clients, Docs, Priorité"></label><button class="btn primary">Créer dossier</button></form></article>
      <article class="studio-panel"><h3>Ajouter un item</h3><form id="fileForm" class="studio-form"><label>Dans<select class="select-input" name="folderId">${state.files.map((folder) => `<option value="${folder.id}">${escapeHtml(folder.title)}</option>`).join("")}</select></label><label>Titre<input class="search-input" name="title" required></label><label>Type<select class="select-input" name="type"><option>note</option><option>lien</option><option>document</option><option>table</option></select></label><label>URL<input class="search-input" name="url" placeholder="https://..."></label><label>Statut<input class="search-input" name="status" value="Actif"></label><label>Tags<input class="search-input" name="tags"></label><button class="btn primary">Ajouter item</button></form></article>
    </div>`;
  return renderShell({
    active: "files",
    icon: "ti-folder",
    title: "Organisation des fichiers.",
    subtitle: `${state.files.length} dossiers`,
    topbarRight,
    subheaderHtml,
    centerHtml
  });
}

function renderFinance() {
  const revenue = financeTotal("revenue");
  const expenses = financeTotal("expense");
  const balance = revenue - expenses;
  const topbarRight = `<button class="btn" id="exportFinanceCsv">CSV</button><button class="btn" id="exportFinanceXml">XML</button>`;
  const centerHtml = `<div class="grid-3"><article class="metric-card"><span class="eyebrow">Revenus</span><strong>${money(revenue)}</strong><p>Total des entrées suivies.</p></article><article class="metric-card"><span class="eyebrow">Dépenses</span><strong>${money(expenses)}</strong><p>Total des sorties prévues ou payées.</p></article><article class="metric-card"><span class="eyebrow">Solde</span><strong>${money(balance)}</strong><p>Budget disponible estimé.</p></article></div>
    <div class="studio-grid section">
      <article class="studio-panel"><h2>Transactions</h2><form id="transactionForm" class="studio-form compact-form"><select class="select-input" name="type"><option value="revenue">Revenu</option><option value="expense">Dépense</option></select><input class="search-input" name="title" placeholder="Libellé" required><input class="search-input" name="category" placeholder="Catégorie" required><input class="search-input" name="amount" type="number" min="0" step="0.01" placeholder="Montant" required><input class="search-input" name="date" type="date" required><button class="btn primary">Ajouter</button></form><div class="transaction-list">${state.finance.transactions.map(transactionRow).join("") || `<div class="empty-state"><strong>Aucune transaction</strong></div>`}</div></article>
      <article class="studio-panel"><h2>Objectifs</h2><form id="goalForm" class="studio-form"><label>Objectif<input class="search-input" name="title" required></label><label>Cible<input class="search-input" name="target" type="number" min="0" step="0.01" required></label><label>Actuel<input class="search-input" name="current" type="number" min="0" step="0.01" value="0"></label><label>Échéance<input class="search-input" name="deadline" type="date"></label><button class="btn primary">Ajouter objectif</button></form><div class="goal-list">${state.finance.goals.map(goalCard).join("") || `<p class="meta">Ajoute un objectif pour suivre sa progression.</p>`}</div></article>
    </div>
    <pre class="code-box export-box" id="financeOutput" hidden></pre>`;
  return renderShell({
    active: "finance",
    icon: "ti-wallet",
    title: "Suivi finance léger.",
    subtitle: `Solde ${money(balance)}`,
    topbarRight,
    centerHtml
  });
}

function folderCard(folder) {
  const search = `${folder.title} ${folder.description} ${folder.status} ${folder.tags.join(" ")} ${folder.files.map((file) => `${file.title} ${file.type} ${file.status} ${file.tags?.join(" ")} ${file.note}`).join(" ")}`.toLowerCase();
  const hasPages = folder.files.length > 5;
  return `<article class="file-card" data-file-card data-resource-page="0" data-search="${escapeAttr(search)}"><div class="file-card-head"><span class="category-icon">${escapeHtml(folder.icon)}</span><span class="level">${escapeHtml(folder.status || "Actif")}</span></div><h3>${escapeHtml(folder.title)}</h3><p>${escapeHtml(folder.description || "Dossier de travail Lumen.")}</p><div class="chip-row">${resourceTypeSummary(folder.files).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}${folder.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div><div class="resource-list">${folder.files.map((file, index) => resourceRow(file, index)).join("") || `<p class="meta">Aucun item.</p>`}</div>${hasPages ? `<div class="resource-pager"><button class="mini-btn" type="button" data-resource-page-prev>←</button><span data-resource-page-label>1 / ${Math.ceil(folder.files.length / 5)}</span><button class="mini-btn" type="button" data-resource-page-next>→</button></div>` : ""}</article>`;
}

function resourceRow(file, index = 0) {
  const title = escapeHtml(file.title);
  const source = file.source ? ` · ${escapeHtml(file.source)}` : "";
  const type = resourceKind(file);
  const label = `<strong>${title}</strong><span><span class="resource-kind">${escapeHtml(resourceKindLabel(type))}</span> · ${escapeHtml(file.status)}${source}</span>`;
  return file.url ? `<a class="resource-row" data-resource-row data-resource-index="${index}" data-type="${type}" href="${escapeAttr(file.url)}" target="_blank" rel="noreferrer">${label}</a>` : `<div class="resource-row" data-resource-row data-resource-index="${index}" data-type="${type}">${label}</div>`;
}

function transactionRow(item) {
  return `<div class="transaction-row"><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.date)}</small></span><strong class="${item.type === "revenue" ? "amount-good" : "amount-bad"}">${item.type === "revenue" ? "+" : "-"}${money(item.amount)}</strong></div>`;
}

function goalCard(goal) {
  const percent = goal.target ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  return `<article class="goal-card"><div class="card-meta"><strong>${escapeHtml(goal.title)}</strong><span>${percent}%</span></div><div class="progress"><span style="width:${percent}%"></span></div><p>${money(goal.current)} / ${money(goal.target)}${goal.deadline ? ` · ${escapeHtml(goal.deadline)}` : ""}</p></article>`;
}

function renderAbout() {
  const techStack = [
    "HTML + CSS + JavaScript vanilla",
    "Données XML + localStorage",
    "GitHub Pages (statique, sans serveur)",
    "Supabase (cloud optionnel — Phase C)",
    "Playwright (tests E2E)",
  ];
  const dataSources = [
    ["data/library.xml", "vidéos & playlists"],
    ["data/resources.xml", "vidéos importées"],
    ["data/workspace.xml", "fichiers & notes"],
    ["data/finance.xml", "transactions"],
    ["localStorage", "modifications locales"],
  ];
  const rules = [
    "Toujours fonctionnel hors-ligne",
    "Aucune suppression de données XML",
    "youtubeId comme clé unique anti-doublon",
    "Aucune clé secrète côté client",
    "Cloud = surcouche, jamais obligatoire",
  ];
  const centerHtml = `<p class="section-intro">Local-first, statique, GitHub Pages. Le cloud est une surcouche optionnelle — jamais une dépendance pour afficher la bibliothèque.</p>
  <div class="grid-3">
    ${appCard("Phase A — Design ✅", "Nouveau design Lumen (violet/cyan, Sora+Inter), page d'accueil animée, dashboard vidéos 3 colonnes, lecteur robuste.", "videos.html")}
    ${appCard("Phase B — Données", "Couche d'accès unifiée store.js, modèle de données cible, schéma SQL Supabase — préparation cloud sans dépendance obligatoire.", "playlists.html")}
    ${appCard("Phase C — Cloud", "Comptes Supabase, authentification email, Row Level Security par utilisateur, migration locale → cloud, synchronisation offline-safe.", "about.html")}
  </div>
  <div class="grid-3 section">
    <article class="content-card"><div class="card-meta"><span class="badge">Tech</span></div><h3>Stack technique</h3><ul class="about-list">${techStack.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>
    <article class="content-card"><div class="card-meta"><span class="badge">Données</span></div><h3>Sources de données</h3><ul class="about-list">${dataSources.map(([file, desc]) => `<li><code>${escapeHtml(file)}</code> — ${escapeHtml(desc)}</li>`).join("")}</ul></article>
    <article class="content-card"><div class="card-meta"><span class="badge">Invariants</span></div><h3>Règles d'or</h3><ul class="about-list">${rules.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul></article>
  </div>`;
  return renderShell({
    active: "about",
    icon: "ti-info-circle",
    title: "Bibliothèque personnelle, modulaire et évolutive.",
    subtitle: "Architecture Lumen",
    centerHtml
  });
}

function bindPage() {
  bindFavorites();
  if (page === "home")      bindHome();
  if (page === "playlists") bindPlaylistFilters();
  if (page === "videos")    bindVideos();
  if (page === "files")     bindFiles();
  if (page === "finance")   bindFinance();
}

function bindHome() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in'), i * 60);
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

  document.querySelectorAll('[data-spotlight]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  if (reduced) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }

  const hero = document.getElementById('homeHero');
  const glow = document.getElementById('homeGlow');
  const cv   = document.getElementById('homeCanvas');
  if (!hero || !glow || !cv) return;

  let gx = window.innerWidth / 2, gy = window.innerHeight * 0.4, tx = gx, ty = gy;
  hero.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function animGlow() {
    gx += (tx - gx) * 0.08;
    gy += (ty - gy) * 0.08;
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    requestAnimationFrame(animGlow);
  })();

  const ctx2d = cv.getContext('2d');
  let W, H, dots = [], mx = -999, my = -999;
  function resizeCanvas() {
    W = cv.width  = hero.offsetWidth;
    H = cv.height = hero.offsetHeight;
    const gap = 46;
    dots = [];
    for (let x = gap / 2; x < W; x += gap)
      for (let y = gap / 2; y < H; y += gap)
        dots.push({ bx: x, by: y });
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  hero.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', () => { mx = -999; my = -999; });
  (function draw() {
    ctx2d.clearRect(0, 0, W, H);
    for (const d of dots) {
      const dx = d.bx - mx, dy = d.by - my, dist = Math.hypot(dx, dy);
      const R = 150;
      let px = d.bx, py = d.by, size = 1.3, a = 0.18;
      if (dist < R) {
        const f = 1 - dist / R;
        const ang = Math.atan2(dy, dx);
        px = d.bx + Math.cos(ang) * f * 14;
        py = d.by + Math.sin(ang) * f * 14;
        size = 1.3 + f * 2.4;
        a = 0.18 + f * 0.7;
        ctx2d.fillStyle = `rgba(${110 + (f * 60 | 0)},${86 + (f * 90 | 0)},247,${a.toFixed(2)})`;
      } else {
        ctx2d.fillStyle = `rgba(150,155,180,${a})`;
      }
      ctx2d.beginPath();
      ctx2d.arc(px, py, size, 0, 6.283);
      ctx2d.fill();
    }
    requestAnimationFrame(draw);
  })();
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
  bindExportActions();
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
    const categoryPlaylists = playlistsByCategory(id);
    if (categoryPlaylists.length) {
      const confirmed = confirm(`Cette catégorie contient ${categoryPlaylists.length} playlist(s). Supprimer cette catégorie supprimera aussi ses playlists et vidéos. Continuer ?`);
      if (!confirmed) return;
    }
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
    const formElement = event.currentTarget;
    const sourceList = getPlaylist(form.get("playlistId"));
    const youtubeId = normalizeYoutubeId(form.get("youtube"));
    const title = clean(form.get("title"));
    if (!sourceList || !youtubeId || !title) return;
    const existingId = form.get("id");
    const targetList = resolveTargetPlaylist(form, sourceList.category);
    if (!targetList) { setAdminNotice(formElement, "Choisis une playlist cible ou crée une nouvelle playlist."); return; }
    const duplicate = targetList.videos.find((video) => video.youtubeId === youtubeId && video.id !== existingId);
    if (duplicate) { setAdminNotice(formElement, `Cette vidéo existe déjà dans la playlist ${targetList.title}.`); return; }
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
    targetList.videos = targetList.videos.filter((video) => video.youtubeId !== next.youtubeId);
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
  document.querySelector(".imported-status-tabs")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-import-admin-status]");
    if (!button) return;
    document.querySelectorAll("[data-import-admin-status]").forEach((item) => item.classList.toggle("active", item === button));
    filterImportedAdmin(button.dataset.importAdminStatus);
  });
  document.querySelector("#organizeImportedForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;
    const video = importedVideosForUi().find((item) => importedVideoKey(item) === form.get("videoKey"));
    if (!video) return;

    const targetList = resolveTargetPlaylist(form, video.category);
    if (!targetList || targetList.imported) { setAdminNotice(formElement, "Choisis une playlist cible ou crée une nouvelle playlist."); return; }
    if (targetList.videos.some((item) => item.youtubeId === video.youtubeId)) {
      setAdminNotice(formElement, `Cette vidéo existe déjà dans la playlist ${targetList.title}.`);
      return;
    }

    const nextVideo = {
      ...video,
      id: uniqueAdminId(slug(video.title), targetList.videos),
      playlistId: targetList.id,
      category: targetList.category,
      imported: false
    };
    targetList.videos.push(nextVideo);
    regularPlaylists().forEach((list) => {
      if (list.id !== targetList.id) list.videos = list.videos.filter((item) => item.youtubeId !== nextVideo.youtubeId);
    });
    saveAdminSelection({ playlistId: targetList.id, videoId: nextVideo.id });
    persistAdminChanges(true, false);
  });
}

function filterImportedAdmin(status) {
  document.querySelectorAll("[data-import-admin-row]").forEach((row) => {
    row.hidden = status !== "all" && row.dataset.status !== status;
  });
}

function bindAdminRows() {
  document.querySelectorAll("[data-organized-move]").forEach((button) => button.addEventListener("click", () => {
    saveAdminSelection({ playlistId: button.dataset.parent, videoId: button.dataset.id });
    fillVideoForm(button.dataset.parent, button.dataset.id);
    document.querySelector("#videoAdminForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  document.querySelectorAll("[data-organized-remove]").forEach((button) => button.addEventListener("click", () => {
    const playlist = getPlaylist(button.dataset.parent);
    if (!playlist) return;
    playlist.videos = playlist.videos.filter((video) => video.id !== button.dataset.id);
    saveAdminSelection({ playlistId: playlist.id, videoId: "" });
    persistAdminChanges(true, false);
  }));
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
  const params = new URLSearchParams(location.search);
  if (params.get("playlist") && params.get("video")) bindVideoPlayer();
  else bindVideoDashboard();
}

function bindVideoPlayer() {
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

  document.querySelector("#videoScope")?.addEventListener("change", (event) => {
    if (event.target.value !== "current") {
      const playlistFilter = document.querySelector("#videoPlaylistFilter");
      if (playlistFilter) playlistFilter.value = "all";
    }
    renderFilteredVideoList();
  });
  document.querySelector("#videoPlaylistFilter")?.addEventListener("change", renderFilteredVideoList);
  document.querySelector("#videoSort")?.addEventListener("change", renderFilteredVideoList);

  document.querySelector("#playerFrame")?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-load-youtube]");
    if (!trigger) return;
    const list = getPlaylist(state.active.playlistId);
    loadYoutubeIntoFrame(getVideo(list, state.active.videoId));
  });

  document.querySelector("#videoSearch")?.addEventListener("input", renderFilteredVideoList);
  bindImportedFilters();
}

function bindVideoDashboard() {
  bindAdminPanel();

  document.querySelector("#vdOpenAdmin2")?.addEventListener("click", () => {
    const drawer = document.querySelector("#adminDrawer");
    const overlay = document.querySelector("#adminOverlay");
    if (drawer && overlay) { drawer.hidden = false; overlay.hidden = false; document.body.classList.add("admin-open"); }
  });

  document.querySelector("#vdSearch")?.addEventListener("input", filterVdGrid);

  document.querySelector("#vdFilters")?.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-filter]");
    if (!chip) return;
    document.querySelectorAll(".vd-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    filterVdGrid();
  });


  let dragged = null;
  document.querySelectorAll("[data-vcard]").forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      dragged = card;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => { card.classList.remove("dragging"); dragged = null; });
  });

  document.querySelectorAll("[data-drop-playlist-id]").forEach((plEl) => {
    plEl.addEventListener("dragover", (e) => { e.preventDefault(); plEl.classList.add("drop-over"); });
    plEl.addEventListener("dragleave", () => plEl.classList.remove("drop-over"));
    plEl.addEventListener("drop", (e) => {
      e.preventDefault();
      plEl.classList.remove("drop-over");
      if (!dragged) return;
      const targetPlaylistId = plEl.dataset.dropPlaylistId;
      const srcPlaylist = getPlaylist(dragged.dataset.playlistId);
      const video = getVideo(srcPlaylist, dragged.dataset.videoId);
      if (!video) return;
      const result = addVideoToPlaylist(video, targetPlaylistId);
      if (result.added) {
        const countEl = document.querySelector(`[data-pl-count="${CSS.escape(targetPlaylistId)}"]`);
        if (countEl) countEl.textContent = String(parseInt(countEl.textContent || "0") + 1);
      }
      showVdToast(result.message, result.added ? "success" : "warn");
    });
  });

  document.querySelector("#vdExportXml")?.addEventListener("click", () => {
    const out = document.querySelector("#vdXmlOutput");
    if (!out) return;
    out.textContent = exportXml();
    out.hidden = false;
    showVdToast("XML généré — copiez le contenu ci-dessous", "success");
  });

  document.querySelector("#vdCopyXml")?.addEventListener("click", () => {
    const xml = exportXml();
    navigator.clipboard.writeText(xml)
      .then(() => showVdToast("XML copié dans le presse-papiers !", "success"))
      .catch(() => {
        const out = document.querySelector("#vdXmlOutput");
        if (out) { out.textContent = xml; out.hidden = false; }
        showVdToast("Copiez depuis le panneau ci-dessous", "warn");
      });
  });
}

function filterVdGrid() {
  const query = (document.querySelector("#vdSearch")?.value || "").toLowerCase();
  const activeChip = document.querySelector(".vd-chip.active");
  const filter = activeChip?.dataset.filter || "all";
  let count = 0;
  document.querySelectorAll("[data-vcard]").forEach((card) => {
    const matchSearch = !query || card.dataset.search.includes(query);
    const matchFilter = filter === "all"
      || (filter === "library" && card.dataset.source === "library")
      || (filter === "imported" && card.dataset.source === "imported")
      || (filter.startsWith("cat:") && card.dataset.category === filter.slice(4));
    const show = matchSearch && matchFilter;
    card.hidden = !show;
    if (show) count++;
  });
  const empty = document.querySelector("#vdEmpty");
  if (empty) empty.innerHTML = count === 0 ? `<div class="empty-state" style="margin-top:40px"><strong>Aucune vidéo trouvée</strong><p>Modifiez votre recherche ou filtre.</p></div>` : "";
}

function showVdToast(msg, type = "success") {
  const toast = document.querySelector("#vdToast");
  const msgEl = document.querySelector("#vdToastMsg");
  const icon = document.querySelector("#vdToastIcon");
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  if (icon) icon.className = `ti ${type === "success" ? "ti-check" : "ti-alert-triangle"}`;
  toast.className = `vd-toast ${type}`;
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(toast._tt);
  toast._tt = setTimeout(() => toast.classList.remove("show"), 2600);
}

function addVideoToPlaylist(video, targetPlaylistId) {
  const target = getPlaylist(targetPlaylistId);
  if (!target) return { added: false, message: "Playlist introuvable" };
  if (target.videos.some((v) => v.youtubeId === video.youtubeId)) {
    return { added: false, message: `Déjà dans « ${target.title} »` };
  }
  target.videos.push({
    id: video.id || `v-${Date.now()}`,
    youtubeId: video.youtubeId,
    title: video.title,
    description: video.description || "",
    duration: video.duration || "",
    level: video.level || target.level || "Débutant",
    tags: Array.isArray(video.tags) ? video.tags : [],
  });
  saveLibraryOverride();
  return { added: true, message: `Ajouté à « ${target.title} » ✓` };
}

function renderFilteredVideoList() {
  const list = getPlaylist(state.active.playlistId);
  const query = (document.querySelector("#videoSearch")?.value || "").toLowerCase();
  const scope = document.querySelector("#videoScope")?.value || "current";
  const playlistId = document.querySelector("#videoPlaylistFilter")?.value || "all";
  const sort = document.querySelector("#videoSort")?.value || "category";
  const activeVideoId = state.active.videoId;
  let videos = [];

  if (scope === "current") {
    const baseList = playlistId !== "all" ? getPlaylist(playlistId) : list;
    videos = (baseList?.videos || []).map((video) => ({ ...video, playlistId: baseList.id, playlistTitle: baseList.title, category: video.category || baseList.category, imported: Boolean(video.imported || baseList.imported) }));
  }
  else videos = allVideos().filter((video) => {
    if (scope === "library" && video.imported) return false;
    if (scope === "imported" && !video.imported) return false;
    return true;
  });

  if (scope !== "current" && playlistId !== "all") videos = videos.filter((video) => video.playlistId === playlistId);
  videos = videos
    .filter((video) => videoSearchText(video).includes(query))
    .sort((a, b) => videoSortValue(a, sort).localeCompare(videoSortValue(b, sort), "fr"));

  const videoList = document.querySelector("#videoList");
  if (videoList) videoList.innerHTML = videos.map((video) => videoRow(video, video.playlistId, video.id === activeVideoId)).join("");
  document.querySelector("#videoEmpty").innerHTML = videos.length ? "" : `<div class="empty-state"><strong>Aucune vidéo trouvée</strong></div>`;
}

function bindImportedFilters() {
  document.querySelector("#importedSearch")?.addEventListener("input", filterImportedVideos);
  document.querySelector("#importedCategory")?.addEventListener("change", filterImportedVideos);
  document.querySelector("#importedSource")?.addEventListener("change", filterImportedVideos);
  document.querySelector("#importedStatus")?.addEventListener("change", filterImportedVideos);
}

function filterImportedVideos() {
  const query = (document.querySelector("#importedSearch")?.value || "").toLowerCase();
  const category = document.querySelector("#importedCategory")?.value || "all";
  const source = document.querySelector("#importedSource")?.value || "all";
  const status = document.querySelector("#importedStatus")?.value || "all";
  let count = 0;
  document.querySelectorAll("[data-imported-video]").forEach((card) => {
    const visible = card.dataset.search.includes(query)
      && (category === "all" || card.dataset.category === category)
      && (source === "all" || card.dataset.source === source)
      && (status === "all" || card.dataset.status === status);
    card.hidden = !visible;
    if (visible) count += 1;
  });
  const empty = document.querySelector("#importedEmpty");
  if (empty) empty.innerHTML = count ? "" : `<div class="empty-state"><strong>Aucune vidéo importée trouvée</strong></div>`;
}

function bindFiles() {
  document.querySelector("#fileSearch")?.addEventListener("input", filterFiles);
  document.querySelector("#fileTypeFilter")?.addEventListener("change", filterFiles);
  document.querySelectorAll("[data-file-card]").forEach((card) => updateResourcePager(card));
  document.querySelector("#fileGrid")?.addEventListener("click", (event) => {
    const prev = event.target.closest("[data-resource-page-prev]");
    const next = event.target.closest("[data-resource-page-next]");
    if (!prev && !next) return;
    const card = event.target.closest("[data-file-card]");
    if (!card) return;
    const current = Number(card.dataset.resourcePage || 0);
    card.dataset.resourcePage = String(current + (next ? 1 : -1));
    updateResourcePager(card);
  });
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
  bindExportActions();
}

function filterFiles() {
  const query = (document.querySelector("#fileSearch")?.value || "").toLowerCase();
  const type = document.querySelector("#fileTypeFilter")?.value || "all";
  let count = 0;
  document.querySelectorAll("[data-file-card]").forEach((card) => {
    card.dataset.resourcePage = "0";
    const matchingRows = visibleResourceRows(card);
    updateResourcePager(card);
    const hasVisibleResource = type === "all" || matchingRows.length > 0;
    const visible = card.dataset.search.includes(query) && hasVisibleResource;
    card.hidden = !visible;
    if (visible) count += 1;
  });
  document.querySelector("#fileEmpty").innerHTML = count ? "" : `<div class="empty-state"><strong>Aucun fichier trouvé</strong></div>`;
}

function visibleResourceRows(card) {
  const type = document.querySelector("#fileTypeFilter")?.value || "all";
  return [...card.querySelectorAll("[data-resource-row]")].filter((row) => type === "all" || row.dataset.type === type);
}

function updateResourcePager(card) {
  const rows = [...card.querySelectorAll("[data-resource-row]")];
  const filteredRows = visibleResourceRows(card);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / 5));
  const current = Math.min(Math.max(Number(card.dataset.resourcePage || 0), 0), totalPages - 1);
  card.dataset.resourcePage = String(current);
  const start = current * 5;
  const active = new Set(filteredRows.slice(start, start + 5));
  rows.forEach((row) => { row.hidden = !active.has(row); });
  const pager = card.querySelector(".resource-pager");
  if (!pager) return;
  pager.hidden = filteredRows.length <= 5;
  const label = card.querySelector("[data-resource-page-label]");
  if (label) label.textContent = `${current + 1} / ${totalPages}`;
  const prev = card.querySelector("[data-resource-page-prev]");
  const next = card.querySelector("[data-resource-page-next]");
  if (prev) prev.disabled = current <= 0;
  if (next) next.disabled = current >= totalPages - 1;
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
  bindExportActions();
}

function showExport(selector, value) {
  const output = document.querySelector(selector);
  output.hidden = false;
  output.textContent = value;
  ensureExportActions(output);
  output.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function ensureExportActions(output) {
  if (!output || output.previousElementSibling?.classList.contains("export-actions")) return;
  const actions = document.createElement("div");
  actions.className = "export-actions";
  actions.innerHTML = `<button class="btn" type="button" data-copy-export>Copier l'export</button><button class="btn" type="button" data-download-export>Télécharger</button>`;
  output.before(actions);
  bindExportActions();
}

function bindExportActions() {
  document.querySelectorAll("[data-copy-export]").forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = "true";
    button.addEventListener("click", async () => {
      const output = button.closest(".export-actions")?.nextElementSibling;
      const value = output?.textContent || "";
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = "Copié";
      } catch {
        selectOutputText(output);
        button.textContent = "Sélectionné";
      }
      setTimeout(() => { button.textContent = "Copier l'export"; }, 1400);
    });
  });
  document.querySelectorAll("[data-download-export]").forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const output = button.closest(".export-actions")?.nextElementSibling;
      downloadText(exportFilename(output), output?.textContent || "");
    });
  });
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
  form.elements.targetCategoryId.value = playlist?.category || state.categories[0]?.id || "";
  form.elements.targetPlaylistId.value = playlist?.id || "";
  form.elements.newCategoryTitle.value = "";
  form.elements.newPlaylistTitle.value = "";
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

function resolveTargetPlaylist(form, fallbackCategoryId) {
  const playlistId = form.get("targetPlaylistId") || form.get("playlistId");
  if (playlistId && playlistId !== "__new__") return getPlaylist(playlistId);
  const categoryId = resolveTargetCategoryId(form, fallbackCategoryId);
  const title = clean(form.get("newPlaylistTitle")) || `À organiser — ${categoryName(categoryId)}`;
  const playlist = {
    id: uniqueAdminId(slug(title), state.playlists),
    title,
    description: "Playlist créée localement depuis l'administration.",
    category: categoryId,
    level: "À classer",
    tags: ["Organisation"],
    videos: []
  };
  state.playlists.push(playlist);
  return playlist;
}

function resolveTargetCategoryId(form, fallbackCategoryId) {
  const requested = form.get("categoryId") || form.get("targetCategoryId");
  if (requested && requested !== "__new__") return requested;
  const title = clean(form.get("newCategoryTitle")) || "Nouvelle catégorie";
  const id = uniqueAdminId(slug(title), state.categories);
  state.categories.push({
    id,
    title,
    icon: title.slice(0, 2),
    color: "cyan",
    description: "Catégorie créée localement depuis l'administration."
  });
  return id || fallbackCategoryId || state.categories[0]?.id;
}

function setAdminNotice(form, message) {
  const notice = form?.querySelector("[data-admin-notice]");
  if (!notice) return;
  notice.hidden = false;
  notice.textContent = message;
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

function importedAdminRow(video) {
  const organization = importedOrganization(video.youtubeId);
  const status = organization ? "organized" : "unorganized";
  const label = organization ? `Ajoutée à ${organization.title}` : "Non classée";
  return `<div class="admin-row" data-import-admin-row data-status="${status}"><span><strong>${escapeHtml(video.title)}</strong><small>${escapeHtml(label)} · ${escapeHtml(categoryName(video.category))}</small></span><span class="admin-row-actions"><a class="mini-btn" href="videos.html?playlist=${encodeURIComponent(video.playlistId)}&video=${encodeURIComponent(video.id)}">Regarder</a></span></div>`;
}

function allVideos() { return state.playlists.flatMap((list) => list.videos.map((video) => ({ ...video, tags: video.tags || [], playlistId: list.id, playlistTitle: list.title, category: video.category || list.category, imported: Boolean(video.imported || list.imported) }))); }
function regularPlaylists() { return state.playlists.filter((list) => !list.imported); }
function organizedVideosForAdmin() { return allVideos().filter((video) => !video.imported); }
function importedVideosForUi() { return allVideos().filter((video) => video.imported && video.youtubeId); }
function unorganizedImportedVideos() {
  const organizedIds = new Set(regularPlaylists().flatMap((list) => list.videos.map((video) => video.youtubeId).filter(Boolean)));
  return importedVideosForUi().filter((video) => !organizedIds.has(video.youtubeId));
}
function importedOrganization(youtubeId) {
  for (const list of regularPlaylists()) {
    if (list.videos.some((video) => video.youtubeId === youtubeId)) return list;
  }
  return null;
}
function importedStatusCounts() {
  const imported = importedVideosForUi();
  const organized = imported.filter((video) => importedOrganization(video.youtubeId)).length;
  return { organized, unorganized: imported.length - organized };
}
function importedVideoKey(video) { return `${video.playlistId}:${video.id}`; }
function importedPlaylistId(folderId) { return `imported-${slug(folderId)}`; }
function sourceFolder(source) { return String(source || "").split("/").filter(Boolean).slice(0, 2).join("/") || ""; }
function videoSearchText(video) { return `${video.title} ${video.description} ${video.playlistTitle || ""} ${categoryName(video.category)} ${video.source || ""} ${video.level || ""} ${video.topic || ""} ${video.domain || ""} ${video.intent || ""} ${(video.tags || []).join(" ")}`.toLowerCase(); }
function videoSortValue(video, sort) {
  if (sort === "title") return video.title || "";
  if (sort === "source") return video.source || video.playlistTitle || "";
  return `${categoryName(video.category)} ${video.title || ""}`;
}
function resourceKind(file) {
  const type = String(file.type || "").toLowerCase();
  if (file.youtubeId || type === "video") return "video";
  if (type === "lien" || /^https?:\/\//.test(file.url || "")) return "lien";
  if (["document", "table", "archive", "image"].includes(type)) return "document";
  if (type === "note") return "note";
  return "local";
}
function resourceKindLabel(type) {
  return ({ video: "Vidéo", lien: "Lien", document: "Document", note: "Note", local: "Fichier local" })[type] || "Ressource";
}
function resourceTypeSummary(files = []) {
  const counts = files.reduce((acc, file) => {
    const type = resourceKind(file);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([type, count]) => `${resourceKindLabel(type)}s ${count}`);
}
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
function selectOutputText(output) { if (!output) return; const range = document.createRange(); range.selectNodeContents(output); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); }
function exportFilename(output) {
  if (output?.id === "workspaceOutput") return "workspace.xml";
  if (output?.id === "financeOutput") return output.textContent.trim().startsWith("type,") ? "finance.csv" : "finance.xml";
  return "library.xml";
}
function downloadText(filename, value) {
  const blob = new Blob([value], { type: filename.endsWith(".csv") ? "text/csv;charset=utf-8" : "application/xml;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}
function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); }
function escapeAttr(value) { return escapeHtml(value); }
function escXml(value) { return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char])); }
