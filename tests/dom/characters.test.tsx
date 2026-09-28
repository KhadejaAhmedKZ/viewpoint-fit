import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Character3D } from "../../src/components/characters/Character3D";
const m = vi.hoisted(() => ({
  create: vi.fn(),
  dispose: vi.fn(),
  render: vi.fn(),
  resize: vi.fn(),
}));
vi.mock("@/lib/characters/scene", () => ({ createCharacterScene: m.create }));
beforeEach(() => {
  m.create.mockReset();
  m.dispose.mockReset();
  m.create.mockReturnValue({ dispose: m.dispose, render: m.render, resize: m.resize });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: (x: unknown[]) => void) {}
      observe() {
        this.cb([{ isIntersecting: true }]);
      }
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test("WebGL startup failure has an accessible illustration fallback", async () => {
  m.create.mockImplementation(() => {
    throw new Error("WebGL unavailable");
  });
  render(<Character3D character="maya" />);
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("illustrated"),
  );
  expect(screen.getByText("Illustrated view · 3D unavailable")).toBeTruthy();
});
test("context loss falls back and cleans GPU resources", async () => {
  const view = render(<Character3D />);
  await waitFor(() => expect(m.create).toHaveBeenCalled());
  fireEvent(view.container.querySelector("canvas")!, new Event("webglcontextlost"));
  expect(screen.getByText("Illustrated view · 3D unavailable")).toBeTruthy();
  expect(m.dispose).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(m.dispose).toHaveBeenCalledTimes(1);
});
test("all characters release resources on navigation", async () => {
  for (const character of ["player", "maya", "khalid", "sara", "omar"] as const) {
    const view = render(<Character3D character={character} />);
    await waitFor(() =>
      expect(m.create).toHaveBeenCalledWith(expect.anything(), character, "yellow", false),
    );
    view.unmount();
  }
  expect(m.dispose).toHaveBeenCalledTimes(5);
});
