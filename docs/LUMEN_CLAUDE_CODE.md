# Lumen — Plan de travail pour Claude Code

> **Comment utiliser ce document.**
> Ce fichier contient **tout le projet découpé en tâches indépendantes**.
> Tu ne dois **PAS tout faire d'un coup**. Tu fais **une seule tâche à la fois**.
> L'utilisateur va te donner les tâches **une par une**, dans l'ordre.
> À la fin de chaque tâche : tu testes, tu fais un commit, et tu **t'arrêtes** en donnant un court rapport.
> Ne commence jamais la tâche suivante sans que l'utilisateur te la demande explicitement.

---

## 0. Contexte permanent (à lire avant CHAQUE tâche)

Le projet s'appelle **Lumen** (anciennement « VisionHub »). C'est une bibliothèque personnelle pour organiser des vidéos YouTube, des playlists, des ressources importées, des fichiers, des notes et un suivi finance léger.

**Architecture actuelle (à préserver) :**
- Site statique compatible **GitHub Pages**.
- `HTML` + `CSS` + `JavaScript vanilla` + `XML` + `localStorage`.
- Chaque page HTML a un `<main id="app">` rempli dynamiquement par `app.js` selon l'attribut `data-page`.
- Données dans `data/library.xml`, `data/resources.xml`, `data/video-intelligence.xml`, `data/workspace.xml`, `data/finance.xml`.
- L'administration écrit dans `localStorage` puis exporte un nouveau XML (GitHub Pages ne peut pas écrire les fichiers).

**Règles d'or — ne jamais les casser :**
1. Le site doit **toujours fonctionner sur GitHub Pages** (fichiers statiques servis tels quels).
2. Le site doit **toujours marcher hors-ligne / sans cloud** (mode local-first). Le cloud est une **surcouche optionnelle**, jamais une dépendance obligatoire pour afficher la bibliothèque.
3. **Ne jamais supprimer** les fichiers de données XML existants ni les données utilisateur dans `localStorage`.
4. Éviter les doublons de vidéos avec le **`youtubeId` comme clé unique**.
5. Travailler **par petites étapes**, tester avant chaque commit.
6. Mettre à jour `README.md` et `SUIVI_PROJET.md` après chaque grande évolution.
7. **Aucune clé secrète dans le code.** Seules les clés Supabase **publiques** (`anon key`) peuvent apparaître côté client ; tout le reste passe par les variables et les règles de sécurité Supabase.

**Méthode Git pour CHAQUE tâche :**
```bash
git checkout main
git pull
git checkout -b lumen/<nom-court-de-la-tache>
# ... travail ...
npm run check:js   # si dispo
npm run test:e2e   # si dispo
git add .
git commit -m "Lumen: <description claire>"
# NE PAS merger automatiquement. Laisser l'utilisateur valider puis merger.
```

**Format de rapport attendu à la fin de chaque tâche :**
- Fichiers créés / modifiés (liste).
- Ce qui a été ajouté, en clair.
- Comment tester manuellement (URLs + clics).
- Problèmes restants éventuels.
- Tâche suivante recommandée.

**Décision technique cloud (déjà tranchée) :**
- Cloud = **Supabase** (authentification + base de données Postgres).
- Stratégie = **local-first puis synchronisation cloud**. localStorage/XML restent la source qui marche toujours ; Supabase synchronise par-dessus quand l'utilisateur est connecté.
- Hébergement du site : **inchangé** (GitHub Pages). Supabase s'appelle depuis le navigateur via le SDK JS (CDN ESM, pas de build obligatoire).

---

# PHASE A — Design & refonte visuelle (local, sans cloud)

