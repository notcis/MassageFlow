"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import {
  ANY_STAFF_OPTION,
  APP_CONFIG,
  ROUTES,
} from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { formatThaiDate, getUpcomingDates } from "@/lib/time";
import { useAvailableSlotsQuery } from "@/hooks/queries/use-booking-queries";
import { useCreateBookingMutation } from "@/hooks/mutations/use-booking-mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServiceItem, StaffItem } from "@/types";

interface BookingWizardProps {
  services: ServiceItem[];
  staffs: StaffItem[];
  defaultCustomerName: string;
  initialLineId: string;
}

const STEPS = [
  { id: 1, label: "บริการ" },
  { id: 2, label: "หมอนวด" },
  { id: 3, label: "วัน-เวลา" },
  { id: 4, label: "ยืนยัน" },
] as const;

export function BookingWizard({
  services,
  staffs,
  defaultCustomerName,
  initialLineId,
}: BookingWizardProps) {
  const router = useRouter();
  const upcomingDates = React.useMemo(() => getUpcomingDates(14), []);

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>(
    services[0]?.id ?? ""
  );
  const [selectedStaffId, setSelectedStaffId] = React.useState<string>(
    ANY_STAFF_OPTION.id
  );
  const [selectedDate, setSelectedDate] = React.useState<string>(
    upcomingDates[0] ?? ""
  );
  const [selectedStartTime, setSelectedStartTime] = React.useState<string>("");
  const [customerName, setCustomerName] = React.useState<string>(
    defaultCustomerName
  );
  const [lineId, setLineId] = React.useState<string>(
    initialLineId || "U_LINE_GUEST_DEMO"
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [slotTakenWarning, setSlotTakenWarning] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (defaultCustomerName && !customerName) {
      setCustomerName(defaultCustomerName);
    }
  }, [defaultCustomerName, customerName]);

  React.useEffect(() => {
    if (initialLineId) {
      setLineId(initialLineId);
    }
  }, [initialLineId]);

  const selectedService = React.useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? services[0],
    [services, selectedServiceId]
  );

  const selectedStaffDisplay = React.useMemo(() => {
    if (selectedStaffId === ANY_STAFF_OPTION.id) {
      return ANY_STAFF_OPTION;
    }
    return (
      staffs.find((st) => st.id === selectedStaffId) ?? {
        id: ANY_STAFF_OPTION.id,
        name: ANY_STAFF_OPTION.name,
        specialty: ANY_STAFF_OPTION.specialty,
      }
    );
  }, [staffs, selectedStaffId]);

  const slotsQuery = useAvailableSlotsQuery({
    serviceId: selectedService?.id ?? "",
    staffId: selectedStaffId,
    bookingDate: selectedDate,
    enabled: Boolean(selectedService?.id && selectedStaffId && selectedDate),
  });

  const selectedSlotObj = React.useMemo(
    () =>
      slotsQuery.data?.find((slot) => slot.startTime === selectedStartTime) ??
      null,
    [slotsQuery.data, selectedStartTime]
  );

  const createBookingMutation = useCreateBookingMutation();

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedStartTime("");
    setErrorMessage(null);
    setSlotTakenWarning(false);
  };

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaffId(staffId);
    setSelectedStartTime("");
    setErrorMessage(null);
    setSlotTakenWarning(false);
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedStartTime("");
    setErrorMessage(null);
    setSlotTakenWarning(false);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createBookingMutation.isPending) return;

    setErrorMessage(null);
    setSlotTakenWarning(false);

    const trimmedName = customerName.trim();
    if (trimmedName.length < 2) {
      setErrorMessage("กรุณากรอกชื่อของคุณอย่างน้อย 2 ตัวอักษร");
      return;
    }

    if (!selectedService || !selectedDate || !selectedStartTime) {
      setErrorMessage("กรุณาเลือกบริการ วันที่ และเวลาให้ครบถ้วน");
      return;
    }

    const result = await createBookingMutation.mutateAsync({
      serviceId: selectedService.id,
      staffId: selectedStaffId,
      bookingDate: selectedDate,
      startTime: selectedStartTime,
      customerName: trimmedName,
      lineId: lineId.trim() || "U_LINE_GUEST_DEMO",
    });

    if (!result.success) {
      setErrorMessage(result.message);
      if (
        result.code === "SLOT_ALREADY_TAKEN" ||
        result.code === "PAST_TIME_SLOT"
      ) {
        setSlotTakenWarning(true);
        setSelectedStartTime("");
        await slotsQuery.refetch();
      }
      return;
    }

    const targetUrl = `${ROUTES.BOOKING_DETAIL(
      result.data.bookingCode
    )}?line_id=${encodeURIComponent(result.data.lineId)}&new=1`;
    router.push(targetUrl);
  };

  return (
    <div className="space-y-5">
      {/* Shop Info Banner */}
      <Card className="border-teal-100 bg-teal-50/60">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {APP_CONFIG.name} — จองคิวนวดออนไลน์
              </h1>
              <p className="text-xs text-slate-600">{APP_CONFIG.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-teal-800">
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 font-medium border border-teal-200">
                <Clock className="h-3.5 w-3.5 text-teal-600" />
                เปิดทุกวัน {APP_CONFIG.openTime}–{APP_CONFIG.closeTime} น.
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 font-medium border border-teal-200">
                <MapPin className="h-3.5 w-3.5 text-teal-600" />
                เวลาไทย (Asia/Bangkok)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Stepper */}
      <div
        aria-label="ขั้นตอนการจอง"
        className="grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3"
      >
        {STEPS.map((item) => {
          const isCompleted = step > item.id;
          const isCurrent = step === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id < step) {
                  setStep(item.id);
                  setErrorMessage(null);
                }
              }}
              disabled={item.id > step}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg py-1.5 text-center transition-colors",
                isCurrent && "bg-teal-50 text-teal-700",
                isCompleted && "text-teal-600 hover:bg-slate-50 cursor-pointer",
                !isCurrent && !isCompleted && "text-slate-400"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  isCurrent && "bg-teal-600 text-white",
                  isCompleted && "bg-teal-100 text-teal-700",
                  !isCurrent && !isCompleted && "bg-slate-100 text-slate-500"
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : item.id}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error / Slot Taken Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="flex-1 space-y-2">
              <p className="font-medium">{errorMessage}</p>
              {slotTakenWarning && step === 4 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStep(3);
                    setErrorMessage(null);
                  }}
                  className="border-red-300 bg-white text-red-700 hover:bg-red-50"
                >
                  กลับไปเลือกเวลาใหม่
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Choose Service */}
      {step === 1 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  1. เลือกบริการนวด
                </h2>
                <p className="text-xs text-slate-500">
                  เลือกรายการนวดที่ต้องการ ระบบจะคำนวณช่วงเวลาว่างตามระยะเวลาบริการ
                </p>
              </div>
              <Badge variant="secondary">{services.length} บริการ</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {services.map((service) => {
                const isSelected = service.id === selectedService?.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceSelect(service.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors cursor-pointer",
                      isSelected
                        ? "border-teal-600 bg-teal-50/50 ring-1 ring-teal-600"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    )}
                  >
                    <div className="space-y-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {service.name}
                        </span>
                        <Badge
                          variant={isSelected ? "default" : "secondary"}
                          className="text-[11px]"
                        >
                          {service.durationMinutes} นาที
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-xs text-slate-500">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-teal-700">
                        {formatCurrency(service.price)} ฿
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!selectedService}
                onClick={() => setStep(2)}
              >
                ถัดไป: เลือกพนักงานนวด
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Choose Staff */}
      {step === 2 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. เลือกพนักงานนวด
              </h2>
              <p className="text-xs text-slate-500">
                เลือกหมอนวดประจำตัว หรือเลือก &ldquo;พนักงานคนใดก็ได้&rdquo; เพื่อดูคิวว่างทั้งหมด
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Any Staff Option */}
              <button
                type="button"
                onClick={() => handleStaffSelect(ANY_STAFF_OPTION.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer",
                  selectedStaffId === ANY_STAFF_OPTION.id
                    ? "border-teal-600 bg-teal-50/50 ring-1 ring-teal-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <Users className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {ANY_STAFF_OPTION.name}
                    </span>
                    <Badge variant="secondary" className="text-[11px]">
                      แนะนำ
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {ANY_STAFF_OPTION.specialty}
                  </p>
                </div>
              </button>

              {/* Individual Staff Options */}
              {staffs.map((staff) => {
                const isSelected = selectedStaffId === staff.id;
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleStaffSelect(staff.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer",
                      isSelected
                        ? "border-teal-600 bg-teal-50/50 ring-1 ring-teal-600"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                      <User className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900">
                        {staff.name}
                      </span>
                      {staff.specialty && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {staff.specialty}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับ
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-2"
                onClick={() => setStep(3)}
              >
                ถัดไป: เลือกวันและเวลา
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Choose Date & Available Time Slot */}
      {step === 3 && (
        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  3. เลือกวันและเวลาที่ว่าง
                </h2>
                <p className="text-xs text-slate-500">
                  แสดงเฉพาะเวลาที่รองรับ {selectedService?.name} (
                  {selectedService?.durationMinutes} นาที) ภายในเวลาปิดร้าน{" "}
                  {APP_CONFIG.closeTime} น.
                </p>
              </div>
            </div>

            {/* Date Selector */}
            <div className="space-y-2">
              <Label htmlFor="booking-date-select" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-teal-600" />
                เลือกวันที่ต้องการจอง
              </Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {upcomingDates.slice(0, 7).map((dateStr, idx) => {
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleDateSelect(dateStr)}
                      className={cn(
                        "flex min-w-[110px] shrink-0 flex-col items-center rounded-xl border px-3 py-2.5 text-xs transition-colors cursor-pointer",
                        isSelected
                          ? "border-teal-600 bg-teal-600 text-white font-semibold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span className="text-[11px] opacity-85">
                        {idx === 0 ? "วันนี้" : idx === 1 ? "พรุ่งนี้" : dateStr}
                      </span>
                      <span className="mt-0.5 font-medium">
                        {formatThaiDate(dateStr)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="pt-1">
                <Input
                  id="booking-date-select"
                  type="date"
                  min={upcomingDates[0]}
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>

            {/* Available Time Slots */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-teal-600" />
                  ช่วงเวลาที่ว่าง ({formatThaiDate(selectedDate)})
                </Label>
                {slotsQuery.data && (
                  <span className="text-xs text-slate-500">
                    ว่าง {slotsQuery.data.length} ช่วงเวลา
                  </span>
                )}
              </div>

              {slotsQuery.isLoading ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-14 w-full" />
                  ))}
                </div>
              ) : slotsQuery.isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-700">
                  ไม่สามารถโหลดข้อมูลคิวว่างได้ กรุณาลองใหม่อีกครั้ง
                </div>
              ) : !slotsQuery.data || slotsQuery.data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    ไม่มีช่วงเวลาว่างในวันที่เลือก
                  </p>
                  <p className="text-xs text-slate-500">
                    กรุณาเลือกวันอื่น หรือเปลี่ยนตัวเลือกพนักงานเป็น &ldquo;พนักงานคนใดก็ได้&rdquo;
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {slotsQuery.data.map((slot) => {
                    const isSelected = selectedStartTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => {
                          setSelectedStartTime(slot.startTime);
                          setErrorMessage(null);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-colors cursor-pointer",
                          isSelected
                            ? "border-teal-600 bg-teal-600 text-white"
                            : "border-slate-200 bg-white text-slate-900 hover:border-teal-500 hover:bg-teal-50/40"
                        )}
                      >
                        <span className="text-sm font-bold">
                          {slot.startTime} – {slot.endTime} น.
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 text-[11px]",
                            isSelected ? "text-teal-100" : "text-slate-500"
                          )}
                        >
                          ว่าง {slot.availableStaffIds.length} คน
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับ
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-2"
                disabled={!selectedStartTime}
                onClick={() => setStep(4)}
              >
                ถัดไป: กรอกชื่อและยืนยัน
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Customer Info & Summary Confirmation */}
      {step === 4 && selectedService && (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleConfirmBooking} className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  4. ข้อมูลผู้จองและตรวจสอบสรุปรายการ
                </h2>
                <p className="text-xs text-slate-500">
                  กรุณาตรวจสอบรายละเอียดให้ถูกต้องก่อนกดยืนยันการจอง
                </p>
              </div>

              {/* Customer Name Input */}
              <div className="space-y-2">
                <Label htmlFor="customer-name">ชื่อลูกค้า *</Label>
                <Input
                  id="customer-name"
                  name="customerName"
                  placeholder="กรอกชื่อเล่น หรือชื่อ-นามสกุลของคุณ"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                />
                {defaultCustomerName && (
                  <p className="text-xs text-teal-700 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    ดึงชื่อของคุณจากประวัติการใช้บริการผ่าน LINE OA อัตโนมัติ
                  </p>
                )}
              </div>

              {/* Booking Summary Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  สรุปรายการจองคิว
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">บริการ:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedService.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ระยะเวลา:</span>
                    <span className="font-medium text-slate-900">
                      {selectedService.durationMinutes} นาที
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">วันที่จอง:</span>
                    <span className="font-semibold text-slate-900">
                      {formatThaiDate(selectedDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">เวลา:</span>
                    <span className="font-bold text-teal-700">
                      {selectedStartTime} –{" "}
                      {selectedSlotObj?.endTime ?? ""} น.
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">พนักงานนวด:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedStaffDisplay.name}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                    <span className="font-semibold text-slate-900">
                      ราคาสุทธิ:
                    </span>
                    <span className="text-lg font-bold text-teal-700">
                      {formatCurrency(selectedService.price)} บาท
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                เงื่อนไขการยกเลิก: สามารถยกเลิกการจองผ่านระบบได้ล่วงหน้าอย่างน้อย{" "}
                <strong>{APP_CONFIG.cancelMinHoursBefore} ชั่วโมง</strong> ก่อนถึงเวลาเริ่มคิว
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={createBookingMutation.isPending}
                  onClick={() => setStep(3)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  เลือกเวลาใหม่
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-2"
                  disabled={
                    createBookingMutation.isPending ||
                    customerName.trim().length < 2
                  }
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังบันทึกการจอง...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      ยืนยันการจองคิว
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
