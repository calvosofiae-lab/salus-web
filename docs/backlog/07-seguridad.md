# EPIC 7 — Seguridad (RLS y políticas)

Row Level Security completo sobre todas las tablas nuevas. Las políticas se fueron escribiendo
epic por epic a medida que se creaba cada tabla (recomendación que ya estaba en el propio
backlog), así que este archivo terminó siendo mayormente la **auditoría final** (`E7-6`) más
la confirmación puntual de cada criterio.

---

### E7-1 — RLS `profiles` ✅ Hecho (verificado 2026-07-31)
- **Objetivo:** cada usuario ve/edita solo su propio perfil; admin ve todos.
- **Implementado en:** `00-fundamentos.md#E0-1`
  (`supabase/migrations/20260731061806_create_profiles_and_roles.sql`).
- **Políticas:** `profiles_select_own`, `profiles_update_own` (ambas `to authenticated`,
  `id = auth.uid()`). Sin policy para `anon` — acceso cero.
- **Criterios de aceptación:**
  - [x] Un usuario no puede leer el perfil de otro usuario vía API REST directa —
        verificado: `select * from profiles` con la anon key devuelve `[]`

---

### E7-2 — RLS `professionals` ✅ Hecho (verificado 2026-07-31)
- **Objetivo:** lectura pública acotada, escritura restringida.
- **Implementado en:** `00-fundamentos.md#E0-4` (lectura pública `is_active=true`),
  `03-administracion-profesionales.md#E3-1` (`professionals_admin_full_access`) y `#E3-5`
  (`professionals_update_own` + trigger que protege campos que no debería poder tocar un
  no-admin — ver `#E7-7` por la ampliación de esa lista de campos).
- **Criterios de aceptación:**
  - [x] Un usuario anónimo no puede leer profesionales con `is_active = false` (policy de
        lectura pública filtra explícitamente por `is_active = true`)
  - [x] Un usuario anónimo no puede hacer `update`/`insert`/`delete` sobre `professionals` —
        verificado: `insert` directo con anon key devuelve
        `"new row violates row-level security policy"`; `update` de `is_active`
        devuelve `[]` (cero filas afectadas)

---

### E7-3 — RLS `availability_rules` / `availability_blocks` ✅ Hecho (verificado 2026-07-31)
- **Objetivo:** acceso acotado al dueño y al admin (no hace falta lectura pública: el cálculo
  de slots pasa por una RPC `SECURITY DEFINER` que no depende de RLS para leer estas tablas).
- **Implementado en:** `04-agenda-profesional.md#E4-1` y `#E4-2`.
- **Políticas:** `availability_rules_owner_full_access`, `availability_blocks_owner_full_access`
  (`to authenticated`, `owns_professional(professional_id) or is_admin()`). Sin policy para
  `anon`.
- **Criterios de aceptación:**
  - [x] Un profesional no puede editar la disponibilidad de otro profesional
        (`owns_professional` lo garantiza estructuralmente) — verificado además que un
        `select` anónimo devuelve `[]` en ambas tablas

---

### E7-4 — RLS `appointments` ✅ Hecho (verificado 2026-07-31)
- **Objetivo:** ningún acceso directo de escritura/lectura amplia sobre turnos.
- **Implementado en:** `05-reserva-turnos.md#E5-1`. Sin `select`/`insert` público directo —
  la reserva pasa por `book_appointment` (`04-agenda-profesional.md`/`05-reserva-turnos.md#E5-4`,
  `SECURITY DEFINER`); `select`/`update` de estado limitados al dueño/admin
  (`appointments_select_own`, `appointments_update_own_status`).
- **Criterios de aceptación:**
  - [x] Un usuario anónimo no puede listar turnos de nadie vía API REST directa — verificado:
        `select * from appointments` con anon key devuelve `[]`
  - [x] Un usuario anónimo no puede insertar un turno directo (sin pasar por la RPC) —
        verificado: `insert` directo devuelve `"new row violates row-level security policy"`
  - [x] Un profesional solo puede ver (y cambiar el estado de) sus propios turnos —
        confirmado en el uso real durante EPIC 4/5 (el profesional de prueba vio y cambió el
        estado de su propio turno)

---

### E7-5 — RLS `reviews` ✅ Hecho (verificado 2026-07-31)
- **Objetivo:** lectura pública de testimonios, escritura solo vía token validado.
- **Implementado en:** `06-calificaciones.md#E6-1`. Lectura pública (`reviews_select_public`);
  **sin ninguna policy de `insert`/`update`/`delete`** — ni siquiera para `authenticated` —,
  así que la única vía de escritura es `submit_review` (`SECURITY DEFINER`, E6-3).
