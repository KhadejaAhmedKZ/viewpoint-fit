import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DailyCheckIn } from "../../src/components/dashboard/DailyCheckIn";
import { WellnessProvider, useWellness } from "../../src/lib/wellness/wellness-state";
import { WellnessHistory } from "../../src/components/dashboard/WellnessHistory";
import { today } from "../../src/lib/services/progressService";
const mocks = vi.hoisted(() => ({
  uid: "player-a",
  history: vi.fn(),
  save: vi.fn(),
  reload: vi.fn(),
  syncScores: vi.fn(),
  missions: [] as import("../../src/types").Mission[],
}));
vi.mock("@/lib/game-state", () => ({
  useGame: () => ({
    user: mocks.uid ? { id: mocks.uid } : null,
    missions: mocks.missions,
    aiMission: null,
    reload: mocks.reload,
  }),
}));
vi.mock("@/lib/services/wellnessService", async (original) => ({
  ...(await original<object>()),
  wellnessService: { history: mocks.history, save: mocks.save, syncScores: mocks.syncScores },
}));
function Probe() {
  const w = useWellness();
  return <output data-testid="score">{w.scores.view ?? "unknown"}</output>;
}
function App() {
  return (
    <WellnessProvider>
      <DailyCheckIn />
      <WellnessHistory inspect />
      <Probe />
    </WellnessProvider>
  );
}
let saved: Record<string, unknown>[];
beforeEach(() => {
  saved = [];
  mocks.missions = [];
  mocks.syncScores.mockReset();
  mocks.syncScores.mockImplementation(async (_uid, row, missionScore, viewScore) => ({
    ...row,
    mission_score: missionScore,
    view_score: viewScore,
    updated_at: "updated",
  }));
  mocks.uid = "player-a";
  mocks.history.mockReset();
  mocks.save.mockReset();
  mocks.history.mockImplementation(async () => saved);
  mocks.save.mockImplementation(async (uid, day, c) => {
    const { wellnessPayload } = await import("../../src/lib/services/wellnessService");
    const row = {
      id: "one-row",
      ...wellnessPayload(uid, day, c, []),
      created_at: "",
      updated_at: "",
    };
    saved = [row];
    return row;
  });
});
afterEach(cleanup);
async function open() {
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "Start 1-min check-in" }) as HTMLButtonElement).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Start 1-min check-in" }));
}
async function submitPartial() {
  fireEvent.click(screen.getByRole("button", { name: "Review & save partial" }));
  fireEvent.submit(screen.getByRole("button", { name: "Update my view" }).closest("form")!);
}
test("partial save persists, reload loads the same row, edit changes the score without XP", async () => {
  const app = render(<App />);
  await open();
  fireEvent.change(screen.getByLabelText("Steps (0–100,000)"), { target: { value: "5000" } });
  await submitPartial();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(saved).toHaveLength(1);
  expect(saved[0]?.["fuel_score"]).toBeNull();
  expect(screen.getByTestId("score").textContent).toBe("50");
  app.unmount();
  render(<App />);
  await screen.findByRole("button", { name: "Edit check-in" });
  fireEvent.click(screen.getByRole("button", { name: "Edit check-in" }));
  expect((screen.getByLabelText("Steps (0–100,000)") as HTMLInputElement).value).toBe("5000");
  fireEvent.change(screen.getByLabelText("Steps (0–100,000)"), { target: { value: "8000" } });
  await submitPartial();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(saved).toHaveLength(1);
  expect(saved[0]?.["date"]).toBe(today());
  expect(screen.getByTestId("score").textContent).toBe("80");
});
test("save failure retains answers and retries successfully", async () => {
  mocks.save.mockRejectedValueOnce(new Error("Could not save. Please retry."));
  render(<App />);
  await open();
  fireEvent.change(screen.getByLabelText("Steps (0–100,000)"), { target: { value: "0" } });
  await submitPartial();
  expect((await screen.findByRole("alert")).textContent).toContain("retry");
  expect(saved).toHaveLength(0);
  fireEvent.submit(screen.getByRole("button", { name: "Update my view" }).closest("form")!);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(saved[0]?.["steps"]).toBe(0);
});
test("invalid input never reaches persistence", async () => {
  render(<App />);
  await open();
  fireEvent.change(screen.getByLabelText("Steps (0–100,000)"), { target: { value: "-5" } });
  fireEvent.click(screen.getByRole("button", { name: "Review & save partial" }));
  expect(screen.getByRole("alert").textContent).toContain("steps");
  expect(mocks.save).not.toHaveBeenCalled();
});
test("account switching never displays the previous player check-in", async () => {
  const app = render(<App />);
  await open();
  fireEvent.change(screen.getByLabelText("Steps (0–100,000)"), { target: { value: "4321" } });
  await submitPartial();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  mocks.uid = "player-b";
  mocks.history.mockResolvedValue([]);
  app.rerender(<App />);
  await waitFor(() => expect(screen.getByTestId("score").textContent).toBe("unknown"));
  expect(screen.queryByText(/4321 steps/)).toBeNull();
});
test("history failure offers retry and does not silently create a blank replacement", async () => {
  mocks.history.mockRejectedValueOnce(new Error("offline"));
  render(<App />);
  await waitFor(() => expect(screen.getAllByRole("alert").length).toBeGreaterThan(0));
  expect(screen.queryByRole("button", { name: "Start 1-min check-in" })).toBeNull();
  fireEvent.click(screen.getAllByRole("button", { name: "Retry" })[0]!);
  await screen.findByRole("button", { name: "Start 1-min check-in" });
  expect(mocks.save).not.toHaveBeenCalled();
});

