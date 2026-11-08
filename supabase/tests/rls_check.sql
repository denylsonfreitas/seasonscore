-- Verificação das políticas RLS e triggers do SeasonScore.
-- Executar no SQL Editor (ou via MCP) de um projeto de testes: cria dois usuários
-- temporários, testa ações permitidas/proibidas e remove tudo ao final.
-- Retorna uma linha por teste com "ok" = true quando o comportamento é o esperado.

create temp table if not exists rls_results (test text, ok boolean, detail text);
truncate rls_results;
grant all on rls_results to authenticated;

do $$
declare
  alice uuid := '00000000-0000-4000-a000-00000000a11c';
  bob uuid := '00000000-0000-4000-a000-000000000b0b';
  v_review uuid;
  v_list uuid;
  v_comment uuid;
  n int;
begin
  -- usuários de teste (o trigger cria os perfis)
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
  values (alice, 'alice@teste.local', '{"username":"alice_teste"}', 'authenticated', 'authenticated'),
         (bob, 'bob@teste.local', '{"username":"bob_teste"}', 'authenticated', 'authenticated');

  insert into rls_results
    select 'perfil criado pelo trigger', count(*) = 2, null
      from public.profiles where id in (alice, bob);

  -- helpers para agir como um usuário
  perform set_config('role', 'authenticated', true);

  -- ALICE --------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', alice, 'role', 'authenticated')::text, true);

  insert into public.reviews (user_id, series_id, series_name) values (alice, 1399, 'Game of Thrones')
    returning id into v_review;
  insert into public.season_reviews (review_id, season_number, rating, comment)
    values (v_review, 1, 4.5, 'Muito boa');
  insert into rls_results values ('alice cria a própria avaliação', true, null);

  insert into public.lists (user_id, title) values (alice, 'Favoritas') returning id into v_list;
  insert into public.list_items (list_id, series_id, name) values (v_list, 1399, 'GoT');
  insert into rls_results values ('alice cria lista e itens', true, null);

  begin
    insert into public.reviews (user_id, series_id) values (bob, 1);
    insert into rls_results values ('alice NÃO cria avaliação em nome do bob', false, 'inseriu');
  exception when others then
    insert into rls_results values ('alice NÃO cria avaliação em nome do bob', true, sqlerrm);
  end;

  begin
    insert into public.season_reviews (review_id, season_number, rating) values (v_review, 2, 4.2);
    insert into rls_results values ('nota precisa ser múltipla de 0.5', false, 'inseriu');
  exception when others then
    insert into rls_results values ('nota precisa ser múltipla de 0.5', true, sqlerrm);
  end;

  -- BOB ----------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', bob, 'role', 'authenticated')::text, true);

  update public.season_reviews set rating = 0.5 where season_reviews.review_id = v_review;
  get diagnostics n = row_count;
  insert into rls_results values ('bob NÃO altera a nota da alice', n = 0, n || ' linhas');

  update public.lists set title = 'hack' where id = v_list;
  get diagnostics n = row_count;
  insert into rls_results values ('bob NÃO edita a lista da alice', n = 0, n || ' linhas');

  delete from public.list_items where list_items.list_id = v_list;
  get diagnostics n = row_count;
  insert into rls_results values ('bob NÃO remove itens da lista da alice', n = 0, n || ' linhas');

  insert into public.season_review_likes (review_id, season_number, user_id) values (v_review, 1, bob);
  insert into rls_results values ('bob curte a avaliação da alice', true, null);

  begin
    insert into public.season_review_likes (review_id, season_number, user_id) values (v_review, 1, alice);
    insert into rls_results values ('bob NÃO curte em nome da alice', false, 'inseriu');
  exception when others then
    insert into rls_results values ('bob NÃO curte em nome da alice', true, sqlerrm);
  end;

  insert into public.review_comments (review_id, season_number, user_id, content)
    values (v_review, 1, bob, 'Concordo!') returning id into v_comment;
  insert into public.follows (follower_id, following_id) values (bob, alice);
  insert into public.list_likes (list_id, user_id) values (v_list, bob);
  insert into public.list_comments (list_id, user_id, content) values (v_list, bob, 'Boa lista');
  insert into rls_results values ('bob comenta, segue e curte lista', true, null);

  begin
    insert into public.follows (follower_id, following_id) values (alice, bob);
    insert into rls_results values ('bob NÃO segue em nome da alice', false, 'inseriu');
  exception when others then
    insert into rls_results values ('bob NÃO segue em nome da alice', true, sqlerrm);
  end;

  begin
    insert into public.notifications (user_id, sender_id, type, message)
      values (alice, bob, 'NEW_FOLLOWER', 'falsa');
    insert into rls_results values ('bob NÃO cria notificação para a alice', false, 'inseriu');
  exception when others then
    insert into rls_results values ('bob NÃO cria notificação para a alice', true, sqlerrm);
  end;

  select count(*) into n from public.notifications where user_id = alice;
  insert into rls_results values ('bob NÃO lê notificações da alice', n = 0, n || ' visíveis');

  update public.profiles set display_name = 'hack' where id = alice;
  get diagnostics n = row_count;
  insert into rls_results values ('bob NÃO edita o perfil da alice', n = 0, n || ' linhas');

  -- ALICE vê as notificações geradas pelos triggers -----------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', alice, 'role', 'authenticated')::text, true);

  select count(*) into n from public.notifications where user_id = alice;
  insert into rls_results values ('triggers geraram 5 notificações para a alice', n = 5, n || ' notificações');

  update public.notifications set read = true where user_id = alice;
  get diagnostics n = row_count;
  insert into rls_results values ('alice marca as notificações como lidas', n = 5, n || ' linhas');

  begin
    update public.notifications set message = 'editada' where user_id = alice;
    insert into rls_results values ('alice NÃO edita o texto da notificação', false, 'alterou');
  exception when others then
    insert into rls_results values ('alice NÃO edita o texto da notificação', true, sqlerrm);
  end;

  delete from public.review_comments where id = v_comment;
  get diagnostics n = row_count;
  insert into rls_results values ('dona da avaliação remove comentário de outro', n = 1, n || ' linhas');

  -- lista privada
  update public.lists set is_public = false where id = v_list;

  perform set_config('request.jwt.claims', json_build_object('sub', bob, 'role', 'authenticated')::text, true);
  select count(*) into n from public.lists where id = v_list;
  insert into rls_results values ('bob NÃO vê lista privada', n = 0, n || ' visíveis');
  select count(*) into n from public.list_items where list_items.list_id = v_list;
  insert into rls_results values ('bob NÃO vê itens de lista privada', n = 0, n || ' visíveis');

  -- desfazer curtida remove a notificação
  delete from public.follows where follower_id = bob and following_id = alice;

  perform set_config('request.jwt.claims', json_build_object('sub', alice, 'role', 'authenticated')::text, true);
  select count(*) into n from public.notifications where user_id = alice and type = 'NEW_FOLLOWER';
  insert into rls_results values ('deixar de seguir remove a notificação', n = 0, n || ' restantes');

  -- view de notas
  select count(*) into n from public.series_ratings where series_id = 1399 and average_rating = 4.5;
  insert into rls_results values ('view series_ratings calcula a média', n = 1, null);

  -- limpeza
  execute 'reset role';
  delete from auth.users where id in (alice, bob);
  select count(*) into n from public.reviews where user_id in (alice, bob);
  insert into rls_results values ('excluir usuário apaga os dados em cascata', n = 0, n || ' restantes');
end;
$$;

select test, ok, detail from rls_results;

-- Para rodar localmente com a CLI:
--   supabase start && supabase db reset
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -f supabase/tests/rls_check.sql
