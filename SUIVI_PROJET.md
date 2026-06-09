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

## Prochaines Tâches Statiques

- Améliorer l'ergonomie de la section `Vidéos importées`.
- Ajouter un indicateur clair des vidéos déjà organisées.
- Améliorer l'export XML avec un bouton de copie plus confortable.
- Ajouter des filtres plus fins dans `files.html`.
- Continuer à garder le projet compatible GitHub Pages sans backend obligatoire.
