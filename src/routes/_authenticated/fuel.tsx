import { FoodCamera } from "@/components/fuel/FoodCamera";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/vp/AppLayout";
import { FuelLog } from "@/components/fuel/FuelLog";
import { SafetyNotice } from "@/components/vp/SafetyNotice";
export const Route = createFileRoute("/_authenticated/fuel")({
  component: () => (
    <AppLayout title="Fuel log" subtitle="Balance, variety, routine">
      <FoodCamera />
      <FuelLog />
      <SafetyNotice />
    </AppLayout>
  ),
  head: () => ({ meta: [{ title: "Fuel Log — VIEW POINT FIT" }] }),
});
