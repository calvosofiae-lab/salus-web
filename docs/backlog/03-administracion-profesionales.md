# EPIC 3 — Administración de profesionales

CRUD completo de profesionales para el rol Administrador, sobre la tabla nueva `professionals`
(ver `docs/data-model.md`).

---

### E3-1 — Listado admin de profesionales ✅ Hecho (2026-07-31)
- **Objetivo:** ver todos los profesionales (activos e inactivos) desde el panel admin.
- **Descripción:** `app/admin/layout.tsx` (header + nav + logout), `app/admin/page.tsx`
  (dashboard mínimo) y `app/admin/profesionales/page.tsx` con `ProfessionalsTable`. Requirió
  una política RLS nueva (`professionals_admin_full_access`, migración
  `20260731071741_professionals_admin_rls.sql`) para que el admin vea filas `is_active=false`
  que el público no ve. **Verificado por el usuario en el navegador con una cuenta admin real:
  el listado se ve correctamente.**
- **Depende de:** `00-fundamentos.md#E0-6`, `01-autenticacion.md#E1-5`
- **Archivos:** `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/profesionales/page.tsx`,
  `features/admin/components/ProfessionalsTable.tsx`,
  `supabase/migrations/20260731071741_professionals_admin_rls.sql`
- **Cambios de base de datos:** policy `professionals_admin_full_access` (select/insert/
  update/delete para `is_admin()`)
- **Componentes nuevos:** `features/admin/components/ProfessionalsTable.tsx`
- **Páginas nuevas:** `/admin`, `/admin/profesionales`
- **Hooks:** `features/professionals/hooks/useAdminProfessionalsList.ts`
- **Servicios/Repos:** `professionalsRepository` (`getAllProfessionalsAdmin`,
  `deactivateProfessional`)
- **Tipos:** `Professional`
- **Criterios de aceptación:**
  - [x] Solo un admin autenticado puede acceder a la ruta
  - [x] Se listan todos los profesionales, incluidos los inactivos

---

### E3-2 — Alta de profesional ✅ Hecho (2026-07-31)
- **Objetivo:** crear un profesional completo (datos + cuenta de acceso).
- **Descripción:** en vez de un RPC de Postgres (crear usuarios de `auth.users` a mano vía SQL
  no es lo recomendado por Supabase), se implementó como una **Server Action** de Next.js
  (`"use server"`) que usa la **secret key** de Supabase (Admin API,
  `supabase.auth.admin.createUser`) desde `lib/supabase/admin.ts` — nunca expuesta al cliente
  (paquete `server-only` fuerza el error de build si se importa desde un Client Component). La
  action verifica `session.role === "admin"` server-side antes de hacer nada (defensa en
  profundidad además del middleware). Si falla el insert en `professionals`, se hace rollback
  borrando el usuario de auth recién creado, para no dejar cuentas huérfanas.
  **Confirmado por el usuario: funciona correctamente end-to-end.**
- **Depende de:** E3-1, `02-roles.md#E2-4`
- **Archivos:** `lib/supabase/admin.ts`,
  `features/professionals/services/adminCreateProfessional.ts`,
  `features/professionals/hooks/useCreateProfessional.ts`,
  `features/professionals/components/ProfessionalForm.tsx`,
  `app/admin/profesionales/nuevo/page.tsx`
- **Cambios de base de datos:** ninguno nuevo (usa `professionals_admin_full_access` de E3-1)
- **Componentes nuevos:** `features/professionals/components/ProfessionalForm.tsx`
  (reutilizable para alta y edición, mode `"create"` | `"edit"`)
- **Páginas nuevas:** `/admin/profesionales/nuevo`
- **Hooks:** `useCreateProfessional`
- **Servicios/Repos:** `adminCreateProfessional` (Server Action), `professionalsRepository`
- **Tipos:** `ProfessionalFormValues`, `ProfessionalCreateInput`
- **Criterios de aceptación:**
  - [x] Al crear, el profesional puede loguearse con la contraseña provisoria
  - [x] La fila `professionals` queda visible en la landing si `is_active`

---

### E3-3 — Edición de profesional ✅ Hecho (2026-07-31)
- **Objetivo:** modificar datos de un profesional existente.
- **Descripción:** `ProfessionalForm` en modo `"edit"`, precargado con
  `getProfessionalByIdAdmin`. Tuvo que separarse en `page.tsx` (Server Component) +
  `edit-professional-client.tsx` (Client Component) envuelto en `<Suspense>`, porque
  `cacheComponents` (Next.js 16, `next.config.ts`) rechaza acceso a `useParams()` sin límite de
  Suspense en una ruta dinámica. **Confirmado por el usuario: funciona correctamente.**
