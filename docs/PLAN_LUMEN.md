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
| A1 | A | Renommage VisionHub → Lumen | `lumen/A1-rebrand` | ✅ Mergée dans main |
| A2 | A | Nouveau design system (CSS) | `lumen/A2-design-system` | ✅ Mergée dans main |
| A3 | A | Page d'accueil animée | `lumen/A3-home-animated` | ✅ Mergée dans main |
| A4 | A | Dashboard Vidéos + drag-drop | `lumen/A3-home-animated` | ✅ Mergée dans main |
| A5 | A | Lecteur robuste + autres pages | `lumen/A3-home-animated` | ✅ Mergée dans main |
| V2-1 | V2 | Coquille de page partagée | `lumen/v2-2-playlist-first` | ✅ Mergée dans main |
| V2-2 | V2 | Playlist au centre, catégorie en étiquette | `lumen/v2-2-playlist-first` | ✅ Mergée dans main |
| V2-3 | V2 | Administration rapide | `lumen/v2-2-playlist-first` | ✅ Mergée dans main |
| V2-4 | V2 | Page Fichiers (vrais fichiers) | `lumen/v2-2-playlist-first` | ✅ Mergée dans main |
| V2-5 | V2 | Import de playlist YouTube | `lumen/v2-2-playlist-first` | ✅ Mergée dans main |
| V2-6 | V2 | À propos → tableau de bord/réglages | `lumen/v2-2-playlist-first` | ✅ Mergée dans main |
| V2-7 | V2 | Habillage visuel | `lumen/v2-2-playlist-first` | ✅ Mergée dans main |
| — | V2 | Import 142 liens YouTube dans library.xml | `lumen/v2-2-playlist-first` | ✅ Mergée dans main |
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

## Tâche A4 — Dashboard Vidéos ✅

**Branche :** `lumen/A3-home-animated`
**Date :** 19 juin 2026

### Ce qui a changé visuellement

#### Layout — avant vs après

**Avant (A2/A3) :**
- Page vidéos = lecteur 2 colonnes (player + liste vidéos à droite)
- Header/footer du site visible

**Après (A4) :**
- Header et footer masqués (`display: none`)
- Layout 3 colonnes plein écran (`position: fixed; inset: 0`)
- Sidebar gauche 248px : logo, nav complète avec compteurs, périmètre, avatar footer
- Colonne centrale : topbar (titre + sous-titre + recherche + bouton Organiser) + chips de filtre + grille auto-fill de cartes vidéo
- Barre droite 300px : liste de playlists droppables + boîte Administration

```
Avant (A2) :
┌─────────────────────────────────────┐
│ [Header Lumen]                      │
│ Lecteur vidéo | [playlist + vidéos] │
│ [Footer]                            │
└─────────────────────────────────────┘

Après (A4) :
┌──────┬────────────────────────┬──────────┐
│Lumen │ Vidéos [search][Organ.]│ Playlists│
│Accueil│ [Toutes][Biblio.][...] │ ──────  │
│Vidéos │ ┌────┐ ┌────┐ ┌────┐  │ ──────  │
│Playli.│ │▶vid│ │▶vid│ │▶vid│  │ Admin  │
│...   │ └────┘ └────┘ └────┘  │[Export]│
│YB    │                        │[Copier]│
└──────┴────────────────────────┴──────────┘
```

#### Cartes vidéo

```
┌──────────────────┐
│ [vignette YT]    │  ← aspect-ratio 16/9, thumbnail YouTube
│ •Bibliothèque    │  ← badge source (violet = biblio, amber = importée)
│            1:00:42│  ← durée
│  ▶ (au survol)  │  ← orbe violet, transition scale+opacity
├──────────────────┤
│ HTML Crash Course│  ← titre 2 lignes max (line-clamp)
│ Dev Web · Playlist│  ← catégorie · playlist
│ [HTML]           │  ← tags (2 max)
└──────────────────┘
```

#### Fonctionnalités

- **Recherche** : filtre en temps réel sur titre, catégorie, playlist, tags
- **Chips de filtre** : Toutes / Bibliothèque / Importées / une chip par catégorie
- **Sidebar périmètre** : clics sur "Bibliothèque" / "Importées" → active le chip correspondant
- **Drag-and-drop** : glisser une carte vers une playlist → `addVideoToPlaylist()` avec anti-doublon par `youtubeId` → toast de confirmation
- **Admin panel** : même tiroir admin que `playlists.html`, accessible via bouton "Organiser"
- **Exporter XML** / **Copier XML** : génère `library.xml` depuis l'état courant
- **Vue lecteur** : si URL a `?playlist=X&video=Y`, route vers l'ancienne vue player (inchangée — sera redessinée en A5)

