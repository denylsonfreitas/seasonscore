-- Avisos de novo episódio para quem tem a série na watchlist.
--
-- Antes, a verificação só rodava no app, uma vez, quando a série entrava na watchlist.
-- Agora uma tarefa agendada (pg_cron) confere todas as séries das watchlists duas vezes
-- por dia. Os dados vêm do proxy público do TMDB do próprio site (api/tmdb), que já
-- guarda a chave do TMDB: nenhum segredo novo fica no banco.

create extension if not exists http with schema extensions;
create extension if not exists pg_cron;

-- Endereço do proxy (fica numa tabela para dar para trocar sem nova migração)
create table if not exists private.settings (
  key text primary key,
  value text not null
);
revoke all on private.settings from public, anon, authenticated;
insert into private.settings (key, value)
values ('tmdb_proxy_url', 'https://seasonscore.vercel.app/api/tmdb')
on conflict (key) do nothing;

/**
 * Confere as séries das watchlists e cria os avisos.
 * - Só considera o último episódio JÁ exibido (last_episode_to_air), nunca o anunciado.
 * - O episódio precisa ter saído nos últimos p_window_days dias (folga para execuções perdidas).
 * - Cada pessoa recebe um aviso por episódio (controle em last_notified_episodes) e só se
 *   a preferência "newEpisode" estiver ligada.
 * - p_only_user restringe a uma pessoa (usado em testes).
 * Retorna quantos avisos foram criados.
 */
create or replace function private.check_new_episodes(
  p_window_days integer default 2,
  p_only_user uuid default null
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  base_url text;
  s record;
  response extensions.http_response;
  episode jsonb;
  ep_season integer;
  ep_number integer;
  ep_air date;
  ep_name text;
  created integer := 0;
  n integer;
begin
  select value into base_url from private.settings where key = 'tmdb_proxy_url';
  if base_url is null then
    return 0;
  end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '8000');

  for s in
    select distinct w.series_id
      from public.watchlist w
     where p_only_user is null or w.user_id = p_only_user
  loop
    begin
      response := extensions.http_get(
        base_url || '?path=/tv/' || s.series_id || '&language=pt-BR'
      );
      if response.status <> 200 then
        continue;
      end if;

      episode := (response.content::jsonb) -> 'last_episode_to_air';
      if episode is null or jsonb_typeof(episode) <> 'object' then
        continue;
      end if;
      ep_air := nullif(episode ->> 'air_date', '')::date;
      ep_season := (episode ->> 'season_number')::integer;
      ep_number := (episode ->> 'episode_number')::integer;
      ep_name := nullif(episode ->> 'name', '');
      if ep_air is null or ep_air > current_date or ep_air < current_date - p_window_days then
        continue;
      end if;

      with targets as (
        select w.user_id, w.series_name, w.poster_path
          from public.watchlist w
          join public.profiles p on p.id = w.user_id
          left join public.last_notified_episodes l
            on l.user_id = w.user_id and l.series_id = w.series_id
         where w.series_id = s.series_id
           and (p_only_user is null or w.user_id = p_only_user)
           and coalesce((p.notification_settings ->> 'newEpisode')::boolean, true)
           -- ainda não avisado deste episódio (nem de um mais novo)
           and (l.user_id is null or (l.season_number, l.episode_number) < (ep_season, ep_number))
      ),
      inserted as (
        insert into public.notifications
          (user_id, type, series_id, series_name, series_poster, season_number, episode_number, message)
        select t.user_id, 'NEW_EPISODE', s.series_id, t.series_name, t.poster_path, ep_season, ep_number,
               left(
                 'Novo episódio de ' || t.series_name || ': T' || ep_season || ' · E'
                   || lpad(ep_number::text, 2, '0')
                   || coalesce(' – ' || ep_name, ''),
                 500
               )
          from targets t
        returning user_id
      )
      insert into public.last_notified_episodes (user_id, series_id, season_number, episode_number, notified_at)
      select i.user_id, s.series_id, ep_season, ep_number, now() from inserted i
      on conflict (user_id, series_id) do update
        set season_number = excluded.season_number,
            episode_number = excluded.episode_number,
            notified_at = excluded.notified_at;

      get diagnostics n = row_count;
      created := created + n;
    exception when others then
      -- uma série com problema não interrompe as outras
      raise warning 'check_new_episodes: série % falhou: %', s.series_id, sqlerrm;
    end;
  end loop;

  return created;
end;
$$;

revoke execute on function private.check_new_episodes(integer, uuid) from public, anon, authenticated;

-- Duas vezes por dia: 12:05 e 00:05 UTC (9h05 e 21h05 em Brasília)
select cron.unschedule(jobid) from cron.job where jobname = 'avisos-novos-episodios';
select cron.schedule(
  'avisos-novos-episodios',
  '5 0,12 * * *',
  $$select private.check_new_episodes()$$
);
