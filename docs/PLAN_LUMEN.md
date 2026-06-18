# PLAN_LUMEN.md — Journal de travail et plan du projet

> Ce fichier est mis à jour après **chaque tâche terminée**.
> Il contient : l'état d'avancement, les modifications visibles avec exemples, les habitudes de travail, et le plan complet à venir.

---

## Habitudes de travail sur ce projet

1. **Une tâche à la fois.** Je ne commence jamais la suivante sans validation explicite.
2. **Branche dédiée par tâche.** Format : `lumen/<code-tâche>-<nom-court>`. Jamais de travail direct sur `main`.
3. **Tests avant commit.** `npm run check:js` + `npm run test:e2e` (4 tests Playwright) passent toujours en vert avant de committer.
4. **Rapport à chaque fin de tâche.** Fichiers modifiés + ce qui a changé visuellement + comment tester + tâche suivante recommandée.
5. **Ce fichier mis à jour.** Après chaque tâche : ajouter une entrée avec captures d'écran textuelles et description visuelle.
6. **Ne jamais supprimer les données.** Les XML et localStorage sont intouchables. Toute migration est douce (copie, jamais suppression).
7. **GitHub Pages en priorité.** Tout doit fonctionner en statique, hors-ligne. Le cloud (Supabase) est optionnel.
8. **Merges sur main uniquement après validation utilisateur.** Les branches restent ouvertes jusqu'au feu vert.

---

## État d'avancement

| Tâche | Phase | Nom | Branche | État |
|-------|-------|-----|---------|------|
| A1 | A | Renommage VisionHub → Lumen | `lumen/A1-rebrand` | ✅ Terminée, en attente merge |
| A2 | A | Nouveau design system (CSS) | `lumen/A2-design-system` | ✅ Terminée, en attente merge |
| A3 | A | Page d'accueil animée | `lumen/A3-home-animated` | ✅ Terminée, en attente merge |
| A4 | A | Dashboard Vidéos + drag-drop | à créer | ⏳ À faire |
| A5 | A | Lecteur robuste + autres pages | à créer | ⏳ À faire |
| B1 | B | Couche d'accès aux données | à créer | ⏳ À faire |
| B2 | B | Modèle de données + schéma SQL | à créer | ⏳ À faire |
| C1 | C | Connexion Supabase | à créer | ⏳ À faire |
| C2 | C | Authentification | à créer | ⏳ À faire |
| C3 | C | Tables + RLS | à créer | ⏳ À faire |
| C4 | C | Migration locale → cloud | à créer | ⏳ À faire |
| C5 | C | Synchronisation bidirectionnelle | à créer | ⏳ À faire |
| C6 | C | Finitions + sécurité + tests | à créer | ⏳ À faire |

---

## Tâche A1 — Renommage VisionHub → Lumen ✅

**Branche :** `lumen/A1-rebrand`
**Commit :** `44c17e9`
**Date :** 16 juin 2026

### Ce qui a changé visuellement

#### Header — avant vs après

**Avant (VisionHub) :**
- Carré dégradé coloré avec les lettres **VH** en texte
- Nom affiché : **VisionHub**
- Sous-titre : *Personal media operating system*
- Onglet navigateur : `VisionHub — OS personnel pour vidéos, fichiers et business`
- Favicon : aucun (onglet vide)

**Après (Lumen) :**
- **Icône SVG** en forme de diaphragme d'objectif (verre chromé, anneau violet→cyan)
- Nom affiché : **Lumen**
- Sous-titre : *Personal knowledge & media library*
- Onglet navigateur : `Lumen — Personal knowledge & media library`
- Favicon : l'icône diaphragme Lumen visible dans l'onglet

```
Avant :  [VH]  VisionHub                    Accueil  Playlists  Vidéos ...
              Personal media operating system

Après :  [⊙]  Lumen                         Accueil  Playlists  Vidéos ...
              Personal knowledge & media library
```

#### Footer — avant vs après

**Avant :** `© 2026 VisionHub. Prêt pour GitHub Pages.`
**Après :** `© 2026 Lumen. Prêt pour GitHub Pages.`

### Fichiers modifiés
- `assets/lumen-icon-glass.svg` + `assets/lumen-logo-glass.svg` (créés)
- `index.html`, `videos.html`, `playlists.html`, `files.html`, `finance.html`, `about.html` — titre, meta, favicon, header, footer
- `app.js` — clés localStorage `lumen-v2-*`, migration douce depuis `visionhub-v2-*`, textes
- `tests/admin-playlists.spec.js` — clés localStorage mises à jour
- `README.md`, `SUIVI_PROJET.md` — rebrandés Lumen

