const fs = require("fs");
const path = require("path");

const ROOT = "/home/yobel/Bureau/a faire/Ressouces";
const AUDIT_FILE = "/tmp/visionhub-youtube-resource-audit-3.tsv";
const OUT = path.join(__dirname, "..", "data", "resources.xml");

const youtubeAudit = readYoutubeAudit(AUDIT_FILE);
const seenUrls = new Set();
const seenFiles = new Set();
const folders = new Map();
const stats = {
  filesSeen: 0,
  urlSeen: 0,
  youtubeValid: 0,
  youtubeInvalidSkipped: 0,
  youtubeNonVideoSkipped: 0,
  duplicateSkipped: 0,
  localFiles: 0,
  externalLinks: 0
};

walk(ROOT)
  .filter((file) => !file.includes(`${path.sep}.git${path.sep}`))
  .sort((a, b) => a.localeCompare(b, "fr"))
  .forEach(addResource);

const folderXml = [...folders.values()].map((folder) => {
  const items = folder.items.map((item) => {
    const attrs = [
      ["id", item.id],
      ["title", item.title],
      ["type", item.type],
      ["status", item.status],
      ["url", item.url || ""],
      ["source", item.source],
      ["tags", item.tags.join(",")]
    ];
    if (item.youtubeId) attrs.push(["youtubeId", item.youtubeId]);
    return `      <item ${attrs.map(([key, value]) => `${key}="${xml(value)}"`).join(" ")}>${xml(item.note)}</item>`;
  }).join("\n");
  return `    <folder id="${xml(folder.id)}" title="${xml(folder.title)}" icon="${xml(folder.icon)}" status="Importé" tags="${xml(folder.tags.join(","))}">
      <description>${xml(folder.description)}</description>
${items}
    </folder>`;
}).join("\n");

const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<resources version="1.0" updated="2026-06-09" source="${xml(ROOT)}">
  <audit filesSeen="${stats.filesSeen}" urlSeen="${stats.urlSeen}" youtubeValid="${stats.youtubeValid}" youtubeInvalidSkipped="${stats.youtubeInvalidSkipped}" youtubeNonVideoSkipped="${stats.youtubeNonVideoSkipped}" duplicateSkipped="${stats.duplicateSkipped}" localFiles="${stats.localFiles}" externalLinks="${stats.externalLinks}" />
  <folders>
${folderXml}
  </folders>
