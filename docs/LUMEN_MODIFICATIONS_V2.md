# Lumen — Modifications v2 (à donner à Claude Code)

> **Pour Claude Code.** Ce document décrit une série d'améliorations sur le projet Lumen, basées sur le code réel de la branche `lumen/A3-home-animated`.
> **Règles inchangées :** une seule tâche à la fois ; tester ; commit sur une branche dédiée (préfixe `lumen/v2-…`) ; ne pas merger sur `main` sans validation ; rester statique GitHub Pages ; fonctionner hors-ligne ; ne jamais supprimer les données XML ; déduplication par `youtubeId` ; localStorage + export XML.
> Avant de commencer, fais un résumé en 5 lignes de ce que tu as compris et attends la validation. Ne code rien encore.

---

## Contexte des changements demandés

L'utilisateur a testé le travail A1–A5 en local. Le design plaît globalement, mais plusieurs points doivent changer. Les deux plus importants :

1. **Cohérence des pages.** Aujourd'hui, la page Vidéos a une mise en page « 3 colonnes » (sidebar gauche + grille centrale + barre playlists droite), mais les autres pages (Accueil, Playlists, Fichiers, Finance, À propos) ont des mises en page différentes. L'utilisateur veut **la même architecture sur toutes les pages** : la même coquille (sidebar + zone centrale + barre droite dynamique), seul le contenu central change d'une page à l'autre. Il ne veut pas que chaque page « réinvente » sa structure.

2. **La playlist devient l'élément central, la catégorie devient secondaire.** Actuellement le code impose partout la hiérarchie `Catégorie > Playlist > Vidéos` (voir `renderAdminDrawer`, `renderHierarchy`, les sélecteurs de catégorie obligatoires, les filtres). L'utilisateur n'aime pas devoir choisir une catégorie en premier. Il veut que **les playlists soient au premier plan**, et que **la catégorie devienne une simple étiquette/description optionnelle** sur la playlist — pas un niveau de regroupement obligatoire.

---

## TÂCHE V2-1 — Coquille de page partagée (même architecture partout)

**But :** extraire la structure de la page Vidéos (sidebar gauche + main central + barre droite) en une **coquille réutilisable**, appliquée à toutes les pages.

**À faire :**
- Créer une fonction unique (ex. `renderShell({active, title, subtitle, centerHtml, rightHtml})`) qui produit : la `aside.vd-side` (navigation gauche, identique partout, avec le logo), la `main.vd-main` (barre de titre + contenu central injecté), et la `aside.vd-right` (barre droite).
- Réécrire `renderHome`, `renderVideosPage`, `renderPlaylistsPage`, `renderFilesPage`, `renderFinancePage`, `renderAboutPage` pour qu'elles **utilisent toutes cette coquille** et ne fournissent que leur contenu central + le contenu de la barre droite.
- La **barre de droite** est dynamique selon la page :
  - Sur Vidéos et Playlists : la liste des playlists avec glisser-déposer (déjà existant sur Vidéos — le généraliser).
  - Sur les autres pages : un contenu pertinent (raccourcis, actions) ou la même barre playlists si utile.
- Le **logo Lumen** (fichier `brand/lumen-logo-glass.svg` ou `lumen-icon-glass.svg`) doit apparaître dans la sidebar de **toutes** les pages, et le favicon dans toutes les pages. Remplacer l'icône `ti-sparkles` actuelle par le vrai logo.
- La page d'accueil garde son hero animé, mais à l'intérieur de la coquille (ou en pleine largeur si plus naturel pour le hero — à décider, mais la navigation et le logo doivent rester cohérents).

**Tester :** naviguer entre toutes les pages → la sidebar, le logo et la barre droite restent identiques ; seule la zone centrale change. Aucune page ne « casse » sa structure.

**Commit :** `Lumen v2: coquille de page partagée + logo sur toutes les pages`

---

## TÂCHE V2-2 — Playlist au centre, catégorie en étiquette

**But :** inverser la hiérarchie dans l'expérience : la playlist devient l'unité principale ; la catégorie devient une étiquette optionnelle.

