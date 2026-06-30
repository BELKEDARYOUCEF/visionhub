# Import de playlist YouTube → Lumen

Workflow en deux étapes : extraction locale via `yt-dlp`, puis collage dans l'app.

---

## 1. Installer yt-dlp

```bash
# pip (recommandé)
pip install yt-dlp

# pipx (isolation)
pipx install yt-dlp

# macOS Homebrew
brew install yt-dlp

# Windows — télécharger l'exécutable
# https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
```

---

## 2. Extraire une playlist

```bash
python3 tools/playlist-to-xml.py "https://www.youtube.com/playlist?list=PLxxxxxxx" \
  --title "Nom de ma playlist" \
  --category web \
  --level Intermédiaire
```

### Options disponibles

| Option | Défaut | Exemple |
|---|---|---|
| `--title` | `Playlist importée` | `"CSS Grid Mastery"` |
| `--id` | slug du titre | `css-grid` |
| `--category` | _(vide)_ | `web`, `ia`, `design` |
| `--level` | `Débutant` | `Intermédiaire`, `Avancé` |
| `--exclude` | _(vide)_ | liste de youtubeIds à ignorer |

---

## 3. Résultat du script

Le script affiche **deux blocs** :

### Bloc 1 — Texte à coller dans Lumen
```
# ── Texte à coller dans Lumen › Ajout rapide › Import playlist ──
Titre de la vidéo 1 | dQw4w9WgXcQ
Titre de la vidéo 2 | xxxxxxxxxxx
...
```

→ Copier ces lignes (`titre | youtubeId`) et les coller dans le champ **Import playlist** de la barre droite sur `videos.html`. L'app ajoute automatiquement les vidéos à la playlist choisie, sans doublon.

### Bloc 2 — XML complet (optionnel)
```xml
<playlist id="ma-playlist" ...>
  <video id="titre-video-1" youtubeId="dQw4w9WgXcQ" .../>
  ...
</playlist>
```

→ À coller directement dans `data/library.xml` si vous préférez éditer le fichier source.

---

## 4. Exclure les vidéos déjà présentes

```bash
python3 tools/playlist-to-xml.py "URL" \
  --exclude dQw4w9WgXcQ abc123def456
```

---

## Notes

- Le script ne contacte pas l'API YouTube — il utilise `yt-dlp` en mode `--flat-playlist` (rapide, sans téléchargement).
- Les titres des vidéos privées ou supprimées sont remplacés par `[Private video]` ou `[Deleted video]` — ils sont inclus mais sans titre utile.
- Après le collage dans l'app, exportez un nouveau `library.xml` (bouton **Exporter XML**) et committez pour rendre les changements permanents.
