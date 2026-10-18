"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  User,
  XCircle,
} from "lucide-react";
import {
  APP_CONFIG,
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
  ROUTES,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { formatThaiDate } from "@/lib/time";
import { useMyBookingsQuery } from "@/hooks/queries/use-booking-queries";
import { useCancelCustomerBookingMutation } from "@/hooks/mutations/use-booking-mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BookingSummaryDTO } from "@/types";

interface MyBookingsListProps {
  initialLineId: string;
  initialCustomerName: string;
  initialBookings: BookingSummaryDTO[];
}

export function MyBookingsList({
  initialLineId,
  initialCustomerName,
  initialBookings,
}: MyBookingsListProps) {
  const [targetCancelBooking, setTargetCancelBooking] =
    React.useState<BookingSummaryDTO | null>(null);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const myBookingsQuery = useMyBookingsQuery(
    initialLineId,
    Boolean(initialLineId)
  );
  const cancelMutation = useCancelCustomerBookingMutation();

  const bookings = myBookingsQuery.data?.bookings ?? initialBookings;
  const customerName =
    myBookingsQuery.data?.customerName ?? initialCustomerName;
  const querySuffix = initialLineId
    ? `?line_id=${encodeURIComponent(initialLineId)}`
    : "";

  const handleConfirmCancel = async () => {
    if (!targetCancelBooking || cancelMutation.isPending) return;
    setFeedback(null);

    const res = await cancelMutation.mutateAsync({
      bookingCode: targetCancelBooking.bookingCode,
      lineId: targetCancelBooking.lineId,
    });

    setTargetCancelBooking(null);

    if (!res.success) {
      setFeedback({ type: "error", text: res.message });
      return;
    }

    setFeedback({
      type: "success",
      text: `ยกเลิกรายการจอง ${res.data.bookingCode} เรียบร้อยแล้ว และส่งแจ้งเตือนทาง LINE แล้ว`,
    });
    await myBookingsQuery.refetch();
  };

  if (!initialLineId) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-base font-bold text-slate-900">
            กรุณาเปิดหน้านี้จากลิงก์ใน LINE Official Account
          </p>
          <p className="text-xs text-slate-500">
            เพื่อความปลอดภัยและป้องกันการเข้าถึงข้อมูลส่วนบุคคลของผู้อื่น
            ระบบจะแสดงเฉพาะรายการจองที่ผูกกับบัญชี LINE ของคุณเท่านั้น
          </p>
          <div className="pt-2">
            <Button asChild>
              <Link href={ROUTES.BOOKING}>ไปหน้าจองคิว</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            รายการจองของฉัน {customerName ? `(${customerName})` : ""}
          </h1>
          <p className="text-xs text-slate-500">
            ยกเลิกคิวที่ยังไม่เริ่มได้ล่วงหน้าอย่างน้อย{" "}
            {APP_CONFIG.cancelMinHoursBefore} ชั่วโมงก่อนเวลาเริ่ม
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`${ROUTES.BOOKING}${querySuffix}`}>
            <CalendarPlus className="h-4 w-4" />
            จองคิวใหม่
          </Link>
        </Button>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        </div>
      )}

      {myBookingsQuery.isLoading && bookings.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-800">
              ยังไม่มีรายการจองคิวในระบบ
            </p>
            <p className="text-xs text-slate-500">
              คุณสามารถเลือกบริการนวดและวันเวลาที่ต้องการได้ทันที
            </p>
            <div className="pt-1">
              <Button asChild>
                <Link href={`${ROUTES.BOOKING}${querySuffix}`}>
                  จองคิวครั้งแรกของคุณ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((item) => {
            const statusVariant =
              item.status === BOOKING_STATUS.CONFIRMED
                ? "default"
                : item.status === BOOKING_STATUS.COMPLETED
                ? "success"
                : "destructive";

            return (
              <Card key={item.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`${ROUTES.BOOKING_DETAIL(
                          item.bookingCode
                        )}${querySuffix}`}
                        className="font-bold text-teal-700 hover:underline"
                      >
                        {item.bookingCode}
                      </Link>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-700">
                        {formatCurrency(item.price)} ฿
                      </span>
                    </div>
                    <Badge variant={statusVariant}>
                      {BOOKING_STATUS_LABELS[item.status]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 sm:grid-cols-2">
                    <div className="font-semibold text-sm text-slate-900 sm:col-span-2">
                      {item.serviceName} ({item.durationMinutes} นาที)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-teal-600" />
                      <span>{formatThaiDate(item.bookingDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-teal-700">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      <span>
                        เวลา {item.startTime} – {item.endTime} น.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <User className="h-3.5 w-3.5 text-teal-600" />
                      <span>พนักงาน: {item.staffName}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`${ROUTES.BOOKING_DETAIL(
                          item.bookingCode
                        )}${querySuffix}`}
                      >
                        ดูใบจอง
                      </Link>
                    </Button>

                    {item.status === BOOKING_STATUS.CONFIRMED &&
                      (item.canCancel ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setTargetCancelBooking(item)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          ยกเลิกคิว
                        </Button>
                      ) : (
                        <span className="text-[11px] text-amber-700">
                          ยกเลิกล่วงหน้าอย่างน้อย {APP_CONFIG.cancelMinHoursBefore} ชม.
                        </span>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={Boolean(targetCancelBooking)}
        onOpenChange={(open) => {
          if (!open) setTargetCancelBooking(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ยืนยันการยกเลิกคิว {targetCancelBooking?.bookingCode}
            </DialogTitle>
            <DialogDescription>
              คุณต้องการยกเลิกรายการ{" "}
              <strong>{targetCancelBooking?.serviceName}</strong> วันที่{" "}
              {targetCancelBooking
                ? formatThaiDate(targetCancelBooking.bookingDate)
                : ""}{" "}
              เวลา {targetCancelBooking?.startTime}–
              {targetCancelBooking?.endTime} น. ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => setTargetCancelBooking(null)}
            >
              ไม่ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={handleConfirmCancel}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังยกเลิก...
                </>
              ) : (
                "ยืนยันยกเลิกคิว"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
