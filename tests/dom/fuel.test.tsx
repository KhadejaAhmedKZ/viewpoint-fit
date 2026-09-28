import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FuelProvider, useFuel } from "../../src/lib/fuel/fuel-state";
const m = vi.hoisted(() => ({ uid: "a", list: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/game-state", () => ({ useGame: () => ({ user: { id: m.uid } }) }));
vi.mock("@/lib/fuel/service", () => ({ fuelService: { list: m.list, save: m.save } }));
function Probe() {
  const f = useFuel();
  return (
    <>
      <output>{f.meals.map((x) => x.description).join(",")}</output>
      <p role="status" data-testid="sync">
        {f.loading ? "Loading" : (f.error ?? "Ready")}
      </p>
      <button onClick={f.reload}>Retry</button>
      <button
        onClick={() =>
          void f.save({ meal_type: "lunch", description: "Lentils", components: ["protein"] })
        }
      >
        Save
      </button>
    </>
  );
}
const App = () => (
  <FuelProvider>
    <Probe />
  </FuelProvider>
);
beforeEach(() => {
  m.uid = "a";
  m.list.mockReset().mockResolvedValue([]);
  m.save.mockReset().mockResolvedValue({ id: "1", description: "Lentils" });
});
afterEach(cleanup);
test("meal save and reload use the same persisted service history", async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByTestId("sync").textContent).toBe("Ready"));
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() => expect(screen.getByTestId("sync").textContent).toBe("Ready"));
  await waitFor(() => expect(screen.getByText("Lentils")).toBeTruthy());
  m.list.mockResolvedValue([{ id: "1", description: "Lentils" }]);
  fireEvent.click(screen.getByText("Retry"));
  await waitFor(() => expect(m.list).toHaveBeenCalledTimes(2));
  expect(screen.getByText("Lentils")).toBeTruthy();
});
test("failed history loads show a recoverable error", async () => {
  m.list.mockRejectedValueOnce(new Error("Connection unavailable"));
  render(<App />);
  await screen.findByText("Connection unavailable");
  fireEvent.click(screen.getByText("Retry"));
  await waitFor(() => expect(screen.getByTestId("sync").textContent).toBe("Ready"));
});
test("late meal responses cannot cross account boundaries", async () => {
  let resolve!: (v: unknown[]) => void;
  m.list.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const app = render(<App />);
  m.uid = "b";
  app.rerender(<App />);
  await waitFor(() => expect(m.list).toHaveBeenCalledWith("b"));
  resolve([{ id: "private", description: "Private A meal" }]);
  await waitFor(() => expect(screen.getByTestId("sync").textContent).toBe("Ready"));
  expect(screen.queryByText("Private A meal")).toBeNull();
});
