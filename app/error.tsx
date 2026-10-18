"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center p-4">
      <Card className="w-full">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-900">
              เกิดข้อผิดพลาดในการโหลดหน้าเว็บ
            </h1>
            <p className="text-xs text-slate-500">
              กรุณาลองรีเฟรชหน้าเว็บอีกครั้ง หรือกลับไปหน้าแรก
            </p>
          </div>
          <Button type="button" onClick={reset} className="w-full">
            ลองใหม่อีกครั้ง
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
