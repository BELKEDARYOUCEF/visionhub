# VisionHub Pro Foundation

VisionHub Pro Foundation est un site statique compatible GitHub Pages pour organiser des vidéos YouTube, des playlists, des ressources, des fichiers et un suivi finance léger.

Le projet fonctionne avec :

- HTML ;
- CSS ;
- JavaScript vanilla ;
- XML ;
- `localStorage` pour les modifications locales ;
- GitHub Pages.

Aucun backend, aucune base SQLite et aucune API YouTube ne sont nécessaires pour afficher le site.

## Structure

```text
index.html
playlists.html
videos.html
files.html
finance.html
about.html
styles.css
app.js
data/library.xml
data/resources.xml
data/video-intelligence.xml
data/workspace.xml
data/finance.xml
README.md
SUIVI_PROJET.md
```

Fichiers de développement conservés :

```text
package.json
package-lock.json
playwright.config.js
tests/admin-playlists.spec.js
```

Ils servent uniquement à lancer un serveur local, vérifier le JavaScript et tester le site statique.

## Lancer en local

Ne pas ouvrir les pages en double-clic si tu veux tester le lecteur YouTube. Lance un serveur local :

```bash
npm run start
```

Puis ouvre :

```text
http://127.0.0.1:5502/index.html
http://127.0.0.1:5502/videos.html
http://127.0.0.1:5502/playlists.html
http://127.0.0.1:5502/files.html
```

## Données

- `data/library.xml` : catégories, playlists et vidéos principales.
- `data/resources.xml` : ressources importées, dont les vidéos YouTube valides.
- `data/video-intelligence.xml` : titres, descriptions, tags et classification éditoriale.
- `data/workspace.xml` : dossiers et ressources visibles dans `files.html`.
- `data/finance.xml` : données du suivi finance.

## Vidéos Importées

Les vidéos YouTube valides présentes dans `data/resources.xml` sont chargées automatiquement par `app.js`.

Elles apparaissent dans :

- `videos.html`, dans la section `Vidéos importées` ;
- `playlists.html`, comme playlists `Ressources importées — Catégorie` ;
- `files.html`, comme ressources cataloguées.

Les doublons sont évités par ID YouTube. Si une vidéo existe déjà dans `data/library.xml`, elle n'est pas recréée depuis `data/resources.xml`.

## Administration

L'administration est intégrée dans `playlists.html` avec le bouton `Administration`.

Elle permet :

- créer, modifier, supprimer et réordonner des catégories ;
- créer, modifier, supprimer et réordonner des playlists ;
- créer, modifier, supprimer, déplacer et réordonner des vidéos ;
- voir les vidéos importées non classées ;
- distinguer les vidéos importées `Non classée` et `Ajoutée à ...` ;
- ajouter une vidéo importée à une playlist existante ;
- créer une nouvelle playlist depuis une vidéo importée ;
- exporter un nouveau XML.

GitHub Pages ne peut pas écrire directement dans `data/library.xml`. Les modifications sont donc stockées en `localStorage`, puis exportées avec le bouton `Exporter XML`.

Les exports affichés dans l'interface proposent aussi :

- copier l'export ;
- télécharger le fichier généré.

## Recherche Et Filtres

`videos.html` propose maintenant :

- filtre par playlist ;
- filtre par périmètre : playlist active, bibliothèque, importées ou toutes les vidéos ;
- tri par catégorie, titre ou source.

`files.html` distingue les ressources par type :

- vidéos ;
- liens ;
- documents ;
- notes ;
- fichiers locaux.

## Vérification

```bash
npm run check:js
npm run test:e2e
```

Tests manuels recommandés :

- ouvrir `videos.html` ;
- vérifier les vidéos de `data/library.xml` ;
- vérifier la section `Vidéos importées` ;
- rechercher une vidéo ;
- filtrer par catégorie, source, état, playlist et périmètre ;
- cliquer sur une vidéo et vérifier que le lecteur change ;
- ouvrir `playlists.html > Administration` ;
- organiser une vidéo importée ;
- exporter le XML ;
- copier ou télécharger l'export ;
- ouvrir `files.html` et vérifier les ressources.

## Déploiement GitHub Pages

Déployer la racine du dépôt sur GitHub Pages.

Les éléments suivants ne doivent pas être publiés et sont ignorés :

```text
node_modules/
test-results/
data/visionhub.sqlite
.env
__pycache__/
*.pyc
```
