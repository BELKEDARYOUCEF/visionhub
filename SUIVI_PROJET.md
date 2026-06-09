# Suivi du projet — VisionHub Pro Foundation

Dernière mise à jour : 09 juin 2026

## Décision principale

Le projet doit repartir sur une base progressive et robuste. On ne doit pas ajouter toutes les fonctionnalités en même temps. La priorité est : vidéo fiable, architecture modulaire, base XML, puis expansion par applications.

## Problème vidéo corrigé dans cette fondation

L'erreur YouTube 153 vient généralement d'un problème de configuration du lecteur : absence de `Referer` HTTP ou politique de referrer non compatible. Pour éviter que l'erreur s'affiche :

- le lecteur ne charge pas l'iframe automatiquement ;
- une miniature est affichée en premier ;
- si la page est ouverte en `file://`, l'iframe n'est pas injectée ;
- l'utilisateur voit un message clair demandant de lancer un serveur local ;
- en HTTP/GitHub Pages, l'iframe reçoit `referrerpolicy="strict-origin-when-cross-origin"` ;
- chaque page contient `<meta name="referrer" content="strict-origin-when-cross-origin">` ;
- l'URL d'embed contient `enablejsapi=1` et `origin=` quand l'origine HTTP existe.

## Structure actuelle proposée

```text
index.html        Accueil vivant
playlists.html    Bibliothèque vidéo
videos.html       Lecteur YouTube dynamique
files.html        Organisation fichiers / dossiers
finance.html      Cockpit finance léger
studio.html       Ajout local + export XML
about.html        Vision produit et roadmap
styles.css        Design premium responsive
app.js            Logique vanilla JS
data/library.xml Base XML interne
```

## Règle de travail

Chaque évolution doit être traitée comme une tâche indépendante :

1. objectif ;
2. fichiers impactés ;
3. critères d'acceptation ;
4. tests ;
5. mise à jour du suivi.

## Prochaines tâches recommandées

### Tâche 1 — Stabilisation vidéo — fait

Valider le lecteur en local HTTP et sur GitHub Pages. Ajouter des tests Playwright plus tard.

### Tâche 2 — Studio avancé

Ajouter modification/suppression, drag & drop de l'ordre des vidéos, import XML et validation des IDs YouTube.

### Tâche 3 — File OS — base faite le 09 juin 2026

`files.html` est maintenant un espace de travail avec `data/workspace.xml`, dossiers, items, statuts, tags, recherche, vues grille/liste, ajout local `localStorage` et export XML.

### Tâche 4 — Finance cockpit — base faite le 09 juin 2026

`finance.html` charge `data/finance.xml`, affiche revenus/dépenses/solde, liste les transactions, suit des objectifs, sauvegarde les ajouts en `localStorage` et exporte CSV/XML. Les graphiques restent à ajouter.

### Tâche 5 — Auth locale puis backend

Ajouter une connexion locale simulée uniquement pour l'expérience utilisateur. Ne pas présenter cela comme une vraie sécurité.

### Tâche 6 — Migration SQL

Quand la version statique est stable, migrer vers SQLite/Supabase/PostgreSQL avec modèles propres.

## Limites connues

- GitHub Pages ne permet pas d'écrire dans les fichiers XML depuis le navigateur.
- Les ajouts Studio sont donc sauvegardés en `localStorage` puis exportés.
- Les ajouts File OS et Finance suivent la même logique : sauvegarde locale puis export XML/CSV.
- Certaines vidéos YouTube peuvent refuser l'intégration selon les paramètres du propriétaire.
- Les embeds TikTok/Instagram devront être ajoutés dans une tâche séparée après stabilisation YouTube.

## Travail réalisé le 09 juin 2026

Le travail effectué couvre une étape complète d'expansion, pas tout le plan directeur.

- La fondation vidéo, XML et Studio minimal existait déjà dans le projet au moment de l'intervention.
- Le File OS a été transformé en module utilisable : `data/workspace.xml`, dossiers, items, statuts, tags, recherche, vues grille/liste, ajout local `localStorage` et export XML.
- Le cockpit Finance a été transformé en module utilisable : `data/finance.xml`, revenus, dépenses, solde, transactions, objectifs, ajout local `localStorage` et export CSV/XML.
- `README.md` a été mis à jour pour documenter les nouveaux fichiers XML, les exports et la vérification.
- Le projet a été vérifié avec `npm run check:js`, testé en serveur local HTTP, puis poussé sur `origin/main`.
- GitHub Pages a reconstruit le site avec succès après le push.

Ce qui reste à faire : Studio avancé complet, édition/suppression, drag and drop, import XML, graphiques finance, tests Playwright, puis migration backend/SQL.

## Ajout playlist informatique — 09 juin 2026

Une nouvelle playlist a été ajoutée dans `data/library.xml` depuis le fichier `/home/yobel/Bureau/a faire/Video YouTube sur l'informatique .txt`.

