const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SOURCES = [
  { file: path.join(ROOT, "data", "library.xml"), kind: "library" },
  { file: path.join(ROOT, "data", "resources.xml"), kind: "resources" }
];
const OUT = path.join(ROOT, "data", "video-intelligence.xml");

const DOMAIN_RULES = [
  {
    id: "ecommerce",
    label: "E-commerce",
    tags: ["E-commerce", "Marketing"],
    words: ["e-commerce", "ecommerce", "shopify", "dropshipping", "product research", "winning product", "dtc", "aliexpress", "store", "شوبيفاي", "التجارة الالكترونية"]
  },
  {
    id: "creation",
    label: "Création de contenu",
    tags: ["Création", "Contenu"],
    words: ["youtube channel", "shorts", "reels", "viral", "capcut", "canva", "after effects", "motion graphics", "video editing", "montage", "مونتاج", "تصميم الجرافيكس"]
  },
  {
    id: "productivite",
    label: "Productivité",
    tags: ["Productivité", "Organisation"],
    words: ["productivite", "productivite", "productivity", "self developpement", "personality", "prodactivity", "notion", "focus", "monk mode", "dopamine", "routine", "habits", "reinvent yourself", "organis", "نوشن", "الإدمان"]
  },
  {
    id: "informatique",
    label: "Informatique",
    tags: ["Informatique", "Tech"],
    words: ["code/", "informatique", "programming", "programmation", "developer", "backend", "frontend", "github", "linux", "python", "javascript", "php", "sql", "برمجة", "بايثون"]
  },
  {
    id: "business",
    label: "Business",
    tags: ["Business", "Execution"],
    words: ["business/", "startup", "money", "income", "revenue", "offer", "sales", "marketing", "freelance", "client", "entrepreneur", "wealth", "millionaire", "rich", "فلوس", "الثراء", "العمل الحر"]
  },
  {
    id: "documents",
    label: "Documents",
    tags: ["Documents", "Base de connaissance"],
    words: ["documents", "pdf", "docx", "template", "guide", "course/", "bootcamp"]
  }
];

const TOPIC_RULES = [
  { label: "IA appliquée", tags: ["IA", "Automatisation", "Outils"], words: ["ai", "ia", "machine learning", "chatgpt", "gpt", "deepseek", "bolt", "jarvis", "intelligence artificielle", "agents ia", "no code", "الذكاء الاصطناعي"] },
  { label: "Python", tags: ["Python", "Programmation", "Automatisation"], words: ["python", "sqlite", "django", "flask", "chatbot", "بايثون", "البايثون"] },
  { label: "JavaScript", tags: ["JavaScript", "Programmation", "Web"], words: ["javascript", " js ", "node", "vue", "react", "typescript", "dom"] },
  { label: "React", tags: ["React", "JavaScript", "Frontend"], words: ["react", "component", "jsx", "hooks"] },
  { label: "Web design", tags: ["Web", "Design", "Frontend"], words: ["html", "css", "website", "responsive", "bootstrap", "font awesome", "particles", "layout"] },
  { label: "Backend et bases de données", tags: ["Backend", "SQL", "Architecture"], words: ["backend", "api", "database", "sql", "nosql", "sqlite", "php", "login system", "base de données"] },
  { label: "Cloud et DevOps", tags: ["Cloud", "DevOps", "Déploiement"], words: ["cloud", "google cloud", "host", "hosting", "github pages", "deploy", "server"] },
  { label: "Cybersécurité", tags: ["Cybersécurité", "Linux", "Réseau"], words: ["hacking", "ethical hacking", "cyber", "network", "bash", "linux", "امن سيبراني", "هاكر"] },
  { label: "Apprentissage programmation", tags: ["Programmation", "Roadmap", "Apprentissage"], words: ["programming language", "roadmap", "learn programming", "computer science", "cs50", "algorithm", "لغة البرمجة", "تعلم البرمجة", "أساسيات البرمجة"] },
  { label: "E-commerce", tags: ["E-commerce", "Shopify", "Marketing"], words: ["shopify", "dropshipping", "e-commerce", "product research", "winning product", "aliexpress", "store", "التجارة الإلكترونية", "شوبيفاي"] },
  { label: "Marketing et vente", tags: ["Marketing", "Vente", "Offre"], words: ["sales page", "copywriting", "offer", "value proposition", "storybrand", "marketing", "media buying", "landing page", "lander"] },
  { label: "Startup et business", tags: ["Startup", "Business", "Stratégie"], words: ["startup", "business", "saas", "entrepreneur", "yc", "strategyzer", "profitable apps", "money", "income", "millionaire"] },
  { label: "Création YouTube", tags: ["YouTube", "Création", "Audience"], words: ["youtube channel", "youtuber", "shorts", "viral", "views", "faceless", "إظهار وجهي", "قناة يوتيوب"] },
  { label: "Montage vidéo", tags: ["Montage", "Vidéo", "Création"], words: ["video editing", "capcut", "after effects", "canva", "motion graphics", "transitions", "reels", "montage", "مونتاج", "جرافيكس"] },
  { label: "Productivité personnelle", tags: ["Productivité", "Habitudes", "Focus"], words: ["productivity", "notion", "monk mode", "dopamine", "habits", "focus", "reinvent yourself", "organis", "نوشن"] },
  { label: "Finance et investissement", tags: ["Finance", "Investissement", "Argent"], words: ["invest", "bitcoin", "crypto", "passive income", "rich dad", "kiyosaki", "wealth", "millionaire", "الثراء"] },
  { label: "Design UI/UX", tags: ["UX", "UI", "Design"], words: ["figma", "ux", "ui design", "interface", "design system"] }
];

