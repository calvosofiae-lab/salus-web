# Backlog SALUS — Sistema de agenda para profesionales de salud

Este backlog cubre la construcción completa del sistema (autenticación, roles, administración
de profesionales, agenda, reservas, calificaciones y seguridad) sobre la base Next.js +
Supabase ya migrada. No incluye código, solo la planificación: objetivo, dependencias,
archivos, cambios de base de datos y criterios de aceptación de cada tarea.

Documentos de referencia (leer antes de las tareas):
- [`docs/architecture.md`](../architecture.md) — convención de carpetas (`app/`, `components/`,
  `features/`, `repositories/`, `services/`, `hooks/`, `types/`, `lib/`)
- [`docs/data-model.md`](../data-model.md) — esquema de base de datos objetivo, RPCs y triggers

## Estado (2026-07-31)

**Backlog completo: EPIC 0 a 7 implementadas y probadas, incluyendo `E0-9`.** Todo el sistema
(auth, roles, admin de profesionales, agenda, reserva pública de turnos, calificaciones, RLS)
corre sobre Supabase real y fue probado de punta a punta (reserva de turno de prueba, cambio de
estado, calificación con estrellas, auditoría de RLS con la anon key). La tabla legacy
`profesionales` fue respaldada (`docs/backups/profesionales_backup_20260731.json`) y borrada.
No queda ninguna tarea abierta de este backlog inicial; el desarrollo a partir de acá son
mejoras/features nuevas sobre esta base.

## Índice de EPICs

| Epic | Archivo | Contenido |
|---|---|---|
| 0 | [00-fundamentos.md](./00-fundamentos.md) | Base de datos y arquitectura (prerequisito de todo) |
| 1 | [01-autenticacion.md](./01-autenticacion.md) | Login, logout, recuperación de contraseña, sesión |
| 2 | [02-roles.md](./02-roles.md) | Admin / Profesional, guards, redirecciones |
| 3 | [03-administracion-profesionales.md](./03-administracion-profesionales.md) | CRUD de profesionales |
| 4 | [04-agenda-profesional.md](./04-agenda-profesional.md) | Disponibilidad, calendario, estados de turno |
| 5 | [05-reserva-turnos.md](./05-reserva-turnos.md) | Flujo público de reserva de turnos |
| 6 | [06-calificaciones.md](./06-calificaciones.md) | Sistema de reviews vía link único |
| 7 | [07-seguridad.md](./07-seguridad.md) | RLS y políticas de acceso |

## Decisiones registradas

1. **EPIC 0 fue agregado** como prerequisito técnico (no estaba en el pedido original) porque
   ninguna otra epic puede empezar sin el esquema de roles ni la reestructuración de carpetas.
2. **La tabla legacy `profesionales` no se toca.** Se crea `professionals` (esquema nuevo, en
   paralelo), se migran los datos una sola vez, y `profesionales` se elimina recién al final de
   todo el proyecto (tarea `E0-9`), después de la auditoría de seguridad de EPIC 7.
3. **El rol se resuelve consultando `profiles` server-side**, no con JWT custom claims —
   más simple, sin depender de una feature beta de Supabase.
4. **No hay backend independiente.** Toda la lógica vive en Next.js (server components/route
   handlers) y Supabase (RLS + funciones RPC `SECURITY DEFINER` para operaciones críticas como
   reservar un turno o calificar).

## Orden sugerido de ejecución

```
EPIC 0 completo
  └─▶ EPIC 1 + EPIC 2 (en paralelo)
        └─▶ EPIC 3
              └─▶ EPIC 5 (E5-1) + EPIC 4 (E4-1, E4-2) en paralelo
                    └─▶ E4-3 (cálculo de slots)
                          └─▶ EPIC 5 (resto) + EPIC 4 (resto)
                                └─▶ EPIC 6 completo
                                      └─▶ EPIC 7 (aunque en un desarrollo real conviene ir
                                          escribiendo las políticas epic por epic, no dejar
                                          todo para el final)
                                            └─▶ E0-9 (baja de la tabla legacy `profesionales`)
```

## Convención de IDs de tareas

Cada tarea tiene un ID `E{n}-{m}` (ej. `E3-2`). Se usa para referenciar dependencias entre
tareas de distintas epics sin repetir el título completo.
