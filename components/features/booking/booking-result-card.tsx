"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
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
import { useCancelCustomerBookingMutation } from "@/hooks/mutations/use-booking-mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BookingSummaryDTO } from "@/types";

interface BookingResultCardProps {
  booking: BookingSummaryDTO;
  isNewBooking?: boolean;
}

export function BookingResultCard({
  booking: initialBooking,
  isNewBooking = false,
}: BookingResultCardProps) {
  const router = useRouter();
  const [booking, setBooking] = React.useState<BookingSummaryDTO>(initialBooking);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const cancelMutation = useCancelCustomerBookingMutation();

  const handleConfirmCancel = async () => {
    if (cancelMutation.isPending) return;
    setFeedback(null);

    const res = await cancelMutation.mutateAsync({
      bookingCode: booking.bookingCode,
      lineId: booking.lineId,
    });

    setConfirmOpen(false);

    if (!res.success) {
      setFeedback({ type: "error", text: res.message });
      return;
    }

    setBooking(res.data);
    setFeedback({
      type: "success",
      text: "ยกเลิกการจองคิวเรียบร้อยแล้ว ระบบได้ส่งแจ้งเตือนไปยัง LINE ของคุณ",
    });
    router.refresh();
  };

  const statusVariant =
    booking.status === BOOKING_STATUS.CONFIRMED
      ? "default"
      : booking.status === BOOKING_STATUS.COMPLETED
      ? "success"
      : "destructive";

  const querySuffix = `?line_id=${encodeURIComponent(booking.lineId)}`;

  return (
    <div className="space-y-4">
      {isNewBooking && booking.status === BOOKING_STATUS.CONFIRMED && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
            <div className="space-y-1">
              <p className="font-bold text-sm">จองคิวสำเร็จเรียบร้อยแล้ว!</p>
              <p className="text-xs text-teal-800 flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                ระบบได้ส่งบัตรคิว (Flex Message) ไปยังแชท LINE ของคุณแล้ว
              </p>
            </div>
          </div>
        </div>
      )}

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

      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs text-slate-500">รหัสการจอง (Booking Code)</span>
              <h1 className="text-2xl font-extrabold tracking-wide text-teal-700">
                {booking.bookingCode}
              </h1>
            </div>
            <Badge variant={statusVariant}>
              {BOOKING_STATUS_LABELS[booking.status]}
            </Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500">บริการ:</span>
              <span className="font-semibold text-slate-900 text-right">
                {booking.serviceName} ({booking.durationMinutes} นาที)
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                วันที่:
              </span>
              <span className="font-semibold text-slate-900">
                {formatThaiDate(booking.bookingDate)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                เวลา:
              </span>
              <span className="font-bold text-teal-700">
                {booking.startTime} – {booking.endTime} น.
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-teal-600" />
                พนักงานนวด:
              </span>
              <span className="font-semibold text-slate-900 text-right">
                {booking.staffName}
                {booking.wasAnyStaff && (
                  <span className="block text-[11px] font-normal text-slate-500">
                    (ระบบจัดสรรจากตัวเลือกพนักงานคนใดก็ได้)
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500">ชื่อผู้จอง:</span>
              <span className="font-semibold text-slate-900">
                {booking.customerName}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="font-semibold text-slate-700">ราคาค่าบริการ:</span>
              <span className="text-lg font-bold text-teal-700">
                {formatCurrency(booking.price)} บาท
              </span>
            </div>
          </div>

          {booking.status === BOOKING_STATUS.CONFIRMED && (
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-2">
              <p>
                กรุณามาถึงร้านก่อนเวลานัดหมายประมาณ 5–10 นาที หากต้องการยกเลิกคิว
                สามารถกดยกเลิกได้ล่วงหน้าอย่างน้อย {APP_CONFIG.cancelMinHoursBefore}{" "}
                ชั่วโมงก่อนเวลาเริ่ม
              </p>
              {booking.canCancel ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4" />
                  ยกเลิกการจองคิวนี้
                </Button>
              ) : (
                <p className="font-medium text-amber-700">
                  * รายการนี้อยู่ในช่วงน้อยกว่า {APP_CONFIG.cancelMinHoursBefore}{" "}
                  ชั่วโมงก่อนเวลาเริ่ม จึงไม่สามารถกดยกเลิกผ่านเว็บได้
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2.5 sm:flex-row pt-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`${ROUTES.MY_BOOKINGS}${querySuffix}`}>
                ดูรายการจองของฉันทั้งหมด
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href={`${ROUTES.BOOKING}${querySuffix}`}>จองคิวเพิ่ม</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการยกเลิกคิว {booking.bookingCode}</DialogTitle>
            <DialogDescription>
              คุณต้องการยกเลิกคิว <strong>{booking.serviceName}</strong> วันที่{" "}
              {formatThaiDate(booking.bookingDate)} เวลา {booking.startTime}–
              {booking.endTime} น. ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => setConfirmOpen(false)}
            >
              ปิดหน้าต่าง
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
                "ยืนยันการยกเลิกคิว"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