test("full five-step form saves all four dimensions and the selected feelings", async () => {
  render(<App />);
  await open();
  const change = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
  const click = (name: string) =>
    fireEvent.click(screen.getByRole("button", { name, exact: true }));
  change("Steps (0–100,000)", "8000");
  change("Active minutes (0–600)", "40");
  click("No");
  click("Next");
  change("Sleep hours", "7");
  change("Sleep minutes", "30");
  click("Good");
  click("Yes");
  click("Next");
  click("Great");
  change("Water in liters (0–10)", "2");
  click("Regular");
  click("Next");
  click("4");
  click("Regularly");
  click("Rest day");
  click("Next");
  const ratings = screen.getAllByRole("button", { name: "4", exact: true });
  fireEvent.click(ratings[0]!);
  const stress = screen.getAllByRole("button", { name: "2", exact: true });
  fireEvent.click(stress[1]!);
  click("calm");
  click("good");
  expect(
    (screen.getByRole("button", { name: "tired", exact: true }) as HTMLButtonElement).disabled,
  ).toBe(true);
  click("Review check-in");
  fireEvent.submit(screen.getByRole("button", { name: "Update my view" }).closest("form")!);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  for (const k of ["movement_score", "sleep_score", "fuel_score", "recovery_score", "view_score"])
    expect(saved[0]?.[k]).toEqual(expect.any(Number));
  expect(saved[0]?.["mood_tags"]).toEqual(["calm", "good"]);
});

test("switching accounts closes an unsaved draft", async () => {
  const app = render(<App />);
  await open();
  fireEvent.change(screen.getByLabelText("Steps (0–100,000)"), { target: { value: "7654" } });
  mocks.uid = "player-b";
  app.rerender(<App />);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(mocks.save).not.toHaveBeenCalled();
});

test("mission changes update today's persisted score without rewriting answers", async () => {
  const app = render(<App />);
  await open();
  fireEvent.change(screen.getByLabelText("Steps (0–100,000)"), { target: { value: "5000" } });
  await submitPartial();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  mocks.missions = [
    { id: "test", title: "Move", description: "", category: "move", xp: 40, completed: true },
  ];
  app.rerender(<App />);
  await waitFor(() => expect(mocks.syncScores).toHaveBeenCalledTimes(1));
  expect(mocks.syncScores.mock.calls[0]?.[2]).toBe(100);
  expect(mocks.syncScores.mock.calls[0]?.[3]).toBe(63);
  expect(mocks.save).toHaveBeenCalledTimes(1);
});
