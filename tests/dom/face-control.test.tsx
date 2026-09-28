import { test, vi, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { FaceControl } from "../../src/components/accessibility/FaceControl";
const m = vi.hoisted(() => ({ close: vi.fn(), get: vi.fn() }));
vi.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: { forVisionTasks: async () => ({}) },
  FaceLandmarker: { createFromOptions: async () => ({ close: m.close }) },
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
test("late camera permission after unmount stops tracks", async () => {
  let resolve!: (s: unknown) => void;
  m.get.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: m.get } });
  const app = render(<FaceControl onStop={() => {}} />);
  await waitFor(() => expect(m.get).toHaveBeenCalled());
  app.unmount();
  const stop = vi.fn();
  resolve({ getTracks: () => [{ stop }] });
  await waitFor(() => expect(stop).toHaveBeenCalledOnce());
  expect(m.close).toHaveBeenCalledOnce();
});
test("Pose camera request cancels face model and stops face mode", async () => {
  m.get.mockReturnValue(new Promise(() => {}));
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: m.get } });
  const onStop = vi.fn();
  render(<FaceControl onStop={onStop} />);
  await waitFor(() => expect(m.get).toHaveBeenCalled());
  window.dispatchEvent(new Event("vp-pose-camera"));
  expect(onStop).toHaveBeenCalledOnce();
  expect(m.close).toHaveBeenCalledOnce();
});
