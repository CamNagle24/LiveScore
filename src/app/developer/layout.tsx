import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/isAdmin";

/**
 * Server-side admin guard for the developer dashboard (defense in depth on top
 * of middleware). Non-admins never receive the dashboard HTML.
 */
export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/developer");
  if (!isAdmin(user.email)) redirect("/landing");

  return <>{children}</>;
}
