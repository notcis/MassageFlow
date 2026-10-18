import Link from "next/link";
import { getBookingByCodeAction } from "@/lib/actions/booking.actions";
import { ROUTES } from "@/lib/constants";
import { PublicHeader } from "@/components/layouts/public-header";
import { BookingResultCard } from "@/components/features/booking/booking-result-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BookingDetailPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ line_id?: string; new?: string }>;
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: BookingDetailPageProps) {
  const { code } = await params;
  const query = await searchParams;
  const lineIdParam = query.line_id?.trim() ?? "";
  const isNew = query.new === "1";

  const result = await getBookingByCodeAction(code, lineIdParam);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader lineId={lineIdParam} />
        <main className="mx-auto max-w-xl p-4 pt-6">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <h1 className="text-base font-bold text-slate-900">
                {result.message}
              </h1>
              <p className="text-xs text-slate-500">
                กรุณาตรวจสอบรหัสการจอง หรือเปิดจากปุ่มในข้อความ LINE ของคุณ
              </p>
              <Button asChild>
                <Link
                  href={
                    lineIdParam
                      ? `${ROUTES.BOOKING}?line_id=${encodeURIComponent(lineIdParam)}`
                      : ROUTES.BOOKING
                  }
                >
                  ไปหน้าจองคิว
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <PublicHeader lineId={result.data.lineId} />
      <main className="mx-auto max-w-xl p-4 pt-5">
        <BookingResultCard booking={result.data} isNewBooking={isNew} />
      </main>
    </div>
  );
}