- **Criterios de aceptación:**
  - [x] Un usuario anónimo no puede insertar una review directamente en la tabla (sin pasar
        por el RPC) — verificado: `insert` directo con anon key devuelve
        `"new row violates row-level security policy"`

---

### E7-6 — Auditoría de exposición de anon key ✅ Hecho (2026-07-31)
- **Objetivo:** cierre de seguridad antes de dar por terminado el proyecto.
- **Descripción:** se ejecutó la auditoría con la anon key contra las 6 tablas nuevas
  (`profiles`, `professionals`, `availability_rules`, `availability_blocks`, `appointments`,
  `reviews`): intentos de lectura no autorizada devolvieron `[]`, intentos de escritura no
  autorizada devolvieron el error esperado de RLS (`42501`) o cero filas afectadas. Se
  confirmó además, revisando las migraciones, que las 6 tablas tienen
  `alter table ... enable row level security` (ninguna quedó con RLS deshabilitada por
  default). La tabla legacy `profesionales` no forma parte de este esquema nuevo y no se tocó
  (sigue con sus permisos originales hasta que se borre en `E0-9`).
- **Depende de:** E7-1, E7-2, E7-3, E7-4, E7-5
- **Criterios de aceptación:**
  - [x] Checklist de políticas por tabla revisado y aprobado
  - [x] Habilita la ejecución de `00-fundamentos.md#E0-9` (baja de la tabla legacy
        `profesionales`) — queda pendiente de que el usuario decida cuándo ejecutarla, ya que
        es una operación destructiva e irreversible

---

### E7-7 — Revisión post-implementación: columnas y RPCs sin validación server-side ✅ Hecho (2026-08-01)
- **Objetivo:** cerrar tres huecos encontrados en una revisión técnica de todo lo agregado en
  E3-6 (fotos), E6-6/E6-7 (contexto de reviews y destacados por rating) y el formateo de
  WhatsApp: casos donde la única validación real vivía en el cliente (UI/JS) y no en RLS/RPC,
  o donde una policy de fila no alcanzaba para proteger columnas puntuales.
- **Descripción:**
  1. **`professionals` — columnas sin proteger:** `professionals_update_own` (E7-2) solo
     restringe qué fila puede tocar un profesional, no qué columnas. El trigger
     `protect_professional_admin_fields` solo revertía `is_active`/`profile_id`; un
     profesional podía auto-asignarse cualquier `average_rating` con un `update` directo,
     salteando la UI (que ni siquiera expone ese campo). Esto pasó de cosmético a explotable
     con `get_top_rated_professionals` (E6-7): ahora `average_rating` decide quién aparece en
     "Profesionales Destacados". Se agregó `average_rating`, `consultation_fee` y
     `gender_trained` a la lista de campos que el trigger revierte para no-admins.
     `license_number` queda afuera a propósito (el profesional sí lo edita legítimamente).
  2. **Bucket `professional-photos` sin límites:** la validación de tipo/tamaño de
     `uploadProfessionalPhoto` (E3-6) era 100% client-side, saltable con un llamado directo a
     la API de Storage. Se configuraron `file_size_limit` (5MB) y `allowed_mime_types`
     (jpeg/png/webp) directo en `storage.buckets`, que Storage enforcea nativamente.
  3. **`book_appointment` sin validar formato de WhatsApp:** solo chequeaba que no viniera
     vacío. Un llamado directo a la RPC podía guardar un valor que rompiera después el link
     `wa.me` de "Enviar encuesta". Se agregó el mismo chequeo de 10 dígitos que ya hace
     `BookingForm.tsx` (`lib/whatsapp.ts`), pero server-side con una regex.
- **Depende de:** E7-2, E3-6, E6-7, `05-reserva-turnos.md#E5-4`
- **Archivos:**
  `supabase/migrations/20260801090000_protect_more_professional_fields.sql`,
  `supabase/migrations/20260801091000_restrict_professional_photos_bucket.sql`,
  `supabase/migrations/20260801092000_validate_whatsapp_format_in_book_appointment.sql`
- **Cambios de base de datos:** `protect_professional_admin_fields` redefinida (más campos
  protegidos), `storage.buckets` (`file_size_limit`/`allowed_mime_types` del bucket
  `professional-photos`), `book_appointment` redefinida (valida formato de WhatsApp)
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Un `update` directo de un profesional sobre su propia fila con
        `average_rating`/`consultation_fee`/`gender_trained` no cambia el valor (RLS lo deja
        pasar pero el trigger lo revierte) — pendiente de verificar en el navegador/API
  - [ ] Subir un archivo que no sea jpeg/png/webp o que supere 5MB al bucket
        `professional-photos` es rechazado por Storage — pendiente de verificar
  - [ ] `book_appointment` con un `p_whatsapp` que no sean 10 dígitos devuelve el mensaje de
        error nuevo en vez de guardar el turno — pendiente de verificar
