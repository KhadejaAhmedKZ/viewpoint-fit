import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import { FoodCamera } from "../../src/components/fuel/FoodCamera";
const m = vi.hoisted(() => ({ analyze: vi.fn(), save: vi.fn(), prepare: vi.fn(), uid: "a" }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => m.analyze }));
vi.mock("@/lib/fuel/photo.functions", () => ({ analyzeMeal: () => {}, getFoodProvider: async () => ({ provider: "gemini" }) }));
vi.mock("@/lib/fuel/photo-client", () => ({ prepareFoodPhoto: m.prepare }));
vi.mock("@/lib/game-state", () => ({ useGame: () => ({ user: { id: m.uid } }) }));
vi.mock("@/lib/fuel/fuel-state", () => ({ useFuel: () => ({ save: m.save }) }));
beforeEach(() => {
  m.uid = "a";
  m.analyze.mockReset();
  m.save.mockReset().mockResolvedValue(undefined);
  m.prepare.mockReset().mockResolvedValue("synthetic-resized-photo");
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL() {
        return "blob:local-only";
      }
      static revokeObjectURL = vi.fn();
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function selectPhoto() {
  const input = screen.getByLabelText(/take or choose a food photo/i);
  fireEvent.change(input, {
    target: { files: [new File(["synthetic"], "food.jpg", { type: "image/jpeg" })] },
  });
}
test("photo stays local until explicit consent and Analyze; confirmed saved report excludes image", async () => {
  m.analyze.mockResolvedValue({
    ok: true,
    report: {
      items: [
        {
          name: "Rice",
          grams: 100,
          kcal100Low: 120,
          kcal100High: 150,
          protein100: 3,
          carbs100: 28,
          fat100: 1,
        },
      ],
      confidence: "low",
      notes: ["Portion uncertain"],
    },
  });
  render(<FoodCamera />);
  selectPhoto();
  expect(m.analyze).not.toHaveBeenCalled();
  const analyze = screen.getByRole("button", { name: "Analyze food photo" });
  expect((analyze as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByLabelText(/I agree to send/));
  await waitFor(() => expect((screen.getByRole("button", { name: "Analyze food photo" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(analyze);
  await screen.findByLabelText("Grams for Rice");
  expect(m.analyze).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText("Grams for Rice"), { target: { value: "200" } });
  await screen.findByText("240–300 kcal");
  const save = screen.getByRole("button", { name: "Save confirmed report" });
  expect((save as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByLabelText(/I reviewed/));
  fireEvent.click(save);
  await screen.findByText("Report saved");
  const payload = m.save.mock.calls[0]![0];
  expect(payload.nutrition_report.items[0].grams).toBe(200);
  expect(JSON.stringify(payload)).not.toMatch(/blob:|synthetic-resized-photo/);
});
test("AI failure keeps manual entry usable", async () => {
  m.analyze.mockResolvedValue({ ok: false, message: "Photo AI is not configured." });
  render(<FoodCamera />);
  selectPhoto();
  fireEvent.click(screen.getByLabelText(/I agree to send/));
  await waitFor(() => expect((screen.getByRole("button", { name: "Analyze food photo" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Analyze food photo" }));
  await screen.findByText("Photo AI is not configured.");
  expect(screen.getByLabelText("Food name")).toBeTruthy();
});
test("switching accounts clears the image and ignores late AI results", async () => {
  let resolve!: (r: unknown) => void;
  m.analyze.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const app = render(<FoodCamera />);
  selectPhoto();
  fireEvent.click(screen.getByLabelText(/I agree to send/));
  await waitFor(() => expect((screen.getByRole("button", { name: "Analyze food photo" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Analyze food photo" }));
  await waitFor(() => expect(m.analyze).toHaveBeenCalled());
  m.uid = "b";
  app.rerender(<FoodCamera />);
  resolve({ ok: true, report: { items: [], confidence: "low", notes: ["Private old response"] } });
  await waitFor(() => expect(screen.queryByAltText(/Your food photo/)).toBeNull());
  expect(screen.queryByText("Private old response")).toBeNull();
});
