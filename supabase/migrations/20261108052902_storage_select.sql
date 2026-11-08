-- O upload com upsert (substituir a foto) precisa ler o objeto existente.
-- O bucket já é público para leitura via URL; aqui liberamos a listagem na própria pasta.
create policy "usuário lê imagens da própria pasta" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
