import { getBookingInitialDataAction } from "@/lib/actions/booking.actions";
import { PublicHeader } from "@/components/layouts/public-header";
import { BookingWizard } from "@/components/features/booking/booking-wizard";
import { Card, CardContent } from "@/components/ui/card";

interface BookingPageProps {
  searchParams: Promise<{ line_id?: string }>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const lineIdParam = params.line_id?.trim() ?? "";

  const initialDataResult = await getBookingInitialDataAction(lineIdParam);

  if (!initialDataResult.success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader lineId={lineIdParam} />
        <main className="mx-auto max-w-xl p-4 pt-6">
          <Card>
            <CardContent className="p-6 text-center text-sm text-red-700">
              {initialDataResult.message}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { services, staffs, defaultCustomerName, resolvedLineId } =
    initialDataResult.data;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <PublicHeader lineId={resolvedLineId} />
      <main className="mx-auto max-w-xl p-4 pt-5">
        <BookingWizard
          services={services}
          staffs={staffs}
          defaultCustomerName={defaultCustomerName}
          initialLineId={resolvedLineId}
        />
      </main>
    </div>
  );
}
