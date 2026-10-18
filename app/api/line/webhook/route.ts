import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SERVICES, LINE_KEYWORDS } from "@/lib/constants";
import {
  buildServiceMenuFlexMessage,
  replyLineFlexMessage,
  verifyLineSignature,
} from "@/lib/line";

interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  source?: {
    type: string;
    userId?: string;
  };
  message?: {
    type: string;
    text?: string;
  };
}

interface LineWebhookPayload {
  destination?: string;
  events?: LineWebhookEvent[];
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-line-signature");

    if (!verifyLineSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, message: "Invalid LINE signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as LineWebhookPayload;
    const events = payload.events ?? [];

    const activeServices = await prisma.service
      .findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          name: true,
          durationMinutes: true,
          price: true,
        },
      })
      .catch(() => [...DEFAULT_SERVICES]);

    const servicesList = activeServices.length > 0 ? activeServices : [...DEFAULT_SERVICES];
    const replies = [];

    for (const event of events) {
      if (
        event.type === "message" &&
        event.message?.type === "text" &&
        event.message.text?.trim() === LINE_KEYWORDS.BOOK_QUEUE &&
        event.replyToken
      ) {
        const lineUserId = event.source?.userId ?? "guest";
        const flexMessage = buildServiceMenuFlexMessage(lineUserId, servicesList);
        const replyResult = await replyLineFlexMessage(event.replyToken, flexMessage);
        replies.push({
          lineUserId,
          replyResult,
          flexMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedEvents: events.length,
      replies,
    });
  } catch (error) {
    console.error("Error processing LINE webhook:", error);
    return NextResponse.json(
      { success: false, message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
