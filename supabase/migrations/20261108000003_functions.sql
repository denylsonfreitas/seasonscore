-- SeasonScore: funções e triggers

-- updated_at automático ----------------------------------------------------------
create function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger reviews_touch before update on public.reviews
  for each row execute function private.touch_updated_at();
create trigger season_reviews_touch before update on public.season_reviews
  for each row execute function private.touch_updated_at();
create trigger lists_touch before update on public.lists
  for each row execute function private.touch_updated_at();
create trigger review_comments_touch before update on public.review_comments
  for each row execute function private.touch_updated_at();
create trigger list_comments_touch before update on public.list_comments
  for each row execute function private.touch_updated_at();

-- Itens adicionados/removidos atualizam a data da lista
create function private.touch_parent_list()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.lists set updated_at = now()
  where id = case when tg_op = 'DELETE' then old.list_id else new.list_id end;
  return null;
end;
$$;
create trigger list_items_touch_list after insert or delete on public.list_items
  for each row execute function private.touch_parent_list();

-- Perfil criado automaticamente no cadastro (email/senha ou Google) ------------------
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1),
    'usuario'
  ));
  -- mantém só caracteres permitidos e garante 3 a 30 caracteres
  base_username := regexp_replace(base_username, '[^a-z0-9_.]', '', 'g');
  if char_length(base_username) < 3 then
    base_username := rpad(base_username, 3, '0');
  end if;
  base_username := left(base_username, 24);

  candidate := base_username;
  while exists (select 1 from public.profiles where lower(username::text) = candidate) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name, photo_url)
  values (
    new.id,
    candidate,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      candidate
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Notificações ---------------------------------------------------------------------

-- Nome exibido nas mensagens
create function private.profile_name(p_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(display_name, ''), username::text, 'Alguém')
  from public.profiles where id = p_id
$$;

-- Cria a notificação respeitando as preferências do destinatário e evitando duplicatas
create function private.notify(
  p_user_id uuid,
  p_sender_id uuid,
  p_type text,
  p_setting text,
  p_message text,
  p_target_id text default null,
  p_series_id integer default null,
  p_series_name text default null,
  p_series_poster text default null,
  p_season_number integer default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  enabled boolean;
begin
  if p_user_id is null or p_user_id = p_sender_id then
    return;
  end if;

  select coalesce((notification_settings ->> p_setting)::boolean, true)
    into enabled
    from public.profiles where id = p_user_id;
  if not coalesce(enabled, false) then
    return;
  end if;

  -- substitui uma notificação igual ainda não lida (ex.: curtir, descurtir e curtir de novo)
  delete from public.notifications
   where user_id = p_user_id
     and sender_id is not distinct from p_sender_id
     and type = p_type
     and target_id is not distinct from p_target_id
     and season_number is not distinct from p_season_number
     and not read;

  insert into public.notifications
    (user_id, sender_id, type, message, target_id, series_id, series_name, series_poster, season_number)
  values
    (p_user_id, p_sender_id, p_type, left(p_message, 500), p_target_id, p_series_id,
     p_series_name, p_series_poster, p_season_number);
end;
$$;

-- Remove a notificação correspondente quando a ação é desfeita
create function private.unnotify(
  p_user_id uuid, p_sender_id uuid, p_type text, p_target_id text, p_season_number integer default null
) returns void language sql security definer set search_path = '' as $$
  delete from public.notifications
   where user_id = p_user_id
     and sender_id = p_sender_id
     and type = p_type
     and target_id is not distinct from p_target_id
     and (p_season_number is null or season_number = p_season_number)
$$;

-- Seguir
create function private.on_follow_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.notify(new.following_id, new.follower_id, 'NEW_FOLLOWER', 'newFollower',
      private.profile_name(new.follower_id) || ' começou a seguir você.', new.follower_id::text);
  else
    perform private.unnotify(old.following_id, old.follower_id, 'NEW_FOLLOWER', old.follower_id::text);
  end if;
  return null;
end;
$$;
create trigger follows_notify after insert or delete on public.follows
  for each row execute function private.on_follow_change();

-- Curtida em avaliação de temporada
create function private.on_season_review_like_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  rv public.reviews;
  row_data record;
begin
  if tg_op = 'DELETE' then row_data := old; else row_data := new; end if;
  select * into rv from public.reviews where id = row_data.review_id;
  if rv.id is null then
    return null;
  end if;
  if tg_op = 'INSERT' then
    perform private.notify(rv.user_id, new.user_id, 'NEW_REACTION', 'newReaction',
      private.profile_name(new.user_id) || ' curtiu sua avaliação de ' || rv.series_name
        || ' (Temporada ' || new.season_number || ').',
      rv.id::text, rv.series_id, rv.series_name, rv.series_poster, new.season_number);
  else
    perform private.unnotify(rv.user_id, old.user_id, 'NEW_REACTION', rv.id::text, old.season_number);
  end if;
  return null;
end;
$$;
create trigger season_review_likes_notify after insert or delete on public.season_review_likes
  for each row execute function private.on_season_review_like_change();

-- Comentário em avaliação
create function private.on_review_comment_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  rv public.reviews;
begin
  select * into rv from public.reviews where id = new.review_id;
  perform private.notify(rv.user_id, new.user_id, 'NEW_COMMENT', 'newComment',
    private.profile_name(new.user_id) || ' comentou na sua avaliação de ' || rv.series_name
      || ' (Temporada ' || new.season_number || ').',
    rv.id::text, rv.series_id, rv.series_name, rv.series_poster, new.season_number);
  return null;
end;
$$;
create trigger review_comments_notify after insert on public.review_comments
  for each row execute function private.on_review_comment_insert();

-- Curtida em comentário de avaliação
create function private.on_review_comment_like_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  c public.review_comments;
  rv public.reviews;
  row_data record;
begin
  if tg_op = 'DELETE' then row_data := old; else row_data := new; end if;
  select * into c from public.review_comments where id = row_data.comment_id;
  if c.id is null then
    return null;
  end if;
  select * into rv from public.reviews where id = c.review_id;
  if tg_op = 'INSERT' then
    perform private.notify(c.user_id, new.user_id, 'NEW_REACTION', 'newReaction',
      private.profile_name(new.user_id) || ' curtiu seu comentário em ' || rv.series_name
        || ' (Temporada ' || c.season_number || ').',
      rv.id::text || '_comment_' || c.id::text, rv.series_id, rv.series_name, rv.series_poster,
      c.season_number);
  else
    perform private.unnotify(c.user_id, old.user_id, 'NEW_REACTION',
      rv.id::text || '_comment_' || c.id::text);
  end if;
  return null;
end;
$$;
create trigger review_comment_likes_notify after insert or delete on public.review_comment_likes
  for each row execute function private.on_review_comment_like_change();

-- Curtida em lista
create function private.on_list_like_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  l public.lists;
  row_data record;
begin
  if tg_op = 'DELETE' then row_data := old; else row_data := new; end if;
  select * into l from public.lists where id = row_data.list_id;
  if l.id is null then
    return null;
  end if;
  if tg_op = 'INSERT' then
    perform private.notify(l.user_id, new.user_id, 'LIST_REACTION', 'listReaction',
      private.profile_name(new.user_id) || ' curtiu sua lista "' || l.title || '".', l.id::text);
  else
    perform private.unnotify(l.user_id, old.user_id, 'LIST_REACTION', l.id::text);
  end if;
  return null;
end;
$$;
create trigger list_likes_notify after insert or delete on public.list_likes
  for each row execute function private.on_list_like_change();

-- Comentário em lista
create function private.on_list_comment_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  l public.lists;
begin
  select * into l from public.lists where id = new.list_id;
  perform private.notify(l.user_id, new.user_id, 'LIST_COMMENT', 'listComment',
    private.profile_name(new.user_id) || ' comentou na sua lista "' || l.title || '".', l.id::text);
  return null;
end;
$$;
create trigger list_comments_notify after insert on public.list_comments
  for each row execute function private.on_list_comment_insert();

-- Curtida em comentário de lista
create function private.on_list_comment_like_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  c public.list_comments;
  l public.lists;
  row_data record;
begin
  if tg_op = 'DELETE' then row_data := old; else row_data := new; end if;
  select * into c from public.list_comments where id = row_data.comment_id;
  if c.id is null then
    return null;
  end if;
  select * into l from public.lists where id = c.list_id;
  if tg_op = 'INSERT' then
    perform private.notify(c.user_id, new.user_id, 'NEW_REACTION', 'newReaction',
      private.profile_name(new.user_id) || ' curtiu seu comentário na lista "' || l.title || '".',
      'list_' || l.id::text || '_comment_' || c.id::text);
  else
    perform private.unnotify(c.user_id, old.user_id, 'NEW_REACTION',
      'list_' || l.id::text || '_comment_' || c.id::text);
  end if;
  return null;
end;
$$;
create trigger list_comment_likes_notify after insert or delete on public.list_comment_likes
  for each row execute function private.on_list_comment_like_change();

-- Nova avaliação: avisa seguidores que têm a série na watchlist
create function private.on_season_review_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  rv public.reviews;
  follower uuid;
begin
  select * into rv from public.reviews where id = new.review_id;
  for follower in
    select f.follower_id
      from public.follows f
      join public.watchlist w on w.user_id = f.follower_id and w.series_id = rv.series_id
     where f.following_id = rv.user_id
  loop
    perform private.notify(follower, rv.user_id, 'NEW_REVIEW', 'newReview',
      private.profile_name(rv.user_id) || ' avaliou ' || rv.series_name
        || ' (Temporada ' || new.season_number || ').',
      rv.id::text, rv.series_id, rv.series_name, rv.series_poster, new.season_number);
  end loop;
  return null;
end;
$$;
create trigger season_reviews_notify after insert on public.season_reviews
  for each row execute function private.on_season_review_insert();

-- Avaliação sem temporadas é removida --------------------------------------------------
create function private.cleanup_empty_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.reviews r
   where r.id = old.review_id
     and not exists (select 1 from public.season_reviews sr where sr.review_id = r.id);
  return null;
end;
$$;
create trigger season_reviews_cleanup after delete on public.season_reviews
  for each row execute function private.cleanup_empty_review();

-- API: funções chamadas pelo app --------------------------------------------------------

-- Exclui a conta do usuário logado (os dados são apagados em cascata).
-- As imagens no Storage são removidas pelo app antes desta chamada.
create function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Verifica se um nome de usuário está livre (sem expor dados)
create function public.is_username_available(p_username text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_username ~ '^[a-zA-Z0-9_.]{3,30}$'
     and not exists (
       select 1 from public.profiles
        where lower(username::text) = lower(p_username)
          and id is distinct from (select auth.uid())
     )
$$;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- Tags mais usadas em listas públicas
create function public.popular_list_tags(p_limit int default 20)
returns table (tag text, count bigint) language sql stable set search_path = '' as $$
  select t.tag, count(*) as count
    from public.lists l, unnest(l.tags) as t(tag)
   where l.is_public
   group by t.tag
   order by count desc, t.tag
   limit p_limit
$$;
grant execute on function public.popular_list_tags(int) to anon, authenticated;

-- Funções internas não podem ser chamadas diretamente; só os helpers de RLS ficam liberados
revoke execute on all functions in schema private from public;
grant execute on function private.review_owner(uuid) to anon, authenticated;
grant execute on function private.list_owner(uuid) to anon, authenticated;
grant execute on function private.can_view_list(uuid) to anon, authenticated;
