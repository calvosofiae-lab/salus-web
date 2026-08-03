# SALUS

Sistema de agenda y turnos online para profesionales de salud mental (psicólogos y
psiquiatras). Permite a pacientes buscar profesionales por provincia, ciudad, modalidad y
obra social/particular, reservar turnos sin necesidad de cuenta, y calificar la atención
recibida mediante un link único. Los profesionales gestionan su disponibilidad y agenda desde
un panel propio, y un rol admin administra el alta y edición de profesionales.

Construido con Next.js (App Router) y Supabase (Postgres + Auth + RLS), sin backend
independiente: toda la lógica de negocio vive en la app Next.js y en funciones RPC
`SECURITY DEFINER` de Supabase para las operaciones críticas (reservar un turno, calificar).

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Supabase](https://supabase.com) — Postgres, Auth (cookies vía `@supabase/ssr`), Row Level
  Security, funciones RPC y Storage (fotos de profesionales)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com/) (`components/ui`)

## Estructura del proyecto

El proyecto sigue una convención de capas documentada en detalle en
[`docs/architecture.md`](./docs/architecture.md):

```
app/            Rutas (App Router). Lo más "delgado" posible: compone componentes de
                features/ y llama hooks. Sin lógica de negocio ni queries directas a Supabase.

components/     UI compartida y agnóstica de dominio (incluye components/ui de shadcn y
                components/salus, la landing pública).

features/       Una carpeta por dominio funcional: auth, professionals, appointments,
                reviews, admin. Cada una con sus propios components/hooks/services/types.

repositories/   Acceso a datos puro contra Supabase (queries y RPCs), un archivo por entidad.
                Es la única capa que conoce el esquema real de la base.

services/       Lógica de negocio cross-feature.

lib/            Clientes de Supabase (lib/supabase/client.ts, server.ts) y utilidades
                generales.

types/          Tipos compartidos, incluyendo el Database generado por Supabase.

supabase/       Migraciones SQL (esquema, RLS, funciones RPC, triggers) y config local.

docs/           Arquitectura, modelo de datos y backlog de desarrollo (docs/backlog).
```

## Funcionalidades

- **Búsqueda pública de profesionales** por provincia, ciudad, modalidad (virtual/presencial)
  y cobertura (particular/obra social), sin necesidad de cuenta.
- **Reserva de turnos** de forma pública, con cálculo de horarios disponibles cruzando
  disponibilidad, bloqueos y turnos ya reservados, y protección anti doble-reserva a nivel
  de base de datos y de función RPC.
- **Calificaciones** vía link único (`/valoracion/[token]`) generado automáticamente cuando un
  turno pasa a estado "realizado".
- **Panel de profesional** (`/profesional`): edición de perfil, configuración de
  disponibilidad semanal y bloqueos puntuales, y gestión de la agenda de turnos.
- **Panel de administración** (`/admin`): alta, edición y baja de profesionales, incluyendo la
  creación del usuario de Supabase Auth asociado.
- **Autenticación** basada en cookies (`@supabase/ssr`) con dos roles: `admin` y
  `professional`, resueltos server-side contra la tabla `profiles`.

## Requisitos

- Node.js 18+
- Un proyecto de [Supabase](https://database.new)

## Configuración local

1. Clonar el repositorio e instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env.local` y completar con los datos de tu proyecto de Supabase
   (Project Settings → API):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=[URL del proyecto]
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[clave publishable o anon]
   ```

3. Aplicar las migraciones de `supabase/migrations` al proyecto de Supabase (vía
   [Supabase CLI](https://supabase.com/docs/guides/cli) o pegando el SQL en el SQL Editor del
   dashboard, en orden). Ver [`docs/data-model.md`](./docs/data-model.md) para el esquema
   completo, funciones RPC y triggers.

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   La app queda disponible en [localhost:3000](http://localhost:3000).

## Scripts disponibles

| Script          | Descripción                          |
| --------------- | ------------------------------------- |
| `npm run dev`   | Servidor de desarrollo (Next.js)      |
| `npm run build` | Build de producción                   |
| `npm run start` | Sirve el build de producción          |
| `npm run lint`  | Linting con ESLint                    |

## Documentación

- [`docs/architecture.md`](./docs/architecture.md) — convención de carpetas y reglas de
  dependencia entre capas
- [`docs/data-model.md`](./docs/data-model.md) — esquema de base de datos, funciones RPC y
  triggers
- [`docs/backlog/`](./docs/backlog) — planificación por EPIC del desarrollo (autenticación,
  roles, administración de profesionales, agenda, reserva de turnos, calificaciones,
  seguridad)
