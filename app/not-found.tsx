import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center p-4">
      <Card className="w-full">
        <CardContent className="p-6 text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-teal-700">404</h1>
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-900">
              ไม่พบหน้าที่คุณต้องการ
            </p>
            <p className="text-xs text-slate-500">
              ลิงก์อาจไม่ถูกต้องหรือรายการจองอาจถูกลบออกจากระบบ
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href={ROUTES.BOOKING}>ไปหน้าจองคิวนวด</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
