#!/usr/bin/env python3
import os
import re
import sqlite3
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DB_PATH = Path(os.environ.get("VISIONHUB_DB", DATA / "visionhub.sqlite"))
SCHEMA_PATH = DATA / "sql-schema.sql"


def main():
    if not SCHEMA_PATH.exists():
        raise SystemExit(f"Missing schema: {SCHEMA_PATH}")

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("pragma foreign_keys = on")
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))

    context = {"video_ids": {}}
    import_library(conn, context)
    import_resources(conn, context)
    import_video_intelligence(conn, context)
    import_finance(conn)

    conn.commit()
    counts = {
        "categories": count(conn, "categories"),
        "playlists": count(conn, "playlists"),
        "videos": count(conn, "videos"),
        "resources": count(conn, "resources"),
        "video_intelligence": count(conn, "video_intelligence"),
        "tags": count(conn, "tags"),
    }
    conn.close()
    print(f"Imported XML into {DB_PATH}")
    print(counts)


def import_library(conn, context):
    doc = parse_xml(DATA / "library.xml")
    if doc is None:
        return

    for index, node in enumerate(doc.findall("./categories/category")):
        category_id = attr(node, "id")
        if not category_id:
            continue
        conn.execute(
            """
            insert into categories (id, title, icon, color, description, sort_order)
            values (?, ?, ?, ?, ?, ?)
            on conflict(id) do update set
              title=excluded.title,
              icon=excluded.icon,
              color=excluded.color,
              description=excluded.description,
              sort_order=excluded.sort_order
            """,
            (
                category_id,
                attr(node, "title") or category_id,
                attr(node, "icon"),
                attr(node, "color"),
                clean_text(node.text),
                index,
            ),
        )
        tag_entity(conn, "category", category_id, split_tags(attr(node, "tags")))

    for playlist_index, node in enumerate(doc.findall("./playlists/playlist")):
        playlist_id = attr(node, "id")
        category_id = attr(node, "category")
        if not playlist_id or not category_id:
            continue
        ensure_category(conn, category_id)
        conn.execute(
            """
            insert into playlists (id, category_id, title, description, level, sort_order)
            values (?, ?, ?, ?, ?, ?)
            on conflict(id) do update set
              category_id=excluded.category_id,
              title=excluded.title,
              description=excluded.description,
              level=excluded.level,
              sort_order=excluded.sort_order
            """,
            (
                playlist_id,
                category_id,
                attr(node, "title") or playlist_id,
                child_text(node, "description"),
                attr(node, "level") or "Débutant",
                playlist_index,
            ),
        )
        tag_entity(conn, "playlist", playlist_id, split_tags(attr(node, "tags")))

        for video_index, video in enumerate(node.findall("video")):
            youtube_id = attr(video, "youtubeId")
            if not youtube_id:
                continue
            video_id = attr(video, "id") or f"yt-{slug(youtube_id)}"
            upsert_video(
                conn,
                context,
                video_id=video_id,
                youtube_id=youtube_id,
                title=attr(video, "title") or youtube_id,
                description=child_text(video, "description"),
                duration=attr(video, "duration"),
                level=attr(video, "level") or attr(node, "level") or "Débutant",
            )
            conn.execute(
                """
                insert into playlist_videos (playlist_id, video_id, sort_order)
                values (?, ?, ?)
                on conflict(playlist_id, video_id) do update set sort_order=excluded.sort_order
                """,
                (playlist_id, context["video_ids"][youtube_id], video_index),
            )
            tag_entity(conn, "video", context["video_ids"][youtube_id], split_tags(attr(video, "tags")))


