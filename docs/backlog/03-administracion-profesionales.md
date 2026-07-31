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