</resources>
`;

fs.writeFileSync(OUT, xmlText, "utf8");
console.log(`Generated ${OUT}`);
console.log(stats);

function addResource(file) {
  stats.filesSeen += 1;
  const relative = path.relative(ROOT, file);
  const rawTitle = path.basename(file).replace(/\.[^.]+$/, "");
  const url = readShortcutUrl(file);
  const section = classify(relative, url);
  const folder = ensureFolder(section);

  if (url) {
    stats.urlSeen += 1;
    const normalizedUrl = normalizeUrl(url);
    if (seenUrls.has(normalizedUrl)) {
      stats.duplicateSkipped += 1;
      return;
    }
    seenUrls.add(normalizedUrl);

    const youtubeId = youtubeVideoId(normalizedUrl);
    if (isYoutubeUrl(normalizedUrl)) {
      if (!youtubeId) {
        stats.youtubeNonVideoSkipped += 1;
        return;
      }
      const audit = youtubeAudit.get(youtubeId);
      if (audit && audit.status !== "OK") {
        stats.youtubeInvalidSkipped += 1;
        return;
      }
      stats.youtubeValid += 1;
      folder.items.push({
        id: uniqueId(`${section.id}-${youtubeId}`),
        title: cleanTitle(rawTitle),
        type: "video",
        status: "Validé",
        url: normalizedUrl,
        source: relative,
        youtubeId,
        tags: tagsFor(relative, "video"),
        note: "Vidéo YouTube validée automatiquement via audit oEmbed."
      });
      return;
    }

    stats.externalLinks += 1;
    folder.items.push({
      id: uniqueId(`${section.id}-${slug(rawTitle)}`),
      title: cleanTitle(rawTitle),
      type: "lien",
      status: "À vérifier",
      url: normalizedUrl,
      source: relative,
      tags: tagsFor(relative, "lien"),
      note: "Lien externe importé depuis un raccourci local."
    });
    return;
  }

  const stat = fs.statSync(file);
  const fileKey = `${rawTitle.toLowerCase()}-${stat.size}`;
  if (seenFiles.has(fileKey)) {
    stats.duplicateSkipped += 1;
    return;
  }
  seenFiles.add(fileKey);
  stats.localFiles += 1;
  folder.items.push({
    id: uniqueId(`${section.id}-${slug(rawTitle)}`),
    title: cleanTitle(rawTitle),
    type: fileType(file),
    status: "Catalogué",
    url: "",
    source: relative,
    tags: tagsFor(relative, fileType(file)),
    note: `Fichier local à centraliser : ${relative}`
  });
}

function readYoutubeAudit(file) {
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).forEach((line) => {
    const [status, id, url, detail] = line.split("\t");
    if (id) map.set(id, { status, url, detail });
  });
  return map;
}

function readShortcutUrl(file) {
  if (!file.toLowerCase().endsWith(".url")) return "";
  const text = fs.readFileSync(file, "utf8");
  return (text.match(/^URL=(.+)$/m)?.[1] || "").trim().replace(/\r/g, "");
}

function classify(relative, url) {
  const value = `${relative} ${url || ""}`.toLowerCase();
  if (url && !isYoutubeUrl(url)) return folderDef("liens", "Liens", "URL", "Liens externes, outils et plateformes.");
  if (value.includes("notion") || value.includes("productiv") || value.includes("self develop") || value.includes("personality") || value.includes("organisation") || value.includes("dopamine")) return folderDef("productivite", "Productivité", "✓", "Organisation, Notion, routines et développement personnel.");
  if (value.includes("template") || value.includes("theme") || value.includes("guide") || value.includes("book") || value.includes("pdf") || value.includes("docx") || value.includes("odt") || value.includes("xlsx") || value.includes("zip")) return folderDef("documents", "Documents", "DOC", "Documents, guides, templates et fichiers locaux.");
  if (value.includes("python") || value.includes("javascript") || value.includes("webdev") || value.includes("informatique") || value.includes("code") || value.includes("program")) return folderDef("informatique", "Informatique", "IT", "Développement, IA, programmation et outils techniques.");
  if (value.includes("business") || value.includes("e-commerce") || value.includes("marketing") || value.includes("trading") || value.includes("shopify") || value.includes("freel")) return folderDef("business", "Business", "$", "Business, marketing, vente, finance et entrepreneuriat.");
  return folderDef("ressources", "Ressources", "RES", "Ressources diverses à qualifier.");
}

function folderDef(id, title, icon, description) {
  return { id, title, icon, description };
}

function ensureFolder(def) {
  if (!folders.has(def.id)) {
    folders.set(def.id, { ...def, tags: [def.title, "Import"], items: [] });
  }
  return folders.get(def.id);
}

function tagsFor(relative, type) {
  const tags = new Set([type]);
  const lower = relative.toLowerCase();
  ["ia", "ai", "python", "javascript", "marketing", "notion", "shopify", "trading", "freelance", "e-commerce", "web3"].forEach((tag) => {
    if (lower.includes(tag)) tags.add(tag.replace("ai", "IA"));
  });
  return [...tags];
}

function fileType(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  if (["pdf", "docx", "odt", "pages"].includes(ext)) return "document";
  if (["xlsx", "ods"].includes(ext)) return "table";
  if (["png", "jpg", "jpeg"].includes(ext)) return "image";
  if (["zip"].includes(ext)) return "archive";
  if (["txt", "md"].includes(ext)) return "note";
  if (["html", "css", "js", "py", "json"].includes(ext)) return "fichier";
  return ext || "fichier";
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function isYoutubeUrl(url) {
  return /(^https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

function youtubeVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.split("/").filter(Boolean)[0] || "";
    if (parsed.pathname === "/watch") return parsed.searchParams.get("v") || "";
    if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] || "";
    return "";
  } catch {
    return "";
  }
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url.trim());
    if (isYoutubeUrl(parsed.href)) {
      const id = youtubeVideoId(parsed.href);
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    parsed.hash = "";
    return parsed.href;
  } catch {
    return url.trim();
  }
}

function cleanTitle(title) {
  return title.replace(/\s+-\s+YouTube$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function uniqueId(base) {
  let next = slug(base);
  let index = 2;
  const allIds = new Set([...folders.values()].flatMap((folder) => folder.items.map((item) => item.id)));
  while (allIds.has(next)) {
    next = `${slug(base)}-${index}`;
    index += 1;
  }
  return next;
}

function slug(value) {
  return String(value || "item").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

function xml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));
}
