"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { BOOKING_STATUS, ERROR_MESSAGES, ROUTES } from "@/lib/constants";
import { canCustomerCancelBooking, isTimeOverlapping } from "@/lib/time";
import {
  adminFilterBookingsSchema,
  adminUpdateBookingStatusSchema,
} from "@/lib/validations/booking";
import { ensureShopCatalogSeeded } from "@/lib/actions/booking.actions";
import {
  buildBookingCancelledFlexMessage,
  buildBookingConfirmedFlexMessage,
  pushLineFlexMessage,
} from "@/lib/line";
import type { ActionResult, AdminDashboardData, BookingSummaryDTO } from "@/types";

export async function getAdminDashboardDataAction(input: {
  bookingDate?: string;
  staffId?: string;
  status?: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "ALL";
}): Promise<ActionResult<AdminDashboardData>> {
  try {
    const authCheck = await requireAdminSession();
    if (!authCheck.authorized) {
      return {
        success: false,
        message:
          authCheck.reason === "UNAUTHENTICATED"
            ? ERROR_MESSAGES.UNAUTHORIZED
            : ERROR_MESSAGES.FORBIDDEN,
      };
    }

    await ensureShopCatalogSeeded();

    const parsed = adminFilterBookingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_INPUT,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { bookingDate, staffId, status } = parsed.data;

    const whereClause: Prisma.BookingWhereInput = {};
    if (bookingDate) {
      whereClause.bookingDate = bookingDate;
    }
    if (staffId && staffId !== "ALL") {
      whereClause.staffId = staffId;
    }
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const [bookings, staffs, services] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
        orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
      }),
      prisma.staff.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          specialty: true,
          imageUrl: true,
        },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
        },
      }),
    ]);

    const now = new Date();
    const mappedBookings: BookingSummaryDTO[] = bookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      serviceId: b.serviceId,
      serviceName: b.service.name,
      durationMinutes: b.durationMinutes,
      price: b.price,
      staffId: b.staffId,
      staffName: b.staff.name,
      wasAnyStaff: b.wasAnyStaff,
      customerName: b.customerName,
      lineId: b.lineId,
      bookingDate: b.bookingDate,
      startTime: b.startTime,
      endTime: b.endTime,
      startAtIso: b.startAt.toISOString(),
      endAtIso: b.endAt.toISOString(),
      status: b.status,
      canCancel:
        b.status === BOOKING_STATUS.CONFIRMED &&
        canCustomerCancelBooking(b.startAt, now).allowed,
      cancelledAtIso: b.cancelledAt ? b.cancelledAt.toISOString() : null,
      cancelReason: b.cancelReason,
      createdAtIso: b.createdAt.toISOString(),
    }));

    const summary = {
      total: mappedBookings.length,
      confirmed: mappedBookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED).length,
      completed: mappedBookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED).length,
      cancelled: mappedBookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED).length,
    };

    return {
      success: true,
      data: {
        bookings: mappedBookings,
        staffs,
        services,
        summary,
      },
    };
  } catch (error) {
    console.error("getAdminDashboardDataAction error:", error);
    return {
      success: false,
      message: ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

export async function updateBookingStatusAction(input: {
  bookingId: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
}): Promise<ActionResult<BookingSummaryDTO>> {
  try {
    const authCheck = await requireAdminSession();
    if (!authCheck.authorized) {
      return {
        success: false,
        message:
          authCheck.reason === "UNAUTHENTICATED"
            ? ERROR_MESSAGES.UNAUTHORIZED
            : ERROR_MESSAGES.FORBIDDEN,
      };
    }

    const parsed = adminUpdateBookingStatusSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_INPUT,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { bookingId, status } = parsed.data;
    const now = new Date();

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const targetBooking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
      });

      if (!targetBooking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      // If admin restores a CANCELLED booking back to CONFIRMED, verify no overlap with another CONFIRMED booking
      if (
        status === BOOKING_STATUS.CONFIRMED &&
        targetBooking.status !== BOOKING_STATUS.CONFIRMED
      ) {
        const conflictingBookings = await tx.booking.findMany({
          where: {
            id: { not: targetBooking.id },
            staffId: targetBooking.staffId,
            bookingDate: targetBooking.bookingDate,
            status: BOOKING_STATUS.CONFIRMED,
          },
          select: {
            startTime: true,
            endTime: true,
          },
        });

        const hasConflict = conflictingBookings.some((b) =>
          isTimeOverlapping(
            targetBooking.startTime,
            targetBooking.endTime,
            b.startTime,
            b.endTime
          )
        );

        if (hasConflict) {
          throw new Error("SLOT_ALREADY_TAKEN");
        }
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status,
          cancelledAt: status === BOOKING_STATUS.CANCELLED ? now : null,
          cancelReason:
            status === BOOKING_STATUS.CANCELLED
              ? targetBooking.cancelReason ?? "ผู้ดูแลระบบยกเลิกรายการ"
              : null,
        },
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
      });
    });

    const dto: BookingSummaryDTO = {
      id: updatedBooking.id,
      bookingCode: updatedBooking.bookingCode,
      serviceId: updatedBooking.serviceId,
      serviceName: updatedBooking.service.name,
      durationMinutes: updatedBooking.durationMinutes,
      price: updatedBooking.price,
      staffId: updatedBooking.staffId,
      staffName: updatedBooking.staff.name,
      wasAnyStaff: updatedBooking.wasAnyStaff,
      customerName: updatedBooking.customerName,
      lineId: updatedBooking.lineId,
      bookingDate: updatedBooking.bookingDate,
      startTime: updatedBooking.startTime,
      endTime: updatedBooking.endTime,
      startAtIso: updatedBooking.startAt.toISOString(),
      endAtIso: updatedBooking.endAt.toISOString(),
      status: updatedBooking.status,
      canCancel:
        updatedBooking.status === BOOKING_STATUS.CONFIRMED &&
        canCustomerCancelBooking(updatedBooking.startAt, now).allowed,
      cancelledAtIso: updatedBooking.cancelledAt
        ? updatedBooking.cancelledAt.toISOString()
        : null,
      cancelReason: updatedBooking.cancelReason,
      createdAtIso: updatedBooking.createdAt.toISOString(),
    };

    if (status === BOOKING_STATUS.CANCELLED) {
      await pushLineFlexMessage(dto.lineId, buildBookingCancelledFlexMessage(dto));
    } else if (status === BOOKING_STATUS.CONFIRMED) {
      await pushLineFlexMessage(dto.lineId, buildBookingConfirmedFlexMessage(dto));
    }

    revalidatePath(ROUTES.ADMIN);
    revalidatePath(ROUTES.BOOKING);
    revalidatePath(ROUTES.MY_BOOKINGS);

    return {
      success: true,
      data: dto,
      message: "อัปเดตสถานะการจองเรียบร้อยแล้ว",
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "BOOKING_NOT_FOUND") {
        return {
          success: false,
          message: ERROR_MESSAGES.BOOKING_NOT_FOUND,
        };
      }
      if (error.message === "SLOT_ALREADY_TAKEN") {
        return {
          success: false,
          message:
            "ไม่สามารถเปลี่ยนกลับเป็นยืนยันได้ เนื่องจากพนักงานมีคิวอื่นในช่วงเวลานี้แล้ว",
        };
      }
    }
    console.error("updateBookingStatusAction error:", error);
    return {
      success: false,
      message: ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}
