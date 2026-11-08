-- Ajustes sugeridos pelos advisors do Supabase

-- is_username_available não precisa de privilégios elevados (perfis são públicos)
alter function public.is_username_available(text) security invoker;

-- Índices para chaves estrangeiras usadas na exclusão em cascata
create index review_comment_likes_user_idx on public.review_comment_likes (user_id);
create index list_comment_likes_user_idx on public.list_comment_likes (user_id);

-- Políticas "for all" duplicavam a checagem de SELECT; separadas por operação
drop policy "dono da avaliação gerencia temporadas" on public.season_reviews;
create policy "dono da avaliação cria temporadas" on public.season_reviews
  for insert to authenticated
  with check (private.review_owner(review_id) = (select auth.uid()));
create policy "dono da avaliação edita temporadas" on public.season_reviews
  for update to authenticated
  using (private.review_owner(review_id) = (select auth.uid()))
  with check (private.review_owner(review_id) = (select auth.uid()));
create policy "dono da avaliação exclui temporadas" on public.season_reviews
  for delete to authenticated
  using (private.review_owner(review_id) = (select auth.uid()));

drop policy "dono gerencia itens da lista" on public.list_items;
create policy "dono adiciona itens à lista" on public.list_items
  for insert to authenticated
  with check (private.list_owner(list_id) = (select auth.uid()));
create policy "dono edita itens da lista" on public.list_items
  for update to authenticated
  using (private.list_owner(list_id) = (select auth.uid()))
  with check (private.list_owner(list_id) = (select auth.uid()));
create policy "dono remove itens da lista" on public.list_items
  for delete to authenticated
  using (private.list_owner(list_id) = (select auth.uid()));

drop policy "usuário gerencia a própria watchlist" on public.watchlist;
create policy "usuário adiciona à própria watchlist" on public.watchlist
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "usuário edita a própria watchlist" on public.watchlist
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "usuário remove da própria watchlist" on public.watchlist
  for delete to authenticated using (user_id = (select auth.uid()));
