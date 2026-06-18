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
| A3 | A | Page d'accueil animée | à créer | ⏳ À faire |
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

## Prochaine tâche : A3 — Page d'accueil animée

**But :** Transformer `index.html` / `renderHome` en `app.js` pour reproduire la page d'accueil de `lumen-home.html`.

**Ce qui va changer visuellement :**
- **Grille de points interactive** sur fond noir : les points proches du curseur grossissent et s'illuminent en violet
- **Halo radial violet** qui suit la souris en douceur
- **Stats dynamiques** sous le hero : nombre réel de vidéos (185), catégories (6), ∞ playlists, XML
- **Sections** : Fonctions (6 cartes avec effet spotlight), Catégories réelles, Modules
- **Animations au scroll** (IntersectionObserver) pour les cartes

**Différence attendue :**
```
Avant (A2) : page statique avec hero image en fond + layout 2 colonnes
Après (A3) : hero plein écran avec canvas animé, boutons Lumen, stats réelles
```

---

## Plan complet Phase A → C

### Phase A — Design & refonte visuelle (en cours)

**A1 ✅** Renommage VisionHub → Lumen (logo, favicon, textes, localStorage)
**A2 ✅** Nouveau design system CSS (palette violet/cyan, Sora+Inter, cartes, boutons)
**A3 ⏳** Page d'accueil animée (grille canvas interactive, halo souris, stats réelles)
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

*Dernière mise à jour : 16 juin 2026 — après tâche A2*
