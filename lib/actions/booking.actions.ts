"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ANY_STAFF_OPTION,
  BOOKING_STATUS,
  COOKIE_NAMES,
  DEFAULT_SERVICES,
  DEFAULT_STAFFS,
  ERROR_MESSAGES,
  ROUTES,
} from "@/lib/constants";
import {
  calculateEndTime,
  canCustomerCancelBooking,
  generateCandidateStartTimes,
  getBangkokNowParts,
  isTimeOverlapping,
  isWithinBusinessHours,
  timeToMinutes,
  toBangkokDateTime,
} from "@/lib/time";
import { generateBookingCode } from "@/lib/utils";
import {
  availableSlotsQuerySchema,
  cancelCustomerBookingSchema,
  createBookingSchema,
} from "@/lib/validations/booking";
import {
  buildBookingCancelledFlexMessage,
  buildBookingConfirmedFlexMessage,
  pushLineFlexMessage,
} from "@/lib/line";
import type {
  ActionResult,
  AvailableTimeSlot,
  BookingSummaryDTO,
  ServiceItem,
  StaffItem,
} from "@/types";

/**
 * Ensures initial services and staff exist in database if not seeded yet.
 */
export async function ensureShopCatalogSeeded(): Promise<void> {
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    for (const s of DEFAULT_SERVICES) {
      await prisma.service.upsert({
        where: { code: s.code },
        update: {},
        create: {
          code: s.code,
          name: s.name,
          description: s.description,
          durationMinutes: s.durationMinutes,
          price: s.price,
          sortOrder: s.sortOrder,
          isActive: true,
        },
      });
    }
  }

  const staffCount = await prisma.staff.count();
  if (staffCount === 0) {
    for (const st of DEFAULT_STAFFS) {
      await prisma.staff.upsert({
        where: { code: st.code },
        update: {},
        create: {
          code: st.code,
          name: st.name,
          specialty: st.specialty,
          sortOrder: st.sortOrder,
          isActive: true,
        },
      });
    }
  }
}

function mapBookingToDTO(
  booking: {
    id: string;
    bookingCode: string;
    serviceId: string;
    staffId: string;
    customerName: string;
    lineId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    startAt: Date;
    endAt: Date;
    durationMinutes: number;
    price: number;
    wasAnyStaff: boolean;
    status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
    cancelledAt: Date | null;
    cancelReason: string | null;
    createdAt: Date;
    service: { name: string };
    staff: { name: string };
  },
  now: Date = new Date()
): BookingSummaryDTO {
  const cancelCheck = canCustomerCancelBooking(booking.startAt, now);
  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    serviceId: booking.serviceId,
    serviceName: booking.service.name,
    durationMinutes: booking.durationMinutes,
    price: booking.price,
    staffId: booking.staffId,
    staffName: booking.staff.name,
    wasAnyStaff: booking.wasAnyStaff,
    customerName: booking.customerName,
    lineId: booking.lineId,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    startAtIso: booking.startAt.toISOString(),
    endAtIso: booking.endAt.toISOString(),
    status: booking.status,
    canCancel: booking.status === BOOKING_STATUS.CONFIRMED && cancelCheck.allowed,
    cancelledAtIso: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
    cancelReason: booking.cancelReason,
    createdAtIso: booking.createdAt.toISOString(),
  };
}

export async function getBookingInitialDataAction(lineId?: string): Promise<
  ActionResult<{
    services: ServiceItem[];
    staffs: StaffItem[];
    defaultCustomerName: string;
    resolvedLineId: string;
  }>