---

## Tâche A2 — Nouveau design system (CSS) ✅

**Branche :** `lumen/A2-design-system`
**Commit :** `bd3eed2`
**Date :** 16 juin 2026

### Ce qui a changé visuellement

#### Couleurs — avant vs après

| Élément | Avant (VisionHub) | Après (Lumen) |
|---------|------------------|---------------|
| Fond de page | `#070a12` + halos colorés (cyan, rose, violet) | `#0A0B0F` — noir pur, sans halos |
| Couleur accent | **Cyan** `#6de5ff` (boutons, liens, icônes) | **Violet** `#6E56F7` |
| Accent secondaire | Violet `#8b5cf6` | Violet clair `#9D8BFF` |
| Cartes | Fond semi-transparent avec backdropblur | Fond solide `#15171F` (surface) |
| Bordures | `rgba(255,255,255,0.13)` | `rgba(255,255,255,0.07)` (plus fines) |
| Bouton primaire | Dégradé **cyan → violet** | Dégradé **violet → violet foncé** |
| Texte secondaire | `#a7afc0` | `#9CA0AD` |
| Nav active | Fond cyan | Fond violet |

#### Typographie — avant vs après

**Avant :** Inter pour tout (titres + texte)
**Après :**
- **Titres (h1, h2, h3)** → `Sora 600` — plus géométrique, moderne
- **Texte courant** → `Inter 400/500` — inchangé mais plus fin (pas de graisses 700+)

#### Exemple visuel — header actuel

```
[⊙] Lumen                    Accueil   Playlists   Vidéos   Fichiers   Finance   À propos
    Personal knowledge...    [bordure arrondie violette sur "Accueil"]
```

#### Exemple visuel — boutons

```
Avant : [  Ouvrir la bibliothèque  ]  ← fond cyan brillant
Après : [  Ouvrir la bibliothèque  ]  ← fond violet #6E56F7 avec ombre violette
```

#### Exemple visuel — cartes playlist (playlists.html)

```
Avant :                          Après :
┌─────────────────────┐          ┌─────────────────────┐
│ fond: semi-transp.  │          │ fond: #15171F        │
│ blur + reflets      │          │ bordure: 1px fine    │
│ radius: 22px        │          │ radius: 18px         │
│ hover: translateY   │          │ hover: -3px + border │
└─────────────────────┘          └─────────────────────┘
```

### Captures réelles (16 juin 2026)

**Header :**
- Logo SVG diaphragme à gauche, "Lumen" en Sora 600, sous-titre gris, nav avec lien "Accueil" encadré en blanc subtil

**Page d'accueil :**
- Label "LUMEN" en violet clair, grand titre en Sora avec saut de ligne, fond noir pur
- Miniature YouTube à droite avec overlay sombre

**Playlists :**
- Titre "Playlists dynamiques." en Sora, bouton "Administration" violet, chips de filtre avec fond sombre

**Lecteur vidéo :**
- Bouton play en cercle violet, fond noir, liste vidéos avec bordures fines

### Fichiers modifiés
- `styles.css` — réécriture complète (659 ajouts, 227 suppressions)

---

## Tâche A3 — Page d'accueil animée ✅

**Branche :** `lumen/A3-home-animated`
**Commit :** `b093a2f`
**Date :** 19 juin 2026

### Ce qui a changé visuellement

#### Hero — avant vs après

**Avant (A2) :**
- Layout 2 colonnes : texte à gauche, miniature YouTube à droite
- Hero statique avec image Unsplash en fond (overlay sombre)
- Boutons simples `.btn.primary` / `.btn`
- Pas de stats dynamiques

**Après (A3) :**
- Hero plein écran centré (`min-height: 100svh`)
- Grille de points animée sur `<canvas>` : les points proches du curseur se déplacent et s'illuminent en violet
- Halo radial violet qui suit la souris en interpolation douce (× 0.08 par frame)
- Badge eyebrow avec point cyan animé
- Grand titre gradient violet → cyan sur « rangé et retrouvable »
- Deux boutons Lumen (primary + ghost)
- Stats réelles : **185 vidéos, 9 catégories, ∞ playlists, XML**

```
Avant (A2) :
┌─────────────────┬──────────────┐
│ [LUMEN kicker]  │  [miniature] │
│ Grand titre     │  YouTube     │
│ [btn] [btn]     │              │
└─────────────────┴──────────────┘

Après (A3) :
╔══════════════════════════════════╗
║  ·  ·  ·  · [halo violet] ·  ·  ║  ← canvas dots
║       ○ Votre bibliothèque       ║  ← eyebrow + dot cyan
║   Tout ce que vous regardez,     ║
║   rangé et retrouvable.          ║  ← gradient violet→cyan
║   sous-titre gris                ║
║  [Ouvrir] [Voir la démo]         ║
║  185   9   ∞   XML               ║  ← stats dynamiques
╚══════════════════════════════════╝
```

