# EPIC 5 — Reserva de turnos

Flujo público de reserva, sin necesidad de que el paciente se registre.

---

### E5-1 — Modelo de turnos ✅ Hecho (2026-07-31)
- **Objetivo:** tener la tabla base de reservas.
- **Descripción:** `appointments` con constraint único
  `(professional_id, appointment_date, start_time)`. Sin política de INSERT/SELECT pública: la
  reserva se hace vía RPC (`E5-4`); el profesional dueño y el admin pueden leer/actualizar
  directo (RLS `appointments_select_own` / `appointments_update_own_status`) — el cambio de
  estado no necesita una RPC aparte porque el trigger de `rating_token` (E6-2) se dispara igual
  en cualquier `UPDATE`.
- **Depende de:** `00-fundamentos.md#E0-1`
- **Archivos:** `supabase/migrations/20260731082642_create_appointments_table.sql`
- **Cambios de base de datos:** tabla `appointments`, enum `appointment_status`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `repositories/appointmentsRepository.ts` (pendiente, se crea en E4-4)
- **Tipos:** `Appointment` (en `features/appointments/types.ts`)
- **Criterios de aceptación:**
  - [x] Insertar dos turnos idénticos (mismo profesional/fecha/hora) falla a nivel DB

---

### E5-2 — Página pública de perfil de profesional ✅ Hecho (2026-07-31)
- **Objetivo:** que un paciente vea info + disponibilidad de un profesional antes de reservar.
- **Descripción:** `app/profesionales/[id]/page.tsx` es un Server Component (con `<Suspense>`
  por `cacheComponents`) que trae el profesional con el cliente de servidor y llama
  `notFound()` si no existe o está inactivo — así devuelve un 404 real de Next.js, no un mensaje
  de texto. Reviews públicas quedan pendientes de EPIC 6 (no implementadas todavía). **Probado
  por mí mismo** (formulario público, sin credenciales de por medio): perfil de "Diego Prueba"
  se ve bien, y un id inexistente devuelve la página 404 de Next.js.
- **Depende de:** `00-fundamentos.md#E0-6`, `04-agenda-profesional.md#E4-3`
- **Archivos:** `app/profesionales/[id]/page.tsx`,
  `app/profesionales/[id]/professional-profile-server.tsx`,
  `features/professionals/components/ProfessionalProfile.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `features/professionals/components/ProfessionalProfile.tsx`,
  `features/appointments/components/SlotPicker.tsx`
- **Páginas nuevas:** `/profesionales/[id]`
- **Hooks:** `useAvailableSlots`
- **Servicios/Repos:** `professionalsRepository` (`getPublicProfessionalById`),
  `availabilityRepository`
- **Tipos:** `Professional`, `TimeSlot`
- **Criterios de aceptación:**
  - [x] Un profesional inactivo devuelve 404
  - [x] Los slots mostrados coinciden con los que devuelve `get_available_slots` (mismo
        repositorio/RPC, sin lógica duplicada)

---

### E5-3 — Flujo de reserva (datos del paciente) ✅ Hecho (2026-07-31)
- **Objetivo:** capturar nombre, apellido y WhatsApp del paciente sin pedir registro.
- **Descripción:** `BookingForm` aparece tras elegir un slot en `ProfessionalProfile`; sin
  creación de cuenta. **Probado por mí mismo**, reserva de prueba completada de punta a punta.
- **Depende de:** E5-2
- **Archivos:** `features/appointments/components/BookingForm.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `BookingForm`
- **Páginas nuevas:** — (sección dentro de `/profesionales/[id]`)
- **Hooks:** `useBookAppointment`
- **Servicios/Repos:** `appointmentsRepository.bookAppointment`
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] No se solicita email ni contraseña en ningún momento del flujo

---

### E5-4 — RPC `book_appointment` con anti doble-reserva ✅ Hecho (2026-07-31)
- **Objetivo:** que la reserva sea atómica y segura contra condiciones de carrera.
- **Descripción:** función `SECURITY DEFINER` que revalida contra `get_available_slots` al
  momento de reservar y además depende del constraint único de `appointments` (E5-1) como
  última barrera; captura `unique_violation` y devuelve un mensaje legible. **Verificado**: tras
  reservar 09:00 del 03/08/2026, `get_available_slots` para esa fecha dejó de incluir ese
  horario (el resto siguió intacto).
- **Depende de:** E5-1, `04-agenda-profesional.md#E4-3`
- **Archivos:** `supabase/migrations/20260731084320_create_book_appointment_function.sql`,
  `repositories/appointmentsRepository.ts` (`bookAppointment`)
- **Cambios de base de datos:** función `book_appointment(...)`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** `useBookAppointment`
- **Servicios/Repos:** `appointmentsRepository.bookAppointment` (llama al RPC, no inserta
  directo)
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Dos reservas simultáneas para el mismo slot: solo una tiene éxito, la otra recibe error
        controlado — la lógica lo contempla (constraint único + captura de
        `unique_violation`), pero no se hizo una prueba de concurrencia real (dos requests en
        paralelo)

---

### E5-5 — Confirmación de reserva ✅ Hecho (2026-07-31)
- **Objetivo:** el paciente sabe que su turno quedó agendado.
- **Descripción:** `BookingConfirmation` muestra profesional, fecha y hora tras una reserva
  exitosa. **Probado por mí mismo**: mostró "Con Diego Prueba el 2026-08-03 a las 09:00 hs."
- **Depende de:** E5-4
- **Archivos:** `features/appointments/components/BookingConfirmation.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `BookingConfirmation`
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Tras reservar, se muestra confirmación con los datos correctos del turno