- **Depende de:** E3-2
- **Archivos:** `app/admin/profesionales/[id]/editar/page.tsx`,
  `app/admin/profesionales/[id]/editar/edit-professional-client.tsx`,
  `features/professionals/hooks/useUpdateProfessional.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** — (reutiliza `ProfessionalForm`)
- **Páginas nuevas:** `/admin/profesionales/[id]/editar`
- **Hooks:** `useUpdateProfessional`
- **Servicios/Repos:** `professionalsRepository.updateProfessional`
- **Tipos:** `ProfessionalFormValues`
- **Criterios de aceptación:**
  - [x] Los cambios se reflejan inmediatamente en la landing pública

---

### E3-4 — Baja de profesional (soft delete) ✅ Hecho (2026-07-31)
- **Objetivo:** dar de baja sin perder historial de turnos/reviews.
- **Descripción:** botón "Dar de baja" en `ProfessionalsTable` marca `is_active = false` (no
  borra la fila). **Confirmado por el usuario: funciona correctamente.**
- **Depende de:** E3-1
- **Archivos:** `features/admin/components/ProfessionalsTable.tsx`,
  `features/professionals/hooks/useAdminProfessionalsList.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** `useAdminProfessionalsList` (expone `deactivate`)
- **Servicios/Repos:** `professionalsRepository.deactivateProfessional`
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Un profesional inactivo desaparece de la búsqueda pública pero conserva su historial

---

### E3-5 — Perfil propio editable por el profesional ✅ Hecho (2026-07-31)
- **Objetivo:** que el profesional pueda actualizar su propia info (foto, descripción,
  whatsapp) sin pasar por el admin.
- **Descripción:** `ProfessionalForm` con prop nuevo `hideFeaturedToggle` (oculta el checkbox
  "Destacado") en `/profesional/perfil`. La protección real no es solo de UI: se agregó una
  policy `professionals_update_own` (dueño puede actualizar su fila) + un **trigger**
  `protect_professional_admin_fields` que revierte `is_active`/`is_featured`/`profile_id` a su
  valor anterior si quien edita no es admin — necesario porque en Supabase todos los usuarios
  logueados comparten el rol de Postgres `authenticated`, así que un GRANT de columnas no
  alcanza para diferenciar admin de profesional. **Confirmado por el usuario: funciona y no
  aparece la opción de Destacado.**
- **Depende de:** E3-3
- **Archivos:** `app/profesional/layout.tsx`, `app/profesional/page.tsx`,
  `app/profesional/perfil/page.tsx`, `features/professionals/hooks/useUpdateOwnProfile.ts`,
  `repositories/professionalsRepository.ts` (`getOwnProfessional`),
  `supabase/migrations/20260731082025_professionals_own_update_policy.sql`
- **Cambios de base de datos:** policy `professionals_update_own`, función y trigger
  `protect_professional_admin_fields`
- **Componentes nuevos:** — (reutiliza `ProfessionalForm` con `hideFeaturedToggle`)
- **Páginas nuevas:** `/profesional`, `/profesional/perfil`
- **Hooks:** `useUpdateOwnProfile`
- **Servicios/Repos:** `professionalsRepository` (`getOwnProfessional`, `updateProfessional`)
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Un profesional no puede marcarse a sí mismo como destacado ni reactivarse si fue
        desactivado (aplicado a nivel de base de datos, no solo ocultando el campo en la UI)

---

### E3-6 — Subida de foto como archivo ✅ Hecho (2026-08-01)
- **Objetivo:** que admin y profesional puedan subir la foto de perfil como archivo desde
  `ProfessionalForm`, en vez de pegar a mano una URL externa en el campo de texto.
- **Descripción:** bucket público `professional-photos` en Supabase Storage, con path
  `{professional_id}/photo.{ext}` (un archivo por profesional, se pisa con `upsert` al
  reemplazar; se agrega `?v=timestamp` a la URL guardada para evitar caché stale). Las
  policies de `storage.objects` reutilizan las mismas funciones helper que ya protegen la
  tabla `professionals` (`owns_professional`/`is_admin`), así que la regla de "quién puede
  editar la foto" es la misma que "quién puede editar la fila". En alta admin, como el
  `id` del profesional no existe hasta después del insert, la Server Action
  `adminCreateProfessional` ahora devuelve el `id` creado y la subida de foto se hace en
  un segundo paso desde el cliente (`uploadProfessionalPhoto` + `updateProfessional`).
