import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

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

  const email = user?.email?.toLowerCase() ?? "";
  if (!user) redirect("/login?next=/developer");
  if (!adminEmails().includes(email)) redirect("/landing");

  return <>{children}</>;
}
