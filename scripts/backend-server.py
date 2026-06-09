#!/usr/bin/env python3
import json
import os
import sqlite3
import subprocess
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DB_PATH = Path(os.environ.get("VISIONHUB_DB", DATA / "visionhub.sqlite"))
HOST = os.environ.get("VISIONHUB_HOST", "127.0.0.1")
PORT = int(os.environ.get("VISIONHUB_PORT", "5503"))


class VisionHubHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/health":
            return self.api_health()
        if parsed.path == "/api/videos":
            return self.api_videos(parsed)
        if parsed.path.startswith("/api/videos/"):
            youtube_id = urllib.parse.unquote(parsed.path.rsplit("/", 1)[-1])
            return self.api_video(youtube_id)
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/import":
            return self.api_import()
        if parsed.path == "/api/youtube/enrich":
            return self.api_youtube_enrich()
        return self.json_response({"error": "Not found"}, status=404)

    def api_health(self):
        ensure_db()
        with connect() as conn:
            payload = {
                "ok": True,
                "database": str(DB_PATH),
                "youtubeApiConfigured": bool(os.environ.get("YOUTUBE_API_KEY")),
                "counts": {
                    "videos": count(conn, "videos"),
                    "resources": count(conn, "resources"),
                    "videoIntelligence": count(conn, "video_intelligence"),
                },
            }
        return self.json_response(payload)

    def api_videos(self, parsed):
        ensure_db()
        params = urllib.parse.parse_qs(parsed.query)
        limit = min(int(first(params, "limit", "50")), 200)
        search = first(params, "search", "").strip()
        sql = """
          select
            v.id, v.youtube_id as youtubeId, v.title, v.description, v.duration, v.level,
            vi.domain, vi.topic, vi.intent, vi.confidence,
            ym.channel_title as channelTitle, ym.published_at as publishedAt
          from videos v
          left join video_intelligence vi on vi.video_id = v.id
          left join youtube_metadata ym on ym.video_id = v.id
        """
        args = []
        if search:
            sql += """
              where lower(v.title || ' ' || coalesce(v.description, '') || ' ' || coalesce(vi.topic, '') || ' ' || coalesce(vi.domain, ''))
              like ?
            """
            args.append(f"%{search.lower()}%")
        sql += " order by v.updated_at desc, v.title collate nocase limit ?"
        args.append(limit)
        with connect() as conn:
            rows = [dict(row) for row in conn.execute(sql, args).fetchall()]
        return self.json_response({"items": rows, "total": len(rows)})

    def api_video(self, youtube_id):
        ensure_db()
        with connect() as conn:
            row = conn.execute(
                """
                select
                  v.*, vi.domain, vi.topic, vi.intent, vi.confidence,
                  vi.generated_title as generatedTitle,
                  vi.generated_description as generatedDescription,
                  ym.channel_title as channelTitle,
                  ym.published_at as publishedAt,
                  ym.official_tags as officialTags,
                  ym.duration_iso as durationIso,
                  ym.thumbnail_url as thumbnailUrl,
                  ym.fetched_at as youtubeFetchedAt
                from videos v
                left join video_intelligence vi on vi.video_id = v.id
                left join youtube_metadata ym on ym.video_id = v.id
                where v.youtube_id = ?
                """,
                (youtube_id,),
            ).fetchone()
        if not row:
            return self.json_response({"error": "Video not found"}, status=404)
        return self.json_response(dict(row))

    def api_import(self):
        run_import()
        return self.api_health()

    def api_youtube_enrich(self):
        ensure_db()
        api_key = os.environ.get("YOUTUBE_API_KEY")
        if not api_key:
            return self.json_response(
                {
                    "error": "YOUTUBE_API_KEY is not configured",
                    "nextStep": "Start with YOUTUBE_API_KEY=... npm run start:backend",
                },
                status=503,
            )
        body = self.read_json()
        youtube_id = (body.get("youtubeId") or "").strip()
        if not youtube_id:
            return self.json_response({"error": "youtubeId is required"}, status=400)
        data = fetch_youtube_metadata(api_key, youtube_id)
        if not data:
            return self.json_response({"error": "No YouTube item returned"}, status=404)
        saved = save_youtube_metadata(youtube_id, data)
        return self.json_response(saved)

    def read_json(self):
        size = int(self.headers.get("content-length") or 0)
        if size <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(size).decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def json_response(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)


