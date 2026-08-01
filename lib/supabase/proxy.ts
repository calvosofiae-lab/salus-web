import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import type { Database, UserRole } from "@/types/database";

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  professional: "/profesional",
};

// Cachea el rol para no consultar `profiles` en cada navegación dentro de /admin o
// /profesional (el proxy corre en cada transición client-side del App Router, no solo en el
// primer load). TTL corto para acotar cuánto puede tardar en notarse un cambio de rol; si
// cambia el usuario logueado, el userId adentro de la cookie no matchea y se recalcula.
const ROLE_CACHE_COOKIE = "salus_role_cache";
const ROLE_CACHE_MAX_AGE_SECONDS = 5 * 60;

function readCachedRole(request: NextRequest, userId: string): UserRole | null {
  const raw = request.cookies.get(ROLE_CACHE_COOKIE)?.value;
  if (!raw) return null;

  const [cachedUserId, cachedRole] = raw.split(":");
  if (cachedUserId !== userId) return null;
  if (cachedRole !== "admin" && cachedRole !== "professional") return null;

  return cachedRole;
}

function setRoleCacheCookie(response: NextResponse, userId: string, role: UserRole) {
  response.cookies.set(ROLE_CACHE_COOKIE, `${userId}:${role}`, {
    maxAge: ROLE_CACHE_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/profesionales" ||
    pathname.startsWith("/profesionales/") ||
    pathname === "/valoracion" ||
    pathname.startsWith("/valoracion/")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const pathname = request.nextUrl.pathname;

  if (!user) {
    // Sin usuario no debería haber cookie de rol vigente (ver logout), pero se limpia acá
    // también por las dudas de que haya quedado una de una sesión anterior sin cerrar bien.
    supabaseResponse.cookies.delete(ROLE_CACHE_COOKIE);

    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.cookies.delete(ROLE_CACHE_COOKIE);
      return redirectResponse;
    }
    return supabaseResponse;
  }

  const requiresAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const requiresProfessional =
    pathname === "/profesional" || pathname.startsWith("/profesional/");

  if (requiresAdmin || requiresProfessional) {
    let role = readCachedRole(request, user.sub);

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.sub)
        .single();

      role = profile?.role ?? null;
      if (role) {
        setRoleCacheCookie(supabaseResponse, user.sub, role);
      }
    }

    if (!role || (requiresAdmin && role !== "admin") || (requiresProfessional && role !== "professional")) {
      const url = request.nextUrl.clone();
      url.pathname = role ? ROLE_HOME[role] : "/auth/login";
      const redirectResponse = NextResponse.redirect(url);
      if (role) {
        setRoleCacheCookie(redirectResponse, user.sub, role);
      }
      return redirectResponse;
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
