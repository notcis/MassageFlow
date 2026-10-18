export const APP_CONFIG = {
  name: "MassageFlow",
  tagline: "ระบบจองคิวร้านนวดผ่าน LINE Official Account",
  description:
    "บริการนวดแผนไทย นวดเท้า และนวดน้ำมันอโรมา โดยหมอนวดมืออาชีพ จองคิวง่ายผ่าน LINE OA",
  address: "สุขุมวิท 24 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ",
  phone: "02-123-4567",
  openTime: "10:00",
  closeTime: "21:00",
  timezone: "Asia/Bangkok",
  slotIntervalMinutes: 30,
  cancelMinHoursBefore: 2,
} as const;

export const ROUTES = {
  HOME: "/",
  BOOKING: "/booking",
  BOOKING_DETAIL: (code: string) => `/booking/${code}`,
  MY_BOOKINGS: "/my-bookings",
  LOGIN: "/login",
  ADMIN: "/admin",
  API_LINE_WEBHOOK: "/api/line/webhook",
} as const;

export const USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export const BOOKING_STATUS = {
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type BookingStatusType = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const BOOKING_STATUS_LABELS: Record<BookingStatusType, string> = {
  CONFIRMED: "ยืนยันแล้ว",
  COMPLETED: "ใช้บริการเสร็จสิ้น",
  CANCELLED: "ยกเลิกแล้ว",
};

export const ANY_STAFF_OPTION = {
  id: "ANY",
  name: "พนักงานคนใดก็ได้",
  specialty: "ระบบจะเลือกหมอนวดที่ว่างในช่วงเวลาที่คุณต้องการให้อัตโนมัติ",
} as const;

export const DEFAULT_SERVICES = [
  {
    code: "THAI_60",
    name: "นวดไทย 60 นาที",
    description: "นวดแผนไทยคลายเส้น แก้ปวดเมื่อยคอ บ่า ไหล่ และแผ่นหลัง",
    durationMinutes: 60,
    price: 350,
    sortOrder: 1,
  },
  {
    code: "THAI_120",
    name: "นวดไทย 120 นาที",
    description: "นวดแผนไทยเต็มอิ่มทั่วร่างกาย คลายกล้ามเนื้อลึกและยืดเหยียดเส้น",
    durationMinutes: 120,
    price: 650,
    sortOrder: 2,
  },
  {
    code: "FOOT_60",
    name: "นวดเท้า 60 นาที",
    description: "นวดกดจุดฝ่าเท้าและน่อง กระตุ้นการไหลเวียนโลหิต ผ่อนคลายความเมื่อยล้า",
    durationMinutes: 60,
    price: 400,
    sortOrder: 3,
  },
  {
    code: "OIL_90",
    name: "นวดน้ำมัน 90 นาที",
    description: "นวดน้ำมันอโรมาหอมผ่อนคลาย รีดเส้นเบาๆ ช่วยให้หลับสบายและบำรุงผิว",
    durationMinutes: 90,
    price: 750,
    sortOrder: 4,
  },
] as const;

export const DEFAULT_STAFFS = [
  {
    code: "STAFF_1",
    name: "คุณพิมพ์ (หมอพิมพ์)",
    specialty: "เชี่ยวชาญนวดไทยคลายเส้น และนวดน้ำมันอโรมา",
    sortOrder: 1,
  },
  {
    code: "STAFF_2",
    name: "คุณกานต์ (หมอกานต์)",
    specialty: "เชี่ยวชาญนวดกดจุดฝ่าเท้า และนวดไทยแก้อาการ",
    sortOrder: 2,
  },
] as const;

export const LINE_KEYWORDS = {
  BOOK_QUEUE: "จองคิว",
} as const;

export const COOKIE_NAMES = {
  LINE_ID: "mf_line_id",
} as const;

export const DEFAULT_PAGE_SIZE = 20;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
  FORBIDDEN: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้",
  INVALID_INPUT: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
  SLOT_ALREADY_TAKEN: "ขออภัย ช่วงเวลานี้เพิ่งถูกจองไปแล้ว กรุณาเลือกเวลาใหม่",
  OUTSIDE_BUSINESS_HOURS: "เวลาที่เลือกอยู่นอกเวลาทำการของร้าน (10:00–21:00 น.)",
  PAST_TIME_SLOT: "ไม่สามารถจองช่วงเวลาที่ผ่านไปแล้วได้",
  BOOKING_NOT_FOUND: "ไม่พบข้อมูลการจองนี้ หรือคุณไม่มีสิทธิ์เข้าถึง",
  CANCEL_TOO_LATE: `ไม่สามารถยกเลิกได้เนื่องจากต้องยกเลิกล่วงหน้าอย่างน้อย ${APP_CONFIG.cancelMinHoursBefore} ชั่วโมงก่อนเวลาเริ่ม`,
  ALREADY_CANCELLED: "รายการจองนี้ถูกยกเลิกไปแล้ว",
  CANNOT_CANCEL_COMPLETED: "รายการจองที่ใช้บริการเสร็จสิ้นแล้วไม่สามารถยกเลิกได้",
  GENERIC_ERROR: "เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง",
} as const;
