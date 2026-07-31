# EPIC 3 — Administración de profesionales

CRUD completo de profesionales para el rol Administrador, sobre la tabla nueva `professionals`
(ver `docs/data-model.md`).

---

### E3-1 — Listado admin de profesionales
- **Objetivo:** ver todos los profesionales (activos e inactivos) desde el panel admin.
- **Descripción:** tabla con búsqueda simple, estado activo/inactivo, acceso a editar/eliminar.
- **Depende de:** `00-fundamentos.md#E0-6`, `01-autenticacion.md#E1-5`
- **Archivos:** `app/admin/profesionales/page.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `features/admin/components/ProfessionalsTable.tsx`
- **Páginas nuevas:** `/admin/profesionales`
- **Hooks:** `features/professionals/hooks/useAdminProfessionalsList.ts`
- **Servicios/Repos:** `professionalsRepository`
- **Tipos:** `Professional`
- **Criterios de aceptación:**
  - [ ] Solo un admin autenticado puede acceder a la ruta
  - [ ] Se listan todos los profesionales, incluidos los inactivos

---

### E3-2 — Alta de profesional
- **Objetivo:** crear un profesional completo (datos + cuenta de acceso).
- **Descripción:** formulario admin que crea el usuario de Supabase Auth (vía RPC/función
  admin, ya que el service_role no debe usarse desde el cliente) y la fila en `professionals`
  vinculada por `profile_id`.
- **Depende de:** E3-1, `02-roles.md#E2-4`
- **Archivos:** `app/admin/profesionales/nuevo/page.tsx`
- **Cambios de base de datos:** función RPC `admin_create_professional(...)`
  (`SECURITY DEFINER`, valida `is_admin()`)
- **Componentes nuevos:** `features/professionals/components/ProfessionalForm.tsx`
- **Páginas nuevas:** `/admin/profesionales/nuevo`
- **Hooks:** `useCreateProfessional`
- **Servicios/Repos:** `professionalsService.create`, `professionalsRepository`
- **Tipos:** `ProfessionalInput`
- **Criterios de aceptación:**
  - [ ] Al crear, el profesional puede loguearse con la contraseña provisoria
  - [ ] La fila `professionals` queda visible en la landing si `is_active`

---

### E3-3 — Edición de profesional
- **Objetivo:** modificar datos de un profesional existente.
- **Descripción:** reutiliza `ProfessionalForm` en modo edición.
- **Depende de:** E3-2
- **Archivos:** `app/admin/profesionales/[id]/editar/page.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** — (reutiliza `ProfessionalForm`)
- **Páginas nuevas:** `/admin/profesionales/[id]/editar`
- **Hooks:** `useUpdateProfessional`
- **Servicios/Repos:** `professionalsService.update`
- **Tipos:** `ProfessionalInput`
- **Criterios de aceptación:**
  - [ ] Los cambios se reflejan inmediatamente en la landing pública

---

### E3-4 — Baja de profesional (soft delete)
- **Objetivo:** dar de baja sin perder historial de turnos/reviews.
- **Descripción:** marcar `is_active = false` en vez de borrar la fila (los turnos y reviews
  referencian `professional_id`).
- **Depende de:** E3-1
- **Archivos:** `features/professionals/components/ProfessionalsTable.tsx`
- **Cambios de base de datos:** `update professionals set is_active = false`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** `useDeactivateProfessional`
- **Servicios/Repos:** `professionalsService.deactivate`
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Un profesional inactivo desaparece de la búsqueda pública pero conserva su historial

---

### E3-5 — Perfil propio editable por el profesional
- **Objetivo:** que el profesional pueda actualizar su propia info (foto, descripción,
  whatsapp) sin pasar por el admin.
- **Descripción:** versión acotada de `ProfessionalForm` (sin poder cambiar `is_active` /
  `is_featured`).
- **Depende de:** E3-3
- **Archivos:** `app/profesional/perfil/page.tsx`
- **Cambios de base de datos:** política RLS que permite `update` solo de columnas no
  sensibles por el dueño
- **Componentes nuevos:** `features/professionals/components/OwnProfileForm.tsx`
- **Páginas nuevas:** `/profesional/perfil`
- **Hooks:** `useUpdateOwnProfile`
- **Servicios/Repos:** `professionalsService.updateOwn`
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Un profesional no puede marcarse a sí mismo como destacado ni reactivarse si fue
        desactivado
