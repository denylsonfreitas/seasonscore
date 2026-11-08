-- Marcação de spoiler por avaliação de temporada.
-- O texto continua público; a interface só o esconde até a pessoa escolher ver.
alter table public.season_reviews
  add column has_spoiler boolean not null default false;

-- Recria a view do feed com a nova coluna no fim (create or replace exige manter a ordem).
create or replace view public.season_review_feed with (security_invoker = true) as
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
         where c.review_id = sr.review_id and c.season_number = sr.season_number)::int as comments_count,
       sr.has_spoiler
from public.season_reviews sr
join public.reviews r on r.id = sr.review_id
join public.profiles p on p.id = r.user_id;
