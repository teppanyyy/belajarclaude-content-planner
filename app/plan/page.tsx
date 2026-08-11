import WeeklyPlanForm from "./WeeklyPlanForm";
import { getThemeOptions } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const initialThemeOptions = await getThemeOptions();
  return <WeeklyPlanForm initialThemeOptions={initialThemeOptions} />;
}
