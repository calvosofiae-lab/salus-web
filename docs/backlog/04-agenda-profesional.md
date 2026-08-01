# EPIC 4 — Agenda del profesional

Disponibilidad, cálculo de slots y gestión de turnos desde el rol Profesional.

---

### E4-1 — Configuración de disponibilidad semanal ✅ Hecho (2026-07-31)
- **Objetivo:** el profesional define su horario recurrente.
- **Descripción:** UI de 7 días con rangos horarios; guarda en `availability_rules` (RLS: solo
  el dueño —vía `owns_professional`— o el admin pueden leer/escribir). **Confirmado por el
  usuario: funciona correctamente.**
- **Depende de:** `00-fundamentos.md#E0-6`, `01-autenticacion.md#E1-5`
- **Archivos:** `app/profesional/disponibilidad/page.tsx`,
  `features/appointments/components/WeeklyAvailabilityForm.tsx`,
  `features/appointments/hooks/useAvailabilityRules.ts`,
  `repositories/availabilityRepository.ts`,
  `supabase/migrations/20260731082644_create_availability_rules_table.sql`
- **Cambios de base de datos:** tabla `availability_rules`
- **Componentes nuevos:** `features/appointments/components/WeeklyAvailabilityForm.tsx`
- **Páginas nuevas:** `/profesional/disponibilidad`
- **Hooks:** `useAvailabilityRules`
- **Servicios/Repos:** `availabilityRepository`
- **Tipos:** `AvailabilityRule`
- **Criterios de aceptación:**
  - [x] Guardar una nueva regla no afecta turnos ya reservados en el pasado (no hay
        recálculo retroactivo: los turnos existentes no dependen de `availability_rules`)
  - [x] Cambios solo impactan fechas futuras (el cálculo de slots en E4-3 siempre parte de
        "hoy" en adelante)

---

### E4-2 — Bloqueo de fechas específicas ✅ Hecho (2026-07-31)
- **Objetivo:** el profesional bloquea un día puntual (vacaciones, feriado propio, etc.).
- **Descripción:** selector de fecha + motivo opcional; guarda en `availability_blocks`.
  **Confirmado por el usuario: funciona correctamente.**
- **Depende de:** E4-1
- **Archivos:** `app/profesional/disponibilidad/page.tsx` (misma página, sección aparte),
  `features/appointments/components/BlockDateForm.tsx`,
  `features/appointments/hooks/useAvailabilityBlocks.ts`,
  `supabase/migrations/20260731082647_create_availability_blocks_table.sql`
- **Cambios de base de datos:** tabla `availability_blocks`
- **Componentes nuevos:** `features/appointments/components/BlockDateForm.tsx`
- **Páginas nuevas:** — (parte de `/profesional/disponibilidad`)
- **Hooks:** `useAvailabilityBlocks`
- **Servicios/Repos:** `availabilityRepository`
- **Tipos:** `AvailabilityBlock`
- **Criterios de aceptación:**
  - [x] Un día bloqueado no ofrece slots en el flujo de reserva pública (verificado con
        `get_available_slots` de E4-3: 17/08/2026, bloqueado por el usuario como feriado
        nacional, devuelve `[]`; el 10/08/2026, mismo día de semana sin bloquear, devuelve los
        horarios esperados)

---

### E4-3 — Cálculo de slots disponibles (RPC) ✅ Hecho (2026-07-31)
- **Objetivo:** función única de verdad para "qué horarios están libres tal día".
- **Descripción:** RPC `get_available_slots(p_professional_id, p_date)` (`SECURITY DEFINER`,
  ejecutable por `anon`) que cruza `availability_rules` (según `extract(dow from p_date)`)
  menos `availability_blocks` menos `appointments` con estado `reservado`/`realizado`, en
  bloques de 1 hora; excluye fechas pasadas y horarios ya pasados de hoy. **Verificado con la
  anon key**: devuelve los horarios esperados para el día configurado, `[]` para el resto de
  los días y `[]` para la fecha bloqueada (17/08/2026).
