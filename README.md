# VisionHub Pro Foundation

VisionHub Pro Foundation est une base statique premium pour organiser des vidéos YouTube par playlists, des fichiers par dossiers et un premier cockpit finance. Le projet est compatible GitHub Pages et utilise une base XML interne versionnable.

## Objectif

Construire une fondation propre avant d'ajouter trop de fonctionnalités :

- une page d'accueil vivante avec liens Discord, Instagram, GitHub et YouTube ;
- des pages séparées : Accueil, Playlists, Vidéos, Fichiers, Finance, Studio, À propos ;
- une bibliothèque vidéo dynamique chargée depuis `data/library.xml` ;
- un lecteur YouTube robuste qui évite l'écran Error 153 en ouverture directe `file://` ;
- une sauvegarde locale `localStorage` pour les ajouts depuis Studio ;
- un export XML pour versionner les modifications sur GitHub ;
- un File OS avec dossiers, items, statuts, tags, recherche, vues grille/liste et export XML ;
- un cockpit finance avec revenus, dépenses, objectifs, persistance locale et export CSV/XML ;
- une architecture prête à migrer plus tard vers SQLite, Supabase ou PostgreSQL.

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
└── data/
    ├── library.xml
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

## Ajouter depuis Studio

`studio.html` ajoute les nouvelles playlists et vidéos dans `localStorage`, car un site GitHub Pages ne peut pas écrire directement dans `data/library.xml`.

Pour versionner les changements :

1. ouvrir `studio.html` ;
2. ajouter les vidéos ;
3. cliquer sur `Générer XML` ;
4. copier le XML dans `data/library.xml` ;
5. commit/push sur GitHub.

## File OS et Finance

`files.html` permet de rechercher les dossiers et items, de basculer entre grille et liste, d’ajouter des dossiers/items dans `localStorage`, puis d’exporter un nouveau `workspace.xml`.

`finance.html` permet d’ajouter des revenus, dépenses et objectifs en local, puis d’exporter les transactions en CSV ou la base complète en XML. Le module est un suivi léger, pas une comptabilité officielle.

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
```

Puis tester manuellement :

- ouvrir `videos.html` ;
- cliquer sur le bouton lecture ;
- changer de vidéo ;
- vérifier que le lecteur change ;
- ajouter une vidéo via `studio.html` ;
- exporter le XML.
- ouvrir `files.html`, rechercher un dossier et exporter le workspace ;
- ouvrir `finance.html`, ajouter une transaction et exporter CSV/XML.