> Objectif : appliquer le nouveau design **Lumen** (thème sombre violet-cyan, page d'accueil animée, dashboard avec sidebar + barre de playlists + glisser-déposer) **sans rien changer à la logique de données**. À la fin de la Phase A, le site est identique en fonctionnalités mais beaucoup plus beau, et toujours 100 % statique.

Deux fichiers de maquette de référence accompagnent ce document : `lumen-home.html` et `lumen-dashboard.html`. Ils montrent le rendu cible (design, couleurs, animations). Ils sont **autonomes** (CSS+JS inline) : il faut **réintégrer** leur design dans l'architecture réelle (`styles.css` + `app.js`), pas les copier tels quels.

---

## TÂCHE A1 — Renommage VisionHub → Lumen

**But :** remplacer toute l'identité « VisionHub » par « Lumen » sans rien casser.

**À faire :**
- Remplacer le nom affiché « VisionHub » par « Lumen » dans tous les `.html`, `README.md`, `SUIVI_PROJET.md`, `<title>`, `meta description`.
- Remplacer la marque dans le header (`brand-mark` « VH ») par « Lumen » avec une icône d'étincelle/lumière.
- Le sous-titre de marque devient : `Personal knowledge & media library`.
- Garder le nom technique du dépôt tel quel (ne pas renommer le repo). Seul l'affichage change.
- Ne PAS renommer les fichiers de données ni les clés `localStorage` existantes (sinon perte de données). Si un préfixe `localStorage` contient « visionhub », créer une **migration douce** : au chargement, si une ancienne clé existe et que la nouvelle n'existe pas, copier l'ancienne vers la nouvelle. Ne jamais supprimer l'ancienne.

**Logo (fourni) :** deux fichiers SVG accompagnent ce document : `brand/lumen-logo-glass.svg` (logo complet horizontal, style verre chromé sombre) et `brand/lumen-icon-glass.svg` (icône seule, verre chromé). Les placer dans le projet (par ex. dans un dossier `assets/` ou `brand/`). Utiliser l'icône comme **favicon** (`<link rel="icon" type="image/svg+xml" href="...">` dans chaque page) et le logo dans le header à la place du « VH » texte. Le logo représente une aperture (diaphragme d'objectif) en verre noir, avec un anneau chromé dégradé violet → cyan et un reflet brillant : il évoque la lumière, la vidéo et l'ouverture sur le savoir. Couleurs de marque : violet `#6E56F7`, violet clair `#9D8BFF`, cyan `#3FD8C7`, fond `#0A0B0F`.

**Tester :** ouvrir chaque page, vérifier que le logo Lumen s'affiche dans le header et le favicon dans l'onglet, que « Lumen » s'affiche partout, que la navigation marche, qu'aucune donnée locale n'a disparu.

**Commit :** `Lumen: rebrand VisionHub vers Lumen (logo verre + affichage + migration douce localStorage)`

---

## TÂCHE A2 — Nouveau système de design (CSS)

**But :** remplacer `styles.css` par le design Lumen, sans toucher au HTML structurel ni à `app.js`.

**Palette (variables CSS à définir) :**
```
--bg:#0A0B0F; --bg-soft:#101218; --surface:#15171F; --surface-2:#1B1E28; --surface-3:#222633;
--line:rgba(255,255,255,0.07); --line-2:rgba(255,255,255,0.12);
--text:#F4F5F7; --text-2:#9CA0AD; --text-3:#5F6373;
--accent:#6E56F7; --accent-2:#9D8BFF; --cyan:#3FD8C7; --amber:#F5A524; --rose:#F76E7E; --green:#54D188;
--radius:14px; --radius-lg:18px;
```
**Typographie :** importer `Sora` (titres) et `Inter` (texte) depuis Google Fonts. Titres en Sora 600, texte en Inter 400/500. Jamais de graisses 700+ partout, garder de la finesse.

**À faire :**
- Réécrire `styles.css` avec cette palette et cette typo, en **conservant les noms de classes existants** utilisés par `app.js` (`.screen-card`, `.content-card`, `.playlist-card`, `.video-row`, `.btn`, `.admin-*`, etc.). Le but est que le HTML généré par `app.js` reçoive le nouveau style **sans modifier `app.js`**.
- Style des cartes : fond `--surface`, bordure `--line`, `border-radius:var(--radius-lg)`, effet de survol `translateY(-3px)` + bordure `--line-2`.
- Boutons : `.btn.primary` en dégradé `--accent`, `.btn.danger` en rose, `.btn.ghost` transparent.
- Garder le responsive existant (les `@media` actuels) en l'adaptant à la nouvelle palette.
- Garder l'accessibilité : focus visible, `prefers-reduced-motion` respecté pour toute animation.

**Tester :** chaque page doit s'afficher correctement avec le nouveau thème, sans élément cassé ni illisible. Vérifier mobile (largeur ~380px).

