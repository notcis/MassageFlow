import { z } from "zod";
import { BOOKING_STATUS } from "@/lib/constants";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availableSlotsQuerySchema = z.object({
  serviceId: z.string().min(1, "กรุณาเลือกบริการ"),
  staffId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  bookingDate: z.string().regex(dateRegex, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
});

export const createBookingSchema = z.object({
  serviceId: z.string().min(1, "กรุณาเลือกบริการ"),
  staffId: z.string().min(1, "กรุณาเลือกพนักงาน"),
  bookingDate: z.string().regex(dateRegex, "กรุณาเลือกวันที่"),
  startTime: z.string().regex(timeRegex, "กรุณาเลือกเวลา"),
  customerName: z
    .string()
    .trim()
    .min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  lineId: z
    .string()
    .trim()
    .min(1, "ไม่พบรหัสผู้ใช้ LINE กรุณาเปิดจากลิงก์ใน LINE OA หรือระบุรหัสอ้างอิง")
    .max(128, "รหัส LINE ไม่ถูกต้อง"),
});

export const cancelCustomerBookingSchema = z.object({
  bookingCode: z.string().trim().min(3, "รหัสการจองไม่ถูกต้อง"),
  lineId: z.string().trim().min(1, "ไม่พบรหัสยืนยันตัวตน LINE"),
  cancelReason: z.string().trim().max(250).optional(),
});

export const adminFilterBookingsSchema = z.object({
  bookingDate: z.string().regex(dateRegex).optional().or(z.literal("")),
  staffId: z.string().optional(),
  status: z
    .enum([
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CANCELLED,
      "ALL",
    ])
    .optional()
    .default("ALL"),
});

export const adminUpdateBookingStatusSchema = z.object({
  bookingId: z.string().min(1, "ไม่พบรหัสการจอง"),
  status: z.enum([
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CANCELLED,
  ]),
});
