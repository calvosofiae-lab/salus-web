# EPIC 5 — Reserva de turnos

Flujo público de reserva, sin necesidad de que el paciente se registre.

---

### E5-1 — Modelo de turnos
- **Objetivo:** tener la tabla base de reservas.
- **Descripción:** crear `appointments` con constraint único
  `(professional_id, appointment_date, start_time)` como primera barrera anti doble-reserva.
- **Depende de:** `00-fundamentos.md#E0-1`
- **Archivos:** migración SQL
- **Cambios de base de datos:** tabla `appointments`, enum `appointment_status`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `repositories/appointmentsRepository.ts`
- **Tipos:** `Appointment`
- **Criterios de aceptación:**
  - [ ] Insertar dos turnos idénticos (mismo profesional/fecha/hora) falla a nivel DB

---

### E5-2 — Página pública de perfil de profesional
- **Objetivo:** que un paciente vea info + disponibilidad de un profesional antes de reservar.
- **Descripción:** página con datos del profesional, reviews públicas y selector de fecha/hora
  que consume `get_available_slots`.
- **Depende de:** `00-fundamentos.md#E0-6`, `04-agenda-profesional.md#E4-3`
- **Archivos:** `app/profesionales/[id]/page.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `features/professionals/components/ProfessionalProfile.tsx`,
  `features/appointments/components/SlotPicker.tsx`
- **Páginas nuevas:** `/profesionales/[id]`
- **Hooks:** `useProfessional`, `useAvailableSlots`
- **Servicios/Repos:** `professionalsRepository`, `availabilityRepository`
- **Tipos:** `Professional`, `TimeSlot`
- **Criterios de aceptación:**
  - [ ] Un profesional inactivo devuelve 404
  - [ ] Los slots mostrados coinciden con los que devuelve `get_available_slots`

---

### E5-3 — Flujo de reserva (datos del paciente)
- **Objetivo:** capturar nombre, apellido y WhatsApp del paciente sin pedir registro.
- **Descripción:** formulario simple tras elegir slot; sin creación de cuenta.
- **Depende de:** E5-2
- **Archivos:** `features/appointments/components/BookingForm.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `BookingForm`
- **Páginas nuevas:** — (modal o sección dentro de `/profesionales/[id]`)
- **Hooks:** `useBookAppointment`
- **Servicios/Repos:** `appointmentsService.book`
- **Tipos:** `BookingInput`
- **Criterios de aceptación:**
  - [ ] No se solicita email ni contraseña en ningún momento del flujo

---

### E5-4 — RPC `book_appointment` con anti doble-reserva
- **Objetivo:** que la reserva sea atómica y segura contra condiciones de carrera.
- **Descripción:** función `SECURITY DEFINER` que valida el slot contra disponibilidad vigente
  al momento de ejecutar (no solo lo que el cliente vio), e inserta el turno dentro de la misma
  transacción.
- **Depende de:** E5-1, `04-agenda-profesional.md#E4-3`
- **Archivos:** migración SQL
- **Cambios de base de datos:** función `book_appointment(...)`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `appointmentsService.book` (llama al RPC, no inserta directo)
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Dos reservas simultáneas para el mismo slot: solo una tiene éxito, la otra recibe error
        controlado

---

### E5-5 — Confirmación de reserva
- **Objetivo:** el paciente sabe que su turno quedó agendado.
- **Descripción:** pantalla/mensaje de confirmación con fecha, hora y profesional.
- **Depende de:** E5-4
- **Archivos:** `features/appointments/components/BookingConfirmation.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `BookingConfirmation`
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Tras reservar, se muestra confirmación con los datos correctos del turno
