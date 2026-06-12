import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function proxy(request: NextRequest) {
  // Refresh the session and forward any updated auth cookies.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Helper: build a redirect that preserves the refreshed auth cookies.
  const redirectTo = (path: string, withNext = false) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (withNext) url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  // /profile — requires any signed-in user.
  if (pathname.startsWith("/profile") && !user) {
    return redirectTo("/login", true);
  }

  // /developer — requires a signed-in admin.
  if (pathname.startsWith("/developer")) {
    if (!user) return redirectTo("/login", true);
    const email = user.email?.toLowerCase() ?? "";
    if (!adminEmails().includes(email)) return redirectTo("/landing");
  }

  return response;
}

export const config = {
  // Run on protected app routes only.
  matcher: ["/profile/:path*", "/developer/:path*"],
};
