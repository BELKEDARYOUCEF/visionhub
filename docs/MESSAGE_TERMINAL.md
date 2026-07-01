# À partager avec Claude Code (terminal)

## 1. Les fichiers à mettre dans le dossier de ton projet

Place ces fichiers à la racine de ton projet (à côté de `index.html`) :

| Fichier | Rôle |
|---|---|
| `LUMEN_CLAUDE_CODE.md` | **Le plan principal** que Claude Code doit suivre, tâche par tâche |
| `COMMENT_LANCER.md` | Ton guide perso (Claude peut le lire aussi) |
| `lumen-home.html` | Maquette de référence — page d'accueil (design + animations souris) |
| `lumen-dashboard.html` | Maquette de référence — dashboard vidéos (drag-drop) |
| `lumen-logo-glass.svg` | Logo complet (verre chromé) |
| `lumen-icon-glass.svg` | Icône / favicon (verre chromé) |

Le `lumen-preview.html` est optionnel (c'est ta vitrine du projet). Tu peux le mettre aussi, ça ne gêne pas.

---

## 2. Le PREMIER message à taper dans le terminal

Copie-colle exactement ceci :

```
Lis le fichier LUMEN_CLAUDE_CODE.md à la racine du projet. C'est le plan complet de mon projet Lumen, découpé en tâches (Phases A, B, C).

Regarde aussi les maquettes de référence lumen-home.html et lumen-dashboard.html (le design cible, avec les animations à la souris et le glisser-déposer), ainsi que les logos lumen-logo-glass.svg et lumen-icon-glass.svg.

Règles à respecter en permanence :
- Tu fais UNE seule tâche à la fois, dans l'ordre. Tu ne commences jamais la tâche suivante sans que je te le demande explicitement.
- À la fin de chaque tâche : tu testes, tu commits sur une branche dédiée (sans merger sur main), tu me donnes un court rapport (fichiers modifiés, ce qui a été fait, comment tester, problèmes restants), puis tu t'arrêtes.
- Règles d'or : le site doit toujours marcher sur GitHub Pages et hors-ligne ; ne jamais supprimer les données XML ni le localStorage ; dédupliquer les vidéos par youtubeId ; le cloud (Supabase) reste optionnel et ne doit jamais être obligatoire pour afficher la bibliothèque.

Avant de coder quoi que ce soit : fais-moi un résumé en 5 lignes de ce que tu as compris du projet, et confirme que tu respecteras les règles d'or. Ne code rien encore, attends ma validation.
```

---

## 3. Lancer les tâches, une par une

Quand son résumé te convient, lance la première tâche :

```
Fais la TÂCHE A1 décrite dans LUMEN_CLAUDE_CODE.md. Rien d'autre. Teste, commit sur une branche, fais ton rapport, puis arrête-toi.
```

Après avoir vérifié toi-même le résultat :

```
Parfait. Fais maintenant la TÂCHE A2. Rien d'autre.
```

…et ainsi de suite (A3, A4, A5, B1, B2, C1 … jusqu'à C6).

Si une tâche n'est pas parfaite, ne passe pas à la suite :

```
Avant de continuer, corrige ceci dans la tâche actuelle : <ce que tu veux changer>.
```

---

## 4. Rappels pour un rendu nickel
- Teste toi-même dans le navigateur après chaque tâche avant de dire « passe à la suivante ».
- Garde `main` toujours stable : ne merge que les tâches validées.
- Avant la Phase C, crée ton projet Supabase (gratuit) et garde sous la main l'URL du projet + la clé « anon » publique.
