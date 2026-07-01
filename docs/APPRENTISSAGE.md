# Ce que j'ai appris — Lumen v2

Fichier personnel : tout ce que tu devrais comprendre et retenir de ce projet.
Mis à jour le 2026-07-01.

---

## 1. Git — le système de versions

### Ce que c'est
Git enregistre chaque version de ton code dans des **commits**. C'est comme une liste de sauvegardes horodatées.

### Commandes essentielles
```bash
git status              # voir ce qui a changé
git diff                # voir les modifications ligne par ligne
git add fichier.js      # préparer un fichier pour le commit
git commit -m "message" # sauvegarder une version avec un message
git log --oneline       # voir l'historique des commits
git push                # envoyer sur GitHub
```

### Concepts clés
- **Commit** = une sauvegarde du code à un instant précis
- **Branche** = une copie parallèle pour tester sans casser le code principal
- **Main** = la branche principale (celle publiée sur GitHub Pages)
- **Merge** = fusionner une branche dans main → intégrer le travail définitivement
- **Revert** = créer un commit qui annule un autre commit (façon safe de revenir en arrière)

### Revenir en arrière
```bash
git log --oneline                    # trouver l'ID du commit cible
git revert <commit-id>               # annuler un commit (safe)
git show <commit-id>:data/library.xml  # voir un fichier à une date précise
```
**Tu peux toujours revenir en arrière. Git ne supprime jamais l'historique.**

---

## 2. GitHub & GitHub Pages

### GitHub
- Héberge ton code Git en ligne (comme un Google Drive pour le code)
- Permet la collaboration et garde une sauvegarde en ligne
- URL de ton projet : `https://github.com/BELKEDARYOUCEF/visionhub`

### GitHub Pages
- Héberge ton site **gratuitement** depuis le dossier `main`
- **Contrainte majeure : statique uniquement** — pas de serveur, pas de base de données, pas de backend Python/Node
- Ton site : `https://belkedaryoucef.github.io/visionhub/`
- Tout ce qui est dans `main` est automatiquement publié

### Pull Request (PR)
- Une PR = une proposition de changement de branche vers main
- Permet de relire et valider avant d'intégrer
- "Merger une PR" = intégrer définitivement le travail dans main
- Commande : `gh pr merge 1 --merge`

---

## 3. Architecture de Lumen

### Pourquoi statique ?
- GitHub Pages ne peut pas exécuter Python, Node, PHP côté serveur
- Tout doit fonctionner dans le navigateur (HTML + CSS + JavaScript)
- Les données sont stockées dans des fichiers XML

### Structure des fichiers
```
index.html          Page d'accueil
videos.html         Liste des vidéos
playlists.html      Bibliothèque + admin
files.html          Fichiers réels
finance.html        Suivi finances
about.html          Tableau de bord
app.js              TOUTE la logique (2200+ lignes)
styles.css          TOUT le design
data/library.xml    Base de données vidéos/playlists
data/files.xml      Manifeste des vrais fichiers
data/workspace.xml  Notes/fichiers virtuels
data/finance.xml    Données finances
data/files/         Vrais fichiers (PDF, images...)
```

### Comment les données sont stockées
1. **XML** (`data/library.xml`) = source de vérité permanente
2. **localStorage** = modifications temporaires dans le navigateur
3. Pour rendre permanent : exporter via "Exporter XML" → remplacer le fichier → commit → push

---

## 4. JavaScript — concepts utilisés dans Lumen

### Structure de l'app
```javascript
const APP = { /* config globale */ }
const state = { /* données en mémoire */ }

async function init() {
  // chargement de l'app au démarrage
  await loadLibrary()   // charge library.xml
  renderPage()          // affiche la page
  bindPage()            // attache les événements (clics, formulaires)
}
```

### Concepts importants
- **async/await** = attendre qu'une opération (chargement fichier, fetch) se termine avant de continuer
- **fetch()** = récupérer un fichier depuis le serveur (ex: charger library.xml)
- **localStorage** = stocker des données dans le navigateur (persistent entre sessions)
- **DOM manipulation** = modifier le HTML depuis JavaScript (`innerHTML`, `querySelector`)
- **Event listeners** = réagir aux clics, saisies, formulaires
- **Anti-doublon** = vérifier si un ID existe déjà avant d'ajouter

### Exemple : anti-doublon par youtubeId
```javascript
// Avant d'ajouter une vidéo, vérifier qu'elle n'existe pas déjà
const exists = playlist.videos.some(v => v.youtubeId === newVideoId)
if (!exists) {
  playlist.videos.push(newVideo)
}
```

### oEmbed (récupérer le titre d'une vidéo YouTube)
```javascript
const url = `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${id}&format=json`
const res = await fetch(url)
const data = await res.json()
const title = data.title // titre récupéré automatiquement
```

---

## 5. CSS — concepts utilisés

### Variables CSS (custom properties)
```css
:root {
  --color-accent: #7C5CFC;  /* couleur principale */
  --radius: 12px;
}
.element {
  color: var(--color-accent);
}
```

### CSS Grid et Flexbox
- **Grid** = pour les layouts en grille (ex: 4 stat cards côte à côte)
- **Flexbox** = pour aligner des éléments en ligne ou en colonne

### Spécificité CSS — règle importante
Quand deux règles CSS s'appliquent au même élément, **la plus spécifique gagne**.
Si deux règles ont la même spécificité, **celle qui vient en dernier dans le fichier gagne**.

