import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

interface HomePageProps {
  searchParams: Promise<{ line_id?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const lineId = params.line_id?.trim();

  if (lineId) {
    redirect(`${ROUTES.BOOKING}?line_id=${encodeURIComponent(lineId)}`);
  }

  redirect(ROUTES.BOOKING);
}