const INTENT_RULES = [
  { label: "Construire", words: ["build", "create", "créer", "develop", "project", "app", "website", "login system", "انشاء", "إنشاء"] },
  { label: "Apprendre", words: ["course", "tutorial", "learn", "crash course", "roadmap", "guide", "formation", "كورس", "تعلم", "دورة"] },
  { label: "Optimiser", words: ["productivity", "focus", "habits", "workflow", "automate", "automation", "organis"] },
  { label: "Monétiser", words: ["money", "income", "sales", "profitable", "business", "shopify", "dropshipping", "make $", "فلوس", "الثراء"] },
  { label: "S'inspirer", words: ["interview", "principles", "mindset", "future", "story", "truth"] }
];

const videos = new Map();

for (const source of SOURCES) {
  if (!fs.existsSync(source.file)) continue;
  collectVideos(source.file, source.kind);
}

const enriched = [...videos.values()].map(enrichVideo).sort((a, b) => a.youtubeId.localeCompare(b.youtubeId));
const xmlText = `<?xml version="1.0" encoding="UTF-8"?>
<videoIntelligence version="1.1" updated="2026-06-09" source="oEmbed + contexte VisionHub + règles éditoriales">
  <audit total="${enriched.length}" library="${enriched.filter((item) => item.source.includes("library")).length}" resources="${enriched.filter((item) => item.source.includes("resources")).length}" />
  <videos>
${enriched.map(videoXml).join("\n")}
  </videos>
</videoIntelligence>
`;

fs.writeFileSync(OUT, xmlText, "utf8");
console.log(`Generated ${OUT}`);
console.log({ total: enriched.length });

