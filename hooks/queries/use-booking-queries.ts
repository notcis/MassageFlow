"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAvailableSlotsAction,
  getMyBookingsAction,
} from "@/lib/actions/booking.actions";
import { getAdminDashboardDataAction } from "@/lib/actions/admin.actions";
import type { BookingStatusType } from "@/lib/constants";

export const BOOKING_QUERY_KEYS = {
  all: ["bookings"] as const,
  availableSlots: (serviceId: string, staffId: string, bookingDate: string) =>
    ["bookings", "available-slots", serviceId, staffId, bookingDate] as const,
  myBookings: (lineId: string) => ["bookings", "my-bookings", lineId] as const,
  adminDashboard: (
    bookingDate: string,
    staffId: string,
    status: BookingStatusType | "ALL"
  ) => ["bookings", "admin-dashboard", bookingDate, staffId, status] as const,
};

export function useAvailableSlotsQuery(params: {
  serviceId: string;
  staffId: string;
  bookingDate: string;
  enabled?: boolean;
}) {
  const { serviceId, staffId, bookingDate, enabled = true } = params;

  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.availableSlots(serviceId, staffId, bookingDate),
    queryFn: async () => {
      const res = await getAvailableSlotsAction({
        serviceId,
        staffId,
        bookingDate,
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      return res.data;
    },
    enabled: Boolean(enabled && serviceId && staffId && bookingDate),
    staleTime: 10 * 1000,
  });
}

export function useMyBookingsQuery(lineId: string, enabled = true) {
  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.myBookings(lineId),
    queryFn: async () => {
      const res = await getMyBookingsAction(lineId);
      if (!res.success) {
        throw new Error(res.message);
      }
      return res.data;
    },
    enabled: Boolean(enabled),
  });
}

export function useAdminDashboardQuery(params: {
  bookingDate: string;
  staffId: string;
  status: BookingStatusType | "ALL";
}) {
  const { bookingDate, staffId, status } = params;

  return useQuery({
    queryKey: BOOKING_QUERY_KEYS.adminDashboard(bookingDate, staffId, status),
    queryFn: async () => {
      const res = await getAdminDashboardDataAction({
        bookingDate,
        staffId,
        status,
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      return res.data;
    },
    staleTime: 10 * 1000,
  });
}
