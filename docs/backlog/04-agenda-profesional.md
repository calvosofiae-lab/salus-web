# EPIC 4 — Agenda del profesional

Disponibilidad, cálculo de slots y gestión de turnos desde el rol Profesional.

---

### E4-1 — Configuración de disponibilidad semanal
- **Objetivo:** el profesional define su horario recurrente.
- **Descripción:** UI de 7 días con rangos horarios (ej. Lun 09-13, 14-18); guarda en
  `availability_rules`.
- **Depende de:** `00-fundamentos.md#E0-6`, `01-autenticacion.md#E1-5`
- **Archivos:** `app/profesional/disponibilidad/page.tsx`
- **Cambios de base de datos:** tabla `availability_rules`
- **Componentes nuevos:** `features/appointments/components/WeeklyAvailabilityForm.tsx`
- **Páginas nuevas:** `/profesional/disponibilidad`
- **Hooks:** `useAvailabilityRules`
- **Servicios/Repos:** `availabilityRepository`, `availabilityService`
- **Tipos:** `AvailabilityRule`
- **Criterios de aceptación:**
  - [ ] Guardar una nueva regla no afecta turnos ya reservados en el pasado
  - [ ] Cambios solo impactan fechas futuras (regla de negocio explícita)

---

### E4-2 — Bloqueo de fechas específicas
- **Objetivo:** el profesional bloquea un día puntual (vacaciones, feriado propio, etc.).
- **Descripción:** selector de fecha + motivo opcional; guarda en `availability_blocks`.
- **Depende de:** E4-1
- **Archivos:** `app/profesional/disponibilidad/page.tsx` (misma página, sección aparte)
- **Cambios de base de datos:** tabla `availability_blocks`
- **Componentes nuevos:** `features/appointments/components/BlockDateForm.tsx`
- **Páginas nuevas:** — (parte de `/profesional/disponibilidad`)
- **Hooks:** `useAvailabilityBlocks`
- **Servicios/Repos:** `availabilityRepository`
- **Tipos:** `AvailabilityBlock`
- **Criterios de aceptación:**
  - [ ] Un día bloqueado no ofrece slots en el flujo de reserva pública

---

### E4-3 — Cálculo de slots disponibles (RPC)
- **Objetivo:** función única de verdad para "qué horarios están libres tal día".
- **Descripción:** RPC que cruza `availability_rules` (según día de semana) menos
  `availability_blocks` menos `appointments` ya reservados (estado `reservado`/`realizado`),
  en bloques de 1 hora.
- **Depende de:** E4-1, E4-2, `05-reserva-turnos.md#E5-1`
- **Archivos:** migración SQL
- **Cambios de base de datos:** función `get_available_slots(professional_id, date)`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `availabilityRepository.getAvailableSlots`
- **Tipos:** `TimeSlot`
- **Criterios de aceptación:**
  - [ ] Un turno ya reservado no vuelve a aparecer como slot libre
  - [ ] Todos los slots devueltos duran exactamente 1 hora

---

### E4-4 — Calendario y listado de turnos del profesional
- **Objetivo:** visualizar la agenda propia.
- **Descripción:** vista semanal/mensual con turnos por día y su estado.
- **Depende de:** `05-reserva-turnos.md#E5-1`, `01-autenticacion.md#E1-5`
- **Archivos:** `app/profesional/turnos/page.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `features/appointments/components/ProfessionalCalendar.tsx`,
  `AppointmentListItem.tsx`
- **Páginas nuevas:** `/profesional/turnos`
- **Hooks:** `useMyAppointments`
- **Servicios/Repos:** `appointmentsRepository`
- **Tipos:** `Appointment`, `AppointmentStatus`
- **Criterios de aceptación:**
  - [ ] El profesional solo ve sus propios turnos (verificado también a nivel RLS, ver
        `07-seguridad.md#E7-4`)

---

### E4-5 — Cambio de estado de turno
- **Objetivo:** marcar un turno como Realizado / Cancelado / No asistió.
- **Descripción:** acción desde el listado; dispara RPC `update_appointment_status`, que a su
  vez genera el `rating_token` cuando corresponde (ver `06-calificaciones.md#E6-2`).
- **Depende de:** E4-4, `06-calificaciones.md#E6-2`
- **Archivos:** `features/appointments/components/AppointmentListItem.tsx`
- **Cambios de base de datos:** función `update_appointment_status(appointment_id, status)`
- **Componentes nuevos:** `features/appointments/components/AppointmentStatusMenu.tsx`
- **Páginas nuevas:** —
- **Hooks:** `useUpdateAppointmentStatus`
- **Servicios/Repos:** `appointmentsService.updateStatus`
- **Tipos:** `AppointmentStatus`
- **Criterios de aceptación:**
  - [ ] Solo el profesional dueño o un admin pueden cambiar el estado
  - [ ] Pasar a "Realizado" genera automáticamente el `rating_token`