- **Depende de:** E4-1, E4-2, `05-reserva-turnos.md#E5-1`
- **Archivos:** `supabase/migrations/20260731083611_create_get_available_slots_function.sql`,
  `repositories/availabilityRepository.ts` (`getAvailableSlots`)
- **Cambios de base de datos:** función `get_available_slots(professional_id, date)`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `availabilityRepository.getAvailableSlots`
- **Tipos:** `TimeSlot`
- **Criterios de aceptación:**
  - [ ] Un turno ya reservado no vuelve a aparecer como slot libre — pendiente de verificar con
        un turno real (se prueba en E5-4, cuando exista el flujo de reserva); la lógica SQL ya
        lo contempla (`booked` excluye por `start_time`)
  - [x] Todos los slots devueltos duran exactamente 1 hora (generados por
        `generate_series` en incrementos de 1 hora)

---

### E4-4 — Calendario y listado de turnos del profesional ✅ Hecho (2026-07-31)
- **Objetivo:** visualizar la agenda propia.
- **Descripción:** en vez de una grilla de calendario completa, se implementó un listado
  agrupado por fecha (`ProfessionalCalendar` agrupa `appointments` por `appointment_date`) —
  suficiente para el volumen esperado y más simple que un widget de calendario interactivo.
  **Confirmado por el usuario:** tras reservar un turno de prueba (vía EPIC 5), apareció
  correctamente en `/profesional/turnos`.
- **Depende de:** `05-reserva-turnos.md#E5-1`, `01-autenticacion.md#E1-5`
- **Archivos:** `app/profesional/turnos/page.tsx`,
  `features/appointments/components/ProfessionalCalendar.tsx`, `AppointmentListItem.tsx`,
  `features/appointments/hooks/useMyAppointments.ts`, `repositories/appointmentsRepository.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `features/appointments/components/ProfessionalCalendar.tsx`,
  `AppointmentListItem.tsx`
- **Páginas nuevas:** `/profesional/turnos`
- **Hooks:** `useMyAppointments`
- **Servicios/Repos:** `appointmentsRepository`
- **Tipos:** `Appointment`, `AppointmentStatus`
- **Criterios de aceptación:**
  - [x] El profesional solo ve sus propios turnos — garantizado por RLS
        (`appointments_select_own`); no se probó exhaustivamente con turnos de más de un
        profesional a la vez, pero la policy no deja margen de ambigüedad (`owns_professional`)

---

### E4-5 — Cambio de estado de turno ✅ Hecho (2026-07-31)
- **Objetivo:** marcar un turno como Realizado / Cancelado / No asistió.
- **Descripción:** `AppointmentStatusMenu` hace un `update` directo sobre `appointments`
  (protegido por RLS `appointments_update_own_status` de E5-1) en vez de una RPC dedicada: el
  trigger que genera el `rating_token` (E6-2, todavía no implementado) se dispara igual sin
  importar si el `UPDATE` viene de una RPC o de un update directo del cliente. **Bug encontrado
  y corregido durante la prueba del usuario:** la tarjeta de turno mostraba el estado dos veces
  (el `Badge` con el valor crudo del enum sin traducir, ej. `reservado`, y el botón del menú con
  la misma etiqueta capitalizada) — confuso, parecía que el dropdown tenía opciones duplicadas.
  Se centralizaron las etiquetas en `features/appointments/constants.ts` y el botón ahora dice
  "Cambiar estado" en vez de repetir el estado actual. **Confirmado por el usuario: cambió el
  estado a "Realizado" correctamente.**
- **Depende de:** E4-4, `06-calificaciones.md#E6-2`
- **Archivos:** `features/appointments/components/AppointmentListItem.tsx`,
  `features/appointments/components/AppointmentStatusMenu.tsx`,
  `features/appointments/constants.ts`,
  `features/appointments/hooks/useMyAppointments.ts`,
  `repositories/appointmentsRepository.ts` (`updateAppointmentStatus`)