**Commit :** `Lumen: nouveau design system (styles.css) sans changer la logique`

---

## TÂCHE A3 — Page d'accueil animée (hero souris)

**But :** transformer `index.html` + son rendu en `app.js` (`renderHome`) pour reproduire la page d'accueil de `lumen-home.html`.

**À faire :**
- Hero plein écran avec : eyebrow « Votre bibliothèque personnelle de savoir », grand titre (« Tout ce que vous regardez, rangé et retrouvable »), sous-titre décrivant le projet, deux boutons (« Ouvrir ma bibliothèque » → `videos.html`, « Voir la démo » → `videos.html`).
- **Élément signature : grille de points interactive** sur un `<canvas>` en fond du hero. Les points proches du curseur se déplacent, grossissent et s'illuminent en violet. Un **halo radial** suit la souris en douceur (interpolation). Reprendre la logique JS de `lumen-home.html` (sections `grid-canvas`, `glow`, `animGlow`, `draw`).
- Respecter `prefers-reduced-motion` : si activé, afficher la grille statique sans animation.
- Stats réelles sous le hero : nombre de vidéos (calculé depuis les données chargées : library + importées), nombre de catégories, « ∞ » playlists, « XML ».  **Calculer dynamiquement** ces chiffres depuis l'état réel, pas en dur.
- Sections suivantes : « Fonctions » (6 cartes : glisser-déposer, classement intelligent, hiérarchie claire, lecteur robuste, recherche & filtres, export XML), « Catégories » (les 6 vraies catégories de `library.xml`), « Modules » (Vidéos, Playlists, Fichiers, Finance). Animations de révélation au scroll (IntersectionObserver), effet projecteur au survol des cartes.
- Tout le JS d'animation doit vivre proprement (dans `app.js` ou un petit module séparé chargé seulement sur la home), sans casser les autres pages.

**Tester :** la grille réagit à la souris, le halo suit, les stats correspondent aux vraies données, les liens marchent, mobile OK, reduced-motion OK.

**Commit :** `Lumen: page d'accueil animée (grille interactive + halo souris)`

---

## TÂCHE A4 — Dashboard Vidéos (sidebar + cartes + barre playlists + drag-drop)

**But :** refondre `videos.html` (`renderVideos`) pour reproduire `lumen-dashboard.html`, branché sur les vraies données.

**Structure cible (3 colonnes) :**
1. **Sidebar gauche** : navigation (Accueil, Vidéos, Playlists, Fichiers, Finance, À propos) + section « Périmètre » (Bibliothèque / Importées) avec compteurs réels. La sidebar peut être un composant partagé réutilisé sur toutes les pages.
2. **Centre** : barre de titre (titre page + recherche + bouton Ajouter), rangée de filtres (Toutes / Bibliothèque / Importées / + chaque catégorie réelle), puis **grille de cartes vidéo**. Chaque carte : vignette YouTube (`https://i.ytimg.com/vi/<youtubeId>/hqdefault.jpg`), badge source (Bibliothèque/Importée), durée, titre, catégorie + playlist, tags. Bouton lecture au survol (orbe violette).
3. **Barre de droite** : liste des vraies playlists (icône, nom, nombre de vidéos + catégorie), zone « Administration » (boutons : Organiser la bibliothèque, Exporter XML, Copier). Indice « Glissez une vidéo ici pour la classer ».

**Glisser-déposer :**
- Rendre chaque carte vidéo `draggable`.
- Déposer une carte sur une playlist (barre droite) = appeler la **logique d'ajout existante** (la même que l'administration : ajout dans `localStorage`, anti-doublon par `youtubeId`, puis export XML disponible). Ne PAS réinventer la persistance : réutiliser les fonctions d'admin déjà présentes dans `app.js`.
- Retour visuel : la playlist s'illumine au survol du drag, son compteur s'incrémente, une notification (toast) confirme « Ajouté à … ».
- Si la vidéo existe déjà dans la playlist : toast « Cette vidéo est déjà dans … », pas de doublon.

**Performance :** prévoir l'affichage fluide de 185 vidéos aujourd'hui et 500-1000 demain (éviter les re-rendus inutiles, ne régénérer que ce qui change).

