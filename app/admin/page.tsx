import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { getBangkokNowParts } from "@/lib/time";
import { getAdminDashboardDataAction } from "@/lib/actions/admin.actions";
import { AdminDashboard } from "@/components/features/admin/admin-dashboard";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminPage() {
  const authCheck = await requireAdminSession();
  if (!authCheck.authorized) {
    redirect(ROUTES.LOGIN);
  }

  const { dateStr: todayDateStr } = getBangkokNowParts();
  const dashboardResult = await getAdminDashboardDataAction({
    bookingDate: todayDateStr,
    staffId: "ALL",
    status: "ALL",
  });

  if (!dashboardResult.success) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-red-700">
          {dashboardResult.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <AdminDashboard
      initialDate={todayDateStr}
      initialData={dashboardResult.data}
      adminName={authCheck.session.user.name}
    />
  );
}
