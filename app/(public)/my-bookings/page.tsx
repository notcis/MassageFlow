import { getMyBookingsAction } from "@/lib/actions/booking.actions";
import { PublicHeader } from "@/components/layouts/public-header";
import { MyBookingsList } from "@/components/features/booking/my-bookings-list";
import { Card, CardContent } from "@/components/ui/card";

interface MyBookingsPageProps {
  searchParams: Promise<{ line_id?: string }>;
}

export default async function MyBookingsPage({
  searchParams,
}: MyBookingsPageProps) {
  const query = await searchParams;
  const lineIdParam = query.line_id?.trim() ?? "";

  const result = await getMyBookingsAction(lineIdParam);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader lineId={lineIdParam} />
        <main className="mx-auto max-w-xl p-4 pt-6">
          <Card>
            <CardContent className="p-6 text-center text-sm text-red-700">
              {result.message}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { lineId, customerName, bookings } = result.data;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <PublicHeader lineId={lineId} />
      <main className="mx-auto max-w-xl p-4 pt-5">
        <MyBookingsList
          initialLineId={lineId}
          initialCustomerName={customerName}
          initialBookings={bookings}
        />
      </main>
    </div>
  );
}