**Tester :** vignettes affichées, filtres fonctionnels, recherche, clic carte → lecteur, drag d'une vidéo vers une playlist → ajout + toast + pas de doublon, export XML contient le changement.

**Commit :** `Lumen: dashboard Vidéos (sidebar + cartes + drag-drop vers playlists)`

---

## TÂCHE A5 — Lecteur vidéo robuste + reste des pages au nouveau design

**But :** appliquer le design Lumen aux pages restantes et fiabiliser le lecteur.

**À faire :**
- **Lecteur YouTube robuste** (anti-erreur 153) : afficher d'abord la miniature, injecter l'iframe **seulement après clic**, ne pas injecter en `file://`, utiliser `referrerpolicy="strict-origin-when-cross-origin"`, et **toujours** un bouton « Ouvrir sur YouTube ». Conserver/renforcer la logique déjà présente.
- Appliquer le nouveau design à `playlists.html` (vue catégories → playlists → vidéos + bouton Administration), `files.html` (ressources par type : vidéos, liens, documents, notes, fichiers locaux + filtres + pagination), `finance.html` (rester simple), `about.html` (présentation + roadmap Lumen).
- Le **drawer d'administration** existant doit adopter le nouveau thème (fond sombre, bordures fines, boutons Lumen).

**Tester :** lecteur ne casse pas même si une vidéo refuse l'iframe ; toutes les pages cohérentes visuellement ; admin fonctionne ; export/copie/téléchargement XML OK.

**Commit :** `Lumen: lecteur robuste + design appliqué à toutes les pages`

> ✅ **Fin de Phase A** : le site est entièrement re-designé en Lumen, toujours 100 % statique et hors-ligne. Faire un point avant la Phase B.

---

# PHASE B — Préparation au cloud (fondations propres, toujours sans dépendance obligatoire)

> Objectif : préparer le terrain pour Supabase **sans encore brancher quoi que ce soit d'obligatoire**. On introduit une couche d'abstraction de données, pour que le passage au cloud soit propre et réversible.

---

## TÂCHE B1 — Couche d'accès aux données (data layer)

**But :** centraliser toutes les lectures/écritures de données derrière une seule interface, pour pouvoir brancher le cloud plus tard sans réécrire l'app.

**À faire :**
- Créer un module `data/store.js` (ou `lib/store.js`) exposant une API claire, par exemple :
  - `getVideos()`, `getPlaylists()`, `getCategories()`, `getResources()`, `getFiles()`, `getFinance()`
  - `addVideoToPlaylist(youtubeId, playlistId)`, `createPlaylist(...)`, `updatePlaylist(...)`, `deletePlaylist(...)`, `createCategory(...)`, etc.
  - `exportLibraryXml()`
- Pour l'instant, **toutes ces fonctions tapent dans la source actuelle** (XML chargé + localStorage). Comportement **identique** à aujourd'hui.
- Refactorer `app.js` pour qu'il passe **uniquement** par ce store, au lieu de lire/écrire directement. Aucune fonctionnalité ne change pour l'utilisateur.
- Ajouter un identifiant d'« espace de données » (`dataSource: 'local'`) qui pourra valoir `'cloud'` plus tard.

**Tester :** tout fonctionne exactement comme avant. Aucune régression. Drag-drop, admin, export : identiques.

**Commit :** `Lumen: couche d'accès aux données unifiée (préparation cloud)`

---

## TÂCHE B2 — Modèle de données cible + schéma de synchronisation

**But :** définir clairement la forme des données pour le cloud, sans encore l'implémenter.

**À faire :**
- Écrire un document `docs/DATA_MODEL.md` décrivant les entités et leurs champs :
  - `categories` (id, title, icon, color, description, position)
  - `playlists` (id, category_id, title, description, level, tags, position)
  - `videos` (id, playlist_id, youtube_id, title, description, duration, level, tags, source, position)
  - `resources`, `files`, `finance` (transactions, goals)
  - `user_id` sur chaque entité (pour le cloud multi-utilisateur).