> {
  try {
    await ensureShopCatalogSeeded();

    const cookieStore = await cookies();
    const cookieLineId = cookieStore.get(COOKIE_NAMES.LINE_ID)?.value ?? "";
    const resolvedLineId = (lineId?.trim() || cookieLineId).trim();

    const [services, staffs, customerProfile] = await Promise.all([
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
      resolvedLineId
        ? prisma.customerProfile.findUnique({
            where: { lineId: resolvedLineId },
            select: { name: true },
          })
        : Promise.resolve(null),
    ]);

    return {
      success: true,
      data: {
        services,
        staffs,
        defaultCustomerName: customerProfile?.name ?? "",
        resolvedLineId,
      },
    };
  } catch (error) {
    console.error("getBookingInitialDataAction error:", error);
    return {
      success: false,
      message: ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

export async function getAvailableSlotsAction(input: {
  serviceId: string;
  staffId: string;
  bookingDate: string;
}): Promise<ActionResult<AvailableTimeSlot[]>> {
  try {
    const parsed = availableSlotsQuerySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_INPUT,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { serviceId, staffId, bookingDate } = parsed.data;
    const nowParts = getBangkokNowParts();

    if (bookingDate < nowParts.dateStr) {
      return {
        success: true,
        data: [],
      };
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
      select: { id: true, durationMinutes: true },
    });

    if (!service) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_INPUT,
      };
    }

    const candidateStaffs = await prisma.staff.findMany({
      where: {
        isActive: true,
        ...(staffId !== ANY_STAFF_OPTION.id ? { id: staffId } : {}),
      },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    });

    if (candidateStaffs.length === 0) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_INPUT,
      };
    }

    // Active bookings on this date that block time (only CONFIRMED blocks slots; CANCELLED does not block)
    const activeBookings = await prisma.booking.findMany({
      where: {
        bookingDate,
        staffId: { in: candidateStaffs.map((s) => s.id) },
        status: BOOKING_STATUS.CONFIRMED,
      },
      select: {
        staffId: true,
        startTime: true,
        endTime: true,
      },
    });

    const candidateStarts = generateCandidateStartTimes(service.durationMinutes);
    const isToday = bookingDate === nowParts.dateStr;

    const slots: AvailableTimeSlot[] = [];

    for (const startTime of candidateStarts) {
      if (isToday && timeToMinutes(startTime) <= nowParts.minutesOfDay) {
        continue;
      }

      const endTime = calculateEndTime(startTime, service.durationMinutes);
      const freeStaffs = candidateStaffs.filter((staff) => {
        const staffBookings = activeBookings.filter((b) => b.staffId === staff.id);
        const hasOverlap = staffBookings.some((b) =>
          isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
        );
        return !hasOverlap;
      });

      if (freeStaffs.length > 0) {
        slots.push({
          startTime,
          endTime,
          available: true,
          availableStaffIds: freeStaffs.map((s) => s.id),
          availableStaffNames: freeStaffs.map((s) => s.name),
        });
      }
    }

    return {
      success: true,
      data: slots,
    };
  } catch (error) {
    console.error("getAvailableSlotsAction error:", error);
    return {
      success: false,
      message: ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

export async function createBookingAction(input: {
  serviceId: string;
  staffId: string;
  bookingDate: string;
  startTime: string;
  customerName: string;
  lineId: string;
}): Promise<ActionResult<BookingSummaryDTO>> {
  try {
    const parsed = createBookingSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_INPUT,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { serviceId, staffId, bookingDate, startTime, customerName, lineId } =
      parsed.data;

    const now = new Date();
    const nowParts = getBangkokNowParts(now);

    if (bookingDate < nowParts.dateStr) {
      return {
        success: false,
        message: ERROR_MESSAGES.PAST_TIME_SLOT,
        code: "PAST_TIME_SLOT",
      };
    }

    if (
      bookingDate === nowParts.dateStr &&
      timeToMinutes(startTime) <= nowParts.minutesOfDay
    ) {
      return {
        success: false,
        message: ERROR_MESSAGES.PAST_TIME_SLOT,
        code: "PAST_TIME_SLOT",
      };
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_INPUT,
      };
    }

    if (!isWithinBusinessHours(startTime, service.durationMinutes)) {
      return {
        success: false,
        message: ERROR_MESSAGES.OUTSIDE_BUSINESS_HOURS,
        code: "OUTSIDE_BUSINESS_HOURS",
      };
    }

    const endTime = calculateEndTime(startTime, service.durationMinutes);
    const startAt = toBangkokDateTime(bookingDate, startTime);
    const endAt = toBangkokDateTime(bookingDate, endTime);
    const wasAnyStaff = staffId === ANY_STAFF_OPTION.id;

    // Execute inside a serializable/locked transaction to prevent concurrent double-booking
    const createdBooking = await prisma.$transaction(
      async (tx) => {
        // Lock active staff rows with FOR UPDATE so concurrent requests serialize cleanly
        await tx.$queryRaw`SELECT id FROM staff WHERE isActive = true FOR UPDATE`;

        const candidateStaffs = await tx.staff.findMany({
          where: {
            isActive: true,
            ...(wasAnyStaff ? {} : { id: staffId }),
          },
          orderBy: { sortOrder: "asc" },
        });

        if (candidateStaffs.length === 0) {
          throw new Error("INVALID_STAFF");
        }

        const existingBookings = await tx.booking.findMany({
          where: {
            bookingDate,
            staffId: { in: candidateStaffs.map((s) => s.id) },
            status: BOOKING_STATUS.CONFIRMED,
          },
          select: {
            staffId: true,
            startTime: true,
            endTime: true,
          },
        });

        const availableStaffs = candidateStaffs.filter((staff) => {
          const staffBookings = existingBookings.filter((b) => b.staffId === staff.id);
          const hasOverlap = staffBookings.some((b) =>
            isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
          );
          return !hasOverlap;
        });

        if (availableStaffs.length === 0) {
          throw new Error("SLOT_ALREADY_TAKEN");
        }

        // If "ANY" staff was chosen, pick the available staff with fewer bookings on that day for fair load balancing
        const selectedStaff = [...availableStaffs].sort((a, b) => {
          const countA = existingBookings.filter((bk) => bk.staffId === a.id).length;
          const countB = existingBookings.filter((bk) => bk.staffId === b.id).length;
          return countA - countB;
        })[0];

        let bookingCode = generateBookingCode();
        for (let attempt = 0; attempt < 5; attempt++) {
          const exists = await tx.booking.findUnique({
            where: { bookingCode },
            select: { id: true },
          });
          if (!exists) break;
          bookingCode = generateBookingCode();
        }

        await tx.customerProfile.upsert({
          where: { lineId },
          update: { name: customerName },
          create: {
            lineId,
            name: customerName,
          },
        });

        const booking = await tx.booking.create({
          data: {
            bookingCode,
            serviceId: service.id,
            staffId: selectedStaff.id,
            customerName,
            lineId,
            bookingDate,
            startTime,
            endTime,
            startAt,
            endAt,
            durationMinutes: service.durationMinutes,
            price: service.price,
            wasAnyStaff,
            status: BOOKING_STATUS.CONFIRMED,
          },
          include: {
            service: { select: { name: true } },
            staff: { select: { name: true } },
          },
        });

        return booking;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAMES.LINE_ID, lineId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });

    const bookingDTO = mapBookingToDTO(createdBooking, now);

    // Push Flex Message to customer's LINE OA
    const flexMessage = buildBookingConfirmedFlexMessage(bookingDTO);
    await pushLineFlexMessage(lineId, flexMessage);

    revalidatePath(ROUTES.BOOKING);
    revalidatePath(ROUTES.MY_BOOKINGS);
    revalidatePath(ROUTES.ADMIN);

    return {
      success: true,
      data: bookingDTO,
      message: "ยืนยันการจองคิวเรียบร้อยแล้ว",
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SLOT_ALREADY_TAKEN") {
        return {
          success: false,
          message: ERROR_MESSAGES.SLOT_ALREADY_TAKEN,
          code: "SLOT_ALREADY_TAKEN",
        };
      }
      if (error.message === "INVALID_STAFF") {
        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_INPUT,
        };
      }
    }
    // Prisma serialization conflict (P2034) also indicates concurrent booking on the same slot
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2034"
    ) {
      return {
        success: false,
        message: ERROR_MESSAGES.SLOT_ALREADY_TAKEN,
        code: "SLOT_ALREADY_TAKEN",
      };
    }

    console.error("createBookingAction error:", error);
    return {
      success: false,
      message: ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

export async function getBookingByCodeAction(
  bookingCode: string,
  lineIdParam?: string
): Promise<ActionResult<BookingSummaryDTO>> {
  try {
    const cleanCode = bookingCode.trim().toUpperCase();
    const cookieStore = await cookies();
    const cookieLineId = cookieStore.get(COOKIE_NAMES.LINE_ID)?.value ?? "";
    const resolvedLineId = (lineIdParam?.trim() || cookieLineId).trim();

    const booking = await prisma.booking.findUnique({
      where: { bookingCode: cleanCode },
      include: {
        service: { select: { name: true } },
        staff: { select: { name: true } },
      },
    });

    if (!booking) {
      return {
        success: false,
        message: ERROR_MESSAGES.BOOKING_NOT_FOUND,
      };
    }

    // Security check: if lineId is provided or stored in cookie, ensure it matches the booking's lineId
    if (resolvedLineId && booking.lineId !== resolvedLineId) {
      return {
        success: false,
        message: ERROR_MESSAGES.BOOKING_NOT_FOUND,
      };
    }

    return {
      success: true,
      data: mapBookingToDTO(booking),
    };
  } catch (error) {
    console.error("getBookingByCodeAction error:", error);
    return {
      success: false,
      message: ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

export async function getMyBookingsAction(
  lineIdParam?: string
): Promise<ActionResult<{ lineId: string; customerName: string; bookings: BookingSummaryDTO[] }>> {
  try {
    const cookieStore = await cookies();
    const cookieLineId = cookieStore.get(COOKIE_NAMES.LINE_ID)?.value ?? "";
    const resolvedLineId = (lineIdParam?.trim() || cookieLineId).trim();

    if (!resolvedLineId) {
      return {
        success: true,
        data: {
          lineId: "",
          customerName: "",
          bookings: [],
        },
      };
    }

    const [profile, bookings] = await Promise.all([
      prisma.customerProfile.findUnique({
        where: { lineId: resolvedLineId },
        select: { name: true },
      }),
      prisma.booking.findMany({
        where: { lineId: resolvedLineId },
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
        orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
      }),
    ]);

    const now = new Date();
    return {
      success: true,
      data: {
        lineId: resolvedLineId,
        customerName: profile?.name ?? bookings[0]?.customerName ?? "",
        bookings: bookings.map((b) => mapBookingToDTO(b, now)),
      },
    };
  } catch (error) {
    console.error("getMyBookingsAction error:", error);
    return {
      success: false,
      message: ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}

export async function cancelCustomerBookingAction(input: {
  bookingCode: string;
  lineId: string;
  cancelReason?: string;
}): Promise<ActionResult<BookingSummaryDTO>> {
  try {
    const parsed = cancelCustomerBookingSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: ERROR_MESSAGES.INVALID_INPUT,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { bookingCode, lineId, cancelReason } = parsed.data;
    const cleanCode = bookingCode.toUpperCase();

    const booking = await prisma.booking.findUnique({
      where: { bookingCode: cleanCode },
      include: {
        service: { select: { name: true } },
        staff: { select: { name: true } },
      },
    });

    // Authorization check: never allow cancelling another customer's booking
    if (!booking || booking.lineId !== lineId) {
      return {
        success: false,
        message: ERROR_MESSAGES.BOOKING_NOT_FOUND,
      };
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return {
        success: false,
        message: ERROR_MESSAGES.ALREADY_CANCELLED,
      };
    }

    if (booking.status === BOOKING_STATUS.COMPLETED) {
      return {
        success: false,
        message: ERROR_MESSAGES.CANNOT_CANCEL_COMPLETED,
      };
    }

    const now = new Date();
    const cancelCheck = canCustomerCancelBooking(booking.startAt, now);
    if (!cancelCheck.allowed) {
      return {
        success: false,
        message: ERROR_MESSAGES.CANCEL_TOO_LATE,
      };
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelledAt: now,
        cancelReason: cancelReason || "ลูกค้ายกเลิกผ่านระบบออนไลน์",
      },
      include: {
        service: { select: { name: true } },
        staff: { select: { name: true } },
      },
    });

    const updatedDTO = mapBookingToDTO(updated, now);

    // Push Flex Message notification of cancellation to LINE
    const cancelFlex = buildBookingCancelledFlexMessage(updatedDTO);
    await pushLineFlexMessage(updated.lineId, cancelFlex);

    revalidatePath(ROUTES.BOOKING);
    revalidatePath(ROUTES.MY_BOOKINGS);
    revalidatePath(ROUTES.BOOKING_DETAIL(updated.bookingCode));
    revalidatePath(ROUTES.ADMIN);

    return {
      success: true,
      data: updatedDTO,
      message: "ยกเลิกการจองเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("cancelCustomerBookingAction error:", error);
    return {
      success: false,
      message: ERROR_MESSAGES.GENERIC_ERROR,
    };
  }
}
