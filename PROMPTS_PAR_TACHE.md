# VisionHub — Prompts par tâche

## Prompt 1 — Stabilisation vidéo YouTube

Tu es un expert senior front-end vanilla spécialisé en debugging YouTube iframe, GitHub Pages et erreurs lecteur.

Objectif : corriger définitivement le lecteur vidéo.

Contraintes :

- ne pas charger automatiquement l'iframe si le site est ouvert en `file://` ;
- afficher une miniature avant chargement ;
- charger l'iframe seulement au clic ;
- ajouter `referrerpolicy="strict-origin-when-cross-origin"` ;
- ajouter `<meta name="referrer" content="strict-origin-when-cross-origin">` ;
- ajouter `origin=` uniquement si `window.location.origin` commence par `http` ;
- ajouter un bouton “Ouvrir sur YouTube” ;
- afficher un message clair si la vidéo ne peut pas être intégrée ;
- tester en `http://127.0.0.1:5502` et GitHub Pages.

Fichiers : `videos.html`, `app.js`, `README.md`, `SUIVI_PROJET.md`.

Critères d'acceptation :

- pas d'écran Error 153 en ouverture directe ;
- la vidéo se charge en HTTP après clic ;
- le changement de vidéo change le titre, la miniature, l'état actif et l'iframe ;
- `npm run check:js` passe.

## Prompt 2 — Base XML interne

Tu es un architecte front-end spécialisé en applications statiques versionnables.

Objectif : déplacer les données de vidéos depuis le JS vers `data/library.xml`.

Contraintes :

- charger XML avec `fetch` ;
- parser avec `DOMParser` ;
- prévoir fallback si XML indisponible ;
- créer une structure claire : categories, playlists, videos ;
- documenter comment modifier XML ;
- ne pas casser GitHub Pages.

Fichiers : `data/library.xml`, `app.js`, `README.md`.

Critères d'acceptation :

- playlists affichées depuis XML ;
- vidéos affichées depuis XML ;
- tags, catégories, niveaux et descriptions fonctionnent ;
- fallback propre si XML non chargé.

## Prompt 3 — Studio local + export XML

Tu es un expert UX/product et front-end vanilla.

Objectif : créer un studio local pour ajouter des playlists et vidéos.

Contraintes :

- sauvegarder les ajouts dans `localStorage` ;
- générer un XML exportable ;
- expliquer que GitHub Pages ne peut pas écrire directement dans le XML ;
- ajouter validation ID YouTube ;
- prévoir reset local.

Fichiers : `studio.html`, `app.js`, `styles.css`, `README.md`.

Critères d'acceptation :

- ajouter playlist ;
- ajouter vidéo ;
- voir la vidéo dans le lecteur ;
- exporter XML complet.

## Prompt 4 — File OS

Tu es un designer produit senior inspiré par Drive, Mega et Notion.

Objectif : créer une page d'organisation de fichiers professionnelle.

Contraintes :

- dossiers ;
- fichiers ;
- ressources ;
- tags ;
- statuts ;
- recherche ;
- vues grille/liste ;
- design premium ;
- structure XML ou JSON versionnable.

Fichiers : `files.html`, `data/workspace.xml`, `app.js`, `styles.css`.

Critères d'acceptation :

- créer/afficher des dossiers ;
- filtrer/rechercher ;
- interface responsive ;
- état vide propre.

## Prompt 5 — Finance Cockpit

Tu es un expert front-end et business dashboard inspiré par Odoo, Base44 et dashboards SaaS.

Objectif : créer une page finance simple mais professionnelle.

Contraintes :

- revenus ;
- dépenses ;
- budget ;
- objectifs ;
- catégories ;
- export CSV/XML ;
- pas de fausse promesse de comptabilité officielle.

Fichiers : `finance.html`, `data/finance.xml`, `app.js`, `styles.css`.

Critères d'acceptation :

- dashboard clair ;
- formulaires simples ;
- données persistantes localStorage ;
- export possible.

## Prompt 6 — Tests qualité

Tu es un QA engineer front-end.

Objectif : ajouter des tests Playwright.

Tests obligatoires :

- chaque page charge ;
- menu mobile fonctionne ;
- playlists filtrables ;
- recherche fonctionne ;
- lecteur vidéo change au clic ;
- en `file://`, l'iframe n'est pas injectée ;
- en HTTP, l'iframe contient `youtube.com/embed`, `enablejsapi=1`, `origin=` et `referrerpolicy` ;
- localStorage favoris/studio persiste.

Fichiers : `package.json`, `playwright.config.js`, `tests/visionhub.spec.js`.

Critères d'acceptation :

- `npm run check:js` passe ;
- `npm test` passe ;
- aucune erreur console critique.
