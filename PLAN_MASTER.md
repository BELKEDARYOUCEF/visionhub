# VisionHub — Plan directeur professionnel

## 1. Vision produit

VisionHub doit devenir un **Personal Operating System modulaire** : une plateforme web premium qui rassemble vidéos, playlists, fichiers, ressources, finances, projets et apprentissage dans une interface cohérente.

La version actuelle doit rester compatible GitHub Pages. Elle doit donc être construite comme une application statique solide, avec une base XML versionnable. Plus tard, la base XML pourra être remplacée par SQLite, Supabase ou PostgreSQL.

## 2. Problème vidéo prioritaire

Le bug actuel n'est pas un simple problème CSS. L'écran YouTube Error 153 signifie que YouTube refuse la configuration du lecteur, souvent car la requête ne contient pas un `Referer` HTTP ou une identification cliente équivalente.

La solution retenue :

1. ne jamais charger l'iframe automatiquement en ouverture directe `file://` ;
2. afficher d'abord une miniature vidéo ;
3. charger l'iframe seulement après clic utilisateur ;
4. en `file://`, afficher un message clair au lieu de l'iframe ;
5. en HTTP/GitHub Pages, générer une iframe avec :
   - `<meta name="referrer" content="strict-origin-when-cross-origin">` ;
   - `referrerpolicy="strict-origin-when-cross-origin"` ;
   - `enablejsapi=1` ;
   - `origin=` quand `window.location.origin` est HTTP/HTTPS ;
   - bouton fallback “Ouvrir sur YouTube”.

## 3. Architecture cible

```text
visionhub/
├── index.html              Accueil premium vivant
├── playlists.html          Bibliothèque de playlists
├── videos.html             Lecteur vidéo dynamique
├── files.html              Organisation fichiers / dossiers
├── resources.html          Base de liens et ressources
├── finance.html            Cockpit finance
├── projects.html           Projets et tâches
├── studio.html             Administration locale
├── about.html              Vision, roadmap, branding
├── styles.css              Design system premium
├── app.js                  Logique front-end vanilla
├── data/
│   ├── library.xml         Playlists, vidéos, catégories
│   ├── workspace.xml       Dossiers, ressources, fichiers
│   └── finance.xml         Données finance de base
├── tests/
│   └── visionhub.spec.js   Tests Playwright
├── README.md
└── SUIVI_PROJET.md
```

## 4. Modules applicatifs

### 4.1 Home / Landing vivante

Inspirations : landing Antigravity, Linear, SaaS premium, pages produit modernes.

Objectif : donner une impression de produit sérieux dès l'ouverture.

Éléments :

- hero impactant ;
- boutons Discord, Instagram, GitHub, YouTube ;
- statistiques animées ;
- aperçu des modules ;
- roadmap ;
- call-to-action vers Studio et Lecteur.

### 4.2 Video Library

Inspirations : YouTube playlists, TikTok collections, Instagram sauvegardes, Skool classroom.

Fonctions :

- playlists dynamiques ;
- catégories ;
- tags ;
- recherche ;
- favoris ;
- lecteur principal unique ;
- progression ;
- learning paths ;
- “à regarder ensuite”.

### 4.3 File OS

Inspirations : Google Drive, Mega, Notion, Finder, Linear docs.

Fonctions :

- dossiers ;
- documents ;
- liens ;
- statuts ;
- tags ;
- recherche ;
- vues grille/liste ;
- favoris ;
- export XML/JSON.

### 4.4 Resources Hub

Fonctions :

- liens utiles ;
- outils ;
- formations ;
- prompts ;
- snippets ;
- notes ;
- classement par domaine.

### 4.5 Finance Cockpit

Inspirations : Odoo, dashboards ERP, Base44 apps, Notion finance dashboards.

Fonctions version 1 :

- revenus ;
- dépenses ;
- catégories ;
- objectifs ;
- résumé mensuel ;
- export.

Fonctions futures :

- factures ;
- clients ;
- projets payants ;
- graphiques ;
- import CSV ;
- migration SQL.

### 4.6 Studio

Le Studio est le centre d'administration local.

Fonctions :

- ajouter playlist ;
- ajouter vidéo ;
- modifier/supprimer ;
- exporter XML ;
- importer XML ;
- réinitialiser localStorage ;
- vérifier les IDs YouTube ;
- préparer la migration backend.

## 5. Stratégie base de données

### Phase actuelle : XML

Avantages :

- lisible ;
- versionnable sur GitHub ;
- simple à modifier ;
- compatible GitHub Pages ;
- bonne étape avant SQL.

Limite :

- GitHub Pages ne peut pas écrire directement dans le XML depuis le navigateur.

Solution :

- lecture depuis `data/library.xml` ;
- ajouts temporaires en `localStorage` ;
- export XML depuis Studio ;
- commit du XML modifié sur GitHub.

### Phase future : SQL

Options :

- SQLite si application locale/desktop ;
- Supabase si app web avec auth ;
- PostgreSQL si version SaaS sérieuse ;
- Firebase si temps réel simple.

## 6. Design system

Style : premium sombre, glassmorphism, gradients subtils, cartes lumineuses, interface large.

Principes :

- largeur desktop 1440–1600px ;
- lecteur vidéo large ;
- navigation claire ;
- cartes séparées ;
- micro-interactions ;
- états vides propres ;
- boutons visibles ;
- responsive mobile propre.

## 7. Phasage recommandé

### Phase 1 — Fondation vidéo + XML

Objectif : stabiliser YouTube, pages séparées, base XML, Studio minimal.

Livrables :

- `videos.html` fonctionnel ;
- `data/library.xml` ;
- `studio.html` ;
- fallback Error 153 ;
- README propre.

### Phase 2 — File OS

Objectif : transformer l'organisation de fichiers en vraie application.

### Phase 3 — Finance Cockpit

Objectif : créer un premier dashboard finance vendable.

### Phase 4 — Studio avancé

Objectif : rendre l'administration fluide.

### Phase 5 — Tests et qualité

Objectif : Playwright, responsive, console errors, accessibilité.

### Phase 6 — Backend / SQL

Objectif : migrer vers une base dynamique réelle.
