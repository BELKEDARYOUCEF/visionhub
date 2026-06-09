# Suivi du projet — VisionHub Pro Foundation

Dernière mise à jour : 10 juin 2026

## Décision Actuelle

VisionHub est recentré sur une version statique propre pour GitHub Pages.

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

## Ajustements interface — 10 juin 2026

Corrections effectuées :

- le panneau `playlists.html > Administration` est repositionné sous la navigation sticky pour ne plus être masqué par l'en-tête ;
- le panneau d'administration a maintenant des marges, un arrondi et une hauteur limitée à l'espace visible ;
- dans `files.html`, chaque dossier affiche les ressources par pages de 5 éléments ;
- les flèches précédent/suivant permettent de naviguer dans les dossiers qui contiennent beaucoup de ressources ;
- la pagination se combine avec le filtre par type de ressource.

Tests :

- `npm run check:js` : OK ;
- `npm run test:e2e` : OK, 3 tests Playwright passent.
