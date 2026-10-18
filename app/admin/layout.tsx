import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import { ERROR_MESSAGES, ROUTES } from "@/lib/constants";
import { PublicHeader } from "@/components/layouts/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authCheck = await requireAdminSession();

  if (!authCheck.authorized) {
    if (authCheck.reason === "UNAUTHENTICATED") {
      redirect(ROUTES.LOGIN);
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader />
        <main className="mx-auto max-w-md p-4 pt-12">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <h1 className="text-lg font-bold text-red-600">
                403 Unauthorized
              </h1>
              <p className="text-sm text-slate-600">
                {ERROR_MESSAGES.FORBIDDEN}
              </p>
              <Button asChild className="w-full">
                <Link href={ROUTES.BOOKING}>กลับไปหน้าจองคิว</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <PublicHeader />
      <main className="mx-auto max-w-6xl p-4 pt-6">{children}</main>
    </div>
  );
}
