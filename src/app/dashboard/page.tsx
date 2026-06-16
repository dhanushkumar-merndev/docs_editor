import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { requireCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  return <DashboardClient user={user} />;
}