#### Sections au scroll

**Nouvelles sections :**
1. **Fonctions** — 6 cartes avec effet spotlight (radial au curseur via `--mx`/`--my`) et révélation `IntersectionObserver`
2. **Catégories** — toutes les catégories réelles de la bibliothèque avec couleur d'accent unique
3. **Modules** — 4 pills cliquables (Vidéos, Playlists, Fichiers, Finance)

**Animations :** `.reveal` → opacité 0 + translateY(26px), glisse au scroll. Désactivé si `prefers-reduced-motion`.

#### Reorganisation de fichiers (même session)

- `maquettes/` : lumen-home.html, lumen-dashboard.html, lumen-preview.html
- `docs/` : tous les .md de travail (sauf README.md)
- SVG dupliqués à la racine supprimés (déjà dans `assets/`)

### Fichiers modifiés
- `index.html` — ajout Tabler Icons CDN
- `app.js` — `renderHome()` réécrit + `bindHome()` ajouté (canvas, glow, reveal, spotlight)
- `styles.css` — section home complète remplacée (315 lignes nettes)
- `docs/PLAN_LUMEN.md`, `docs/SUIVI_PROJET.md`, `docs/AGENTS.md`, etc. → déplacés dans `docs/`
- `maquettes/` → créé avec les 3 maquettes HTML

---

## Prochaine tâche : A4 — Dashboard Vidéos

**But :** Refondre `videos.html` (`renderVideos`) pour reproduire `lumen-dashboard.html`, branché sur les vraies données.

**Ce qui va changer visuellement :**
- Layout 3 colonnes : sidebar gauche + grille vidéos + barre playlists droite
- Cartes vidéo avec vignette YouTube, badge source, orbe au survol
- Glisser-déposer : vidéo → playlist → ajout + toast de confirmation

```
Avant (A2) :
┌─────────────────────────────────────┐
│ [filtre] [recherche]                │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│ │vid │ │vid │ │vid │ │vid │        │
│ └────┘ └────┘ └────┘ └────┘        │
└─────────────────────────────────────┘

Après (A4) :
┌──────┬──────────────────────┬────────┐
│ Nav  │ [titre] [search] [+] │Playlist│
│ side │ [filtres catégories] │ ──── │
│ bar  │ ┌────┐ ┌────┐ ┌────┐│ ──── │
│      │ │▶vid│ │▶vid│ │▶vid││ drag │
│      │ └────┘ └────┘ └────┘│ drop │
└──────┴──────────────────────┴────────┘
```

---

## Plan complet Phase A → C

### Phase A — Design & refonte visuelle (en cours)

**A1 ✅** Renommage VisionHub → Lumen (logo, favicon, textes, localStorage)
**A2 ✅** Nouveau design system CSS (palette violet/cyan, Sora+Inter, cartes, boutons)
**A3 ✅** Page d'accueil animée (grille canvas interactive, halo souris, stats réelles)
**A4 ⏳** Dashboard Vidéos (sidebar + grille cartes + barre playlists + drag-drop)
**A5 ⏳** Lecteur robuste + toutes les autres pages au nouveau design

### Phase B — Préparation cloud (sans dépendance obligatoire)

**B1 ⏳** Couche d'accès aux données unifiée (`store.js`) — abstraction pour brancher le cloud plus tard
**B2 ⏳** Modèle de données cible + schéma SQL Supabase (document uniquement, rien d'exécuté)

### Phase C — Supabase (cloud optionnel)

> Pré-requis : créer un compte Supabase gratuit, noter l'URL et la `anon key`.

**C1 ⏳** Connexion SDK Supabase (mode local préservé si non configuré)
**C2 ⏳** Authentification (email + mot de passe, session persistante)
**C3 ⏳** Tables Postgres + Row Level Security (chaque utilisateur voit UNIQUEMENT ses données)
**C4 ⏳** Migration locale → cloud (import XML/localStorage vers Supabase, sans doublons)
**C5 ⏳** Synchronisation bidirectionnelle local ↔ cloud (offline-safe, queue de modifications)
**C6 ⏳** Finitions : sécurité, accessibilité, performance, tests complets

---

*Dernière mise à jour : 19 juin 2026 — après tâche A3*
