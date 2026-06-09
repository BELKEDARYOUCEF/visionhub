# VisionHub Pro Foundation

VisionHub Pro Foundation est une base statique premium pour organiser des vidéos YouTube par playlists, des fichiers par dossiers et un premier cockpit finance. Le projet est compatible GitHub Pages et utilise une base XML interne versionnable.

## Objectif

Construire une fondation propre avant d'ajouter trop de fonctionnalités :

- une page d'accueil vivante avec liens Discord, Instagram, GitHub et YouTube ;
- des pages séparées : Accueil, Playlists, Vidéos, Fichiers, Finance, Studio, À propos ;
- une bibliothèque vidéo dynamique chargée depuis `data/library.xml` ;
- une administration intégrée dans `playlists.html` pour gérer catégories, playlists et vidéos ;
- un lecteur YouTube robuste qui évite l'écran Error 153 en ouverture directe `file://` ;
- une sauvegarde locale `localStorage` pour les modifications depuis l'administration ;
- un export XML pour versionner les modifications sur GitHub ;
- un File OS avec dossiers, items, statuts, tags, recherche, vues grille/liste et export XML ;
- un catalogue centralisé des ressources importées depuis `data/resources.xml` ;
- une intelligence vidéo générée dans `data/video-intelligence.xml` ;
- un cockpit finance avec revenus, dépenses, objectifs, persistance locale et export CSV/XML ;
- une architecture prête à migrer plus tard vers SQLite, Supabase ou PostgreSQL avec `data/sql-schema.sql`.

## Structure

```text
visionhub-pro-foundation/
├── index.html
├── playlists.html
├── videos.html
├── files.html
├── finance.html
├── studio.html
├── about.html
├── styles.css
├── app.js
├── package.json
├── scripts/
│   ├── build-resources-catalog.js
│   └── build-video-intelligence.js
├── docs/
│   └── sql-data-model.md
└── data/
    ├── library.xml
    ├── resources.xml
    ├── video-intelligence.xml
    ├── sql-schema.sql
    ├── workspace.xml
    └── finance.xml
```

## Lancer en local

Pour tester YouTube correctement, ne pas ouvrir `index.html` en double-clic. Lance un serveur local :

```bash
npm run start
```

ou :

```bash
python3 -m http.server 5502
```

Puis ouvre :

```text
http://127.0.0.1:5502
```

Pour lancer la version backend locale avec API + SQLite :

```bash
npm run db:import
npm run start:backend
```

Puis ouvre :

```text
http://127.0.0.1:5503
```

Endpoints utiles :

```text
GET  /api/health
GET  /api/videos?limit=50
GET  /api/videos/{youtubeId}
POST /api/import
POST /api/youtube/enrich
```

Pour enrichir avec les métadonnées officielles YouTube, démarre le backend avec une clé YouTube Data API :

```bash
YOUTUBE_API_KEY=ta_cle npm run start:backend
```

## Pourquoi cette version évite l'erreur YouTube 153

Le lecteur n'injecte pas automatiquement l'iframe au chargement de la page. Il affiche d'abord une miniature et charge l'iframe seulement après clic.

Si le site est ouvert en `file://`, l'iframe n'est pas injectée : un message explique de lancer le serveur local. Cela évite d'afficher l'écran YouTube Error 153.

Quand le site est chargé en `http://127.0.0.1:5502` ou sur GitHub Pages, l'iframe est générée avec :

```html
<meta name="referrer" content="strict-origin-when-cross-origin">
```

et :

```html
<iframe referrerpolicy="strict-origin-when-cross-origin" ...></iframe>
```

L'URL embed contient aussi `enablejsapi=1` et `origin=` lorsque l'origine HTTP existe.

## Modifier la base XML

Les playlists sont dans :

```text
data/library.xml
```

Exemple :

