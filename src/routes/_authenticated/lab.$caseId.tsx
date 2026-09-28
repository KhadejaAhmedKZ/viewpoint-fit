import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Construction, FileSearch, Lock } from "lucide-react";
import { AppLayout } from "@/components/vp/AppLayout";
import { CaseEngine } from "@/components/lab/CaseEngine";
import { CaseSafety } from "@/components/lab/CaseSafety";
import { EmptyState } from "@/components/vp/ui";
import { cases } from "@/data/mock";
import { getPlayableCase } from "@/data/cases";
import { useGame } from "@/lib/game-state";

export const Route = createFileRoute("/_authenticated/lab/$caseId")({
  head: () => ({
    meta: [
      { title: "Case File — VIEW POINT LAB" },
      {
        name: "description",
        content:
          "Investigate a fictional Health Detective case: gather evidence, connect clues, build a plan and see an educational simulation.",
      },
      { property: "og:title", content: "Case File — VIEW POINT LAB" },
      { property: "og:description", content: "Open a detective dossier inside VIEW POINT LAB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CaseDetail,
});

function CaseDetail() {
  const { caseId } = Route.useParams();
  const { solvedCases } = useGame();
  const summary = cases.find((c) => c.id === caseId);
  const playable = getPlayableCase(caseId);
  const locked = !!summary?.requiresCaseId && !solvedCases.includes(summary.requiresCaseId);

  const back = (
    <Link
      to="/lab"
      className="vp-label vp-press inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-ink bg-surface px-3 text-ink"
    >
      <ArrowLeft className="h-4 w-4" /> Back to cases
    </Link>
  );

  let content;
  if (!summary) {
    content = (
      <EmptyState
        icon={<FileSearch className="h-6 w-6" />}
        title="No case file found"
        body={`Nothing matches “${caseId}”. Pick a case from the Lab.`}
      />
    );
  } else if (locked) {
    content = (
      <EmptyState
        icon={<Lock className="h-6 w-6" />}
        title="Case locked"
        body={summary.unlockRequirement ?? "Solve earlier cases first."}
      />
    );
  } else if (!playable) {
    content = (
      <EmptyState
        icon={<Construction className="h-6 w-6" />}
        title={`Case #${summary.id} development coming next`}
        body={`${summary.title} is unlocked. Its investigation is still being built.`}
      />
    );
  } else {
    content = <CaseEngine c={playable} />;
  }

  return (
    <AppLayout
      kicker={summary ? `Case #${summary.id}` : "Case file"}
      title={summary ? summary.title : "Unknown case"}
    >
      {back}
      {content}
      {!playable || locked ? <CaseSafety /> : null}
    </AppLayout>
  );
}