function collectVideos(file, sourceKind) {
  const text = fs.readFileSync(file, "utf8");
  const itemPattern = /<(video|item)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = itemPattern.exec(text))) {
    const tagName = match[1];
    const attrs = attrsToObject(match[2]);
    const youtubeId = attrs.youtubeId;
    if (!youtubeId) continue;
    const current = videos.get(youtubeId) || {
      youtubeId,
      rawTitle: decodeXml(attrs.title || ""),
      rawDescription: decodeXml(stripTags(match[3] || "")),
      category: "",
      playlist: "",
      sourcePath: decodeXml(attrs.source || ""),
      tags: new Set(),
      sources: new Set()
    };
    current.sources.add(sourceKind);
    if (attrs.tags) splitTags(decodeXml(attrs.tags)).forEach((tag) => current.tags.add(tag));
    if (attrs.source) current.sourcePath = decodeXml(attrs.source);
    if (sourceKind === "library" && tagName === "video") {
      const before = text.slice(0, match.index);
      const playlistOpen = before.lastIndexOf("<playlist ");
      const playlistEnd = before.lastIndexOf("</playlist>");
      if (playlistOpen > playlistEnd) {
        const playlistTag = text.slice(playlistOpen, text.indexOf(">", playlistOpen) + 1);
        const playlistAttrs = attrsToObject(playlistTag);
        current.playlist = decodeXml(playlistAttrs.title || "");
        current.category = decodeXml(playlistAttrs.category || "");
        splitTags(decodeXml(playlistAttrs.tags || "")).forEach((tag) => current.tags.add(tag));
      }
    }
    if (sourceKind === "resources" && tagName === "item") {
      const before = text.slice(0, match.index);
      const folderOpen = before.lastIndexOf("<folder ");
      const folderEnd = before.lastIndexOf("</folder>");
      if (folderOpen > folderEnd) {
        const folderTag = text.slice(folderOpen, text.indexOf(">", folderOpen) + 1);
        const folderAttrs = attrsToObject(folderTag);
        current.category = decodeXml(folderAttrs.title || "");
        current.playlist = decodeXml(folderAttrs.title || "");
        splitTags(decodeXml(folderAttrs.tags || "")).forEach((tag) => current.tags.add(tag));
      }
    }
    videos.set(youtubeId, current);
  }
}

function enrichVideo(video) {
  const publicTitle = fetchTitle(video.youtubeId) || video.rawTitle;
  const signal = [
    publicTitle,
    video.rawTitle,
    video.rawDescription,
    video.category,
    video.playlist,
    video.sourcePath,
    [...video.tags].join(" ")
  ].join(" ");
  const domain = classify(signal, DOMAIN_RULES, { label: "Apprentissage", tags: ["Apprentissage"] });
  const topic = classify(signal, TOPIC_RULES, { label: domain.label, tags: domain.tags });
  const intent = classify(signal, INTENT_RULES, { label: "Comprendre", tags: [] });
  const level = inferLevel(signal);
  const clean = makeTitle(publicTitle, topic, intent);
  const tags = [
    ...topic.tags,
    ...domain.tags,
    intent.label,
    ...[...video.tags].map(cleanTag)
  ].filter(Boolean);

  return {
    youtubeId: video.youtubeId,
    originalTitle: publicTitle,
    title: clean,
    description: makeDescription({ topic, domain, intent, context: video.playlist || video.category, level }),
    tags: [...new Set(tags)].slice(0, 10),
    level,
    topic: topic.label,
    domain: domain.label,
    intent: intent.label,
    confidence: confidenceFrom(topic.score + domain.score),
    category: video.category,
    playlist: video.playlist,
    sourcePath: video.sourcePath,
    source: [...video.sources].join(",")
  };
}

