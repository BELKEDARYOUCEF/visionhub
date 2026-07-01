# Regles de travail pour VisionHub

Ce fichier sert de reference permanente pour les prochaines interventions sur VisionHub.

## Objectif du projet

VisionHub doit rester un site statique compatible GitHub Pages.

Technologies autorisees pour le fonctionnement du site :

- HTML ;
- CSS ;
- JavaScript vanilla ;
- XML ;
- `localStorage` ;
- GitHub Pages.

Ne pas rendre obligatoire :

- backend ;
- SQLite ;
- API YouTube ;
- serveur applicatif ;
- build JavaScript complexe.

## Regles de developpement

- Garder les changements fonctionnels et limites au besoin demande.
- Ne pas refaire le design global sans demande explicite.
- Preferer les patterns deja presents dans `app.js`, `styles.css` et les pages HTML.
- Ne pas supprimer de donnees utilisateur sans demande explicite.
- Preserver les videos et ressources deja presentes dans `data/library.xml` et `data/resources.xml`.
- Eviter les doublons video avec l'ID YouTube comme cle principale.
- Toute modification faite dans l'administration doit rester compatible avec `localStorage` et l'export XML.

## Structure a conserver

Fichiers du site statique :

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
AGENTS.md
```

Fichiers de developpement autorises :

```text
package.json
package-lock.json
playwright.config.js
tests/
```

Ces fichiers servent aux tests et au serveur local. Ils ne doivent pas etre requis pour afficher le site sur GitHub Pages.

## Nettoyage du projet

Ne pas publier et ne pas suivre dans Git :

```text
node_modules/
test-results/
playwright-report/
.env
data/visionhub.sqlite
data/*.sqlite
data/*.sqlite-shm
data/*.sqlite-wal
__pycache__/
*.pyc
```

Si `node_modules/` ou `test-results/` sont recrees pour les tests, les supprimer apres verification locale.

Ne pas reintroduire sans demande explicite :

- ancienne page `studio.html` ;
- backend Python ;
- import SQLite ;
- schema SQL obligatoire ;
- scripts devenus necessaires au fonctionnement du site.

## Donnees video

Regle principale :

```text
Categorie
└── Playlist
    └── Videos
```

`data/library.xml` reste la bibliotheque principale.

`data/resources.xml` reste une source d'import statique. Les videos YouTube valides doivent etre visibles et navigables, mais ne doivent pas creer de doublons si elles existent deja dans `library.xml`.

Les videos importees peuvent etre organisees via l'administration, stockees en `localStorage`, puis exportees en XML.

## Administration

L'administration reste dans `playlists.html`.

Elle doit permettre :

- creer, modifier, supprimer, fusionner et reordonner les categories ;
- creer, modifier, supprimer, deplacer et reordonner les playlists ;
- creer, modifier, retirer, deplacer et reordonner les videos ;
- organiser les videos importees ;
- eviter automatiquement les doublons ;
- exporter un nouveau XML ;
- copier ou telecharger l'export.

Ne pas supposer que GitHub Pages peut ecrire dans `data/library.xml`.

## Tests obligatoires avant de terminer une evolution fonctionnelle

Commandes :

```bash
npm run check:js
npm run test:e2e
```

Pages a verifier en local avec `npm run start` :

```text
http://127.0.0.1:5502/index.html
http://127.0.0.1:5502/videos.html
http://127.0.0.1:5502/playlists.html
http://127.0.0.1:5502/files.html
```

Points a verifier selon la modification :

- chargement des XML ;
- affichage des videos de `library.xml` ;
- affichage des videos importees de `resources.xml` ;
- recherche et filtres ;
- clic video qui change le lecteur ;
- absence de doublons ;
- administration et export XML ;
- fonctionnement sans backend.

## Mise a jour documentaire

Apres une evolution importante :

- mettre a jour `README.md` si l'utilisation change ;
- mettre a jour `SUIVI_PROJET.md` avec la date, les changements et les tests ;
- garder la documentation courte et utile.

## Regle de decision

Si une demande est ambigue, choisir l'option la plus compatible avec GitHub Pages, la plus simple a maintenir, et qui conserve les donnees existantes.
