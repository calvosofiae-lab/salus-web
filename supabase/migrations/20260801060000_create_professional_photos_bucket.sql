-- Bucket público para las fotos de perfil de los profesionales, subidas como archivo
-- desde ProfessionalForm (antes era un campo de texto libre con una URL externa).
--
-- Convención de path: {professional_id}/photo.{ext} (un solo archivo por profesional,
-- se pisa con upsert al reemplazar). Reutiliza las mismas funciones helper que ya
-- protegen la tabla `professionals` (owns_professional/is_admin, de
-- 20260731065748_create_role_helper_functions.sql) para que la regla de "quién puede
-- editar la foto" sea exactamente la misma que "quién puede editar la fila".

insert into storage.buckets (id, name, public)
values ('professional-photos', 'professional-photos', true);

create policy "professional_photos_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'professional-photos');

create policy "professional_photos_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'professional-photos'
    and (
      public.owns_professional(((storage.foldername(name))[1])::uuid)
      or public.is_admin()
    )
  );

create policy "professional_photos_owner_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'professional-photos'
    and (
      public.owns_professional(((storage.foldername(name))[1])::uuid)
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'professional-photos'
    and (
      public.owns_professional(((storage.foldername(name))[1])::uuid)
      or public.is_admin()
    )
  );

create policy "professional_photos_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'professional-photos'
    and (
      public.owns_professional(((storage.foldername(name))[1])::uuid)
      or public.is_admin()
    )
  );