function fetchTitle(youtubeId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}&format=json`;
    const body = execFileSync("curl", ["-s", url], { encoding: "utf8", timeout: 10000 });
    const json = JSON.parse(body);
    return json.title || "";
  } catch {
    return "";
  }
}

function classify(value, rules, fallback) {
  const text = normalize(value);
  const scored = rules
    .map((rule) => ({ ...rule, score: scoreWords(text, rule.words) }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score <= 0) return { ...fallback, score: 0 };
  return best;
}

function scoreWords(text, words) {
  return words.reduce((score, word) => {
    const needle = normalize(word).trim();
    if (!containsSignal(text, needle)) return score;
    const weight = needle.length > 12 ? 3 : needle.length > 6 ? 2 : 1;
    return score + weight;
  }, 0);
}

function containsSignal(text, needle) {
  if (!needle) return false;
  if (needle.length <= 3 && /^[a-z0-9]+$/.test(needle)) {
    return new RegExp(`(^|\\s)${escapeRegExp(needle)}(?=\\s|$)`).test(text);
  }
  return text.includes(needle);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inferLevel(value) {
  const text = normalize(value);
  if (["advanced", "masterclass", "expert", "scaling", "backend", "smart contract", "complete guide", "profitable apps"].some((word) => text.includes(word))) return "Avancé";
  if (["project", "build", "complete", "crash course", "roadmap", "strategy", "automation", "from zero", "bootcamp"].some((word) => text.includes(word))) return "Intermédiaire";
  return "Débutant";
}

function confidenceFrom(score) {
  if (score >= 9) return "Haute";
  if (score >= 4) return "Moyenne";
  return "Faible";
}

function makeTitle(title, topic, intent) {
  const base = cleanTitle(title);
  const noisy = normalize(base);
  if (topic.label === "IA appliquée" && (noisy.includes("tools") || noisy.includes("outils"))) return "Sélection professionnelle d'outils IA";
  if (topic.label === "Python" && noisy.includes("sqlite")) return "Bases de données avec Python et SQLite";
  if (topic.label === "Python" && noisy.includes("chatbot")) return "Créer un chatbot IA avec Python";
  if (topic.label === "JavaScript" && (noisy.includes("course") || noisy.includes("tutorial"))) return "Bases modernes de JavaScript";
  if (topic.label === "Web design" && noisy.includes("responsive")) return "Créer une interface web responsive";
  if (topic.label === "Backend et bases de données" && noisy.includes("sql")) return "Comprendre SQL, NoSQL et les bases de données";
  if (topic.label === "Montage vidéo" && noisy.includes("capcut")) return "Apprendre le montage vidéo avec CapCut";
  if (topic.label === "E-commerce" && noisy.includes("shopify")) return "Construire une boutique Shopify orientée vente";
  if (topic.label === "Startup et business" && intent.label === "Monétiser") return "Transformer une idée business en revenu";
  return base.length > 96 ? `${base.slice(0, 93).trim()}...` : base;
}

function makeDescription({ topic, domain, intent, context, level }) {
  const suffix = context ? ` dans ${context}` : "";
  const action = {
    Construire: "passer de l'idée à une réalisation concrète",
    Apprendre: "acquérir une base claire et réutilisable",
    Optimiser: "améliorer ton système de travail",
    Monétiser: "relier la compétence à une opportunité business",
    "S'inspirer": "extraire des principes utiles à appliquer",
    Comprendre: "clarifier les concepts importants"
  }[intent.label] || "progresser avec méthode";
  return `Ressource ${domain.label.toLowerCase()} de niveau ${level.toLowerCase()} sur ${topic.label}${suffix}. Objectif éditorial : ${action}.`;
}

function videoXml(video) {
  return `    <video youtubeId="${xml(video.youtubeId)}" source="${xml(video.source)}" sourcePath="${xml(video.sourcePath)}" category="${xml(video.category)}" playlist="${xml(video.playlist)}" domain="${xml(video.domain)}" topic="${xml(video.topic)}" intent="${xml(video.intent)}" level="${xml(video.level)}" confidence="${xml(video.confidence)}" title="${xml(video.title)}" originalTitle="${xml(video.originalTitle)}" tags="${xml(video.tags.join(","))}">
      <description>${xml(video.description)}</description>
    </video>`;
}

function attrsToObject(value) {
  const attrs = {};
  String(value || "").replace(/([\w:-]+)="([^"]*)"/g, (_, key, val) => {
    attrs[key] = decodeXml(val);
    return "";
  });
  return attrs;
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, " ");
}

function splitTags(value) {
  return String(value || "").split(",").map((tag) => tag.trim()).filter(Boolean);
}

function cleanTag(value) {
  return String(value || "")
    .replace(/^ia$/i, "IA")
    .replace(/^video$/i, "Vidéo")
    .replace(/^import$/i, "Import")
    .trim();
}

function cleanTitle(value) {
  return decodeXml(value)
    .replace(/\s+-\s+YouTube$/i, "")
    .replace(/\s*\([^)]*steal my template[^)]*\)/i, "")
    .replace(/[🔥😰🤑🤯💸❤️😎🧐]+/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return ` ${String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")} `;
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function xml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));
}