- Nouvelle catégorie : `informatique`, affichée comme `Informatique & IA`.
- Nouvelle playlist : `informatique-ia-tools`, affichée comme `Vidéos YouTube sur l'informatique`.
- 4 vidéos YouTube importées : `gGquFWBY5cs`, `9TwedVHohUc`, `NjTbdO-krH8`, `8LHEwkV7QpY`.
- Les titres publics ont été récupérés pour 2 vidéos via YouTube oEmbed.
- Les 2 autres vidéos ont été ajoutées avec des titres de secours, car YouTube oEmbed a répondu `Unauthorized`.

## Audit vidéo et nettoyage — 09 juin 2026

Audit complet des vidéos déclarées dans `data/library.xml` :

- 13 vidéos vérifiées via YouTube oEmbed.
- 11 vidéos valides et intégrables.
- 2 vidéos invalides dans la playlist `informatique-ia-tools` : `gGquFWBY5cs` et `8LHEwkV7QpY`.
- Les deux vidéos invalides ont été retirées de `data/library.xml`.
- La playlist `informatique-ia-tools` conserve uniquement les vidéos valides `9TwedVHohUc` et `NjTbdO-krH8`.

Audit du dossier `/home/yobel/Bureau/a faire/Ressouces` :

- 399 fichiers utiles hors `.git`.
- 254 raccourcis `.url`.
- 228 liens YouTube détectés.
- 192 liens vidéo valides.
- 31 entrées vidéo invalides, soit 28 IDs distincts.
- 5 liens YouTube sont des playlists ou une chaîne, pas des vidéos individuelles.
- 19 doublons détectés.

Statuts YouTube invalides observés dans les ressources :

- `Not Found` : vidéo supprimée ou introuvable.
- `Unauthorized` : vidéo privée, restreinte ou inaccessible publiquement.
- `Forbidden` : vidéo non intégrable ou accès refusé.

Nettoyage interface :

- Les messages techniques visibles sur la page Vidéos ont été simplifiés.
- Le bouton `Réinitialiser local` a été retiré du Studio.
- Les explications techniques restent documentées ici et dans le README, pas dans l'interface utilisateur.

Prochaine étape validable : transformer l'administration en panneau intégré dans `playlists.html`, avec hiérarchie stricte Catégorie > Playlist > Vidéo.

## Administration intégrée aux playlists — 09 juin 2026

L'administration de la bibliothèque a été intégrée dans `playlists.html` via un panneau latéral accessible avec le bouton `Administration`.

Fonctions ajoutées :

- création, modification et suppression de catégories ;
- fusion de catégories ;
- réorganisation des catégories par boutons et glisser-déposer ;
- création, modification, suppression et déplacement de playlists vers une autre catégorie ;
- réorganisation des playlists par boutons et glisser-déposer ;
- création, modification, suppression et déplacement de vidéos vers une autre playlist ;
- réorganisation des vidéos par boutons et glisser-déposer dans leur playlist ;
- persistance locale complète avec `localStorage` via la clé `visionhub-v2-library` ;
- export XML depuis la page Playlists ;
- conservation stricte de la hiérarchie `Catégorie > Playlist > Vidéo`.

Nettoyage associé :

- le lien `Studio` a été retiré de la navigation principale et du footer ;
- l'administration visible passe maintenant par la page Playlists ;
- l'ancienne page `studio.html` reste présente dans le dépôt pour compatibilité temporaire, mais elle n'est plus exposée dans la navigation.

Limite volontaire :

- cette administration reste locale côté navigateur. Pour une version commerciale, il faudra remplacer `localStorage` par une vraie base de données et une API.

Prochaine étape validable : importer le dossier ressources dans une bibliothèque centralisée, avec déduplication, exclusion des liens morts et classement dans la structure VisionHub.

## Bibliothèque centralisée des ressources — 09 juin 2026

Le dossier `/home/yobel/Bureau/a faire/Ressouces` a été transformé en catalogue versionnable `data/resources.xml`.

Résultat de génération :

- 399 fichiers analysés hors `.git`.
- 254 raccourcis `.url` analysés.
- 174 vidéos YouTube valides uniques importées.
- 28 vidéos YouTube invalides exclues.
- 5 liens YouTube non vidéo exclus : playlists ou chaîne.
- 25 doublons ignorés.
- 141 fichiers locaux catalogués.
- 26 liens externes catalogués.

Structure produite :

- `Informatique`
- `Business`
- `Documents`
- `Liens`
- `Productivité`

Intégration application :

- `app.js` charge maintenant `data/resources.xml` après `data/workspace.xml`.
- Les ressources importées apparaissent dans la page `files.html`.
- Les liens externes ouvrent leur URL.
- Les fichiers locaux sont catalogués avec leur chemin source pour migration future.

Script ajouté :

- `npm run build:resources`
- source : `scripts/build-resources-catalog.js`

Prochaine étape validable : ajouter l'intelligence automatique sur les vidéos pour générer titres propres, descriptions, tags et niveaux à partir des métadonnées YouTube et du contexte VisionHub.

## Intelligence automatique vidéo — 09 juin 2026

Une première couche d'intelligence vidéo a été ajoutée.

Fichiers ajoutés :

- `scripts/build-video-intelligence.js`
- `data/video-intelligence.xml`

