# Suivi du projet — Lumen

Dernière mise à jour : 16 juin 2026

## Phase A — Design & refonte visuelle (en cours)

### Tâche A1 — Renommage Lumen → Lumen ✅

Effectué le 16 juin 2026 :

- Tous les fichiers HTML (index, videos, playlists, files, finance, about) mis à jour : `<title>`, `<meta description>`, header, footer.
- Logo SVG `lumen-icon-glass.svg` ajouté comme favicon sur chaque page.
- Icône SVG dans le header à la place du texte « VH ».
- Sous-titre de marque : `Personal knowledge & media library`.
- Clés `localStorage` migrées de `visionhub-v2-*` vers `lumen-v2-*` avec migration douce au chargement (copie automatique si ancienne clé existe).
- `app.js`, `README.md`, `SUIVI_PROJET.md` mis à jour.

---

## Décision Actuelle

Lumen (anciennement Lumen) est recentré sur une version statique propre pour GitHub Pages.

Le site doit fonctionner avec :

- HTML ;
- CSS ;
- JavaScript vanilla ;
- XML ;
- `localStorage` ;
- GitHub Pages.

Le backend local, SQLite, le schéma SQL, les scripts d'import SQL et l'ancienne page `studio.html` ont été retirés du projet pour éviter toute confusion. Le travail utile reste dans les fichiers XML, `app.js`, les pages HTML, les styles et les tests statiques.

## Structure Conservée

```text
index.html        Accueil
playlists.html    Bibliothèque, administration et organisation
videos.html       Lecteur YouTube et vidéos importées
files.html        Ressources et dossiers
finance.html      Suivi finance léger
about.html        Présentation
styles.css        Design responsive
app.js            Logique statique vanilla JS
data/library.xml Base vidéo principale
data/resources.xml Ressources importées
data/video-intelligence.xml Enrichissement éditorial
data/workspace.xml Données File OS
data/finance.xml Données Finance
README.md         Documentation statique
SUIVI_PROJET.md   Suivi projet
AGENTS.md         Règles permanentes de travail
```

Fichiers de développement conservés :

```text
package.json
package-lock.json
playwright.config.js
tests/admin-playlists.spec.js
```

Ils servent à lancer le serveur local, vérifier `app.js` et tester la version statique.

## Fonction Vidéo

Le lecteur vidéo est conçu pour éviter les erreurs d'intégration YouTube les plus courantes :

- miniature affichée avant chargement de l'iframe ;
- iframe injectée seulement après clic ;
- pas d'iframe injectée en `file://` ;
- `referrerpolicy="strict-origin-when-cross-origin"` ;
- URL embed avec `origin=` quand une origine HTTP existe.

## Vidéos Importées

`app.js` charge `data/resources.xml` et transforme les vidéos YouTube valides en vidéos navigables.

Structure utilisée :

```text
Catégorie
└── Ressources importées — Catégorie
    └── Vidéo
```

Règles :

- `data/resources.xml` n'est pas supprimé ;
- les vidéos importées apparaissent dans `videos.html` ;
- les playlists importées apparaissent dans `playlists.html` ;
- les ressources apparaissent aussi dans `files.html` ;
- les doublons sont évités par ID YouTube ;
- `data/library.xml` reste prioritaire quand une vidéo existe déjà.

Compteurs vérifiés :

- vidéos dans `data/library.xml` : 11 ;
- vidéos YouTube uniques importées depuis `data/resources.xml` : 174 ;
- doublons entre `library.xml` et `resources.xml` : 0 ;
- vidéos navigables attendues : 185.

## Administration

L'administration est intégrée dans `playlists.html`.

Fonctions disponibles :

- catégories : créer, modifier, supprimer, fusionner, réordonner ;
- playlists : créer, modifier, supprimer, déplacer, réordonner ;
- vidéos : créer, modifier, supprimer, déplacer, réordonner ;
- vidéos importées non classées : afficher, choisir une catégorie, choisir ou créer une playlist, ajouter localement ;
- export XML pour générer un nouveau `data/library.xml`.

Limite volontaire :

- GitHub Pages ne peut pas écrire dans `data/library.xml`.
- Les changements sont stockés en `localStorage`, puis exportés manuellement en XML.

## Nettoyage Effectué

Retiré du projet suivi par Git :

- ancienne page `studio.html` ;
- backend local Python ;
- import XML vers SQLite ;
- schéma SQL ;
- documentation SQL ;
- scripts de génération/import devenus non essentiels au site statique ;
- agent local `.github/agents` ;
- caches Python `.pyc`.

