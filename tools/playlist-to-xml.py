#!/usr/bin/env python3
"""
Extrait une playlist YouTube et génère le texte + XML pour Lumen.

Usage:
    python3 tools/playlist-to-xml.py <URL> [options]

Options:
    --id ID           ID slug pour la playlist Lumen (ex: ma-playlist)
    --title TITRE     Titre affiché dans Lumen
    --category CAT    ID de catégorie Lumen (ex: web, ia)
    --level NIVEAU    Niveau : Débutant | Intermédiaire | Avancé
    --exclude ID ...  youtubeIds à ignorer (déjà présents)
"""
import subprocess, sys, re, html, argparse
from datetime import date


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:48] or "video"


def parse_args():
    p = argparse.ArgumentParser(description="Import playlist YouTube → Lumen XML")
    p.add_argument("url", help="URL de la playlist YouTube")
    p.add_argument("--id", dest="playlist_id", default="", help="ID slug de la playlist")
    p.add_argument("--title", default="Playlist importée", help="Titre de la playlist")
    p.add_argument("--category", default="", help="ID de catégorie Lumen")
    p.add_argument("--level", default="Débutant", help="Niveau des vidéos")
    p.add_argument("--exclude", nargs="*", default=[], help="youtubeIds à exclure")
    return p.parse_args()


def fetch_videos(url):
    result = subprocess.run(
        ["yt-dlp", "--flat-playlist", "--print", "%(title)s | %(id)s", url],
        capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    if result.returncode != 0:
        print("Erreur yt-dlp :", result.stderr.strip(), file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip().splitlines()


def parse_lines(lines, exclude):
    exclude_set = set(exclude)
    seen = set()
    videos = []
    skipped = 0
    for line in lines:
        line = line.strip()
        idx = line.rfind(" | ")
        if idx < 0:
            continue
        title = line[:idx].strip()
        yt_id = line[idx + 3:].strip()
        if not yt_id or not title:
            continue
        if yt_id in exclude_set or yt_id in seen:
            skipped += 1
            continue
        seen.add(yt_id)
        videos.append((slug(title) or yt_id, title, yt_id))
    return videos, skipped


def print_text_format(videos):
    print("# ── Texte à coller dans Lumen › Ajout rapide › Import playlist ──")
    for _, title, yt_id in videos:
        print(f"{title} | {yt_id}")
    print()


def print_xml(videos, playlist_id, title, category, level):
    today = date.today().isoformat()
    pid = playlist_id or slug(title) or "playlist-importee"
    print("# ── Bloc XML à insérer dans data/library.xml ──")
    print(f'<playlist id="{pid}" category="{html.escape(category)}" level="{html.escape(level)}" title="{html.escape(title)}" tags="Importée,YouTube">')
    print(f'  <description>Importée depuis YouTube le {today}.</description>')
    for vid_id, vid_title, yt_id in videos:
        print(f'  <video id="{vid_id}" youtubeId="{yt_id}" duration="" level="{html.escape(level)}" title="{html.escape(vid_title)}" tags="">')
        print(f'    <description></description>')
        print(f'  </video>')
    print("</playlist>")


def main():
    args = parse_args()
    print(f"Extraction de : {args.url}", file=sys.stderr)
    lines = fetch_videos(args.url)
    videos, skipped = parse_lines(lines, args.exclude)

    print_text_format(videos)
    print_xml(videos, args.playlist_id, args.title, args.category, args.level)

    print(f"\n# {len(videos)} vidéo(s) exportée(s), {skipped} doublon(s) ignoré(s)", file=sys.stderr)


if __name__ == "__main__":
    main()