- Définir une **clé de déduplication** : `youtube_id` unique par utilisateur.
- Définir la **stratégie de synchronisation** : local-first, « last-write-wins » par `updated_at`, avec un journal de modifications local (queue) à pousser quand l'utilisateur est connecté.
- Écrire le **SQL de création des tables** Supabase (Postgres) dans `supabase/schema.sql` (sans l'exécuter encore).

**Tester :** revue de la cohérence avec les données XML actuelles (chaque champ XML a sa place).

**Commit :** `Lumen: modèle de données cible + schéma SQL Supabase (doc seulement)`

---

# PHASE C — Cloud Supabase (comptes + base + sync)

> Objectif : ajouter comptes sécurisés et synchronisation cloud, **en option**. Si l'utilisateur n'est pas connecté, l'app reste en mode local exactement comme avant.

**Pré-requis utilisateur (à faire une fois, hors Claude Code) :**
1. Créer un compte gratuit sur supabase.com et un nouveau projet.
2. Noter l'`URL du projet` et la `anon public key` (ce sont des valeurs **publiques**, OK côté client).
3. Les coller dans un fichier `config.js` (voir tâche C1).

---

## TÂCHE C1 — Connexion Supabase (lecture seule, sans casser le local)

**But :** brancher le SDK Supabase et établir la connexion, sans encore migrer les données.

**À faire :**
- Charger le SDK Supabase via ESM CDN (`https://esm.sh/@supabase/supabase-js`), sans build.
- Créer `config.js` avec `SUPABASE_URL` et `SUPABASE_ANON_KEY` (clés publiques). Ajouter `config.local.js` au `.gitignore` si on veut un override local, mais la anon key publique peut rester versionnée (elle est conçue pour le client). **Aucune clé service_role côté client, jamais.**
- Créer `lib/supabase.js` qui initialise le client et expose `supabase`.
- Ajouter un **indicateur d'état** discret dans l'UI : « Mode local » vs « Connecté au cloud ». Au départ : toujours « Mode local ».
- Si Supabase est injoignable ou non configuré : l'app continue en local **sans erreur visible** (try/catch, dégradation propre).

**Tester :** site marche sans config Supabase (mode local) ; avec config, la connexion s'initialise sans rien casser.

**Commit :** `Lumen: intégration SDK Supabase (connexion, mode local préservé)`

---

## TÂCHE C2 — Authentification (création de compte + connexion sécurisée)

**But :** permettre à l'utilisateur de créer un compte et se connecter.

**À faire :**
- Créer une page/modal de connexion : inscription par email + mot de passe, connexion, déconnexion, mot de passe oublié. Optionnel : connexion Google (OAuth Supabase) si l'utilisateur le souhaite plus tard.
- Utiliser **Supabase Auth** (gère le hachage, les sessions, les tokens JWT — rien à coder côté sécurité bas niveau).
- Gérer la session : au chargement, détecter si une session existe ; afficher l'avatar/état connecté dans la sidebar.
- **Sécurité :** activer la confirmation par email côté Supabase ; ne stocker aucun mot de passe ; s'appuyer sur les sessions Supabase. Respecter un design Lumen pour les écrans d'auth (sobres, sombres, soignés).
- Tant que l'utilisateur n'est pas connecté : tout reste en **mode local** comme avant.

**Tester :** créer un compte, recevoir l'email, se connecter, se déconnecter, rafraîchir la page (session persiste), mauvais mot de passe géré proprement.

**Commit :** `Lumen: authentification Supabase (compte, connexion, session)`

---

## TÂCHE C3 — Base de données + sécurité par lignes (RLS)

**But :** créer les tables cloud et garantir que chaque utilisateur ne voit QUE ses données.

**À faire :**
- Exécuter `supabase/schema.sql` (de la tâche B2) pour créer les tables.
- Activer **Row Level Security (RLS)** sur **toutes** les tables, avec des policies : un utilisateur ne peut lire/écrire que les lignes où `user_id = auth.uid()`. **C'est la garantie de sécurité principale** — sans RLS, les données seraient exposées.
- Écrire les policies dans `supabase/policies.sql` et les documenter.
- Vérifier avec deux comptes de test que l'un ne voit jamais les données de l'autre.

**Tester :** compte A crée des données ; compte B ne les voit pas ; un appel non authentifié ne renvoie rien.

**Commit :** `Lumen: tables Supabase + RLS (isolation par utilisateur)`

---

## TÂCHE C4 — Migration locale → cloud (première synchro)

**But :** quand l'utilisateur se connecte pour la première fois, proposer d'importer sa bibliothèque locale (XML/localStorage) vers le cloud.

**À faire :**
- Détecter à la connexion s'il existe des données locales non encore synchronisées.
- Proposer un bouton « Importer ma bibliothèque locale dans le cloud ». Au clic : pousser catégories → playlists → vidéos → ressources → fichiers → finance vers Supabase, **en respectant la déduplication par `youtube_id`**.
- Afficher une progression claire et un récapitulatif (X catégories, Y playlists, Z vidéos importées, N doublons évités).
- Idempotent : relancer la migration ne crée pas de doublons.

**Tester :** depuis un compte neuf, importer la bibliothèque locale ; vérifier dans Supabase que tout est présent, sans doublon ; relancer → aucun doublon ajouté.

**Commit :** `Lumen: migration de la bibliothèque locale vers le cloud (dédupliquée)`

---

## TÂCHE C5 — Synchronisation bidirectionnelle local ↔ cloud

**But :** faire vivre les deux mondes en parallèle (objectif « les deux »).

**À faire :**
- Quand connecté : les lectures viennent du cloud, mais une **copie locale** est maintenue pour le hors-ligne.
- Les écritures (drag-drop, admin) vont dans une **file locale** puis sont poussées au cloud ; en cas de hors-ligne, elles partent à la reconnexion.
- Conflits : « last-write-wins » par `updated_at` (déjà défini en B2).
- Un bouton « Synchroniser maintenant » + une synchro auto périodique discrète.
- Le mode local pur (déconnecté) continue de fonctionner à 100 % comme en Phase A.

**Tester :** modifier sur un appareil connecté → retrouver le changement sur un autre après synchro ; couper le réseau, modifier, reconnecter → la modif part ; déconnecté total → tout marche encore en local.

**Commit :** `Lumen: synchronisation local-first ↔ cloud (offline-safe)`

---

## TÂCHE C6 — Finitions, sécurité et qualité

**But :** rendre l'ensemble « nickel » et prêt à l'usage durable.

**À faire :**
- Revue sécurité : RLS sur toutes les tables, aucune clé secrète côté client, confirmation email active, gestion propre des erreurs réseau/auth, pas de fuite de données entre comptes.
- États vides soignés (aucune vidéo, non connecté, hors-ligne) avec messages clairs en voix de l'interface.
- Accessibilité : focus clavier visible, contrastes suffisants, `prefers-reduced-motion`, navigation au clavier dans les modals.
- Performance : test avec ~1000 vidéos simulées, rendu fluide, pas de fuite mémoire.
- Tests Playwright couvrant : auth, drag-drop, admin, export XML, migration, synchro.
- Mettre à jour `README.md` (installation, config Supabase, déploiement) et `SUIVI_PROJET.md` (état final).

**Tester :** parcours complet d'un nouvel utilisateur : arrivée → mode local → création de compte → import → usage multi-appareils → hors-ligne → retour en ligne. Tout doit être fluide et sans perte de données.

**Commit :** `Lumen: finitions, sécurité, accessibilité, tests`

> ✅ **Fin de Phase C** : Lumen est une application local-first avec comptes sécurisés et synchronisation cloud, toujours hébergeable sur GitHub Pages, et fonctionnelle hors-ligne.

---

## Récapitulatif des tâches (ordre conseillé)

| # | Phase | Tâche | Dépendance |
|---|-------|-------|-----------|
| A1 | A | Renommage VisionHub → Lumen | — |
| A2 | A | Nouveau design system (CSS) | A1 |
| A3 | A | Page d'accueil animée | A2 |
| A4 | A | Dashboard Vidéos + drag-drop | A2 |
| A5 | A | Lecteur robuste + autres pages | A2 |
| B1 | B | Couche d'accès aux données | A5 |
| B2 | B | Modèle de données + schéma SQL | B1 |
| C1 | C | Connexion Supabase | B2 |
| C2 | C | Authentification | C1 |
| C3 | C | Tables + RLS | C2 |
| C4 | C | Migration locale → cloud | C3 |
| C5 | C | Synchronisation bidirectionnelle | C4 |
| C6 | C | Finitions + sécurité + tests | C5 |

**Rappel final :** une tâche à la fois. Tester. Committer. Rapporter. S'arrêter. Attendre la tâche suivante.