Commande ajoutée :

- `npm run build:video-intelligence`

Fonctionnement actuel :

- collecte les vidéos depuis `data/library.xml` et `data/resources.xml` ;
- récupère le titre public disponible via YouTube oEmbed quand l'accès réseau le permet ;
- analyse le titre, les tags, la catégorie, la playlist et le chemin source ;
- génère un titre propre ;
- génère une description homogène ;
- génère des tags enrichis ;
- déduit un niveau : `Débutant`, `Intermédiaire` ou `Avancé` ;
- déduit un sujet principal : JavaScript, Python, IA, Web design, Business IA, E-commerce, Productivité, UX/UI, Startup, etc.

Intégration application :

- `app.js` charge `data/video-intelligence.xml`.
- Les vidéos de la page `videos.html` utilisent les titres, descriptions, tags, niveaux et sujets enrichis quand ils existent.
- Les ressources vidéo de `files.html` utilisent aussi les titres et descriptions enrichis.

Limite connue :

- YouTube oEmbed ne fournit pas la description complète ni les mots-clés YouTube. Pour analyser les descriptions et tags officiels YouTube, il faudra brancher une clé YouTube Data API ou un backend d'enrichissement.

Tests :

- `npm run check:js` : OK.
- `npm run test:e2e` : OK, 2 tests Playwright passent.

## Intelligence vidéo éditoriale + modèle SQL cible — 09 juin 2026

L'étape suivante recommandée a été réalisée.

Amélioration de l'intelligence vidéo :

- `scripts/build-video-intelligence.js` passe en logique éditoriale par règles pondérées ;
- ajout d'un domaine éditorial : Informatique, Business, E-commerce, Création de contenu, Productivité, Documents ou Apprentissage ;
- ajout d'une intention : Construire, Apprendre, Optimiser, Monétiser, S'inspirer ou Comprendre ;
- ajout d'une confiance : Faible, Moyenne ou Haute ;
- les sujets sont plus précis : IA appliquée, Backend et bases de données, Cloud et DevOps, Cybersécurité, Montage vidéo, Création YouTube, Finance et investissement, etc. ;
- les mots courts `IA`, `AI` et `JS` sont traités comme des tokens pour éviter les faux positifs ;
- les domaines spécialisés passent avant le domaine Business générique pour limiter les classements trop larges.

Intégration application :

- `data/video-intelligence.xml` est régénéré en version `1.1` ;
- `app.js` lit maintenant `domain`, `intent` et `confidence` ;
- la page Vidéos affiche les badges de domaine, sujet et intention ;
- la recherche vidéo inclut aussi ces nouveaux champs.

Préparation SQL :

- ajout de `data/sql-schema.sql` comme cible de migration future ;
- ajout de `docs/sql-data-model.md` pour documenter les tables, les règles de migration XML vers SQL et la limite YouTube Data API ;
- le modèle prépare les tables `categories`, `playlists`, `videos`, `playlist_videos`, `resources`, `video_intelligence`, `tags`, `taggings`, `finance_transactions` et `finance_goals`.

Limite volontaire :

- aucune base de données ni API backend n'a été branchée maintenant. Le site reste compatible GitHub Pages et les fichiers XML restent la source statique actuelle.
- Les tests couvrent l'administration Playlists et l'affichage des métadonnées vidéo enrichies.

Prochaine étape validable : choisir entre un backend d'enrichissement YouTube Data API ou un premier import XML vers SQLite/Supabase en suivant `data/sql-schema.sql`.

## Backend local SQLite + YouTube Data API — 09 juin 2026

La suite recommandée a été lancée avec une version backend minimale locale.

Fichiers ajoutés :

- `scripts/import-xml-to-sqlite.py`
- `scripts/backend-server.py`

Commandes ajoutées :

- `npm run db:import`
- `npm run start:backend`

Fonctionnement :

- `npm run db:import` reconstruit `data/visionhub.sqlite` depuis les XML versionnés ;
- le backend sert le site sur `http://127.0.0.1:5503` ;
- `GET /api/health` expose l'état de la base et les compteurs ;
- `GET /api/videos` expose les vidéos enrichies depuis SQLite ;
- `GET /api/videos/{youtubeId}` expose le détail d'une vidéo ;
- `POST /api/import` relance l'import XML vers SQLite ;
- `POST /api/youtube/enrich` prépare l'enrichissement officiel YouTube Data API.

Résultat de l'import local :

- 6 catégories ;
- 5 playlists ;
- 185 vidéos ;
- 341 ressources ;
- 185 entrées `video_intelligence` ;
- 80 tags.

Limite actuelle :

- aucune clé `YOUTUBE_API_KEY` n'est configurée dans l'environnement. L'endpoint YouTube est prêt, mais il ne peut pas encore récupérer les descriptions/tags officiels sans cette clé.

Déploiement :

- ce backend est local uniquement pour l'instant ;
- le travail n'a pas encore été poussé ou déployé sur GitHub Pages ;
- la version statique GitHub Pages reste compatible, car SQLite et le backend sont optionnels.
