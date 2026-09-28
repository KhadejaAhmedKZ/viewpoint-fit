import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/vp/AppLayout";
import { PoseCoach } from "@/components/pose/PoseCoach";
import { RecentSessions } from "@/components/pose/RecentSessions";
import { SafetyNotice } from "@/components/vp/SafetyNotice";

export const Route = createFileRoute("/_authenticated/pose")({
  head: () => ({
    meta: [
      { title: "AI Pose Coach — Squat, Curl & Lunge | VIEW POINT FIT" },
      {
        name: "description",
        content:
          "Real-time rep counting and form cues for squats, bicep curls and lunges, processed locally in your browser.",
      },
      { property: "og:title", content: "AI Pose Coach — Squat, Curl & Lunge | VIEW POINT FIT" },
      {
        property: "og:description",
        content: "Move. Learn. Improve. One camera, three real movement detectors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PosePage,
});

function PosePage() {
  return (
    <AppLayout title="AI Pose Coach" subtitle="Move. Learn. Improve.">
      <PoseCoach />
      <RecentSessions />
      <SafetyNotice />
    </AppLayout>
  );
}
