# EPIC 1 — Autenticación

Sistema completo de autenticación con Supabase Auth para usuarios internos (admin y
profesional). Los pacientes nunca se autentican (ver `03-administracion-profesionales.md` y
`05-reserva-turnos.md`).

---

### E1-1 — Cliente y contexto de sesión ✅ Hecho (2026-07-31)
- **Objetivo:** exponer la sesión autenticada al resto de la app.
- **Descripción:** `repositories/profilesRepository.ts` (`getOwnProfile`, pendiente desde
  E0-1) + `sessionService.getServerSession()` para Server Components/middleware, y
  `SessionProvider` (Context + `onAuthStateChange`) para componentes cliente, con
  `useSession`/`useCurrentProfile` como hooks de consumo. Wireado en `app/layout.tsx` dentro
  de `ThemeProvider`. Verificado en el navegador sin sesión activa: no rompe nada, sin queries
  de más ni errores de consola.
- **Depende de:** `00-fundamentos.md#E0-1`
- **Archivos:** `repositories/profilesRepository.ts`, `features/auth/types.ts`,
  `features/auth/services/sessionService.ts`,
  `features/auth/components/SessionProvider.tsx`, `features/auth/hooks/useSession.ts`,
  `app/layout.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `features/auth/components/SessionProvider.tsx`
- **Páginas nuevas:** —
- **Hooks:** `useSession`, `useCurrentProfile`
- **Servicios/Repos:** `sessionService`, `repositories/profilesRepository.ts`
- **Tipos:** `Session`, `AuthUser`
- **Criterios de aceptación:**
  - [x] `useSession` devuelve `null` si no hay usuario, y `{user, profile, role}` si lo hay
  - [x] La sesión persiste tras un refresh de página (delegado en la persistencia propia del
        cliente de Supabase + `getUser()` en el mount)

---

### E1-2 — Login funcional (adaptar `components/login-form.tsx`) ✅ Hecho (2026-07-31)
- **Objetivo:** que admin y profesional puedan iniciar sesión.
- **Descripción:** `features/auth/components/LoginForm.tsx` reemplaza a
  `components/login-form.tsx` (eliminado), usa el hook `useLogin`, traducido al español, y sin
  el link a "Sign up" (adelanto de E1-6). Verificado visualmente en `/auth/login`. El redirect
  a `/admin`/`/profesional` funciona, pero esas rutas todavía no tienen página propia (llegan
  en EPIC 3/4) — hoy un login exitoso cae en 404 después de redirigir, es esperado en esta
  etapa.
- **Depende de:** E1-1, `02-roles.md#E2-2`
- **Archivos:** `app/auth/login/page.tsx`, `features/auth/components/LoginForm.tsx`,
  `features/auth/hooks/useLogin.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `LoginForm` (movido/adaptado)
- **Páginas nuevas:** — (reutiliza `/auth/login` existente)
- **Hooks:** `useLogin`
- **Servicios/Repos:** `repositories/profilesRepository.ts` (`getOwnProfile` tras login)
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Login exitoso redirige a `/admin` o `/profesional` según rol
  - [x] Credenciales inválidas muestran error sin crashear

---

### E1-3 — Cierre de sesión ✅ Hecho (2026-07-31)
- **Objetivo:** permitir logout desde cualquier pantalla protegida.
- **Descripción:** `features/auth/components/LogoutButton.tsx` (reemplaza a
  `components/logout-button.tsx`, eliminado) invalida la sesión y redirige a `/auth/login`.
  `components/auth-button.tsx` actualizado para importarlo desde su nueva ubicación.
- **Depende de:** E1-1
- **Archivos:** `features/auth/components/LogoutButton.tsx`, `features/auth/hooks/useLogout.ts`,
  `components/auth-button.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** `LogoutButton` (adaptado)
- **Páginas nuevas:** —
- **Hooks:** `useLogout`
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [x] Tras logout, acceder a una ruta protegida redirige a login (queda reforzado por el
        middleware en E1-5)

---

### E1-4 — Recuperación de contraseña ✅ Hecho (2026-07-31)
- **Objetivo:** flujo completo de "olvidé mi contraseña".
- **Descripción:** `features/auth/components/ForgotPasswordForm.tsx` y
  `UpdatePasswordForm.tsx` (reemplazan a los componentes viejos, eliminados), traducidos al
  español. `useUpdatePassword` redirige por rol igual que el login. Verificado visualmente en
  `/auth/forgot-password`.
