"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { APP_CONFIG, ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(
          error.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
        );
        setIsLoading(false);
        return;
      }

      router.push(ROUTES.ADMIN);
      router.refresh();
    } catch {
      setErrorMessage("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            เข้าสู่ระบบจัดการร้าน ({APP_CONFIG.name})
          </h1>
          <p className="text-xs text-slate-500">
            สำหรับผู้ดูแลระบบ (Admin) เพื่อตรวจสอบและจัดการตารางคิวนวด
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">อีเมลผู้ดูแลระบบ</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@massageflow.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password">รหัสผ่าน</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังตรวจสอบสิทธิ์...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                เข้าสู่ระบบ Admin
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
