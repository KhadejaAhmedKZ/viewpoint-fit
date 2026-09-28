import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import {
  Accessibility,
  readSettings,
  A11Y_KEY,
} from "../../src/components/accessibility/Accessibility";
vi.mock("@/components/accessibility/FaceControl", () => ({
  FaceControl: ({ onStop }: { onStop: () => void }) => (
    <button onClick={onStop}>Stop face control</button>
  ),
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.className = "";
});
test("stored preferences accept booleans only and recover malformed data", () => {
  expect(readSettings("{broken").largeText).toBe(false);
  expect(readSettings('{"largeText":"false","highContrast":true}')).toMatchObject({
    largeText: false,
    highContrast: true,
  });
});
test("display preferences persist and reset without starting camera", async () => {
  render(<Accessibility />);
  fireEvent.click(screen.getByRole("button", { name: "Accessibility settings" }));
  fireEvent.click(screen.getByRole("switch", { name: "Large text" }));
  await waitFor(() =>
    expect(document.documentElement.classList.contains("a11y-largeText")).toBe(true),
  );
  expect(JSON.parse(localStorage.getItem(A11Y_KEY)!).largeText).toBe(true);
  fireEvent.click(screen.getByRole("switch", { name: "Reduce motion" }));
  expect(document.documentElement.classList.contains("a11y-reducedMotion")).toBe(true);
  expect(screen.queryByRole("button", { name: "Stop face control" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Reset accessibility settings" }));
  expect(document.documentElement.classList.contains("a11y-largeText")).toBe(false);
});
test("voice input requires consent and face control can be stopped with Escape", async () => {
  render(<Accessibility />);
  fireEvent.click(screen.getByRole("button", { name: "Accessibility settings" }));
  expect(
    (screen.getByRole("button", { name: "Start voice input" }) as HTMLButtonElement).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Start face control" }));
  expect(await screen.findByRole("button", { name: "Stop face control" })).toBeTruthy();
  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Stop face control" })).toBeNull(),
  );
});
