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

### Tâche 1 — Stabilisation vidéo

Valider le lecteur en local HTTP et sur GitHub Pages. Ajouter des tests Playwright plus tard.

### Tâche 2 — Studio avancé

Ajouter modification/suppression, drag & drop de l'ordre des vidéos, import XML et validation des IDs YouTube.

### Tâche 3 — File OS

Transformer `files.html` en vrai espace : dossiers, notes, liens, tags, recherche, statut, favoris, export.

### Tâche 4 — Finance cockpit

Créer revenus, dépenses, objectifs, graphiques simples et export CSV/XML.

### Tâche 5 — Auth locale puis backend

Ajouter une connexion locale simulée uniquement pour l'expérience utilisateur. Ne pas présenter cela comme une vraie sécurité.

### Tâche 6 — Migration SQL

Quand la version statique est stable, migrer vers SQLite/Supabase/PostgreSQL avec modèles propres.

## Limites connues

- GitHub Pages ne permet pas d'écrire dans les fichiers XML depuis le navigateur.
- Les ajouts Studio sont donc sauvegardés en `localStorage` puis exportés.
- Certaines vidéos YouTube peuvent refuser l'intégration selon les paramètres du propriétaire.
- Les embeds TikTok/Instagram devront être ajoutés dans une tâche séparée après stabilisation YouTube.
