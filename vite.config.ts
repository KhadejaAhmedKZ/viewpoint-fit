// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages build (static SPA served under /<repo>/). Set GITHUB_PAGES=1 and
// optionally PAGES_BASE=/repo-name. Server functions (Live Coach, food photo AI)
// are unavailable on Pages; the app falls back to its offline guidance.
const pages = !!process.env.GITHUB_PAGES;
const pagesBase = process.env.PAGES_BASE ?? "/viewpoint-fit";

export default defineConfig(
  pages
    ? {
        nitro: false,
        vite: { base: `${pagesBase}/` },
        tanstackStart: {
          server: { entry: "server" },
          router: { basepath: pagesBase },
          spa: { enabled: true, prerender: { outputPath: "/index.html" } },
        },
      }
    : {
        tanstackStart: {
          // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
          // nitro/vite builds from this
          server: { entry: "server" },
        },
      },
);
