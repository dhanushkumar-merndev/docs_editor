import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { requireCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  await requireCurrentUser();
  return <DashboardClient />;
}
