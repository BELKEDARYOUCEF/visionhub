# Comment lancer le projet dans Claude Code

## Étape 1 — Place ces fichiers dans ton dossier projet
Mets dans le dossier de ton projet (à côté de `index.html`) :
- `LUMEN_CLAUDE_CODE.md`  (le plan complet, ce document principal)
- `lumen-home.html`       (maquette de référence : page d'accueil)
- `lumen-dashboard.html`  (maquette de référence : dashboard vidéos)

## Étape 2 — Premier message à coller dans Claude Code
Copie-colle exactement ceci comme **premier message** :

---
Lis le fichier `LUMEN_CLAUDE_CODE.md` à la racine du projet. C'est le plan complet de mon projet Lumen, découpé en tâches.

Regarde aussi les deux maquettes de référence `lumen-home.html` et `lumen-dashboard.html` (design cible).

Règles : tu fais UNE seule tâche à la fois, dans l'ordre. Tu ne commences jamais la tâche suivante sans que je te le demande. À la fin de chaque tâche : tu testes, tu commits sur une branche dédiée (sans merger), et tu me donnes un court rapport, puis tu t'arrêtes.

Avant de commencer, fais-moi un résumé en 5 lignes de ce que tu as compris du projet et confirme que tu respecteras les règles d'or (GitHub Pages, fonctionne hors-ligne, jamais supprimer les données, dédup par youtubeId, cloud optionnel). Ne code rien encore.

---

## Étape 3 — Lancer les tâches une par une
Quand le résumé te convient, donne la première tâche avec un message simple :

> Fais la TÂCHE A1 décrite dans `LUMEN_CLAUDE_CODE.md`. Rien d'autre.

Puis, après vérification de ton côté :

> Parfait. Fais maintenant la TÂCHE A2. Rien d'autre.

…et ainsi de suite jusqu'à C6.

## Conseils pour un rendu nickel
- Après chaque tâche, ouvre le site en local et teste toi-même avant de dire « passe à la suivante ».
- Si une tâche n'est pas parfaite, ne passe pas à la suite : dis « corrige X dans la tâche actuelle ».
- Ne merge sur `main` que les tâches validées. Garde `main` toujours stable.
- Pour la Phase C (cloud), crée d'abord ton projet Supabase et garde l'URL + la clé anon publique sous la main.
