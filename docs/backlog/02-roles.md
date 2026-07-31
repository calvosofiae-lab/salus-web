# EPIC 2 — Roles

Tres roles conceptuales: **Administrador**, **Profesional** y **Paciente**. Los roles con
autenticación (`user_role`) aplican únicamente a usuarios internos (admin y profesional); los
pacientes no se autentican para reservar un turno.

---

### E2-1 — Políticas base por rol (helper de verificación)
- **Objetivo:** tener una forma única de chequear "¿es admin?" / "¿es profesional dueño de X?"
  tanto en server como en RLS.
- **Descripción:** crear función SQL `is_admin()` / `owns_professional(professional_id)`
  reutilizable en políticas RLS, y su contraparte TS en `sessionService`.
- **Depende de:** `00-fundamentos.md#E0-1`
- **Archivos:** migración SQL, `features/auth/services/sessionService.ts`
- **Cambios de base de datos:** funciones SQL `is_admin()`, `owns_professional(uuid)`
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `sessionService`
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] `is_admin()` devuelve correctamente según `profiles.role`

---

### E2-2 — Redirección post-login según rol
- **Objetivo:** cada rol cae en su home correspondiente.
- **Descripción:** tras login exitoso, admin → `/admin`, profesional → `/profesional`.
- **Depende de:** `01-autenticacion.md#E1-2`, E2-1
- **Archivos:** `features/auth/hooks/useLogin.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** `useLogin`
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Redirección correcta verificada para ambos roles

---

### E2-3 — Guard de UI por rol
- **Objetivo:** ocultar/mostrar elementos de navegación según rol sin depender solo del
  middleware.
- **Descripción:** componente `<RoleGate roles={[...]}>` que renderiza children solo si el rol
  coincide.
- **Depende de:** `01-autenticacion.md#E1-1`
- **Archivos:** `features/auth/components/RoleGate.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `RoleGate`
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Un profesional no ve enlaces de administración en el layout compartido

---

### E2-4 — Alta de usuarios internos sin self-signup
- **Objetivo:** que solo el admin pueda crear cuentas (admin o profesional).
- **Descripción:** cubierto funcionalmente en `03-administracion-profesionales.md#E3-2` (alta
  de profesional crea también su usuario de auth); esta tarea solo documenta la regla de
  negocio y bloquea cualquier otro punto de entrada.
- **Depende de:** `01-autenticacion.md#E1-6`
- **Archivos:** —
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] No existe endpoint/RPC que permita crear un `profiles` con rol distinto de
        `professional` salvo ejecutado por un admin
