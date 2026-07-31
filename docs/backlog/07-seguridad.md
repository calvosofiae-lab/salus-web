# EPIC 7 — Seguridad (RLS y políticas)

Row Level Security completo sobre todas las tablas nuevas. En un desarrollo real conviene
escribir las políticas de cada tabla junto con la epic que la introduce, no dejar todo para el
final; acá se agrupan al final del backlog solo para la auditoría integral (`E7-6`).

---

### E7-1 — RLS `profiles`
- **Objetivo:** cada usuario ve/edita solo su propio perfil; admin ve todos.
- **Depende de:** `00-fundamentos.md#E0-1`
- **Cambios de base de datos:** políticas `select`/`update` sobre `profiles`
- **Criterios de aceptación:**
  - [ ] Un usuario no puede leer el perfil de otro usuario vía API REST directa

---

### E7-2 — RLS `professionals`
- **Objetivo:** lectura pública acotada, escritura restringida.
- **Depende de:** `00-fundamentos.md#E0-4`
- **Cambios de base de datos:** política de lectura pública solo `is_active = true`; escritura
  solo admin (o el propio profesional en columnas permitidas, ver
  `03-administracion-profesionales.md#E3-5`)
- **Criterios de aceptación:**
  - [ ] Un usuario anónimo no puede leer profesionales con `is_active = false`
  - [ ] Un usuario anónimo no puede hacer `update`/`insert`/`delete` sobre `professionals`

---

### E7-3 — RLS `availability_rules` / `availability_blocks`
- **Objetivo:** lectura pública (necesaria para calcular slots), escritura acotada.
- **Depende de:** `04-agenda-profesional.md#E4-1`, `#E4-2`
- **Cambios de base de datos:** lectura pública; escritura solo del profesional dueño o admin
- **Criterios de aceptación:**
  - [ ] Un profesional no puede editar la disponibilidad de otro profesional

---

### E7-4 — RLS `appointments`
- **Objetivo:** ningún acceso directo de escritura/lectura amplia sobre turnos.
- **Descripción:** sin `select`/`insert` público directo — toda escritura pasa por
  `book_appointment` / `update_appointment_status` (`SECURITY DEFINER`); `select` restringido
  al profesional dueño y al admin.
- **Depende de:** `05-reserva-turnos.md#E5-1`, `#E5-4`
- **Criterios de aceptación:**
  - [ ] Un usuario anónimo no puede listar turnos de nadie vía API REST directa de Supabase
  - [ ] Un profesional solo puede ver (y cambiar el estado de) sus propios turnos

---

### E7-5 — RLS `reviews`
- **Objetivo:** lectura pública de testimonios, escritura solo vía token validado.
- **Depende de:** `06-calificaciones.md#E6-1`, `#E6-3`
- **Cambios de base de datos:** lectura pública; inserción solo vía `submit_review`; sin
  `update`/`delete` habilitado para nadie salvo admin
- **Criterios de aceptación:**
  - [ ] Un usuario anónimo no puede insertar una review directamente en la tabla (sin pasar por
        el RPC)

---

### E7-6 — Auditoría de exposición de anon key
- **Objetivo:** cierre de seguridad antes de dar por terminado el proyecto.
- **Descripción:** revisión final de que ninguna tabla sensible quede legible/escribible de más
  solo por tener la anon key (que ya es pública, como hoy en `.env.local`). Checklist tabla por
  tabla de las políticas E7-1 a E7-5.
- **Depende de:** E7-1, E7-2, E7-3, E7-4, E7-5
- **Criterios de aceptación:**
  - [ ] Checklist de políticas por tabla revisado y aprobado
  - [ ] Habilita la ejecución de `00-fundamentos.md#E0-9` (baja de la tabla legacy
        `profesionales`)