def import_resources(conn, context):
    doc = parse_xml(DATA / "resources.xml")
    if doc is None:
        return

    for folder_index, folder in enumerate(doc.findall(".//folder")):
        folder_id = attr(folder, "id")
        if not folder_id:
            continue
        conn.execute(
            """
            insert into resource_folders (id, title, icon, status, description, sort_order)
            values (?, ?, ?, ?, ?, ?)
            on conflict(id) do update set
              title=excluded.title,
              icon=excluded.icon,
              status=excluded.status,
              description=excluded.description,
              sort_order=excluded.sort_order
            """,
            (
                folder_id,
                attr(folder, "title") or folder_id,
                attr(folder, "icon"),
                attr(folder, "status") or "Importé",
                child_text(folder, "description"),
                folder_index,
            ),
        )
        tag_entity(conn, "resource_folder", folder_id, split_tags(attr(folder, "tags")))

        for item in folder.findall("item"):
            item_id = attr(item, "id")
            if not item_id:
                continue
            youtube_id = attr(item, "youtubeId")
            video_id = None
            if youtube_id:
                upsert_video(
                    conn,
                    context,
                    video_id=f"yt-{slug(youtube_id)}",
                    youtube_id=youtube_id,
                    title=attr(item, "title") or youtube_id,
                    description=clean_text(item.text),
                    duration="",
                    level="Débutant",
                )
                video_id = context["video_ids"][youtube_id]
            conn.execute(
                """
                insert into resources (id, folder_id, video_id, title, type, status, url, source_path, note)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(id) do update set
                  folder_id=excluded.folder_id,
                  video_id=excluded.video_id,
                  title=excluded.title,
                  type=excluded.type,
                  status=excluded.status,
                  url=excluded.url,
                  source_path=excluded.source_path,
                  note=excluded.note
                """,
                (
                    item_id,
                    folder_id,
                    video_id,
                    attr(item, "title") or item_id,
                    attr(item, "type") or "note",
                    attr(item, "status") or "Catalogué",
                    attr(item, "url"),
                    attr(item, "source"),
                    clean_text(item.text),
                ),
            )
            tag_entity(conn, "resource", item_id, split_tags(attr(item, "tags")))


def import_video_intelligence(conn, context):
    doc = parse_xml(DATA / "video-intelligence.xml")
    if doc is None:
        return

    for item in doc.findall(".//video"):
        youtube_id = attr(item, "youtubeId")
        if not youtube_id:
            continue
        if youtube_id not in context["video_ids"]:
            upsert_video(
                conn,
                context,
                video_id=f"yt-{slug(youtube_id)}",
                youtube_id=youtube_id,
                title=attr(item, "title") or attr(item, "originalTitle") or youtube_id,
                description=child_text(item, "description"),
                duration="",
                level=attr(item, "level") or "Débutant",
            )
        video_id = context["video_ids"][youtube_id]
        conn.execute(
            """
            insert into video_intelligence (
              video_id, domain, topic, intent, level, confidence,
              generated_title, generated_description, source
            )
            values (?, ?, ?, ?, ?, ?, ?, ?, ?)
            on conflict(video_id) do update set
              domain=excluded.domain,
              topic=excluded.topic,
              intent=excluded.intent,
              level=excluded.level,
              confidence=excluded.confidence,
              generated_title=excluded.generated_title,
              generated_description=excluded.generated_description,
              source=excluded.source,
              generated_at=current_timestamp
            """,
            (
                video_id,
                attr(item, "domain"),
                attr(item, "topic"),
                attr(item, "intent"),
                attr(item, "level"),
                attr(item, "confidence"),
                attr(item, "title"),
                child_text(item, "description"),
                attr(doc, "source") or "oEmbed + contexte VisionHub + règles éditoriales",
            ),
        )
        tag_entity(conn, "video", video_id, split_tags(attr(item, "tags")))