**À faire :**
- **Modèle de données :** garder le champ `category` sur la playlist, mais le rendre **facultatif** (une playlist sans catégorie est valide). Ne plus jamais bloquer la création d'une playlist faute de catégorie.
- **Affichage :** partout où le code regroupe d'abord par catégorie (`renderHierarchy`, listes admin, filtres), réorganiser pour **lister les playlists directement**. La catégorie, si présente, s'affiche comme un petit badge/étiquette sur la carte de playlist (ex. « Dév Web »), pas comme un titre de section.
- **Filtres :** garder un filtre par catégorie *optionnel* (pour ceux qui veulent), mais la vue par défaut liste les playlists sans imposer de choisir une catégorie d'abord.
- **Hiérarchie admin :** remplacer l'arbre `Catégorie > Playlist > Vidéos` par une liste `Playlist > Vidéos`, avec la catégorie en étiquette éditable sur chaque playlist.
- Ne casser aucune donnée existante : les playlists qui ont déjà une catégorie la gardent comme étiquette.

**Tester :** créer une playlist **sans** choisir de catégorie → ça marche. Les playlists s'affichent directement. La catégorie apparaît comme badge optionnel. L'export XML reste valide.

**Commit :** `Lumen v2: playlist au centre, catégorie en étiquette optionnelle`

---

## TÂCHE V2-3 — Administration plus rapide et dynamique

**But :** rendre l'ajout de catégories/playlists/vidéos beaucoup plus fluide. L'utilisateur trouve l'admin actuelle peu optimale.

**À faire :**
- **Ajout rapide de playlist :** un champ unique « Nom de la playlist » + un bouton « + Créer », visible directement dans la barre droite (pas besoin d'ouvrir un grand panneau). Catégorie optionnelle via un petit menu « étiquette » à côté.
- **Ajout rapide de vidéo :** coller un lien YouTube → le système extrait l'`youtubeId`, pré-remplit le titre si possible, et l'ajoute à la playlist sélectionnée en un clic. Anti-doublon par `youtubeId`.
- **Glisser-déposer** déjà présent sur Vidéos : s'assurer qu'il marche aussi pour réordonner et déplacer dans l'admin.
- **Retour visuel** clair : toast de confirmation, compteur qui s'incrémente, état vide soigné.
- Garder le panneau d'administration complet pour les actions avancées (fusion, suppression, réordonnancement), mais sortir les actions fréquentes (créer playlist, ajouter vidéo) en accès rapide.

**Tester :** créer une playlist en 2 clics ; ajouter une vidéo en collant un lien ; vérifier l'anti-doublon ; export XML correct.

**Commit :** `Lumen v2: administration rapide (ajout playlist + vidéo par lien)`

---

## TÂCHE V2-4 — Page Fichiers repensée (vrais fichiers)

**But :** la page Fichiers ne doit plus afficher seulement des noms/emplacements, mais permettre de **garder de vrais fichiers**.

**Contrainte importante :** GitHub Pages est statique et ne peut pas stocker des fichiers uploadés côté serveur. Donc deux options, à présenter à l'utilisateur dans l'implémentation :
- **Option A (locale, simple) :** les fichiers sont rangés dans un dossier du projet (ex. `data/files/`) et la page les liste avec un vrai lien d'ouverture/téléchargement. L'utilisateur dépose ses fichiers dans ce dossier et commit. Simple, robuste, hors-ligne.
- **Option B (cloud, plus tard) :** stockage des fichiers via Supabase Storage (Phase C). À ne pas faire maintenant.

**À faire (Option A) :**
- Lister les fichiers réellement présents dans `data/files/` (ou un manifeste `data/files.xml` listant chemin + type + titre).
- Pour chaque fichier : icône selon le type (pdf, image, doc, vidéo locale…), nom, taille si dispo, bouton **Ouvrir** et **Télécharger** qui pointent vers le vrai fichier.
- Filtres par type. Garder la distinction vidéos / liens / documents / notes.
- Glisser-déposer d'un fichier dans la page = l'ajouter au manifeste (avec instruction claire que le fichier doit être commité dans `data/files/`).

**Tester :** déposer un PDF de test dans `data/files/`, l'ajouter au manifeste → il apparaît, s'ouvre et se télécharge réellement.

**Commit :** `Lumen v2: page Fichiers avec vrais fichiers (data/files)`

---

## TÂCHE V2-5 — Import de playlist YouTube (lien → vidéos en XML)

**But :** coller le lien d'une playlist YouTube et générer automatiquement les entrées XML (titre + youtubeId + description) dans la bibliothèque.

**Contrainte :** l'extraction réelle des vidéos d'une playlist nécessite soit l'API YouTube, soit un outil comme `yt-dlp` — qui **ne tournent pas dans une page GitHub Pages statique**. Donc l'architecture est en deux temps :

**Partie 1 — Script local d'extraction (hors navigateur).**
- Créer un script utilitaire dans le dépôt, ex. `tools/import-playlist.md` + `tools/playlist-to-xml.py`, qui :
  - utilise `yt-dlp` pour extraire titres + URLs d'une playlist (`yt-dlp --flat-playlist --print "%(title)s | %(id)s" "URL"`),
  - transforme la sortie en bloc XML conforme à `data/library.xml` (structure `playlist > video` avec `youtubeId`, `title`, `description`),
  - déduplique par `youtubeId`.
- Documenter l'installation de `yt-dlp` (pipx/brew/exe) et la commande, dans `tools/import-playlist.md`.

**Partie 2 — Coller-importer dans l'app (navigateur).**
- Dans la barre droite ou l'admin : un champ « Coller un lien de playlist ou le texte exporté ».
- Si l'utilisateur colle le **texte exporté** par le script (lignes `titre | id`), l'app le parse et crée les vidéos dans la playlist choisie, avec anti-doublon. (Le navigateur ne contacte pas YouTube, il lit juste le texte collé.)
- Bouton pour exporter ensuite le nouveau `library.xml`.

**Tester :** lancer le script sur une vraie playlist → obtenir le bloc XML ; coller le texte exporté dans l'app → les vidéos apparaissent sans doublon.

**Commit :** `Lumen v2: import de playlist (script yt-dlp + coller-importer)`

---

## TÂCHE V2-6 — Page « À propos » transformée en Tableau de bord / Réglages

**But :** l'utilisateur n'a pas besoin d'une page de présentation (l'app est privée). Transformer « À propos » en page utile.

