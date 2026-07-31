# EPIC 2 — Roles

Tres roles conceptuales: **Administrador**, **Profesional** y **Paciente**. Los roles con
autenticación (`user_role`) aplican únicamente a usuarios internos (admin y profesional); los
pacientes no se autentican para reservar un turno.

---

### E2-1 — Políticas base por rol (helper de verificación) ✅ Hecho (2026-07-31)
- **Objetivo:** tener una forma única de chequear "¿es admin?" / "¿es profesional dueño de X?"
  tanto en server como en RLS.
- **Descripción:** funciones SQL `is_admin()` y `owns_professional(professional_id)`, ambas
  `SECURITY DEFINER` con `search_path` fijo. Verificado vía RPC (anon) que `is_admin()`
  devuelve `false` para usuario anónimo.
- **Depende de:** `00-fundamentos.md#E0-1`
- **Archivos:** `supabase/migrations/20260731065748_create_role_helper_functions.sql`
- **Cambios de base de datos:** funciones SQL `is_admin()`, `owns_professional(uuid)`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** — (se consumen directamente como RPC de Postgres, no hay wrapper TS
  todavía; se agrega si hace falta cuando se escriban las políticas RLS de E7)
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] `is_admin()` devuelve correctamente según `profiles.role`

---

### E2-2 — Redirección post-login según rol ✅ Hecho (2026-07-31)
- **Objetivo:** cada rol cae en su home correspondiente.
- **Descripción:** tras login exitoso, admin → `/admin`, profesional → `/profesional`. Falta
  que esas rutas existan como página (EPIC 3/4); el redirect en sí ya funciona.
- **Depende de:** `01-autenticacion.md#E1-2`, E2-1
- **Archivos:** `features/auth/hooks/useLogin.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** `useLogin`
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Redirección correcta verificada para ambos roles (lógica; pendiente probar con
        credenciales reales de ambos roles una vez existan las páginas de destino)

---

### E2-3 — Guard de UI por rol ✅ Hecho (2026-07-31)
- **Objetivo:** ocultar/mostrar elementos de navegación según rol sin depender solo del
  middleware.
- **Descripción:** `features/auth/components/RoleGate.tsx` renderiza `children` solo si
  `session.role` está en la lista de `roles` pasada. Todavía no tiene ningún consumidor real
  (no existe layout compartido de `/admin` o `/profesional` todavía) — se usa recién cuando se
  construyan esos layouts en EPIC 3/4.
- **Depende de:** `01-autenticacion.md#E1-1`
- **Archivos:** `features/auth/components/RoleGate.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `RoleGate`
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Un profesional no ve enlaces de administración en el layout compartido — pendiente
        hasta que exista ese layout (EPIC 3/4)

---

### E2-4 — Alta de usuarios internos sin self-signup ✅ Verificado (2026-07-31)
- **Objetivo:** que solo el admin pueda crear cuentas (admin o profesional).
- **Descripción:** hoy no existe ningún endpoint/RPC que permita elegir el rol al crear un
  usuario: el trigger `handle_new_user` (E0-1) siempre crea el `profile` con rol `professional`
  por defecto, y la única forma de tener un `admin` es la `update` manual que hicimos en
  Supabase. Cubierto funcionalmente del todo cuando se implemente
  `03-administracion-profesionales.md#E3-2`.
- **Depende de:** `01-autenticacion.md#E1-6`
- **Archivos:** —
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] No existe endpoint/RPC que permita crear un `profiles` con rol distinto de
        `professional` salvo ejecutado por un admin (verificado: no hay ningún RPC de este
        tipo todavía en la base)