def import_finance(conn):
    doc = parse_xml(DATA / "finance.xml")
    if doc is None:
        return

    for item in doc.findall(".//transaction"):
        tx_id = attr(item, "id")
        if not tx_id:
            continue
        conn.execute(
            """
            insert into finance_transactions (id, type, title, category, amount, date, note)
            values (?, ?, ?, ?, ?, ?, ?)
            on conflict(id) do update set
              type=excluded.type,
              title=excluded.title,
              category=excluded.category,
              amount=excluded.amount,
              date=excluded.date,
              note=excluded.note
            """,
            (
                tx_id,
                attr(item, "type") or "expense",
                attr(item, "title") or tx_id,
                attr(item, "category") or "Général",
                float(attr(item, "amount") or 0),
                attr(item, "date"),
                clean_text(item.text),
            ),
        )

    for item in doc.findall(".//goal"):
        goal_id = attr(item, "id")
        if not goal_id:
            continue
        conn.execute(
            """
            insert into finance_goals (id, title, category, target, current, deadline)
            values (?, ?, ?, ?, ?, ?)
            on conflict(id) do update set
              title=excluded.title,
              category=excluded.category,
              target=excluded.target,
              current=excluded.current,
              deadline=excluded.deadline
            """,
            (
                goal_id,
                attr(item, "title") or goal_id,
                attr(item, "category") or "Objectif",
                float(attr(item, "target") or 0),
                float(attr(item, "current") or 0),
                attr(item, "deadline"),
            ),
        )


def upsert_video(conn, context, video_id, youtube_id, title, description, duration, level):
    existing = context["video_ids"].get(youtube_id) or fetch_video_id(conn, youtube_id)
    final_id = existing or unique_id(conn, video_id)
    conn.execute(
        """
        insert into videos (id, youtube_id, original_title, title, description, duration, level)
        values (?, ?, ?, ?, ?, ?, ?)
        on conflict(youtube_id) do update set
          original_title=coalesce(videos.original_title, excluded.original_title),
          title=coalesce(nullif(videos.title, ''), excluded.title),
          description=coalesce(nullif(videos.description, ''), excluded.description),
          duration=coalesce(nullif(videos.duration, ''), excluded.duration),
          level=coalesce(nullif(videos.level, ''), excluded.level),
          updated_at=current_timestamp
        """,
        (final_id, youtube_id, title, title, description or "", duration or "", level or "Débutant"),
    )
    context["video_ids"][youtube_id] = fetch_video_id(conn, youtube_id)


def tag_entity(conn, entity_type, entity_id, tags):
    for tag_name in tags:
        tag_id = slug(tag_name)
        if not tag_id:
            continue
        conn.execute(
            "insert into tags (id, name) values (?, ?) on conflict(id) do update set name=excluded.name",
            (tag_id, tag_name),
        )
        conn.execute(
            """
            insert into taggings (tag_id, entity_type, entity_id)
            values (?, ?, ?)
            on conflict(tag_id, entity_type, entity_id) do nothing
            """,
            (tag_id, entity_type, entity_id),
        )


def ensure_category(conn, category_id):
    conn.execute(
        "insert into categories (id, title) values (?, ?) on conflict(id) do nothing",
        (category_id, category_id),
    )


def fetch_video_id(conn, youtube_id):
    row = conn.execute("select id from videos where youtube_id = ?", (youtube_id,)).fetchone()
    return row["id"] if row else None


def unique_id(conn, candidate):
    base = slug(candidate) or "item"
    value = base
    index = 2
    while conn.execute("select 1 from videos where id = ?", (value,)).fetchone():
        value = f"{base}-{index}"
        index += 1
    return value


def count(conn, table):
    return conn.execute(f"select count(*) as total from {table}").fetchone()["total"]


def parse_xml(path):
    if not path.exists():
        return None
    try:
        return ET.parse(path).getroot()
    except ET.ParseError as error:
        raise SystemExit(f"Invalid XML in {path}: {error}") from error


def attr(node, name):
    return (node.get(name) or "").strip()


def child_text(node, tag):
    child = node.find(tag)
    return clean_text(child.text if child is not None else "")


def clean_text(value):
    return re.sub(r"\s+", " ", value or "").strip()


def split_tags(value):
    return [tag.strip() for tag in (value or "").split(",") if tag.strip()]


def slug(value):
    text = (value or "").strip().lower()
    text = re.sub(r"[^a-z0-9_-]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:96]


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Import failed: {error}", file=sys.stderr)
        raise
