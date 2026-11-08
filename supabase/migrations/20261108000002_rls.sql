-- SeasonScore: políticas de segurança (Row Level Security)
-- Regra geral: conteúdo público pode ser lido por todos; cada usuário só escreve
-- nos próprios dados. Notificações sociais são criadas apenas por triggers.

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.season_reviews enable row level security;
alter table public.season_review_likes enable row level security;
alter table public.review_comments enable row level security;
alter table public.review_comment_likes enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.list_likes enable row level security;
alter table public.list_comments enable row level security;
alter table public.list_comment_likes enable row level security;
alter table public.follows enable row level security;
alter table public.watchlist enable row level security;
alter table public.notifications enable row level security;
alter table public.last_notified_episodes enable row level security;

-- Helpers (schema "private": usados pelas políticas, não expostos pela API) ------
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- Dono de uma avaliação (security definer evita recursão de RLS nas subconsultas)
create function private.review_owner(p_review_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select user_id from public.reviews where id = p_review_id
$$;

create function private.list_owner(p_list_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select user_id from public.lists where id = p_list_id
$$;

-- Lista visível para quem consulta: pública, acessível por link ou do próprio usuário
create function private.can_view_list(p_list_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lists l
    where l.id = p_list_id
      and (l.is_public or l.access_by_link or l.user_id = (select auth.uid()))
  )
$$;

-- Perfis ----------------------------------------------------------------------
create policy "perfis são públicos" on public.profiles
  for select using (true);
create policy "usuário edita o próprio perfil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- inserção apenas pelo trigger handle_new_user

-- Avaliações ------------------------------------------------------------------
create policy "avaliações são públicas" on public.reviews
  for select using (true);
create policy "usuário cria as próprias avaliações" on public.reviews
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "usuário edita as próprias avaliações" on public.reviews
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "usuário exclui as próprias avaliações" on public.reviews
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "temporadas avaliadas são públicas" on public.season_reviews
  for select using (true);
create policy "dono da avaliação gerencia temporadas" on public.season_reviews
  for all to authenticated
  using (private.review_owner(review_id) = (select auth.uid()))
  with check (private.review_owner(review_id) = (select auth.uid()));

create policy "curtidas de avaliações são públicas" on public.season_review_likes
  for select using (true);
create policy "usuário curte em nome próprio" on public.season_review_likes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "usuário remove a própria curtida" on public.season_review_likes
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "comentários de avaliações são públicos" on public.review_comments
  for select using (true);
create policy "usuário comenta em nome próprio" on public.review_comments
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "autor edita o comentário" on public.review_comments
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "autor ou dono da avaliação exclui o comentário" on public.review_comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or private.review_owner(review_id) = (select auth.uid()));

create policy "curtidas de comentários são públicas" on public.review_comment_likes
  for select using (true);
create policy "usuário curte comentário em nome próprio" on public.review_comment_likes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "usuário remove a própria curtida em comentário" on public.review_comment_likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Listas ----------------------------------------------------------------------
create policy "listas visíveis" on public.lists
  for select using (is_public or access_by_link or user_id = (select auth.uid()));
create policy "usuário cria as próprias listas" on public.lists
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "usuário edita as próprias listas" on public.lists
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "usuário exclui as próprias listas" on public.lists
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "itens de listas visíveis" on public.list_items
  for select using (private.can_view_list(list_id));
create policy "dono gerencia itens da lista" on public.list_items
  for all to authenticated
  using (private.list_owner(list_id) = (select auth.uid()))
  with check (private.list_owner(list_id) = (select auth.uid()));

create policy "curtidas de listas visíveis" on public.list_likes
  for select using (private.can_view_list(list_id));
create policy "usuário curte lista em nome próprio" on public.list_likes
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.can_view_list(list_id));
create policy "usuário remove a própria curtida em lista" on public.list_likes
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "comentários de listas visíveis" on public.list_comments
  for select using (private.can_view_list(list_id));
create policy "usuário comenta em lista em nome próprio" on public.list_comments
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.can_view_list(list_id));
create policy "autor edita comentário em lista" on public.list_comments
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "autor ou dono da lista exclui comentário" on public.list_comments
  for delete to authenticated
  using (user_id = (select auth.uid()) or private.list_owner(list_id) = (select auth.uid()));

create policy "curtidas de comentários de listas são públicas" on public.list_comment_likes
  for select using (true);
create policy "usuário curte comentário de lista em nome próprio" on public.list_comment_likes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "usuário remove a própria curtida em comentário de lista" on public.list_comment_likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Social ----------------------------------------------------------------------
create policy "seguidores são públicos" on public.follows
  for select using (true);
create policy "usuário segue em nome próprio" on public.follows
  for insert to authenticated with check (follower_id = (select auth.uid()));
create policy "seguidor deixa de seguir ou seguido remove" on public.follows
  for delete to authenticated
  using (follower_id = (select auth.uid()) or following_id = (select auth.uid()));

create policy "watchlists são públicas" on public.watchlist
  for select using (true);
create policy "usuário gerencia a própria watchlist" on public.watchlist
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Notificações ----------------------------------------------------------------
create policy "usuário lê as próprias notificações" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "usuário cria aviso de episódio para si" on public.notifications
  for insert to authenticated
  with check (user_id = (select auth.uid()) and sender_id is null and type = 'NEW_EPISODE');
create policy "usuário marca as próprias notificações" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "usuário exclui as próprias notificações" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "usuário gerencia os próprios avisos de episódio" on public.last_notified_episodes
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Notificações: só a coluna "read" pode ser alterada pelo usuário
revoke update on public.notifications from authenticated, anon;
grant update (read) on public.notifications to authenticated;

-- Perfis: id e created_at não podem ser alterados
revoke update on public.profiles from authenticated, anon;
grant update (username, display_name, photo_url, cover_url, description, favorite_series,
              notification_settings) on public.profiles to authenticated;
