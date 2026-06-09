# Modèle SQL cible VisionHub

Ce document prépare la migration future vers un backend sans changer le fonctionnement actuel en GitHub Pages. Aujourd'hui, les fichiers XML restent la source statique servie au navigateur. Demain, ces mêmes entités peuvent être persistées dans SQLite, Supabase ou PostgreSQL avec le schéma `data/sql-schema.sql`.

## Entités principales

- `categories` : domaines de la bibliothèque vidéo.
- `playlists` : collections éditoriales rattachées à une catégorie.
- `videos` : identité vidéo unique, basée sur `youtube_id`.
- `playlist_videos` : ordre des vidéos dans chaque playlist.
- `resource_folders` et `resources` : File OS, liens externes, fichiers locaux et vidéos importées.
- `video_intelligence` : sortie enrichie du moteur éditorial, séparée des métadonnées brutes.
- `youtube_metadata` : métadonnées officielles récupérées via YouTube Data API quand une clé backend est disponible.
- `tags` et `taggings` : tags réutilisables sur catégories, playlists, vidéos et ressources.
- `finance_transactions` et `finance_goals` : base du cockpit finance.

## Règles de migration

- `data/library.xml` alimente `categories`, `playlists`, `videos`, `playlist_videos` et les tags.
- `data/resources.xml` alimente `resource_folders`, `resources` et complète `videos` quand un `youtubeId` existe.
- `data/video-intelligence.xml` alimente `video_intelligence` et ne doit pas écraser les titres manuels sans validation.
- Les IDs XML actuels sont conservés comme clés métier quand ils existent.
- `youtube_id` reste unique pour éviter les doublons entre bibliothèque et ressources.

## Backend local

Le backend minimal est dans `scripts/backend-server.py`. Il utilise uniquement la bibliothèque standard Python :

- `sqlite3` pour la base locale ;
- `http.server` pour servir le site et l'API ;
- `urllib` pour appeler YouTube Data API quand `YOUTUBE_API_KEY` existe.

Commandes :

```bash
npm run db:import
npm run start:backend
```

Endpoints :

- `GET /api/health` : état de la base, compteurs et présence de la clé YouTube.
- `GET /api/videos?limit=50` : liste des vidéos enrichies depuis SQLite.
- `GET /api/videos/{youtubeId}` : détail d'une vidéo.
- `POST /api/import` : reconstruit `data/visionhub.sqlite` depuis les XML.
- `POST /api/youtube/enrich` : récupère les métadonnées officielles YouTube pour un `youtubeId`.

## Limite YouTube actuelle

YouTube oEmbed fournit surtout le titre public. Il ne fournit pas la description complète ni les mots-clés officiels. Pour remplir des champs avancés plus tard, il faudra ajouter un backend avec YouTube Data API, stocker les réponses brutes, puis régénérer `video_intelligence`.
