import crypto from "crypto";
import { getServerEnv } from "@/lib/env";
import { APP_CONFIG, DEFAULT_SERVICES, ROUTES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { formatThaiDate } from "@/lib/time";
import type { BookingSummaryDTO } from "@/types";

const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";
const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

export function verifyLineSignature(rawBody: string, signature: string | null): boolean {
  const env = getServerEnv();
  if (!env.LINE_CHANNEL_SECRET || env.LINE_CHANNEL_SECRET.startsWith("replace-with")) {
    return env.NODE_ENV !== "production";
  }
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("SHA256", env.LINE_CHANNEL_SECRET)
    .update(rawBody)
    .digest("base64");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export interface LineFlexContainer {
  type: "bubble" | "carousel";
  [key: string]: unknown;
}

export interface LineFlexMessage {
  type: "flex";
  altText: string;
  contents: LineFlexContainer;
}

/**
 * Builds the Flex Message showing available massage services and a button to open the booking page
 * with `?line_id={lineUserId}`.
 */
export function buildServiceMenuFlexMessage(
  lineUserId: string,
  services: ReadonlyArray<{
    name: string;
    durationMinutes: number;
    price: number;
  }> = DEFAULT_SERVICES
): LineFlexMessage {
  const env = getServerEnv();
  const bookingUrl = `${env.NEXT_PUBLIC_APP_URL}${ROUTES.BOOKING}?line_id=${encodeURIComponent(
    lineUserId
  )}`;
  const myBookingsUrl = `${env.NEXT_PUBLIC_APP_URL}${ROUTES.MY_BOOKINGS}?line_id=${encodeURIComponent(
    lineUserId
  )}`;

  const serviceRows = services.map((service) => ({
    type: "box",
    layout: "horizontal",
    margin: "md",
    contents: [
      {
        type: "box",
        layout: "vertical",
        flex: 4,
        contents: [
          {
            type: "text",
            text: service.name,
            weight: "bold",
            size: "sm",
            color: "#1F2937",
            wrap: true,
          },
          {
            type: "text",
            text: `ระยะเวลา ${service.durationMinutes} นาที`,
            size: "xs",
            color: "#6B7280",
          },
        ],
      },
      {
        type: "text",
        text: `${formatCurrency(service.price)} ฿`,
        weight: "bold",
        size: "sm",
        color: "#0D9488",
        align: "end",
        gravity: "center",
        flex: 2,
      },
    ],
  }));

  return {
    type: "flex",
    altText: `${APP_CONFIG.name} - รายการบริการนวดและจองคิวออนไลน์`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0D9488",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: APP_CONFIG.name,
            color: "#FFFFFF",
            weight: "bold",
            size: "xl",
          },
          {
            type: "text",
            text: `เปิดบริการทุกวัน ${APP_CONFIG.openTime}–${APP_CONFIG.closeTime} น.`,
            color: "#CCFBF1",
            size: "xs",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "รายการบริการนวด",
            weight: "bold",
            size: "md",
            color: "#111827",
          },
          {
            type: "separator",
            margin: "md",
          },
          ...serviceRows,
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0D9488",
            height: "sm",
            action: {
              type: "uri",
              label: "จองคิวทันที",
              uri: bookingUrl,
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "รายการจองของฉัน",
              uri: myBookingsUrl,
            },
          },
        ],
      },
    },
  };
}

/**
 * Builds the Flex Message pushed to customer when a booking is confirmed.
 */