- **Depende de:** E3-2, E3-3, E3-5
- **Archivos:** `supabase/migrations/20260801060000_create_professional_photos_bucket.sql`,
  `repositories/professionalsRepository.ts` (`uploadProfessionalPhoto`),
  `features/professionals/components/ProfessionalForm.tsx`,
  `features/professionals/hooks/useUpdateOwnProfile.ts`,
  `features/professionals/hooks/useUpdateProfessional.ts`,
  `features/professionals/hooks/useCreateProfessional.ts`,
  `features/professionals/services/adminCreateProfessional.ts`
- **Cambios de base de datos:** bucket `professional-photos` (público) + policies
  `professional_photos_public_read`/`professional_photos_owner_insert`/`_update`/`_delete`
- **Componentes nuevos:** — (extiende `ProfessionalForm`)
- **Páginas nuevas:** —
- **Hooks:** — (extiende `useUpdateOwnProfile`, `useUpdateProfessional`, `useCreateProfessional`)
- **Servicios/Repos:** `professionalsRepository.uploadProfessionalPhoto`
- **Tipos:** `ProfessionalFormSubmitValues` (gana `photoFile?: File | null`)
- **Criterios de aceptación:**
  - [x] Se puede elegir un archivo de imagen (JPG/PNG/WEBP, máx. 5MB) y se sube al guardar
  - [x] La foto subida se ve en la landing pública y en el perfil del profesional
  - [x] Se puede quitar la foto actual sin subir una nueva

---

### E3-7 — Limpieza de fotos huérfanas y fix de alta con foto fallida ✅ Hecho (2026-08-01)
- **Objetivo:** dos gaps encontrados en una revisión técnica de E3-6.
- **Descripción:**
  1. **Fotos huérfanas en Storage:** "Quitar foto" solo limpiaba `photo_url` en la fila, sin
     borrar el objeto real en `professional-photos`; y reemplazar una foto por otra de
     distinta extensión no borraba la vieja (`upsert` solo pisa si el path es idéntico,
     `photo.jpg` y `photo.png` conviven). Se agregó `removeProfessionalPhoto` a
     `professionalsRepository.ts`, y `uploadProfessionalPhoto` ahora borra cualquier archivo
     del profesional que no sea el que está por subir antes de subirlo. `ProfessionalForm`
     gana un estado `photoRemoved` (separado de vaciar `photo_url`) para que los hooks sepan
     cuándo hay que borrar el objeto de Storage y cuándo no tocar nada.
  2. **Alta con foto fallida podía derivar en alta duplicada:** si `adminCreateProfessional`
     tenía éxito pero fallaba el paso de subir la foto, `useCreateProfessional` mostraba un
     error genérico y se quedaba en el formulario de alta — el admin podía interpretar que
     falló todo y reintentar el alta completa, disparando un segundo `adminCreateProfessional`
     con el mismo email. Ahora, si falla solo la foto, se redirige a
     `/admin/profesionales/[id]/editar` (el profesional ya existe) en vez de mostrar error.
- **Depende de:** E3-6
- **Archivos:** `repositories/professionalsRepository.ts` (`removeProfessionalPhoto`, fix en
  `uploadProfessionalPhoto`), `features/professionals/components/ProfessionalForm.tsx`,
  `features/professionals/hooks/useUpdateOwnProfile.ts`,
  `features/professionals/hooks/useUpdateProfessional.ts`,
  `features/professionals/hooks/useCreateProfessional.ts`
- **Cambios de base de datos:** — (reutiliza la policy `professional_photos_owner_delete`
  de E3-6)
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** — (extiende los tres de E3-6)
- **Servicios/Repos:** `professionalsRepository.removeProfessionalPhoto`
- **Tipos:** `ProfessionalFormSubmitValues` (gana `photoRemoved?: boolean`)
- **Criterios de aceptación:**
  - [x] Reemplazar una foto `.jpg` por una `.png` deja un solo archivo en el bucket, no dos —
        verificado con curl (`storage/object/list`): tras subir un `.png` sobre un
        `.jpg` existente, solo queda `photo.png` en la carpeta del profesional
  - [x] "Quitar foto" borra el objeto de Storage, no solo el campo `photo_url` — verificado:
        tras "Quitar foto" + Guardar, `storage/object/list` devuelve `[]` y `photo_url` queda
        en `""`
  - [ ] Si falla la subida de foto en el alta admin, redirige a editar en vez de mostrar
        error — pendiente de verificar (requiere forzar el fallo)