```xml
<playlist id="frontend-foundations" category="web" level="Débutant" title="Frontend Foundations" tags="Coding,HTML,CSS">
  <description>Construire des bases solides.</description>
  <video id="html-crash" youtubeId="UB1O30fR-EE" duration="1:00:42" level="Débutant" title="HTML Crash Course" tags="HTML">
    <description>Les bases HTML.</description>
  </video>
</playlist>
```

Les dossiers et ressources du File OS sont dans :

```text
data/workspace.xml
```

Le cockpit finance charge ses transactions et objectifs depuis :

```text
data/finance.xml
```

Le catalogue importé des ressources est dans :

```text
data/resources.xml
```

L'enrichissement vidéo généré est dans :

```text
data/video-intelligence.xml
```

Le schéma cible de migration SQL est dans :

```text
data/sql-schema.sql
```

## Administration des playlists

L'administration principale est intégrée dans `playlists.html` via le bouton `Administration`. Elle permet de créer, modifier, supprimer, fusionner et réordonner les catégories, playlists et vidéos.

Les changements restent en `localStorage`, car GitHub Pages ne peut pas écrire directement dans `data/library.xml`.

Pour versionner les changements :

1. ouvrir `playlists.html` ;
2. cliquer sur `Administration` ;
3. modifier la hiérarchie `Catégorie > Playlist > Vidéo` ;
4. cliquer sur `Exporter XML` ;
5. copier le XML dans `data/library.xml` ;
6. commit/push sur GitHub.

`studio.html` reste dans le dépôt pour compatibilité temporaire, mais il n'est plus l'entrée principale.

## File OS et Finance

`files.html` permet de rechercher les dossiers et items, de basculer entre grille et liste, d’ajouter des dossiers/items dans `localStorage`, puis d’exporter un nouveau `workspace.xml`.

`finance.html` permet d’ajouter des revenus, dépenses et objectifs en local, puis d’exporter les transactions en CSV ou la base complète en XML. Le module est un suivi léger, pas une comptabilité officielle.

## Ressources et intelligence vidéo

Le catalogue `data/resources.xml` centralise les ressources importées, avec déduplication, exclusion des liens YouTube morts et classement dans les dossiers VisionHub.

L'intelligence vidéo est générée avec :

```bash
npm run build:video-intelligence
```

Elle enrichit les vidéos avec :

- un titre nettoyé ;
- une description éditoriale ;
- des tags enrichis ;
- un niveau ;
- un domaine ;
- un sujet ;
- une intention ;
- une confiance.

Limite actuelle : YouTube oEmbed ne donne pas la description complète ni les mots-clés officiels. Pour analyser ces champs, il faudra ajouter YouTube Data API via backend.

## Modèle SQL cible

`data/sql-schema.sql` prépare la future migration vers SQLite, Supabase ou PostgreSQL. Le site actuel reste statique et compatible GitHub Pages.

La documentation de migration est dans :

```text
docs/sql-data-model.md
```

L'import XML vers SQLite est lancé avec :

```bash
npm run db:import
```

La base locale générée est `data/visionhub.sqlite`. Elle est ignorée par Git car elle est reconstruite depuis les XML.

## Déploiement GitHub Pages

1. Créer un dépôt GitHub.
2. Mettre les fichiers du dossier à la racine.
3. Aller dans `Settings > Pages`.
4. Choisir `Deploy from a branch`.
5. Sélectionner `main` puis `/root`.
6. Ouvrir l'URL fournie par GitHub.

## Vérification

```bash
npm run check:js
npm run db:import
npm run build:video-intelligence
npm run test:e2e
```

Puis tester manuellement :

- ouvrir `videos.html` ;
- cliquer sur le bouton lecture ;
- changer de vidéo ;
- vérifier que le lecteur change ;
- modifier une catégorie, playlist ou vidéo via `playlists.html > Administration` ;
- exporter le XML ;
- ouvrir `files.html`, rechercher un dossier et exporter le workspace ;
- ouvrir `finance.html`, ajouter une transaction et exporter CSV/XML.