Ignoré par Git :

```text
node_modules/
test-results/
.env
data/visionhub.sqlite
__pycache__/
*.pyc
playwright-report/
data/*.sqlite
data/*.sqlite-shm
data/*.sqlite-wal
```

## Tests

Commandes validées :

```bash
npm run check:js
npm run test:e2e
```

Tests Playwright couverts :

- administration `Catégorie > Playlist > Vidéo` ;
- enrichissement vidéo ;
- affichage des vidéos importées ;
- recherche importée ;
- changement du lecteur après clic vidéo ;
- ouverture de l'administration des importées ;
- création locale d'une playlist depuis une vidéo importée ;
- présence des ressources dans `files.html`.

## Améliorations statiques — 10 juin 2026

Fonctions ajoutées :

- état clair des vidéos importées : `Non classée` ou `Ajoutée à ...` ;
- compteur des importées non classées et déjà organisées ;
- filtre d'administration des importées : toutes, non classées, déjà organisées ;
- conservation de la playlist importée source quand une vidéo est organisée ;
- export avec actions `Copier l'export` et `Télécharger` ;
- `videos.html` : filtre par playlist ;
- `videos.html` : filtre par périmètre, bibliothèque, importées ou toutes les vidéos ;
- `videos.html` : tri par catégorie, titre ou source ;
- `files.html` : filtre par type de ressource ;
- `files.html` : distinction visuelle entre vidéos, liens, documents, notes et fichiers locaux.

Vérification GitHub Pages :

- `https://belkedaryoucef.github.io/visionhub/index.html` répond en HTTP 200 ;
- `https://belkedaryoucef.github.io/visionhub/videos.html` répond en HTTP 200 ;
- `https://belkedaryoucef.github.io/visionhub/playlists.html` répond en HTTP 200 ;
- `https://belkedaryoucef.github.io/visionhub/files.html` répond en HTTP 200 ;
- les XML `library.xml`, `resources.xml`, `video-intelligence.xml`, `workspace.xml` et `finance.xml` répondent en HTTP 200.

Limite de cette vérification :

- ces changements doivent encore être poussés/déployés pour apparaître sur GitHub Pages ;
- la vérification GitHub Pages ci-dessus confirme que le déploiement existant sert bien les pages et XML statiques.

Tests locaux :

- `npm run check:js` : OK ;
- `npm run test:e2e` : OK, 3 tests Playwright passent ;
- les tests couvrent les nouveaux filtres vidéo, les états d'importées, l'organisation locale, les actions d'export visibles et les filtres de ressources.

## Prochaines Tâches Statiques

- Améliorer l'ergonomie de la section `Vidéos importées`.
- Ajouter un indicateur clair des vidéos déjà organisées.
- Améliorer l'export XML avec un bouton de copie plus confortable.
- Ajouter des filtres plus fins dans `files.html`.
- Continuer à garder le projet compatible GitHub Pages sans backend obligatoire.

---

## Phase V2 — Lumen v2 (2026-07-01) ✅ MERGÉE DANS MAIN

### Tâches complétées