def ensure_db():
    if not DB_PATH.exists():
        run_import()


def run_import():
    subprocess.run(
        ["python3", str(ROOT / "scripts" / "import-xml-to-sqlite.py")],
        cwd=str(ROOT),
        check=True,
    )


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("pragma foreign_keys = on")
    return conn


def fetch_youtube_metadata(api_key, youtube_id):
    params = urllib.parse.urlencode(
        {
            "part": "snippet,contentDetails",
            "id": youtube_id,
            "key": api_key,
        }
    )
    url = f"https://www.googleapis.com/youtube/v3/videos?{params}"
    with urllib.request.urlopen(url, timeout=15) as response:
        payload = json.loads(response.read().decode("utf-8"))
    items = payload.get("items") or []
    return items[0] if items else None


def save_youtube_metadata(youtube_id, item):
    snippet = item.get("snippet") or {}
    content = item.get("contentDetails") or {}
    thumbnails = snippet.get("thumbnails") or {}
    thumbnail = (thumbnails.get("maxres") or thumbnails.get("high") or thumbnails.get("medium") or {}).get("url", "")
    official_tags = ",".join(snippet.get("tags") or [])
    title = snippet.get("title") or youtube_id
    description = snippet.get("description") or ""
    duration = content.get("duration") or ""

    with connect() as conn:
        row = conn.execute("select id from videos where youtube_id = ?", (youtube_id,)).fetchone()
        video_id = row["id"] if row else f"yt-{slug(youtube_id)}"
        conn.execute(
            """
            insert into videos (id, youtube_id, original_title, title, description, duration)
            values (?, ?, ?, ?, ?, ?)
            on conflict(youtube_id) do update set
              original_title=excluded.original_title,
              description=excluded.description,
              duration=excluded.duration,
              updated_at=current_timestamp
            """,
            (video_id, youtube_id, title, title, description, duration),
        )
        video_id = conn.execute("select id from videos where youtube_id = ?", (youtube_id,)).fetchone()["id"]
        conn.execute(
            """
            insert into youtube_metadata (
              video_id, youtube_id, channel_id, channel_title, published_at,
              official_title, official_description, official_tags,
              duration_iso, thumbnail_url, raw_json, fetched_at
            )
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, current_timestamp)
            on conflict(video_id) do update set
              channel_id=excluded.channel_id,
              channel_title=excluded.channel_title,
              published_at=excluded.published_at,
              official_title=excluded.official_title,
              official_description=excluded.official_description,
              official_tags=excluded.official_tags,
              duration_iso=excluded.duration_iso,
              thumbnail_url=excluded.thumbnail_url,
              raw_json=excluded.raw_json,
              fetched_at=current_timestamp
            """,
            (
                video_id,
                youtube_id,
                snippet.get("channelId"),
                snippet.get("channelTitle"),
                snippet.get("publishedAt"),
                title,
                description,
                official_tags,
                duration,
                thumbnail,
                json.dumps(item, ensure_ascii=False),
            ),
        )
        conn.commit()
    return {
        "youtubeId": youtube_id,
        "title": title,
        "channelTitle": snippet.get("channelTitle"),
        "publishedAt": snippet.get("publishedAt"),
        "durationIso": duration,
        "tagCount": len(snippet.get("tags") or []),
    }


def count(conn, table):
    return conn.execute(f"select count(*) as total from {table}").fetchone()["total"]


def first(params, key, fallback):
    values = params.get(key)
    return values[0] if values else fallback


def slug(value):
    return "".join(char.lower() if char.isalnum() else "-" for char in value).strip("-")[:96]


def main():
    ensure_db()
    server = ThreadingHTTPServer((HOST, PORT), VisionHubHandler)
    print(f"VisionHub backend running on http://{HOST}:{PORT}")
    print(f"SQLite database: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
