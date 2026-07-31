# EPIC 6 — Sistema de calificaciones

Valoraciones vía link único, generado cuando un turno pasa a estado "Realizado".

---

### E6-1 — Modelo de reviews ✅ Hecho (2026-07-31)
- **Objetivo:** tabla de calificaciones vinculada 1 a 1 con un turno.
- **Descripción:** `reviews` con `appointment_id` único. Lectura pública habilitada (para
  mostrar testimonios/promedio); sin política de `insert` para nadie — la única vía de
  escritura es la RPC `submit_review` (E6-3). **Verificado**: la review de prueba quedó
  visible vía anon key.
- **Depende de:** `05-reserva-turnos.md#E5-1`
- **Archivos:** `supabase/migrations/20260731090000_create_reviews_table.sql`
- **Cambios de base de datos:** tabla `reviews`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `repositories/reviewsRepository.ts`
- **Tipos:** `Review`
- **Criterios de aceptación:**
  - [x] No se puede insertar dos reviews para el mismo `appointment_id` (constraint único)

---

### E6-2 — Generación del token único al pasar a "Realizado" ✅ Hecho (2026-07-31)
- **Objetivo:** habilitar el link de calificación solo cuando corresponde.
- **Descripción:** trigger `trg_generate_rating_token` sobre `appointments`, genera
  `rating_token` (uuid) solo la primera vez que el estado pasa a `realizado`. **Verificado**:
  un turno de prueba llevado a `realizado` generó el token
  (`19def6e5-ceb7-44ce-8247-4ca740746466`), que después se usó con éxito en E6-3.
- **Depende de:** `05-reserva-turnos.md#E5-1`
- **Archivos:** `supabase/migrations/20260731090002_create_rating_token_trigger.sql`
- **Cambios de base de datos:** trigger `trg_generate_rating_token`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Marcar un turno como "Cancelado" o "No asistió" nunca genera token (la condición
        `new.status = 'realizado'` del trigger lo garantiza)

---

### E6-3 — Página pública de valoración vía token ✅ Hecho (2026-07-31)
- **Objetivo:** que el paciente califique sin loguearse, usando el link recibido.
- **Descripción:** `app/valoracion/[token]/page.tsx` (Server Component + `<Suspense>`, mismo
  patrón que otras rutas dinámicas por `cacheComponents`) renderiza `ReviewForm`, que llama a
  la RPC `submit_review`. **Bug encontrado y corregido durante la prueba:** las estrellas de
  puntaje usaban el glifo Unicode "★", que en Windows/Chrome se renderiza con un emoji a color
  fijo e ignora el `text-color` de Tailwind — se veían todas negras sin importar la selección.
  Se reemplazó por el ícono `Star` de `lucide-react` (con `fill`/`stroke` controlados por
  props), que sí refleja la selección visualmente. **Probado por mí mismo de punta a punta**
  (formulario público, sin credenciales): calificación de 5 estrellas con comentario enviada
  correctamente; reintentar el mismo token después devuelve "Este turno ya fue calificado."
- **Depende de:** E6-2
- **Archivos:** `app/valoracion/[token]/page.tsx`, `app/valoracion/[token]/review-page-content.tsx`,
  `features/reviews/components/ReviewForm.tsx`, `features/reviews/hooks/useSubmitReview.ts`,
  `repositories/reviewsRepository.ts` (`submitReview`),
  `supabase/migrations/20260731090119_create_submit_review_function.sql`
- **Cambios de base de datos:** función `submit_review(token, rating, comment)`
- **Componentes nuevos:** `features/reviews/components/ReviewForm.tsx`
- **Páginas nuevas:** `/valoracion/[token]`
- **Hooks:** `useSubmitReview`
- **Servicios/Repos:** `reviewsRepository.submitReview`
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Un token ya usado o inexistente muestra un mensaje claro, no un error genérico
  - [x] Un turno cancelado o no asistido no tiene token válido, por lo tanto no es calificable
        (la RPC además revalida `status = 'realizado'` explícitamente, doble seguro)

---

### E6-4 — Cálculo de promedio por profesional ✅ Hecho (2026-07-31)
- **Objetivo:** mostrar rating agregado en el perfil público.
- **Descripción:** en vez de una función a demanda, se optó por un **trigger** que recalcula y
  cachea el promedio en `professionals.average_rating` (columna ya existente desde E0-4) cada
  vez que se inserta una review — evita recalcular en cada lectura del perfil. `RatingSummary`
  simplemente muestra ese campo, ya presente en cualquier fetch de `professionals`. **Verificado**:
  tras la review de 5 estrellas, `average_rating` pasó a `5.00` y se ve en `/profesionales/[id]`
  como "⭐ 5.0 / 5".
- **Depende de:** E6-1
- **Archivos:** `supabase/migrations/20260731090121_create_professional_rating_trigger.sql`,
  `features/reviews/components/RatingSummary.tsx`
- **Cambios de base de datos:** función y trigger `update_professional_average_rating`
- **Componentes nuevos:** `features/reviews/components/RatingSummary.tsx`
- **Páginas nuevas:** —
- **Hooks:** — (no hizo falta un hook aparte: el promedio ya viaja en `Professional.average_rating`)
- **Servicios/Repos:** `reviewsRepository.getReviewsForProfessional` (listado de testimonios,
  disponible aunque todavía no tiene UI propia)
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] El promedio mostrado coincide con el cálculo manual sobre `reviews` (verificado: 1
        review de 5 → `average_rating = 5.00`)

---

### E6-5 — Profesional destacado del mes ✅ Hecho (2026-07-31)
- **Objetivo:** feature de destaque automático basado en calificaciones.
- **Descripción:** RPC `get_featured_professional_of_month()` exige **mínimo 3 reviews** dentro
  del mes en curso antes de considerar a un profesional, ordena por promedio y devuelve el
  mejor. Es una señal **independiente** de `professionals.is_featured` (el destaque manual del
  admin, EPIC 3): se muestra como una sección aparte (`FeaturedOfMonthBanner`) en la landing,
  sin reemplazar el destaque manual existente. **Verificado**: con una sola review cargada,
  la RPC devuelve `null` (no alcanza el mínimo) y el banner correctamente no se muestra; no se
  llegó a probar el caso positivo (requeriría 3 reviews reales en el mes).
- **Depende de:** E6-4
- **Archivos:**
  `supabase/migrations/20260731090202_create_featured_professional_of_month_function.sql`,
  `features/professionals/components/FeaturedOfMonthBanner.tsx`,
  `features/professionals/hooks/useFeaturedProfessionalOfMonth.ts`, `app/page.tsx`
- **Cambios de base de datos:** función `get_featured_professional_of_month()`
- **Componentes nuevos:** `features/professionals/components/FeaturedOfMonthBanner.tsx`
- **Páginas nuevas:** —
- **Hooks:** `useFeaturedProfessionalOfMonth`
- **Servicios/Repos:** `reviewsRepository.getFeaturedProfessionalOfMonth`,
  `professionalsRepository.getPublicProfessionalById`
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Con menos de un mínimo definido de reviews (3), un profesional no puede ser destacado
        automáticamente (verificado: con 1 review, la RPC devuelve `null`)
