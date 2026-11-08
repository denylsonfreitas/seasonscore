-- SeasonScore: esquema inicial (tabelas, índices e views)

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Perfis (dados públicos do usuário; o email fica apenas em auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique
    check (username ~ '^[a-zA-Z0-9_.]{3,30}$'),
  display_name text check (char_length(display_name) <= 60),
  photo_url text,
  cover_url text,
  description text check (char_length(description) <= 500),
  favorite_series jsonb,
  notification_settings jsonb not null default jsonb_build_object(
    'newEpisode', true, 'newFollower', true, 'newComment', true, 'newReaction', true,
    'newReview', true, 'listComment', true, 'listReaction', true
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Avaliações: uma por usuário e série, com uma linha por temporada avaliada
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  series_id integer not null,
  series_name text not null default '',
  series_poster text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, series_id)
);
create index reviews_series_id_idx on public.reviews (series_id);
create index reviews_created_at_idx on public.reviews (created_at desc);

create table public.season_reviews (
  review_id uuid not null references public.reviews (id) on delete cascade,
  season_number integer not null check (season_number >= 0),
  rating numeric(2, 1) not null
    check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  comment text not null default '' check (char_length(comment) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (review_id, season_number)
);
create index season_reviews_created_at_idx on public.season_reviews (created_at desc);

create table public.season_review_likes (
  review_id uuid not null,
  season_number integer not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, season_number, user_id),
  foreign key (review_id, season_number)
    references public.season_reviews (review_id, season_number) on delete cascade
);
create index season_review_likes_user_idx on public.season_review_likes (user_id);

create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null,
  season_number integer not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  foreign key (review_id, season_number)
    references public.season_reviews (review_id, season_number) on delete cascade
);
create index review_comments_target_idx on public.review_comments (review_id, season_number, created_at desc);
create index review_comments_user_idx on public.review_comments (user_id);

create table public.review_comment_likes (
  comment_id uuid not null references public.review_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Listas
-- ---------------------------------------------------------------------------
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  tags text[] not null default '{}',
  is_public boolean not null default true,
  access_by_link boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lists_user_idx on public.lists (user_id);
create index lists_public_updated_idx on public.lists (updated_at desc) where is_public;
create index lists_tags_idx on public.lists using gin (tags);

create table public.list_items (
  list_id uuid not null references public.lists (id) on delete cascade,
  series_id integer not null,
  name text not null,
  poster_path text,
  added_at timestamptz not null default now(),
  primary key (list_id, series_id)
);
create index list_items_series_idx on public.list_items (series_id);

create table public.list_likes (
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);
create index list_likes_user_idx on public.list_likes (user_id);

create table public.list_comments (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index list_comments_list_idx on public.list_comments (list_id, created_at desc);
create index list_comments_user_idx on public.list_comments (user_id);

create table public.list_comment_likes (
  comment_id uuid not null references public.list_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Social
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

create table public.watchlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  series_id integer not null,
  series_name text not null,
  poster_path text,
  first_air_date text,
  added_at timestamptz not null default now(),
  primary key (user_id, series_id)
);
create index watchlist_series_idx on public.watchlist (series_id);

-- ---------------------------------------------------------------------------
-- Notificações (criadas por triggers; o cliente só cria avisos de episódio para si)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in (
    'NEW_FOLLOWER', 'NEW_COMMENT', 'NEW_REACTION', 'NEW_EPISODE',
    'NEW_REVIEW', 'LIST_COMMENT', 'LIST_REACTION'
  )),
  series_id integer,
  series_name text,
  series_poster text,
  season_number integer,
  episode_number integer,
  -- avaliação, lista ou "list_<id>_comment_<id>", conforme o tipo
  target_id text,
  message text not null check (char_length(message) <= 500),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_sender_idx on public.notifications (sender_id);

create table public.last_notified_episodes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  series_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  notified_at timestamptz not null default now(),
  primary key (user_id, series_id)
);

-- ---------------------------------------------------------------------------
-- Views (security_invoker: respeitam as políticas RLS de quem consulta)
-- ---------------------------------------------------------------------------

-- Nota média da comunidade por série
create view public.series_ratings with (security_invoker = true) as
select r.series_id,
       max(r.series_name) as series_name,
       max(r.series_poster) as series_poster,
       round(avg(sr.rating), 2)::float8 as average_rating,
       count(*)::int as ratings_count,
       count(distinct r.user_id)::int as reviewers_count
from public.reviews r
join public.season_reviews sr on sr.review_id = r.id
group by r.series_id;

-- Avaliações de temporada com autor e contadores, para feeds e listagens
create view public.season_review_feed with (security_invoker = true) as
select r.id as review_id,
       r.user_id,
       r.series_id,
       r.series_name,
       r.series_poster,
       sr.season_number,
       sr.rating::float8 as rating,
       sr.comment,
       sr.created_at,
       sr.updated_at,
       p.username,
       p.display_name,
       p.photo_url,
       (select count(*) from public.season_review_likes l
         where l.review_id = sr.review_id and l.season_number = sr.season_number)::int as likes_count,
       (select count(*) from public.review_comments c
         where c.review_id = sr.review_id and c.season_number = sr.season_number)::int as comments_count
from public.season_reviews sr
join public.reviews r on r.id = sr.review_id
join public.profiles p on p.id = r.user_id;

-- Listas com autor e contadores
create view public.list_summaries with (security_invoker = true) as
select l.*,
       p.username,
       p.display_name,
       p.photo_url as user_photo_url,
       (select count(*) from public.list_likes ll where ll.list_id = l.id)::int as likes_count,
       (select count(*) from public.list_comments lc where lc.list_id = l.id)::int as comments_count,
       (select count(*) from public.list_items li where li.list_id = l.id)::int as items_count
from public.lists l
join public.profiles p on p.id = l.user_id;

-- Perfis com estatísticas para a página Comunidade
create view public.profile_stats with (security_invoker = true) as
select p.id,
       p.username,
       p.display_name,
       p.photo_url,
       p.cover_url,
       p.description,
       p.created_at,
       (select count(*) from public.follows f where f.following_id = p.id)::int as followers_count,
       (select count(*) from public.follows f where f.follower_id = p.id)::int as following_count,
       (select count(*) from public.reviews r where r.user_id = p.id)::int as reviews_count,
       (select count(*) from public.lists l where l.user_id = p.id and l.is_public)::int as lists_count
from public.profiles p;
