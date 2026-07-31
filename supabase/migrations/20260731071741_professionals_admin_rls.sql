-- EPIC 3 (docs/backlog/03-administracion-profesionales.md): el admin necesita ver y
-- gestionar TODOS los profesionales (activos e inactivos), no solo los activos que ve
-- el público. Adelanta parcialmente la política de escritura de E7-2.
--
-- Al ser políticas permisivas, se combinan con OR junto a
-- "professionals_select_active_public" (E0-4): el público sigue viendo solo activos,
-- el admin ve y puede escribir todo.

create policy "professionals_admin_full_access"
  on public.professionals
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
