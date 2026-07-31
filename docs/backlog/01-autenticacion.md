# EPIC 1 — Autenticación

Sistema completo de autenticación con Supabase Auth para usuarios internos (admin y
profesional). Los pacientes nunca se autentican (ver `03-administracion-profesionales.md` y
`05-reserva-turnos.md`).

---

### E1-1 — Cliente y contexto de sesión
- **Objetivo:** exponer la sesión autenticada al resto de la app.
- **Descripción:** crear un provider/hook que exponga usuario, perfil y rol actuales, apoyado
  en `lib/supabase/client.ts` y `server.ts` ya existentes.
- **Depende de:** `00-fundamentos.md#E0-1`
- **Archivos:** `features/auth/services/sessionService.ts`, `features/auth/hooks/useSession.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `features/auth/components/SessionProvider.tsx`
- **Páginas nuevas:** —
- **Hooks:** `useSession`, `useCurrentProfile`
- **Servicios/Repos:** `sessionService`, `repositories/profilesRepository.ts`
- **Tipos:** `Session`, `AuthUser`
- **Criterios de aceptación:**
  - [ ] `useSession` devuelve `null` si no hay usuario, y `{user, profile, role}` si lo hay
  - [ ] La sesión persiste tras un refresh de página

---

### E1-2 — Login funcional (adaptar `components/login-form.tsx`)
- **Objetivo:** que admin y profesional puedan iniciar sesión.
- **Descripción:** adaptar el formulario ya provisto por el starter para usar `sessionService`,
  mostrar errores de credenciales, y redirigir según rol tras éxito.
- **Depende de:** E1-1, `02-roles.md#E2-2`
- **Archivos:** `app/auth/login/page.tsx`, `features/auth/components/LoginForm.tsx` (reemplaza
  a `components/login-form.tsx`)
- **Cambios de base de datos:** —
- **Componentes nuevos:** `LoginForm` (movido/adaptado)
- **Páginas nuevas:** — (reutiliza `/auth/login` existente)
- **Hooks:** `useLogin`
- **Servicios/Repos:** `sessionService`
- **Tipos:** `LoginInput`
- **Criterios de aceptación:**
  - [ ] Login exitoso redirige a `/admin` o `/profesional` según rol
  - [ ] Credenciales inválidas muestran error sin crashear

---

### E1-3 — Cierre de sesión
- **Objetivo:** permitir logout desde cualquier pantalla protegida.
- **Descripción:** adaptar `components/logout-button.tsx` para invalidar sesión y redirigir a
  `/`.
- **Depende de:** E1-1
- **Archivos:** `features/auth/components/LogoutButton.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `LogoutButton` (adaptado)
- **Páginas nuevas:** —
- **Hooks:** `useLogout`
- **Servicios/Repos:** `sessionService`
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Tras logout, acceder a una ruta protegida redirige a login

---

### E1-4 — Recuperación de contraseña
- **Objetivo:** flujo completo de "olvidé mi contraseña".
- **Descripción:** adaptar `forgot-password-form.tsx` y `update-password-form.tsx` ya
  existentes al `sessionService`, validar el flujo end-to-end con Supabase Auth (email de
  recupero real).
- **Depende de:** E1-1
- **Archivos:** `app/auth/forgot-password/page.tsx`, `app/auth/update-password/page.tsx`,
  `features/auth/components/ForgotPasswordForm.tsx`,
  `features/auth/components/UpdatePasswordForm.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** — (adaptación de existentes)
- **Páginas nuevas:** —
- **Hooks:** `useForgotPassword`, `useUpdatePassword`
- **Servicios/Repos:** `sessionService`
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Se recibe el email de recupero y el link permite fijar nueva contraseña

---

### E1-5 — Protección de rutas por middleware
- **Objetivo:** bloquear acceso no autenticado/no autorizado a `/admin/**` y `/profesional/**`.
- **Descripción:** extender `proxy.ts` (ya corregido para excluir `.pdf`) para: dejar pasar
  rutas públicas (`/`, `/profesionales/*`, `/reservar/*`, `/valoracion/*`, `/auth/*`), exigir
  sesión en `/admin/**` y `/profesional/**`, y verificar rol correcto por sección.
- **Depende de:** E1-1, `02-roles.md#E2-1`
- **Archivos:** `proxy.ts`, `lib/supabase/proxy.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** `sessionService`
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Un profesional autenticado no puede entrar a `/admin/**` (redirige)
  - [ ] Un usuario no autenticado no puede entrar a ninguna de las dos áreas

---

### E1-6 — Eliminar/ocultar sign-up público
- **Objetivo:** evitar auto-registro, ya que solo el admin crea cuentas internas.
- **Descripción:** quitar el link a `/auth/sign-up` de cualquier navegación visible; dejar la
  ruta técnica solo si se reutiliza internamente para alta de profesionales (ver
  `03-administracion-profesionales.md#E3-2`), o eliminarla si no aplica.
- **Depende de:** `03-administracion-profesionales.md#E3-2`
- **Archivos:** `app/auth/sign-up/page.tsx`, `app/auth/sign-up-success/page.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] No existe ningún flujo público de auto-registro accesible desde la UI