### Fichiers modifiés

- `videos.html` — ajout Tabler Icons CDN
- `app.js` — `renderVideos()` routeur + `renderVideoDashboard()` + `bindVideos()` → `bindVideoPlayer()` + `bindVideoDashboard()` + `filterVdGrid()` + `showVdToast()` + `addVideoToPlaylist()`
- `styles.css` — bloc `.vd-*` (dashboard CSS, ~200 lignes)

---

## Tâche A5 — Lecteur robuste + autres pages ✅

**Branche :** `lumen/A3-home-animated`
**Date :** 19 juin 2026

### Ce qui a changé

#### Lecteur vidéo (`videos.html?playlist=X&video=Y`)

- Lien **← Tableau de bord** en haut à gauche du player (retour vers le dashboard)
- Bouton **Ouvrir sur YouTube ↗** toujours visible sur le poster (pas seulement en `file://`)
- Anti-erreur 153 déjà en place : poster → iframe seulement après clic utilisateur

```
Avant (A4) :
[pas de navigation visible — header caché par le CSS dashboard]
[poster vidéo]  [Cliquer pour charger]

Après (A5) :
← Tableau de bord            ← lien retour
LECTEUR VIDÉO
Playlist démo
[poster vidéo]  [Cliquer pour charger]
                [Ouvrir sur YouTube ↗]  ← toujours visible
```

#### Page À propos

