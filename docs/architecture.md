# Arquitectura del proyecto SALUS

Convención de carpetas a respetar en todo el backlog (`docs/backlog/`). El objetivo es que el
dominio (reglas de negocio) quede separado de la UI y del acceso a datos, para que el proyecto
sea modular y fácil de mantener a medida que crecen los EPICs.

```
app/                    Rutas (App Router de Next.js). Lo más "delgado" posible: compone
                        componentes de features/ y llama hooks. No debe contener lógica de
                        negocio ni queries a Supabase directamente.

components/             UI compartida y agnóstica de dominio (botones, cards, layout, etc.).
                        Incluye el sistema de componentes shadcn ya instalado (components/ui).

features/                Una carpeta por dominio funcional:
  auth/                   - login, logout, recuperación de contraseña, sesión
  professionals/          - alta/edición/listado de profesionales, perfil público
  appointments/           - disponibilidad, agenda, reserva de turnos
  reviews/                - calificaciones
  admin/                  - vistas y componentes exclusivos del rol admin

  Cada feature puede tener internamente:
    components/           componentes propios del dominio
    hooks/                hooks propios del dominio (consumen services/repositories)
    services/             lógica de negocio y orquestación (validaciones, mapeos)
    types/                tipos propios del dominio (si no son compartidos)

repositories/            Acceso a datos puro contra Supabase (queries y llamadas a RPC).
                        Un archivo por entidad (ej. professionalsRepository.ts,
                        appointmentsRepository.ts). Sin lógica de negocio: solo lectura/
                        escritura tipada.

services/               Lógica de negocio cross-feature, cuando no pertenece claramente a
                        una sola feature (ej. cálculo de estadísticas globales).

hooks/                  Hooks compartidos, no atados a una feature (ej. useDebounce).

types/                  Tipos compartidos entre features (Database generado por Supabase,
                        Role, ApiResult, etc.).

lib/                    Clientes de Supabase (ya existente: lib/supabase/client.ts,
                        server.ts) y utilidades generales (lib/utils.ts).
```

## Reglas de dependencia

- Los componentes de página (`app/**/page.tsx`) **no llaman a Supabase directamente**: usan
  hooks de `features/*/hooks`.
- Los **hooks** llaman a **services** (o directamente a **repositories** cuando no hay lógica
  de negocio adicional que orquestar).
- Los **repositories** son la única capa que conoce el esquema real de Supabase (nombres de
  tablas, columnas, RPCs). Si el esquema cambia, solo se toca el repository correspondiente.
- Ninguna tabla sensible (turnos, calificaciones) se consulta con la anon key sin pasar por
  RLS o por una función RPC `SECURITY DEFINER` cuando la operación lo requiere (ver
  `docs/backlog/07-seguridad.md`).

## Estado de esta convención

Al momento de escribir este documento, el proyecto todavía tiene componentes de la landing
(`components/salus/*`) consultando Supabase directamente. La tarea **E0-7** del backlog cubre
la migración de esos componentes a la convención descripta acá.
