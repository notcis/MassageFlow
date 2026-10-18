import Link from "next/link";
import { CalendarCheck, Clock, Sparkles, ShieldCheck } from "lucide-react";
import { APP_CONFIG, ROUTES } from "@/lib/constants";

interface PublicHeaderProps {
  lineId?: string;
}

export function PublicHeader({ lineId }: PublicHeaderProps) {
  const querySuffix = lineId ? `?line_id=${encodeURIComponent(lineId)}` : "";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link
          href={`${ROUTES.BOOKING}${querySuffix}`}
          className="flex items-center gap-2 text-slate-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <span className="block text-base font-bold leading-tight text-slate-900">
              {APP_CONFIG.name}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="h-3 w-3 text-teal-600" />
              เปิดทุกวัน {APP_CONFIG.openTime}–{APP_CONFIG.closeTime} น.
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href={`${ROUTES.MY_BOOKINGS}${querySuffix}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>คิวของฉัน</span>
          </Link>
          <Link
            href={ROUTES.ADMIN}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            title="สำหรับร้านค้า (Admin)"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
