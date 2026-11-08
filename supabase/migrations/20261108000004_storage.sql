-- SeasonScore: armazenamento de fotos de perfil e capa
-- Arquivos ficam em profile-images/<user_id>/<arquivo>; leitura pública, escrita só do dono.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "usuário envia imagens na própria pasta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "usuário atualiza imagens da própria pasta" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "usuário remove imagens da própria pasta" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
