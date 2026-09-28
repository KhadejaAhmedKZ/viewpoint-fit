import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { PoseCoach } from "../../src/components/pose/PoseCoach";
const m = vi.hoisted(() => ({ camera: vi.fn(), close: vi.fn() }));
vi.mock("@/lib/game-state", () => ({
  useGame: () => ({
    user: null,
    poseHistory: [],
    completePoseSession: () => ({ xp: false, badges: [] }),
  }),
}));
vi.mock("@/components/characters/Character3D", () => ({
  Character3D: () => <div>Exercise illustration</div>,
}));
vi.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: { forVisionTasks: async () => ({}) },
  PoseLandmarker: {
    createFromOptions: async () => ({ close: m.close, detectForVideo: () => ({ landmarks: [] }) }),
  },
}));
beforeEach(() => {
  m.camera.mockReset();
  m.close.mockReset();
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: m.camera },
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test("camera never starts automatically and denied permission is recoverable", async () => {
  m.camera.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
  render(<PoseCoach />);
  expect(m.camera).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /enable camera/i }));
  await waitFor(() =>
    expect(screen.getAllByText(/camera access needed/i).length).toBeGreaterThan(0),
  );
  expect(m.camera).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
});
test("permission resolving after navigation stops every late stream track", async () => {
  let resolve!: (s: unknown) => void;
  m.camera.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const view = render(<PoseCoach />);
  fireEvent.click(screen.getByRole("button", { name: /enable camera/i }));
  const stop = vi.fn();
  view.unmount();
  await act(async () => {
    resolve({ getTracks: () => [{ stop }] });
  });
  expect(stop).toHaveBeenCalledTimes(1);
});