**À faire :** remplacer le contenu par un **tableau de bord personnel** : statistiques de la bibliothèque (nombre de vidéos, playlists, par statut/étiquette), activité récente, et une zone **Réglages** (import/export XML, vider le cache local, futur réglage cloud). Garder l'entrée de menu mais la renommer « Tableau de bord » ou « Réglages ».

**Tester :** la page affiche des stats réelles calculées depuis l'état ; les actions d'export/réglages fonctionnent.

**Commit :** `Lumen v2: page À propos → tableau de bord / réglages`

---

## TÂCHE V2-7 — Habillage visuel (logo, images, finitions)

**But :** rendre l'ensemble plus beau et fini : vrai logo partout, vraies vignettes, moins de « carrés colorés ».

**À faire :**
- Intégrer le logo verre Lumen dans la sidebar et le favicon (déjà en V2-1, vérifier partout).
- Remplacer les placeholders colorés par les **vraies vignettes YouTube** (`https://i.ytimg.com/vi/<youtubeId>/hqdefault.jpg`) sur toutes les cartes vidéo.
- Hero d'accueil : enrichir le texte (l'utilisateur ne l'aime pas tel quel) — proposer un titre et un sous-titre plus inspirants, et y intégrer le logo verre en grand.
- Soigner les états vides, les survols, les transitions. Respecter `prefers-reduced-motion`.

**Tester :** chaque page a le logo et des vignettes réelles ; aucun carré vide ; cohérence visuelle.

**Commit :** `Lumen v2: habillage visuel (logo, vignettes, hero)`

---

## Ordre conseillé

| # | Tâche | Pourquoi en premier |
|---|---|---|
| V2-1 | Coquille partagée | Base de cohérence, tout en dépend |
| V2-2 | Playlist au centre | Changement structurel majeur |
| V2-3 | Admin rapide | Confort quotidien |
| V2-4 | Page Fichiers | Fonctionnalité manquante |
| V2-5 | Import playlist | Grosse valeur ajoutée |
| V2-6 | Dashboard/Réglages | Nettoyage |
| V2-7 | Habillage visuel | Finition |

**Rappel : une tâche à la fois. Tester. Commit. Rapport. Stop.**
