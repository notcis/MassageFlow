import type { BookingStatusType } from "@/lib/constants";

export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string; errors?: Record<string, string[]>; code?: string };

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
}

export interface StaffItem {
  id: string;
  code: string;
  name: string;
  specialty: string | null;
  imageUrl: string | null;
}

export interface AvailableTimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  availableStaffIds: string[];
  availableStaffNames: string[];
}

export interface BookingSummaryDTO {
  id: string;
  bookingCode: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  price: number;
  staffId: string;
  staffName: string;
  wasAnyStaff: boolean;
  customerName: string;
  lineId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  startAtIso: string;
  endAtIso: string;
  status: BookingStatusType;
  canCancel: boolean;
  cancelledAtIso: string | null;
  cancelReason: string | null;
  createdAtIso: string;
}

export interface AdminDashboardData {
  bookings: BookingSummaryDTO[];
  staffs: StaffItem[];
  services: ServiceItem[];
  summary: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}