- Roadmap mise à jour : Phase A / B / C (plus Phase 1/2/3 VisionHub)
- 6 cartes : 3 phases (A Design ✅, B Données, C Cloud) + 3 infos (Stack, Sources de données, Règles d'or)
- Liens `data/*.xml` stylisés en `code` violet

### Fichiers modifiés

- `app.js` — `renderPlayerPoster()` : bouton YT toujours visible ; player branch : lien retour ; `renderAbout()` : roadmap A/B/C + 3 cartes info
- `styles.css` — `.player-back-link`, `.player-yt-link`, `.about-list`

---

## Fin Phase A ✅

Toutes les tâches A1 → A5 sont terminées. Le site est entièrement re-designé Lumen, 100 % statique et fonctionnel hors-ligne. Prêt pour la Phase B.

---

## Tâche V2-1 — Coquille de page partagée ✅

**Branche :** `lumen/v2-1-shared-shell`
**Date :** 20 juin 2026
**Source :** `docs/LUMEN_MODIFICATIONS_V2.md`

### Ce qui a changé visuellement

#### Architecture des pages — avant vs après

**Avant (fin Phase A) :**
- Seule la page Vidéos avait une mise en page « 3 colonnes » (sidebar + grille + barre playlists).
- Accueil, Playlists, Fichiers, Finance, À propos gardaient l'ancien `site-header` (logo + nav horizontale) + `site-footer`, chacun avec sa propre mise en page (`page-head`, `hero-actions`, `workspace-layout`, `finance-layout`...).
- Le logo de la sidebar Vidéos était une icône `ti-sparkles` générique, pas le vrai logo Lumen.

**Après (V2-1) :**
- Une fonction unique `renderShell({active, icon, title, subtitle, topbarRight, subheaderHtml, centerHtml, rightHtml})` produit la sidebar gauche (`.vd-side`), la zone centrale (`.vd-main` avec barre de titre optionnelle) et la barre droite (`.vd-right`) — utilisée par les 6 pages (`renderHome`, `renderVideoDashboard`, `renderPlaylists`, `renderFiles`, `renderFinance`, `renderAbout`).
- Le vieux `site-header`/`site-footer` (et le menu mobile associé) a été retiré des 6 pages HTML : il était de toute façon masqué sur Vidéos depuis A4, et devient désormais inutile partout puisque la sidebar le remplace.
- Le vrai logo (`assets/lumen-icon-glass.svg`) apparaît dans la sidebar de toutes les pages (remplace l'icône `ti-sparkles`).
- La barre droite est dynamique : liste des playlists + glisser-déposer sur **Vidéos** (+ bloc Administration/Export XML, inchangé) et sur **Playlists** (liste seule) ; formulaires « Ajouter localement » déplacés dans la barre droite sur **Fichiers** et formulaire « Objectifs » sur **Finance** (réutilisation des asides existants plutôt que duplication) ; panneau « Raccourcis » (liens rapides) sur **À propos**.
- L'accueil garde son hero plein cadre (canvas interactif + halo souris) à l'intérieur de la coquille : pas de barre de titre sur cette page pour ne pas couper le hero, mais la sidebar reste identique.

```
Avant :                                  Après :
┌─────────────────────────────┐          ┌──────┬─────────────────┬──────────┐
│ [Header Lumen + nav horiz.] │          │ Lumen│ Titre + actions │ Playlists│
│  contenu spécifique par page│          │ Accueil ...          │  ou      │
│ [Footer]                    │          │ Vidéos (active)      │ Raccourcis│
└─────────────────────────────┘          │ ...  │   contenu page  │  ou      │
        (sauf Vidéos déjà en 3 colonnes) │ YB   │                 │ Formulaire│
                                          └──────┴─────────────────┴──────────┘
                                                  (identique sur les 6 pages)
```

### Décisions prises (zones d'ambiguïté du document V2)

- **Hero Accueil :** gardé à l'intérieur de la coquille (option proposée par le document) plutôt qu'en pleine largeur, pour ne pas casser la cohérence de navigation — la sidebar reste visible même sur l'accueil.
- **Bloc Administration (Export/Copier XML) :** gardé uniquement sur Vidéos (pas dupliqué sur Playlists), car Playlists a déjà son propre bouton « Exporter XML » testé par Playwright (`#exportLibraryFromPlaylists`) — dupliquer le libellé aurait cassé ce test (deux boutons avec le même nom accessible).
- **Glisser-déposer sur Playlists :** la liste de playlists est généralisée (même composant que Vidéos) mais l'écoute des événements de drop n'est branchée que sur Vidéos pour l'instant — Playlists n'a pas de cartes vidéo glissables dans son contenu central. Câblage complet du drag-and-drop multi-page laissé pour V2-2/V2-3.
- **Nettoyage CSS :** les règles CSS du vieux header/footer (`.site-header`, `.main-nav`, `.menu-toggle`, `.site-footer`, etc.) ont été supprimées car prouvées mortes (markup retiré des 6 pages). Les règles `.workspace-layout`/`.finance-layout`/`.studio-grid` (devenues mortes par ce refactor) ont aussi été retirées. D'autres classes déjà mortes avant V2-1 (`.hero`, `.hero-copy`, `.brand`...) n'ont pas été touchées — hors périmètre.

### Bug pré-existant constaté (non lié à V2-1)

Le test Playwright `imported YouTube resources are visible searchable and organizable` échouait déjà **avant** V2-1 : il navigue vers `/videos.html` sans paramètres et attend la vue lecteur (`#playerInfo`, `#playlistSelect`), mais depuis A4 cette URL affiche le dashboard 3 colonnes. Confirmé par un test sur la branche `lumen/A3-home-animated` avant toute modification (3 passed / 1 failed, même résultat après V2-1). À corriger dans une tâche dédiée si besoin.

### Fichiers modifiés
- `app.js` — nouvelle fonction `renderShell()` + helpers (`vdPlaylistItem`, `vdCard`, `renderPlaylistsList`, `renderVideoAdminBox`, `renderShortcutsPanel`) ; `renderHome`, `renderVideoDashboard`, `renderPlaylists`, `renderFiles`, `renderFinance`, `renderAbout` réécrits pour utiliser la coquille ; `route()` applique `vd-mode` globalement ; suppression de `bindHeader()`/`markActiveNav()` (devenues mortes).
- `styles.css` — généralisation de `body.vd-mode .page-shell` (remplace les règles spécifiques à `[data-page="videos"]`/`[data-page="home"]`), nouvelles classes `.vd-topbar-actions`/`.vd-subbar`, `.vd-brand-mark` adapté pour un `<img>` réel, suppression du CSS mort (header/footer/nav mobile, `.workspace-layout`/`.finance-layout`/`.studio-grid`).
- `index.html`, `videos.html`, `playlists.html`, `files.html`, `finance.html`, `about.html` — retrait du `site-header`/`site-footer` ; ajout du CDN Tabler Icons sur les 4 pages qui ne l'avaient pas encore (playlists, files, finance, about).

### Comment tester
```
npm run check:js && npx playwright test
```
3 tests passent, 1 échoue (pré-existant, voir ci-dessus). Vérifié aussi manuellement via Playwright (captures + 0 erreur console) sur les 6 pages, et ouverture du panneau admin depuis les deux emplacements sur Vidéos.

---

---

## Tâche V2-2 — Playlist au centre, catégorie en étiquette ✅

**Branche :** `lumen/v2-2-playlist-first`
**Commit :** `70fb841`
**Date :** 2026-07-01

### Ce qui a changé

- La hiérarchie `Catégorie > Playlist > Vidéos` a été inversée : les playlists sont maintenant au premier plan.
- La catégorie devient une **étiquette badge** optionnelle sur la carte playlist (ex. `· web`), pas un groupe obligatoire.
- Créer une playlist sans catégorie fonctionne (catégorie vide = valide).
- Vue par défaut : liste directe de playlists. Filtre catégorie disponible mais optionnel.
- Admin : arbre `Playlist > Vidéos` (plus `Catégorie > Playlist > Vidéos`).

### Fichiers modifiés
- `app.js` — `renderPlaylists()`, `renderPlaylistCard()`, filtres ; catégorie retirée des sélecteurs obligatoires
- `styles.css` — `.vd-pl-cat-tag` (badge étiquette catégorie)

---

## Tâche V2-3 — Administration rapide ✅

**Branche :** `lumen/v2-2-playlist-first`
**Commit :** `ab7fa44`
**Date :** 2026-07-01

### Ce qui a changé

Trois sections dans la barre droite de la page Vidéos :

1. **Ajout rapide playlist** — champ nom + sélect catégorie (optionnel) + bouton `+` → playlist créée en un clic
2. **Ajout rapide vidéo** — coller un lien YouTube → extraction `youtubeId` → appel oEmbed pour récupérer le titre automatiquement → ajout à la playlist sélectionnée. Anti-doublon par `youtubeId`.
3. **Import playlist** — textarea pour coller du texte format `Titre | youtubeId` (généré par `tools/playlist-to-xml.py`) → ajout batch de toutes les vidéos d'un coup.

Toast de confirmation à chaque action. Bouton `+` de 34px fixe (corrigé : bug CSS spécificité `.qa-btn` vs `.vd-adm-btn`).

### Fichiers modifiés
- `app.js` — `renderVideoAdminBox()` réécrit, handlers `#quickPlaylistForm`, `#quickVideoForm`, `#importPlaylistForm`
- `styles.css` — `.qa-section`, `.qa-label`, `.quick-row`, `.quick-input`, `.quick-btn`, `.qa-btn { width: 34px !important }` (après `.vd-adm-btn.primary:hover`)

---

## Tâche V2-4 — Page Fichiers (vrais fichiers) ✅

**Branche :** `lumen/v2-2-playlist-first`
**Commit :** `98cb9d5`
**Date :** 2026-07-01

### Ce qui a changé

- `data/files.xml` : manifeste des vrais fichiers (id, title, path, type, size, date)
- `data/files/guide.pdf` : PDF de démonstration (539 octets, généré en Python)
- Page Fichiers : section **Fichiers réels** en haut, avec onglets filtre par type (Tous / PDF / Image / Doc / Vidéo / Zip)
- Chaque fichier : icône colorée par type, nom, taille, bouton Ouvrir + Télécharger
- Zone drag-drop : déposer un fichier → message explicatif (commit requis pour rendre permanent)
- `loadFilesManifest()` + `mergeLocalFiles()` dans `init()`

### Fichiers modifiés
- `app.js` — `loadFilesManifest()`, `mergeLocalFiles()`, `renderRealFilesSection()`, `realFileRow()`, `realFileIcon()`, `realFileTypeFromMime()`, `formatFileSize()`
- `styles.css` — `.rf-section`, `.rf-row`, `.rf-icon`, `.rf-pdf/.rf-image/...`, `.rf-dropzone`
- `data/files.xml` (créé), `data/files/guide.pdf` (créé)

---

## Tâche V2-5 — Import de playlist YouTube ✅

**Branche :** `lumen/v2-2-playlist-first`
**Commit :** `6366326`
**Date :** 2026-07-01

### Ce qui a changé

**Script local :** `tools/playlist-to-xml.py`
```bash
python3 tools/playlist-to-xml.py "URL_PLAYLIST" --title "Nom" --category web --level Débutant
```
→ utilise `yt-dlp --flat-playlist` pour extraire `titre | id` de chaque vidéo
→ affiche le texte à coller dans Lumen ET le bloc XML complet

**Dans l'app :** textarea "Import playlist" dans la barre droite (section V2-3) :
- Coller les lignes `titre | id`
- L'app parse, déduplique par `youtubeId`, ajoute à la playlist sélectionnée
- Séparation sur `line.lastIndexOf(" | ")` pour gérer les titres qui contiennent " | "

**Guide :** `tools/import-playlist.md` — installation yt-dlp, commande, options, exclure des IDs déjà présents.

### Fichiers modifiés
- `tools/playlist-to-xml.py` (créé)
- `tools/import-playlist.md` (créé)
- `app.js` — handler `#importPlaylistForm` dans `bindVideoDashboard()`

---

## Tâche V2-6 — Page À propos → Tableau de bord ✅

**Branche :** `lumen/v2-2-playlist-first`
**Commit :** `14fc565`
**Date :** 2026-07-01

### Ce qui a changé

La page `about.html` (ancienne page de présentation) est remplacée par un **tableau de bord personnel** :

```
┌──────────────────────────────────────────────┐
│  185 vidéos  │  11 playlists  │  6 catég.  │  0 fichiers  │  ← 4 stat cards
├──────────────────────────────────────────────┤
│  Répartition par catégorie                   │  ← barres de progression
│  ████████████ Informatique 82%               │
│  ██ Business 10%   ...                       │
├──────────────────────────────────────────────┤
│  Réglages : Exporter XML · Vider le cache    │  ← actions
└──────────────────────────────────────────────┘
```

Nav : "À propos" renommé "Tableau de bord", icône `ti-gauge`.

### Fichiers modifiés
- `app.js` — `renderAbout()` réécrit, `bindDashboard()` ajouté
- `styles.css` — `.db-stats`, `.db-stat-card`, `.db-stat-icon.pc1-pc4`, `.db-cats`, `.db-bar`, `.db-settings`
- `about.html` — titre et meta mis à jour

---

## Tâche V2-7 — Habillage visuel ✅

**Branche :** `lumen/v2-2-playlist-first`
**Commit :** `6c7e792`
**Date :** 2026-07-01

### Ce qui a changé

- **Logo Lumen sur l'accueil** : `assets/lumen-icon-glass.svg` affiché en grand (200px) dans un cadre verre animé (`home-logo-glass`) avec glow violet → cyan
- **Vignettes YouTube réelles** : toutes les balises `<img src="${thumb(id)}">` ont `onerror="this.style.opacity='0'"` — image disparaît proprement si YouTube bloque la vignette (hors-ligne, ID invalide)
- **`prefers-reduced-motion`** : logo statique si l'utilisateur a désactivé les animations système
- **Hero d'accueil** : texte et sous-titre enrichis, logo intégré au centre avant le titre

### Fichiers modifiés
- `app.js` — `renderHome()` : logo verre + h1/sous-titre remaniés ; `onerror` ajouté sur tous les `<img>` de vignettes
- `styles.css` — `.home-logo-wrap`, `.home-logo-glass`, `@media (prefers-reduced-motion: reduce)`, `.vd-thumb img { transition: opacity .2s }`

---

## Import de données — 142 liens YouTube ✅

**Branche :** `lumen/v2-2-playlist-first`
**Commit :** `8d601aa`
**Date :** 2026-07-01

### Ce qui a été fait

Traitement de `liens_youtube_pas_encore_dans_visionhub.md` (145 liens) :
- **142 entrées ajoutées** à `data/library.xml` en 11 nouvelles playlists
- **3 URLs ignorées** (liens de chaînes YouTube `@username`, non-addables)
- `liens_youtube_deja_dans_visionhub.md` mis à jour avec les 142 entrées
- Fichier source supprimé (tout le contenu traité)

| Playlist créée | Catégorie | Vidéos |
|---|---|---|
| Ethical Hacking — Cours et ressources | informatique | 33 |
| Bash & Terminal — Scripting Linux | informatique | 6 |
| Python — Cours et projets | informatique | 3 |
| Computer Science — CS50 & Fondamentaux | informatique | 13 |
| Informatique — Windows, PC & Astuces | informatique | 15 |
| Trading, Finance & Crypto | business | 14 |
| E-commerce & Monétisation | business | 10 |
| Self-Développement & Mindset | business | 10 |
| Web Dev & Outils Divers | web | 4 |
| Vidéos — À classer | informatique | 15 |
| Playlists YouTube — À importer | informatique | 19 |

**État final library.xml :** 16 playlists, 153 vidéos.

---

## Fin Phase V2 ✅

Toutes les tâches V2-1 → V2-7 + import données sont terminées. PR #1 mergée dans `main` le 2026-07-01.

---

## Plan complet Phase A → C

### Phase A — Design & refonte visuelle (en cours)

**A1 ✅** Renommage VisionHub → Lumen (logo, favicon, textes, localStorage)
**A2 ✅** Nouveau design system CSS (palette violet/cyan, Sora+Inter, cartes, boutons)
**A3 ✅** Page d'accueil animée (grille canvas interactive, halo souris, stats réelles)
**A4 ✅** Dashboard Vidéos (sidebar + grille cartes + barre playlists + drag-drop)
**A5 ✅** Lecteur robuste + toutes les autres pages au nouveau design

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

*Dernière mise à jour : 2026-07-01 — Phase V2 complète mergée dans main (V2-1 → V2-7 + import 142 vidéos)*
