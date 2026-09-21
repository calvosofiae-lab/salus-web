# Modelo de datos objetivo

Referencia única de esquema para todas las tareas del backlog (`docs/backlog/`). Este
documento describe el diseño a construir; no es una migración ejecutada todavía.

## Decisión clave: tabla legacy `profesionales`

La tabla `profesionales` (existente en Supabase, con datos reales ya cargados) **no se
modifica ni se borra** durante el desarrollo. Se crea un esquema nuevo en paralelo
(`professionals`, en inglés/snake_case) y los datos se migran una sola vez (tarea E0-5).
`profesionales` queda de solo lectura/histórico y se elimina recién al final de todo el
proyecto (tarea E0-9), una vez validado que nada la referencia.

## Enums

- `user_role`: `admin` | `professional`
- `appointment_status`: `reservado` | `realizado` | `cancelado` | `no_asistio`

## Tablas nuevas

### `profiles` (tabla nueva — verificado que no existe todavía en el proyecto de Supabase)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | FK a `auth.users.id` |
| role | user_role | default `professional` |
| full_name | text | |
| created_at | timestamptz | default now() |

### `professionals` (tabla nueva, no relacionada por FK con `profesionales`)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| profile_id | uuid, único, nullable | FK a `profiles.id`; null hasta que el profesional tenga cuenta propia |
| full_name | text | |
| profession | text | `psicologo` \| `psiquiatra` |
| license_number | text | matrícula |
| gender | text, nullable | |
| description | text | |
| photo_url | text | |
| whatsapp | text | |
| coverage | text[] | `particular`, `obra_social` |
| modality | text[] | `virtual`, `presencial` |
| consultation_reasons | text[] | motivos de consulta |
| province | text, nullable | FK a `provinces.id` (mismo dropdown que usa el buscador público) |
| city | text, nullable | valor de `cities.name` para la provincia elegida, o `"General"` = toda la provincia; solo relevante si `presencial` está en `modality` |
| is_active | boolean | default true |
| is_premium | boolean | default false; plan pago, solo lo edita un admin |
| is_featured_of_month | boolean | default false; "destacado del mes", selección manual del admin, máximo 2 a la vez (`enforce_featured_of_month_limit`) |
| average_rating | numeric | cacheado, recalculado desde `reviews` |
| gender_trained | boolean, nullable | migrado de `profesionales.Capacitacion_en_genero`; no estaba en el diseño original, se agregó al migrar datos reales (E0-5) |
| consultation_fee | numeric, nullable | precio de la sesión; se carga/edita desde `ProfessionalForm` (alta, edición admin y "Mi perfil") |
| created_at | timestamptz | default now() |

### `availability_rules`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| professional_id | uuid | FK a `professionals.id` |
| day_of_week | smallint | 1–6 (lunes a sábado; SALUS no atiende domingos, `check` a nivel DB) |
| start_time | time | |
| end_time | time | |

### `availability_blocks`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| professional_id | uuid | FK a `professionals.id` |
| start_date | date | inicio del rango bloqueado (un rango de 1 día = `start_date = end_date`) |
| end_date | date | fin del rango bloqueado; `check (end_date >= start_date)`; sin solapar con otro rango del mismo profesional (trigger) |
| reason | text, nullable | |

### `appointments`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| professional_id | uuid | FK a `professionals.id` |
| appointment_date | date | |
| start_time | time | |
| end_time | time | siempre `start_time + 1h` |
| status | appointment_status | default `reservado` |
| patient_first_name | text | |
| patient_last_name | text | |
| patient_whatsapp | text | |
| rating_token | uuid, único, nullable | generado por trigger al pasar a `realizado` |
| reviewed | boolean | default false |
| created_at | timestamptz | |

Constraint único: `(professional_id, appointment_date, start_time)` — primera barrera
anti doble-reserva a nivel base de datos.

### `provinces`
| Columna | Tipo | Notas |
|---|---|---|
| id | text PK | nombre de la provincia (ej. `"CABA"`, `"Santa Fe"`), coincide con `professionals.province` |
| created_at | timestamptz | |

Datos oficiales (24 provincias), cargados por migración desde la API Georef (`datos.gob.ar`).

### `cities`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| province_id | text | FK a `provinces.id` |
| name | text | nombre del municipio/localidad oficial |
| created_at | timestamptz | |

Único `(province_id, name)`. 2256 filas cargadas por migración desde Georef (municipios oficiales;
localidades como fallback en Santa Cruz y Santiago del Estero, que no tienen municipios formales).
Reemplaza las constantes hardcodeadas `PROVINCIAS` / `CIUDADES_POR_PROVINCIA` — los selects de
provincia/ciudad (buscador público y formulario de alta/edición de profesional) ahora se alimentan
de estas tablas.

### `reviews`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| appointment_id | uuid, único | FK a `appointments.id` |
| professional_id | uuid | FK a `professionals.id` (denormalizado para queries simples) |
| rating | smallint | 1–5 |
| comment | text, nullable | |
| created_at | timestamptz | |

## Funciones RPC (`SECURITY DEFINER` donde corresponde)

| Función | Uso |
|---|---|
| `get_available_slots(professional_id, date)` | calcula horarios libres cruzando disponibilidad, bloqueos y turnos existentes |
| `book_appointment(professional_id, date, start_time, first_name, last_name, whatsapp)` | reserva atómica con validación anti doble-reserva |
| `update_appointment_status(appointment_id, status)` | cambia estado; dispara generación de `rating_token` |
| `submit_review(token, rating, comment)` | valida token y registra la calificación |
| `get_professional_rating(professional_id)` | promedio de calificaciones |
| `get_professional_report()` | tabla por profesional (rating promedio, cantidad de reviews, turnos por estado) para el panel de admin |
| `admin_create_professional(...)` | alta de profesional + su usuario de Supabase Auth, solo ejecutable por admin |

## Triggers

- `trg_generate_rating_token`: `BEFORE UPDATE ON appointments`, cuando `status` cambia a
  `realizado` y `rating_token IS NULL` → asigna `gen_random_uuid()`.

## Verificación de rol (sin JWT custom claims)

El rol del usuario autenticado se resuelve consultando `profiles` server-side (vía RLS "ver mi
propio perfil"), no mediante un Auth Hook de JWT. Es más simple y evita depender de una feature
beta de Supabase; queda anotado como posible optimización futura si el volumen de checks lo
justifica.