C'est pourquoi l'ordre des règles CSS compte. Exemple du bug qu'on a rencontré :
```css
/* PROBLÈME : .qa-btn venait AVANT .vd-adm-btn */
.qa-btn { width: 34px; }       /* ignoré car vient avant */
.vd-adm-btn { width: 100%; }  /* cette règle gagnait */

/* SOLUTION : mettre .qa-btn APRÈS avec !important */
.vd-adm-btn { width: 100%; }
.qa-btn { width: 34px !important; }  /* gagne maintenant */
```

### prefers-reduced-motion
Respecter les préférences d'accessibilité des utilisateurs qui ont des problèmes avec les animations :
```css
@media (prefers-reduced-motion: reduce) {
  .logo { animation: none; }
}
```

---

## 6. XML — le format de base de données de Lumen

### Structure de library.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<library version="1.0">
  <categories>
    <category id="web" title="Développement Web" color="cyan">...</category>
  </categories>
  <playlists>
    <playlist id="ma-playlist" category="web" level="Débutant" title="Mon titre" tags="Tag1,Tag2">
      <description>Description de la playlist.</description>
      <video id="ma-video" youtubeId="dQw4w9WgXcQ" duration="" level="Débutant" title="Titre vidéo" tags="">
        <description></description>
      </video>
    </playlist>
  </playlists>
</library>
```

### Règles importantes
- Chaque `id` doit être unique dans tout le fichier
- Les caractères spéciaux doivent être échappés : `&` → `&amp;`, `<` → `&lt;`, `"` → `&quot;`
- Un fichier XML invalide fait planter toute l'app → toujours valider après modification

### Valider le XML en Python
```bash
python3 -c "import xml.etree.ElementTree as ET; ET.parse('data/library.xml'); print('OK')"
```

---

## 7. Outils utilisés

### yt-dlp — extraire les infos d'une playlist YouTube
```bash
# Installer
pip install yt-dlp

# Extraire titre et ID de chaque vidéo d'une playlist
yt-dlp --flat-playlist --print "%(title)s | %(id)s" "URL_PLAYLIST"
```
Utilisé dans `tools/playlist-to-xml.py` pour générer le texte à coller dans Lumen.

### Python — script de génération XML
On a utilisé Python pour générer automatiquement 142 entrées XML car les écrire à la main aurait pris des heures. Le principe :
```python
# Définir les données en Python
videos = [("youtubeId", "Titre de la vidéo"), ...]

# Générer le XML
for yt_id, title in videos:
    print(f'<video id="yt-{yt_id}" youtubeId="{yt_id}" title="{title}">')
```

### gh — GitHub CLI (en ligne de commande)
```bash
gh pr create       # créer une Pull Request
gh pr merge 1      # merger la PR #1
gh pr view 1       # voir l'état d'une PR
```

### Playwright — tests automatiques
- Lance un vrai navigateur (Chrome) et vérifie que l'app marche
- Détecte les erreurs console, les pages vides, les boucles infinies
- Commande : `npm run test:e2e`

### Serveur local de développement
```bash
cd ~/Bureau/Lumen
python3 -m http.server 5502
# → ouvrir http://localhost:5502
```
Toujours lancer depuis le dossier du projet, pas depuis n'importe où.

---

## 8. Concepts GitHub / workflow

### Workflow utilisé dans ce projet
```
1. Créer une branche     git checkout -b lumen/ma-feature
2. Coder et tester
3. Commit               git add fichier && git commit -m "message"
4. Push                 git push origin lumen/ma-feature
5. Créer PR             gh pr create
6. Valider / relire
7. Merger               gh pr merge 1 --merge
```

### Pourquoi des branches ?
- Travailler sans risquer de casser `main` (ce qui est en production)
- Pouvoir abandonner des changements sans conséquence
- Permet de comparer avant d'intégrer (code review)

---

## 9. Leçons pratiques retenues

### Erreur npm ENOENT
**Cause :** lancer `npm run start` depuis le mauvais dossier
**Solution :** toujours être dans `~/Bureau/Lumen` avant de lancer npm

### Bug CSS de spécificité
**Cause :** une règle CSS plus large écrasait une règle plus précise car elle venait après dans le fichier
**Solution :** déplacer la règle plus précise APRÈS la règle générale dans le CSS

### Bug couleurs `.db-stat-icon`
**Cause :** les classes `.pc1`, `.pc2`... étaient définies uniquement pour `.vd-pl-ic` et pas pour `.db-stat-icon`
**Solution :** dupliquer les règles de couleur pour le nouveau sélecteur

### localStorage vs XML
- localStorage = rapide mais local au navigateur (disparaît si on vide le cache)
- XML = permanent, sauvegardé dans le repo, visible sur GitHub Pages
- Toujours exporter en XML après des ajouts importants

---

## 10. Ce qu'il reste à apprendre / explorer

- **JavaScript avancé** : Promises, modules ES6, classes
- **CSS avancé** : animations keyframes, variables, container queries
- **Git avancé** : rebase, cherry-pick, git bisect (trouver quel commit a causé un bug)
- **GitHub Actions** : automatiser les tests à chaque push (CI/CD)
- **yt-dlp** : explorer les options pour extraire sous-titres, métadonnées
- **Phase B de Lumen** : connexion Supabase pour le stockage cloud des fichiers
