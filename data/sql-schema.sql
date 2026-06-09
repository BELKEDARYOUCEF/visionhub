-- VisionHub future SQL model
-- Static XML remains the production source for GitHub Pages.
-- This schema is the migration target for a backend using SQLite, Supabase, or PostgreSQL.

create table categories (
  id text primary key,
  title text not null,
  icon text,
  color text,
  description text,
  sort_order integer not null default 0,
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);

create table playlists (
  id text primary key,
  category_id text not null references categories(id) on delete restrict,
  title text not null,
  description text,
  level text not null default 'Débutant',
  sort_order integer not null default 0,
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);

create table videos (
  id text primary key,
  youtube_id text not null unique,
  original_title text,
  title text not null,
  description text,
  duration text,
  level text not null default 'Débutant',
  status text not null default 'active',
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);

create table playlist_videos (
  playlist_id text not null references playlists(id) on delete cascade,
  video_id text not null references videos(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (playlist_id, video_id)
);

create table resource_folders (
  id text primary key,
  title text not null,
  icon text,
  status text not null default 'Importé',
  description text,
  sort_order integer not null default 0,
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);

create table resources (
  id text primary key,
  folder_id text not null references resource_folders(id) on delete cascade,
  video_id text references videos(id) on delete set null,
  title text not null,
  type text not null,
  status text not null default 'Catalogué',
  url text,
  source_path text,
  note text,
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);

create table video_intelligence (
  video_id text primary key references videos(id) on delete cascade,
  domain text,
  topic text,
  intent text,
  level text,
  confidence text,
  generated_title text,
  generated_description text,
  source text not null default 'oEmbed + contexte VisionHub + règles éditoriales',
  generated_at text not null default current_timestamp
);

create table youtube_metadata (
  video_id text primary key references videos(id) on delete cascade,
  youtube_id text not null unique,
  channel_id text,
  channel_title text,
  published_at text,
  official_title text,
  official_description text,
  official_tags text,
  duration_iso text,
  thumbnail_url text,
  raw_json text,
  fetched_at text not null default current_timestamp
);

create table tags (
  id text primary key,
  name text not null unique,
  kind text not null default 'generic'
);

create table taggings (
  tag_id text not null references tags(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  primary key (tag_id, entity_type, entity_id)
);

create table finance_transactions (
  id text primary key,
  type text not null check (type in ('revenue', 'expense')),
  title text not null,
  category text not null default 'Général',
  amount numeric not null,
  date text not null,
  note text,
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);

create table finance_goals (
  id text primary key,
  title text not null,
  category text not null default 'Objectif',
  target numeric not null,
  current numeric not null default 0,
  deadline text,
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp
);

create index idx_playlists_category on playlists(category_id);
create index idx_playlist_videos_video on playlist_videos(video_id);
create index idx_resources_folder on resources(folder_id);
create index idx_resources_video on resources(video_id);
create index idx_taggings_entity on taggings(entity_type, entity_id);
create index idx_youtube_metadata_youtube on youtube_metadata(youtube_id);