- **Cambios de base de datos:** — (usa la policy de E5-1, no un RPC aparte)
- **Componentes nuevos:** `features/appointments/components/AppointmentStatusMenu.tsx`
- **Páginas nuevas:** —
- **Hooks:** `useMyAppointments` (expone `changeStatus`)
- **Servicios/Repos:** `appointmentsRepository.updateAppointmentStatus`
- **Tipos:** `AppointmentStatus`
- **Criterios de aceptación:**
  - [x] Solo el profesional dueño o un admin pueden cambiar el estado (RLS `with check`)
  - [ ] Pasar a "Realizado" genera automáticamente el `rating_token` — pendiente hasta
        implementar el trigger de E6-2

---

### E4-6 — Revisión técnica: horarios superpuestos y errores silenciosos ✅ Hecho (2026-08-01)
- **Objetivo:** tres gaps encontrados en una revisión técnica de E4-1/E4-2/E4-3.
- **Descripción:**
  1. **Sin prevención de horarios superpuestos:** nada impedía cargar dos reglas de
     disponibilidad que se pisan para el mismo profesional+día (ej. 09:00-13:00 y
     11:00-15:00 un lunes) — ni en el formulario ni en la base. `get_available_slots` no
     hacía `distinct` en el select final, así que una superposición podía devolver el mismo
     horario dos veces en el selector del paciente. Se agregó un trigger
     `prevent_overlapping_availability_rules` (before insert/update en
     `availability_rules`) que rechaza cualquier rango nuevo que se pise con uno existente
     del mismo profesional y día — se usa un trigger en vez de un exclusion constraint
     porque Postgres no tiene un tipo `timerange` nativo. De yapa se agregó `distinct` a
     `get_available_slots` como defensa extra por si quedó algún dato viejo superpuesto.
  2. **Sin manejo de errores:** `WeeklyAvailabilityForm` y `BlockDateForm` llamaban a
     `addRule`/`addBlock` sin `try/catch` — un insert rechazado (el check `end_time >
     start_time`, el `unique` de `blocked_date`, o ahora el trigger nuevo del punto 1)
     fallaba en silencio, sin ningún mensaje para el profesional/admin. `useAvailabilityRules`
     y `useAvailabilityBlocks` ahora exponen `error`/`isSaving`, y los dos componentes
     muestran el error igual que el resto de los formularios de la app.
  3. **Sin protección de doble-submit:** ninguno de los dos formularios deshabilitaba el
     botón mientras la petición estaba en curso — un doble clic apurado facilitaba crear
     reglas superpuestas antes del fix del punto 1. Ahora los botones de agregar/quitar se
     deshabilitan mientras `isSaving` es `true`.
- **Depende de:** E4-1, E4-2, E4-3
- **Archivos:**
  `supabase/migrations/20260801120000_prevent_overlapping_availability_rules.sql`,
  `features/appointments/hooks/useAvailabilityRules.ts`,
  `features/appointments/hooks/useAvailabilityBlocks.ts`,
  `features/appointments/components/WeeklyAvailabilityForm.tsx`,
  `features/appointments/components/BlockDateForm.tsx`
- **Cambios de base de datos:** trigger `prevent_overlapping_availability_rules`
  (`before insert or update on availability_rules`); `get_available_slots` redefinida con
  `select distinct`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** — (extienden los dos existentes con `error`/`isSaving`)
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Cargar un horario que se superpone con uno existente muestra el mensaje de error del
        trigger en vez de guardarse — pendiente de verificar
  - [ ] Cargar dos veces la misma fecha bloqueada muestra un error en vez de fallar en
        silencio — pendiente de verificar
  - [ ] Los botones de agregar/quitar quedan deshabilitados mientras se guarda — pendiente de
        verificar