| Tâche | Description | Commit |
|---|---|---|
| V2-1 | Nav horizontale en haut partout + colonne playlists droite | `b515e6e` |
| V2-2 | Playlist au centre, catégorie en étiquette optionnelle | `70fb841` |
| V2-3 | Administration rapide (ajout playlist + vidéo par lien, oEmbed) | `ab7fa44` |
| V2-4 | Page Fichiers avec vrais fichiers (`data/files/`, manifeste XML) | `98cb9d5` |
| V2-5 | Import playlist yt-dlp + coller-importer dans l'app | `6366326` |
| V2-6 | Page À propos → Tableau de bord (stats, catégories, réglages) | `14fc565` |
| V2-7 | Habillage visuel (logo verre, vignettes YouTube, hero d'accueil) | `6c7e792` |
| Import | 142 liens YouTube → 11 nouvelles playlists dans `library.xml` | `8d601aa` |

### État final

- Branche : `lumen/v2-2-playlist-first` → mergée dans `main`
- PR #1 : fermée/mergée
- `data/library.xml` : 16 playlists, 153 vidéos
- Déploiement GitHub Pages : actif sur `main`

### Nouvelles fonctionnalités v2

- Coquille partagée (`renderShell`) sur toutes les pages
- Ajout rapide playlist en 2 clics, vidéo en collant un lien YouTube (oEmbed)
- Import batch de playlist (texte `titre | id` généré par `tools/playlist-to-xml.py`)
- Anti-doublon par `youtubeId` partout
- Page Fichiers : manifeste `data/files.xml`, filtres par type, drag-drop
- Tableau de bord : 4 stat cards, barres par catégorie, export XML, réglages
- Logo verre animé sur l'accueil, vignettes YouTube réelles, `onerror` gracieux
- `prefers-reduced-motion` respecté

## Ajustements interface — 10 juin 2026

Corrections effectuées :

- le panneau `playlists.html > Administration` contient maintenant une vue `Hiérarchie` explicite ;
- cette vue affiche `Catégorie > Playlist > Vidéos` dans un arbre lisible ;
- les boutons `Éditer` de l'arbre réutilisent les formulaires locaux existants ;
- le panneau `playlists.html > Administration` est repositionné sous la navigation sticky pour ne plus être masqué par l'en-tête ;
- le panneau d'administration a maintenant des marges, un arrondi et une hauteur limitée à l'espace visible ;
- dans `files.html`, chaque dossier affiche les ressources par pages de 5 éléments ;
- les flèches précédent/suivant permettent de naviguer dans les dossiers qui contiennent beaucoup de ressources ;
- la pagination se combine avec le filtre par type de ressource.

Tests :

- `npm run check:js` : OK ;
- `npm run test:e2e` : OK, 3 tests Playwright passent.

## Administration bibliothèque vidéo — 10 juin 2026

Objectif : améliorer uniquement l'administration statique de la bibliothèque vidéo, sans API YouTube, SQLite ou backend.

Fonctions ajoutées :

- zone `Vidéos déjà organisées` dans `playlists.html > Administration` ;
- chaque vidéo organisée affiche sa catégorie, sa playlist, son titre, sa durée et ses tags ;
- actions par vidéo organisée : `Déplacer`, `Modifier`, `Retirer` ;
- déplacement d'une vidéo déjà classée vers une autre playlist ;
- déplacement d'une vidéo importée vers une playlist existante ;
- création d'une nouvelle playlist pendant le déplacement ;
- création d'une nouvelle catégorie pendant le déplacement ;
- prévention automatique des doublons par ID YouTube ;
- message clair si la vidéo existe déjà dans la playlist cible : `Cette vidéo existe déjà dans la playlist X.`

Règles conservées :

- hiérarchie stricte `Catégorie > Playlist > Vidéos` ;
- persistance en `localStorage` ;
- export XML pour générer un nouveau `data/library.xml` ;
- compatibilité GitHub Pages.

Tests :

- `npm run check:js` : OK ;
- `npm run test:e2e` : OK, 3 tests Playwright passent ;
- le test couvre le déplacement d'une vidéo déjà classée et l'affichage du message de doublon.

## Bonnes pratiques projet — 10 juin 2026

Ajout de `AGENTS.md` pour centraliser les règles permanentes du projet.

Objectif :

- éviter de répéter à chaque intervention que Lumen doit rester statique ;
- garder les contraintes GitHub Pages visibles ;
- documenter les fichiers essentiels et les fichiers de développement autorisés ;
- rappeler les éléments à nettoyer après les tests ;
- fixer les règles de gestion des vidéos, playlists, catégories, imports et exports XML ;
- préciser les tests obligatoires avant de terminer une évolution fonctionnelle.

Règle principale ajoutée :

- choisir l'option la plus compatible GitHub Pages, la plus simple à maintenir, et qui conserve les données existantes.

## Gestion playlists et catégories — 10 juin 2026

Fonctions confirmées dans `playlists.html > Administration` :

- créer une playlist ;
- modifier le titre et la description d'une playlist ;
- changer la catégorie d'une playlist ;
- supprimer une playlist ;
- déplacer une playlist dans une autre catégorie ;
- réordonner les playlists ;
- créer une catégorie ;
- modifier le nom et la description d'une catégorie ;
- supprimer une catégorie vide ;
- fusionner deux catégories ;
- réordonner les catégories.

Correction ajoutée :

- une catégorie qui contient encore des playlists ne peut plus être supprimée sans confirmation ;
- si la confirmation est refusée, la catégorie et ses playlists restent intactes ;
- si la confirmation est acceptée, la catégorie, ses playlists et leurs vidéos sont retirées du `localStorage`, puis l'export XML reflète le nouvel état.

Test ajouté :

- test Playwright dédié à la confirmation de suppression d'une catégorie contenant une playlist.

Tests validés :

- `npm run check:js` : OK ;
- `npm run test:e2e` : OK, 4 tests Playwright passent ;
- `node_modules/` et `test-results/` supprimés après les tests pour garder le projet propre.
