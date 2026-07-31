# EPIC 6 — Sistema de calificaciones

Valoraciones vía link único, generado cuando un turno pasa a estado "Realizado".

---

### E6-1 — Modelo de reviews
- **Objetivo:** tabla de calificaciones vinculada 1 a 1 con un turno.
- **Descripción:** `reviews` con `appointment_id` único (evita doble calificación del mismo
  turno).
- **Depende de:** `05-reserva-turnos.md#E5-1`
- **Archivos:** migración SQL
- **Cambios de base de datos:** tabla `reviews`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `repositories/reviewsRepository.ts`
- **Tipos:** `Review`
- **Criterios de aceptación:**
  - [ ] No se puede insertar dos reviews para el mismo `appointment_id`

---

### E6-2 — Generación del token único al pasar a "Realizado"
- **Objetivo:** habilitar el link de calificación solo cuando corresponde.
- **Descripción:** trigger sobre `appointments` que genera `rating_token` (uuid) cuando el
  estado cambia a `realizado` y aún no tiene token.
- **Depende de:** `05-reserva-turnos.md#E5-1`
- **Archivos:** migración SQL (trigger)
- **Cambios de base de datos:** trigger `trg_generate_rating_token`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Marcar un turno como "Cancelado" o "No asistió" nunca genera token

---

### E6-3 — Página pública de valoración vía token
- **Objetivo:** que el paciente califique sin loguearse, usando el link recibido.
- **Descripción:** ruta que recibe el token, valida contra `submit_review` (RPC), muestra
  formulario de puntaje + comentario.
- **Depende de:** E6-2
- **Archivos:** `app/valoracion/[token]/page.tsx`
- **Cambios de base de datos:** función `submit_review(token, rating, comment)`
- **Componentes nuevos:** `features/reviews/components/ReviewForm.tsx`
- **Páginas nuevas:** `/valoracion/[token]`
- **Hooks:** `useSubmitReview`
- **Servicios/Repos:** `reviewsService.submit`
- **Tipos:** `ReviewInput`
- **Criterios de aceptación:**
  - [ ] Un token ya usado o inexistente muestra un mensaje claro, no un error genérico
  - [ ] Un turno cancelado o no asistido no tiene token válido, por lo tanto no es calificable

---

### E6-4 — Cálculo de promedio por profesional
- **Objetivo:** mostrar rating agregado en el perfil público.
- **Descripción:** función/consulta que calcula promedio y cantidad de reviews; cachear en
  `professionals.average_rating` (actualizado por trigger o recalculado on-demand).
- **Depende de:** E6-1
- **Archivos:** migración SQL
- **Cambios de base de datos:** función `get_professional_rating(professional_id)` o trigger de
  recálculo
- **Componentes nuevos:** `features/reviews/components/RatingSummary.tsx`
- **Páginas nuevas:** —
- **Hooks:** `useProfessionalRating`
- **Servicios/Repos:** `reviewsRepository`
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] El promedio mostrado coincide con el cálculo manual sobre `reviews`

---

### E6-5 — Profesional destacado del mes
- **Objetivo:** feature de destaque automático basado en calificaciones.
- **Descripción:** función que determina el profesional con mejor promedio (con mínimo de
  reviews para evitar sesgo) dentro del mes en curso; se muestra en la landing.
- **Depende de:** E6-4
- **Archivos:** migración SQL, componente de destacados en `features/professionals`
- **Cambios de base de datos:** función `get_featured_professional_of_month()`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** `useFeaturedProfessionalOfMonth`
- **Servicios/Repos:** `professionalsRepository`
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Con menos de un mínimo definido de reviews, un profesional no puede ser destacado
        automáticamente
