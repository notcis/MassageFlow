"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  ListFilter,
  Loader2,
  LogOut,
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import {
  APP_CONFIG,
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
   type BookingStatusType,
  ROUTES,
} from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { formatThaiDate } from "@/lib/time";
import { authClient } from "@/lib/auth-client";
import { useAdminDashboardQuery } from "@/hooks/queries/use-booking-queries";
import { useUpdateBookingStatusMutation } from "@/hooks/mutations/use-booking-mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { AdminDashboardData, BookingSummaryDTO } from "@/types";

interface AdminDashboardProps {
  initialDate: string;
  initialData: AdminDashboardData;
  adminName: string;
}

export function AdminDashboard({
  initialDate,
  initialData,
  adminName,
}: AdminDashboardProps) {
  const router = useRouter();

  const [bookingDate, setBookingDate] = React.useState<string>(initialDate);
  const [staffId, setStaffId] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<
    BookingStatusType | "ALL"
  >("ALL");
  const [activeTab, setActiveTab] = React.useState<"list" | "schedule">(
    "schedule"
  );
  const [pendingStatusChange, setPendingStatusChange] = React.useState<{
    booking: BookingSummaryDTO;
    nextStatus: BookingStatusType;
  } | null>(null);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const dashboardQuery = useAdminDashboardQuery({
    bookingDate,
    staffId,
    status: statusFilter,
  });

  const updateStatusMutation = useUpdateBookingStatusMutation();

  const data = dashboardQuery.data ?? initialData;

  const handleConfirmStatusUpdate = async () => {
    if (!pendingStatusChange || updateStatusMutation.isPending) return;
    setFeedback(null);

    const res = await updateStatusMutation.mutateAsync({
      bookingId: pendingStatusChange.booking.id,
      status: pendingStatusChange.nextStatus,
    });

    setPendingStatusChange(null);

    if (!res.success) {
      setFeedback({ type: "error", text: res.message });
      return;
    }

    setFeedback({
      type: "success",
      text: `อัปเดตสถานะรหัส ${res.data.bookingCode} เป็น "${
        BOOKING_STATUS_LABELS[res.data.status]
      }" เรียบร้อยแล้ว`,
    });
    await dashboardQuery.refetch();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push(ROUTES.LOGIN);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ระบบจัดการคิวร้าน {APP_CONFIG.name} (Admin)
          </h1>
          <p className="text-xs text-slate-500">
            ผู้ดูแลระบบ: {adminName} • เวลาทำการ {APP_CONFIG.openTime}–
            {APP_CONFIG.closeTime} น. (Asia/Bangkok)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                dashboardQuery.isFetching && "animate-spin"
              )}
            />
            รีเฟรชข้อมูล
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            ออกจากระบบ
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-slate-500">รายการจองทั้งหมด</span>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {data.summary.total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-teal-700">ยืนยันแล้ว (บล็อกคิว)</span>
            <p className="mt-1 text-2xl font-bold text-teal-700">
              {data.summary.confirmed}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-emerald-700">เสร็จสิ้นแล้ว</span>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {data.summary.completed}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-red-600">ยกเลิกแล้ว (คืนคิวว่าง)</span>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {data.summary.cancelled}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="filter-date" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                วันที่จอง
              </Label>
              <div className="flex gap-2">
                <Input
                  id="filter-date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
                {bookingDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBookingDate("")}
                    title="แสดงทุกวัน"
                  >
                    ทุกวัน
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-staff" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-teal-600" />
                พนักงานนวด
              </Label>
              <select
                id="filter-staff"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="ALL">พนักงานทั้งหมด ({data.staffs.length} คน)</option>
                {data.staffs.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-status" className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-teal-600" />
                สถานะการจอง
              </Label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as BookingStatusType | "ALL")
                }
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value={BOOKING_STATUS.CONFIRMED}>
                  CONFIRMED ({BOOKING_STATUS_LABELS.CONFIRMED})
                </option>
                <option value={BOOKING_STATUS.COMPLETED}>
                  COMPLETED ({BOOKING_STATUS_LABELS.COMPLETED})
                </option>
                <option value={BOOKING_STATUS.CANCELLED}>
                  CANCELLED ({BOOKING_STATUS_LABELS.CANCELLED})
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <ListFilter className="h-3.5 w-3.5 text-teal-600" />
                รูปแบบการแสดงผล
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={activeTab === "schedule" ? "default" : "outline"}
                  onClick={() => setActiveTab("schedule")}
                  className="h-11"
                >
                  <Users className="h-4 w-4" />
                  ตารางพนักงาน
                </Button>
                <Button
                  type="button"
                  variant={activeTab === "list" ? "default" : "outline"}
                  onClick={() => setActiveTab("list")}
                  className="h-11"
                >
                  รายการทั้งหมด
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* VIEW 1: Staff Queue Schedule */}
      {activeTab === "schedule" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.staffs
            .filter((st) => staffId === "ALL" || st.id === staffId)
            .map((staff) => {
              const staffBookings = data.bookings.filter(
                (b) => b.staffId === staff.id
              );
              return (
                <Card key={staff.id}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          ตารางคิว: {staff.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {bookingDate
                            ? `วันที่ ${formatThaiDate(bookingDate)}`
                            : "แสดงทุกวันที่"}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {staffBookings.length} รายการ
                      </Badge>
                    </div>

                    {dashboardQuery.isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : staffBookings.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                        ไม่มีรายการจองสำหรับพนักงานท่านนี้ในตัวกรองที่เลือก
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {staffBookings.map((booking) => (
                          <BookingAdminItem
                            key={booking.id}
                            booking={booking}
                            onChangeStatus={(nextStatus) =>
                              setPendingStatusChange({ booking, nextStatus })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* VIEW 2: Full Bookings List */}
      {activeTab === "list" && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                รายการจองทั้งหมด ({data.bookings.length} รายการ)
              </h2>
            </div>

            {dashboardQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : data.bookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                ไม่พบรายการจองตามเงื่อนไขที่กรอง
              </div>
            ) : (
              <div className="space-y-3">
                {data.bookings.map((booking) => (
                  <BookingAdminItem
                    key={booking.id}
                    booking={booking}
                    onChangeStatus={(nextStatus) =>
                      setPendingStatusChange({ booking, nextStatus })
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Update Confirmation Dialog */}
      <Dialog
        open={Boolean(pendingStatusChange)}
        onOpenChange={(open) => {
          if (!open) setPendingStatusChange(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ยืนยันการเปลี่ยนสถานะคิว{" "}
              {pendingStatusChange?.booking.bookingCode}
            </DialogTitle>
            <DialogDescription>
              ต้องการเปลี่ยนสถานะของลูกค้า{" "}
              <strong>{pendingStatusChange?.booking.customerName}</strong> (
              {pendingStatusChange?.booking.serviceName} เวลา{" "}
              {pendingStatusChange?.booking.startTime}–
              {pendingStatusChange?.booking.endTime} น.) เป็น{" "}
              <strong>
                {pendingStatusChange
                  ? `${pendingStatusChange.nextStatus} (${
                      BOOKING_STATUS_LABELS[pendingStatusChange.nextStatus]
                    })`
                  : ""}
              </strong>{" "}
              ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={updateStatusMutation.isPending}
              onClick={() => setPendingStatusChange(null)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant={
                pendingStatusChange?.nextStatus === BOOKING_STATUS.CANCELLED
                  ? "destructive"
                  : "default"
              }
              disabled={updateStatusMutation.isPending}
              onClick={handleConfirmStatusUpdate}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "ยืนยันการเปลี่ยนสถานะ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingAdminItem({
  booking,
  onChangeStatus,
}: {
  booking: BookingSummaryDTO;
  onChangeStatus: (nextStatus: BookingStatusType) => void;
}) {
  const statusVariant =
    booking.status === BOOKING_STATUS.CONFIRMED
      ? "default"
      : booking.status === BOOKING_STATUS.COMPLETED
      ? "success"
      : "destructive";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-2.5 py-1 text-xs font-bold text-white">
            <Clock className="h-3 w-3" />
            {booking.startTime} – {booking.endTime} น.
          </span>
          <span className="font-bold text-sm text-slate-900">
            {booking.bookingCode}
          </span>
          <span className="text-xs text-slate-500">
            ({formatThaiDate(booking.bookingDate)})
          </span>
        </div>
        <Badge variant={statusVariant}>
          {booking.status} • {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-1 text-xs text-slate-700 sm:grid-cols-2">
        <div>
          <span className="text-slate-500">ลูกค้า:</span>{" "}
          <strong className="text-slate-900">{booking.customerName}</strong>
        </div>
        <div>
          <span className="text-slate-500">พนักงาน:</span>{" "}
          <strong className="text-slate-900">{booking.staffName}</strong>
        </div>
        <div>
          <span className="text-slate-500">บริการ:</span>{" "}
          <strong className="text-slate-900">
            {booking.serviceName} ({booking.durationMinutes} นาที)
          </strong>
        </div>
        <div>
          <span className="text-slate-500">ราคา:</span>{" "}
          <strong className="text-teal-700">
            {formatCurrency(booking.price)} บาท
          </strong>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2.5">
        <span className="text-[11px] text-slate-500">เปลี่ยนสถานะการจอง:</span>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={
              booking.status === BOOKING_STATUS.CONFIRMED
                ? "default"
                : "outline"
            }
            disabled={booking.status === BOOKING_STATUS.CONFIRMED}
            onClick={() => onChangeStatus(BOOKING_STATUS.CONFIRMED)}
          >
            CONFIRMED
          </Button>
          <Button
            type="button"
            size="sm"
            variant={
              booking.status === BOOKING_STATUS.COMPLETED
                ? "default"
                : "outline"
            }
            disabled={booking.status === BOOKING_STATUS.COMPLETED}
            onClick={() => onChangeStatus(BOOKING_STATUS.COMPLETED)}
          >
            COMPLETED
          </Button>
          <Button
            type="button"
            size="sm"
            variant={
              booking.status === BOOKING_STATUS.CANCELLED
                ? "destructive"
                : "outline"
            }
            disabled={booking.status === BOOKING_STATUS.CANCELLED}
            onClick={() => onChangeStatus(BOOKING_STATUS.CANCELLED)}
          >
            CANCELLED
          </Button>
        </div>
      </div>
    </div>
  );
}