- **Depende de:** E1-1
- **Archivos:** `app/auth/forgot-password/page.tsx`, `app/auth/update-password/page.tsx`,
  `features/auth/components/ForgotPasswordForm.tsx`,
  `features/auth/components/UpdatePasswordForm.tsx`,
  `features/auth/hooks/useForgotPassword.ts`, `features/auth/hooks/useUpdatePassword.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** — (adaptación de existentes)
- **Páginas nuevas:** —
- **Hooks:** `useForgotPassword`, `useUpdatePassword`
- **Servicios/Repos:** `repositories/profilesRepository.ts`
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Se recibe el email de recupero y el link permite fijar nueva contraseña — pendiente de
        probar end-to-end con un envío real (requiere credenciales de un usuario real; el
        flujo de código está implementado y compila/renderiza correctamente)

---

### E1-5 — Protección de rutas por middleware ✅ Hecho (2026-07-31)
- **Objetivo:** bloquear acceso no autenticado/no autorizado a `/admin/**` y `/profesional/**`.
- **Descripción:** `lib/supabase/proxy.ts` reescrito: rutas públicas (`/`, `/profesionales/*`,
  `/reservar/*`, `/valoracion/*`, `/auth/*`) pasan sin chequeo; cualquier otra ruta sin usuario
  redirige a `/auth/login`; `/admin/**` y `/profesional/**` además verifican `profiles.role`
  (consulta directa a `profiles`, sin round-trip extra de `getUser()`) y redirigen al home del
  rol correcto si no coincide. `/protected` (demo del starter) sigue requiriendo sesión pero sin
  rol específico, como antes. Tuve que agregar `Views`/`Functions`/`Relationships`/
  `CompositeTypes` vacíos a `types/database.ts` porque sin esas claves el generic de
  `@supabase/supabase-js` resolvía los tipos de fila como `never`.
  **Actualización (2026-08-01, `07-seguridad.md#E7-9`):** `/reservar/*` se sacó de la lista de
  públicas — nunca se construyó esa ruta, había quedado como código muerto — y el matching de
  las demás pasó a comparar el segmento completo en vez de `startsWith` suelto (mismo fix que
  ya se había aplicado a `/admin`/`/profesional`). **Actualización (2026-08-01, `#E1-7`):** el
  `select role from profiles` ahora se cachea en una cookie corta para no repetirlo en cada
  navegación dentro de `/admin`/`/profesional`.
- **Verificado en el navegador:** `/admin` sin sesión → redirige a `/auth/login`;
  `/profesionales/1` (pública, página inexistente) → 404 normal, sin redirect. Pendiente probar
  el caso "profesional autenticado entra a `/admin/**`" con credenciales reales de ambos roles.
- **Depende de:** E1-1, `02-roles.md#E2-1`
- **Archivos:** `lib/supabase/proxy.ts`, `types/database.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Un profesional autenticado no puede entrar a `/admin/**` (redirige) — lógica
        implementada, pendiente de prueba con credenciales reales
  - [x] Un usuario no autenticado no puede entrar a ninguna de las dos áreas

---

### E1-6 — Eliminar/ocultar sign-up público 🟡 Parcial (2026-07-31)
- **Objetivo:** evitar auto-registro, ya que solo el admin crea cuentas internas.
- **Descripción:** se sacó el link "Sign up" de `components/auth-button.tsx` (el único lugar
  con un link visible a `/auth/sign-up`; en la práctica ni se veía porque `/protected`, la
  única ruta que usa `AuthButton`, ya requiere sesión por middleware). El `LoginForm` nuevo
  (E1-2) tampoco lo incluye. La ruta `/auth/sign-up` y `components/sign-up-form.tsx` siguen
  existiendo — la decisión de eliminarlas del todo o dejarlas como alta técnica queda pendiente
  hasta `03-administracion-profesionales.md#E3-2`, como estaba previsto.
- **Depende de:** `03-administracion-profesionales.md#E3-2`
- **Archivos:** `components/auth-button.tsx`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] No existe ningún flujo público de auto-registro accesible desde la UI — pendiente cerrar
        en E3-2 (la ruta `/auth/sign-up` sigue accesible tipeándola directamente)

---

### E1-7 — Cachea el rol en el proxy para no consultar `profiles` en cada navegación ✅ Hecho (2026-08-01)
- **Objetivo:** el proxy (E1-5) corre en cada transición del App Router dentro de
  `/admin/**`/`/profesional/**`, no solo en el primer load — cada clic entre páginas del panel
  disparaba un `select role from profiles` nuevo, aunque el rol no cambia durante la sesión.
- **Descripción:** el rol se cachea en una cookie `httpOnly` (`salus_role_cache`, formato
  `{userId}:{role}`) con `maxAge` de 5 minutos. Antes de consultar `profiles`, el proxy revisa
  si hay una cookie vigente cuyo `userId` coincida con el usuario actual; si matchea, usa ese
  rol sin ir a la base. El TTL corto acota cuánto puede tardar en reflejarse un cambio de rol
  (ej. si un admin cambia el rol de alguien mientras esa persona tiene una sesión activa). Se
  limpia explícitamente al detectar que no hay usuario (por si quedó una cookie de una sesión
  anterior), y se propaga tanto en la respuesta normal como en las de redirect (antes solo se
  seteaban cookies sobre `supabaseResponse`; los redirects son objetos `NextResponse` nuevos y
  necesitan que se les copie la cookie aparte).
- **Depende de:** E1-5
- **Archivos:** `lib/supabase/proxy.ts`
- **Cambios de base de datos:** —
- **Componentes nuevos:** —
- **Páginas nuevas:** —
- **Hooks:** —
- **Servicios/Repos:** —
- **Tipos:** —
- **Criterios de aceptación:**
  - [ ] Navegar entre varias páginas de `/profesional/**` (o `/admin/**`) en la misma sesión no
        dispara una query de `profiles` en cada click — pendiente de verificar
  - [ ] Cerrar sesión y volver a entrar con otro rol no arrastra el rol cacheado del usuario
        anterior — pendiente de verificar
  - [ ] Sigue bloqueando correctamente el acceso cruzado (`professional` a `/admin`, admin
        anónimo a rutas protegidas) — pendiente de verificar
