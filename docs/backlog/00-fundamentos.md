# EPIC 0 — Fundamentos: base de datos y arquitectura

Prerequisito técnico de todas las demás epics. Ver [`docs/data-model.md`](../data-model.md)
para el detalle completo del esquema y [`docs/architecture.md`](../architecture.md) para la
convención de carpetas.

---

### E0-1 — Definir y migrar esquema de roles y perfiles ✅ Hecho (2026-07-31)
- **Objetivo:** habilitar el concepto de usuario interno con rol.
- **Descripción:** crear enum `user_role`, crear tabla `profiles` (verificado vía API que no
  existe todavía en el proyecto de Supabase) con columna `role`, y crear manualmente el primer
  perfil `admin` para pruebas.
- **Depende de:** —
- **Archivos:** `supabase/migrations/20260731061806_create_profiles_and_roles.sql`
- **Cambios de base de datos:** enum `user_role`; `create table profiles` (con RLS "ver/editar
  mi propio perfil" habilitada desde el inicio, adelanto de E7-1) y trigger
  `on_auth_user_created` que crea el `profile` automáticamente al registrarse un usuario
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `repositories/profilesRepository.ts` (pendiente, se crea cuando haga
  falta en E1-1)
- **Tipos:** `Role`, `Profile`
- **Criterios de aceptación:**
  - [x] El enum existe y `profiles.role` tiene default `professional`
  - [x] Existe al menos un perfil con rol `admin` creado manualmente para pruebas

---

### E0-2 — Reestructurar carpetas del proyecto ✅ Hecho (2026-07-31)
- **Objetivo:** dejar el esqueleto de carpetas listo antes de sumar features.
- **Descripción:** crear `features/{auth,professionals,appointments,reviews,admin}`,
  `repositories/`, `services/`, `types/` en la raíz; mover `lib/salus/constants.ts` a
  `features/professionals/constants.ts` como parte del reacomodo (sin tocar su contenido en
  esta tarea; el contenido se actualiza en `E0-8`).
- **Depende de:** —
- **Archivos:** estructura de carpetas nueva, `lib/salus/constants.ts` → movido a
  `features/professionals/constants.ts`, imports actualizados en
  `components/salus/featured-professionals.tsx`, `professional-card.tsx`, `search-section.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] `npm run build` sigue funcionando tras el movimiento (imports actualizados)
  - [ ] No queda lógica de dominio suelta directamente en `components/` — parcial: el
        esqueleto de carpetas ya existe, pero `components/salus/*` todavía llama a Supabase
        directamente; eso se termina de resolver en `E0-6`/`E0-7`

---

### E0-3 — Tipado generado desde Supabase ✅ Hecho (2026-07-31, tipado a mano)
- **Objetivo:** tener tipos TS confiables del esquema real.
- **Descripción:** en vez de `supabase gen types typescript` (requiere CLI vinculado con
  credenciales que todavía no tenemos, ver decisión en el README del backlog), se tipeó a mano
  `types/database.ts` reflejando exactamente la migración `E0-1` aplicada (`profiles` +
  enum `user_role`). Se puede reemplazar por la salida real del CLI en cualquier momento sin
  romper nada, siempre que coincida con el esquema aplicado.
- **Depende de:** E0-1
- **Archivos:** `types/database.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** `Database`, `UserRole`
- **Criterios de aceptación:**
  - [x] `Database` tipa correctamente `profiles` (se amplía con `professionals` en E0-4)
  - [x] Los clientes de Supabase (`lib/supabase/client.ts` y `server.ts`) usan
        `createClient<Database>`

---

### E0-4 — Crear tabla nueva `professionals` (sin tocar `profesionales`) ✅ Hecho (2026-07-31)
- **Objetivo:** tener el esquema limpio de profesionales, en paralelo, sin afectar la tabla
  legacy.
- **Descripción:** crear la tabla `professionals` desde cero con columnas en inglés/snake_case
  (ver `docs/data-model.md`). La tabla `profesionales` **no se modifica ni se borra** en esta
  tarea. Se agregaron además `gender_trained` y `consultation_fee` (decisión tomada al ver los
  datos reales de `profesionales`, que tenían columnas no contempladas en el diseño original).
  RLS habilitada desde el inicio con lectura pública de `is_active = true` (adelanto de E7-2);
  sin políticas de escritura todavía.
- **Depende de:** E0-1
- **Archivos:** `supabase/migrations/20260731062509_create_professionals_table.sql`,
  `supabase/migrations/20260731062717_add_professional_extra_fields.sql`
- **Cambios de base de datos:** `create table professionals (...)` (tabla nueva, independiente
  de `profesionales`)
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** `Professional`
- **Criterios de aceptación:**
  - [x] `profesionales` sigue existiendo intacta y sin cambios de esquema
  - [x] `professionals` existe vacía, lista para recibir datos

---

### E0-5 — Migración de datos `profesionales` → `professionals` ✅ Hecho (2026-07-31)
- **Objetivo:** no perder los profesionales ya cargados (ej. "Sol Nogueira") al pasar al
  esquema nuevo.
- **Descripción:** script de migración (one-time) que lee `profesionales` y escribe en
  `professionals`, mapeando `Nombre_y_apellido→full_name`, `Profesion→profession`,
  `Matricula→license_number`, `Genero→gender`, `Descripcion→description`, `photo→photo_url`,
  `Whatsapp→whatsapp`, `Destacado→is_featured`, `Obra_social→coverage[]`,
  `Modalidad→modality[]`, `Motivo_de_consulta→consultation_reasons[]`, `Ubicacion→location`,
  `Capacitacion_en_genero→gender_trained`, `Valor_de_consulta→consultation_fee`. Se migraron
  las 4 filas existentes (2 son datos de prueba: "Sofia Prueba"/"Celeste Prueba"; no se
  filtraron, se migraron tal cual).
- **Bug encontrado y corregido:** la normalización de `profession` no era insensible a
  acentos (`ilike '%psicolog%'` no matcheaba "Psicóloga"/"Psicólogo/a" por la posición del
  acento). Corregido con `translate()` antes de comparar, tanto en el script de migración como
  con una migración de fix aplicada sobre los datos ya insertados
  (`20260731063028_fix_profession_normalization.sql`). Verificado: las 4 filas quedaron con
  `profession` en (`psicologo`, `psiquiatra`).
- **Depende de:** E0-4
- **Archivos:** `supabase/migrations/20260731062720_migrate_legacy_profesionales_data.sql`,
  `supabase/migrations/20260731063028_fix_profession_normalization.sql`
- **Cambios de base de datos:** `insert into professionals select ... from profesionales`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Cantidad de filas en `professionals` == cantidad de filas relevantes migradas (4)
  - [x] `profesionales` permanece intacta y sin filas borradas todavía

---

### E0-6 — Repositorio de `professionals` sobre el esquema nuevo ✅ Hecho (2026-07-31)
- **Objetivo:** que el código deje de depender de la tabla legacy y de cualquier mapeo de
  nombres de columna en español.
- **Descripción:** crear `repositories/professionalsRepository.ts` apuntando a `professionals`
  (nombres de columna directos, sin necesidad de mapeo). Implementado con `getFeaturedProfessionals()`
  (con fallback a los primeros 3 activos si no hay destacados) y `searchProfessionals(filters)`
  ya usando operadores de array (`.contains()`), adelantando también E0-8 en el mismo archivo
  para no reescribirlo dos veces.
- **Depende de:** E0-5, E0-3
- **Archivos:** `repositories/professionalsRepository.ts`, `features/professionals/types.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `professionalsRepository`
- **Tipos:** `Professional`, `ProfessionalFilters`
- **Criterios de aceptación:**
  - [x] El repositorio consulta `professionals`, nunca `profesionales`

---

### E0-7 — Migrar componentes de landing al nuevo repositorio/esquema ✅ Hecho (2026-07-31)
- **Objetivo:** que la landing pública deje de leer `profesionales` directamente.
- **Descripción:** reescribí `components/salus/featured-professionals.tsx` y
  `components/salus/search-section.tsx` para usar `professionalsRepository` (vía hooks
  `useFeaturedProfessionals`/`useProfessionalSearch`) en lugar de llamar `supabase.from(...)`
  inline con los nombres de columna viejos. `components/salus/professional-card.tsx` ahora lee
  los campos con los nombres nuevos (`full_name`, `photo_url`, `profession`, `modality[]`, etc.).
  Verificado en el navegador: la landing muestra "Sofia Prueba" y "Sol Nogueira" leyendo de
  `professionals`, sin errores de consola.
- **Depende de:** E0-6
- **Archivos:** `components/salus/featured-professionals.tsx`,
  `components/salus/search-section.tsx`, `components/salus/professional-card.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** `features/professionals/hooks/useFeaturedProfessionals.ts`,
  `useProfessionalSearch.ts`
- **Servicios/Repos:** `professionalsRepository`
- **Tipos:** `Professional`
- **Criterios de aceptación:**
  - [x] La landing muestra los mismos profesionales que antes, ahora leyendo de `professionals`
  - [x] Ningún componente de UI referencia `profesionales` ni `CAMPOS`

---

### E0-8 — Adaptar filtros de búsqueda a columnas tipo array ✅ Hecho (2026-07-31)
- **Objetivo:** que el buscador funcione con `coverage`, `modality` y `consultation_reasons`
  como `text[]` en vez de texto libre con `ilike`.
- **Descripción:** la lógica de filtros en `search-section.tsx` / `professionalsRepository` usa
  `.contains()` para `modality`/`coverage`/`consultation_reasons` (arrays) y sigue usando
  `.ilike()` solo donde el dato de origen sigue siendo texto libre real (`location`, `gender`).
  `features/professionals/constants.ts` reemplazó el mapeo `CAMPOS` por listas de opciones
  (`PROFESSION_OPTIONS`, `MODALITY_OPTIONS`, `COVERAGE_OPTIONS`, `GENDER_OPTIONS`,
  `CONSULTATION_REASONS`) que coinciden con los valores reales de `professionals`.
- **Depende de:** E0-7
- **Archivos:** `components/salus/search-section.tsx`, `features/professionals/constants.ts`,
  `repositories/professionalsRepository.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `professionalsRepository.search`
- **Tipos:** `ProfessionalFilters`
- **Criterios de aceptación:**
  - [x] Filtrar por "Presencial" devuelve profesionales cuyo array `modality` contiene
        `presencial`, sin falsos positivos de texto libre (verificado en el navegador: solo
        devolvió a "Sofia Prueba")

---

### E0-9 — Baja de la tabla legacy `profesionales` (al final del proyecto)
- **Objetivo:** limpiar la base una vez que todo el sistema nuevo esté validado en producción.
- **Descripción:** confirmar que ningún código (front, RPCs, reportes) referencia ya
  `profesionales`, y recién ahí ejecutar `drop table profesionales`. Es la única tarea de este
  backlog que se hace literalmente al final, después de EPIC 7.
- **Depende de:** `07-seguridad.md#E7-6` y de todas las demás epics completas
- **Archivos:** migración SQL final
- **Cambios de base de datos:** `drop table profesionales`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Búsqueda de "profesionales" (la tabla) en todo el repo no arroja resultados antes de
        borrarla
  - [ ] Backup/export de la tabla tomado antes del `drop`, por las dudas