export function buildBookingConfirmedFlexMessage(booking: BookingSummaryDTO): LineFlexMessage {
  const env = getServerEnv();
  const detailUrl = `${env.NEXT_PUBLIC_APP_URL}${ROUTES.BOOKING_DETAIL(
    booking.bookingCode
  )}?line_id=${encodeURIComponent(booking.lineId)}`;
  const myBookingsUrl = `${env.NEXT_PUBLIC_APP_URL}${ROUTES.MY_BOOKINGS}?line_id=${encodeURIComponent(
    booking.lineId
  )}`;

  return {
    type: "flex",
    altText: `ยืนยันการจองคิว ${booking.bookingCode} - ${booking.serviceName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0D9488",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "ยืนยันการจองคิวสำเร็จ",
            color: "#FFFFFF",
            weight: "bold",
            size: "lg",
          },
          {
            type: "text",
            text: `รหัสการจอง: ${booking.bookingCode}`,
            color: "#CCFBF1",
            size: "sm",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "บริการ",
                size: "xs",
                color: "#6B7280",
              },
              {
                type: "text",
                text: `${booking.serviceName} (${formatCurrency(booking.price)} บาท)`,
                weight: "bold",
                size: "md",
                color: "#111827",
                wrap: true,
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "วันที่และเวลา",
                size: "xs",
                color: "#6B7280",
              },
              {
                type: "text",
                text: `${formatThaiDate(booking.bookingDate)} เวลา ${booking.startTime}–${booking.endTime} น.`,
                weight: "bold",
                size: "sm",
                color: "#0D9488",
                wrap: true,
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "พนักงานนวด",
                    size: "xs",
                    color: "#6B7280",
                  },
                  {
                    type: "text",
                    text: booking.staffName,
                    weight: "bold",
                    size: "sm",
                    color: "#1F2937",
                    wrap: true,
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "ชื่อลูกค้า",
                    size: "xs",
                    color: "#6B7280",
                  },
                  {
                    type: "text",
                    text: booking.customerName,
                    weight: "bold",
                    size: "sm",
                    color: "#1F2937",
                    wrap: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0D9488",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูผลการจอง",
              uri: detailUrl,
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "รายการจองของฉัน",
              uri: myBookingsUrl,
            },
          },
        ],
      },
    },
  };
}

/**
 * Builds the Flex Message pushed to customer when a booking is cancelled.
 */
export function buildBookingCancelledFlexMessage(booking: BookingSummaryDTO): LineFlexMessage {
  const env = getServerEnv();
  const bookingUrl = `${env.NEXT_PUBLIC_APP_URL}${ROUTES.BOOKING}?line_id=${encodeURIComponent(
    booking.lineId
  )}`;
  const myBookingsUrl = `${env.NEXT_PUBLIC_APP_URL}${ROUTES.MY_BOOKINGS}?line_id=${encodeURIComponent(
    booking.lineId
  )}`;

  return {
    type: "flex",
    altText: `ยกเลิกการจองคิว ${booking.bookingCode} เรียบร้อยแล้ว`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#DC2626",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "ยกเลิกการจองคิวเรียบร้อยแล้ว",
            color: "#FFFFFF",
            weight: "bold",
            size: "lg",
          },
          {
            type: "text",
            text: `รหัสการจอง: ${booking.bookingCode}`,
            color: "#FEE2E2",
            size: "sm",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: `บริการ: ${booking.serviceName}`,
            weight: "bold",
            size: "sm",
            color: "#111827",
            wrap: true,
          },
          {
            type: "text",
            text: `วันที่: ${formatThaiDate(booking.bookingDate)} (${booking.startTime}–${booking.endTime} น.)`,
            size: "sm",
            color: "#4B5563",
            wrap: true,
          },
          {
            type: "text",
            text: `พนักงาน: ${booking.staffName}`,
            size: "sm",
            color: "#4B5563",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "16px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0D9488",
            height: "sm",
            action: {
              type: "uri",
              label: "จองคิวใหม่",
              uri: bookingUrl,
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูรายการจองของฉัน",
              uri: myBookingsUrl,
            },
          },
        ],
      },
    },
  };
}

export async function replyLineFlexMessage(
  replyToken: string,
  message: LineFlexMessage
): Promise<{ sent: boolean; reason?: string }> {
  const env = getServerEnv();
  if (
    !env.LINE_CHANNEL_ACCESS_TOKEN ||
    env.LINE_CHANNEL_ACCESS_TOKEN.startsWith("replace-with")
  ) {
    return { sent: false, reason: "LINE_CHANNEL_ACCESS_TOKEN_NOT_CONFIGURED" };
  }

  try {
    const response = await fetch(LINE_REPLY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [message],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LINE Reply API error:", response.status, errorText);
      return { sent: false, reason: `HTTP_${response.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error("Failed to send LINE reply message:", error);
    return { sent: false, reason: "NETWORK_ERROR" };
  }
}

export async function pushLineFlexMessage(
  toLineUserId: string,
  message: LineFlexMessage
): Promise<{ sent: boolean; reason?: string }> {
  if (!toLineUserId) {
    return { sent: false, reason: "MISSING_LINE_USER_ID" };
  }

  const env = getServerEnv();
  if (
    !env.LINE_CHANNEL_ACCESS_TOKEN ||
    env.LINE_CHANNEL_ACCESS_TOKEN.startsWith("replace-with")
  ) {
    return { sent: false, reason: "LINE_CHANNEL_ACCESS_TOKEN_NOT_CONFIGURED" };
  }

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: toLineUserId,
        messages: [message],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LINE Push API error:", response.status, errorText);
      return { sent: false, reason: `HTTP_${response.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error("Failed to send LINE push message:", error);
    return { sent: false, reason: "NETWORK_ERROR" };
  }
}
