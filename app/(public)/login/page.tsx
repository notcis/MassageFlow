import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { ROUTES, USER_ROLES } from "@/lib/constants";
import { PublicHeader } from "@/components/layouts/public-header";
import { AdminLoginForm } from "@/components/features/auth/admin-login-form";

export default async function LoginPage() {
  const session = await getServerSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  if (session?.user && userRole === USER_ROLES.ADMIN) {
    redirect(ROUTES.ADMIN);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-xl items-center justify-center p-4">
        <AdminLoginForm />
      </main>
    </div>
  );
}
