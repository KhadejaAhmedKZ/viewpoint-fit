import { Accessibility } from "@/components/accessibility/Accessibility";
import { FuelProvider } from "@/lib/fuel/fuel-state";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { GameProvider, useGame } from "@/lib/game-state";
import { Toaster } from "@/components/ui/sonner";
import { Eye, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WellnessProvider } from "@/lib/wellness/wellness-state";
import { CoachProvider } from "@/lib/coach/coach-state";
import { Celebrations } from "../components/dashboard/Celebrations";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VIEW POINT FIT" },
      {
        name: "description",
        content:
          "See your health from every angle — preventive wellness education and habit support.",
      },
      { property: "og:title", content: "VIEW POINT FIT" },
      {
        property: "og:description",
        content:
          "See your health from every angle — preventive wellness education and habit support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Space+Grotesk:wght@400;500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ProgressGate() {
  const { user, status, reload } = useGame();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED")
        void router.invalidate();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);
  const publicDemo = router.state.location.pathname === "/demo";
  if (!publicDemo && user && status === "loading") {
    return (
      <div
        className="vp-dots flex min-h-screen flex-col items-center justify-center gap-4 bg-background"
        role="status"
      >
        <span className="vp-pop grid h-16 w-16 animate-bounce place-items-center rounded-2xl border-[3px] border-ink bg-yellow">
          <Eye className="h-8 w-8 text-ink" />
        </span>
        <p className="text-2xl font-bold uppercase text-ink">Loading your view…</p>
      </div>
    );
  }
  if (!publicDemo && user && status === "error") {
    return (
      <div className="vp-dots flex min-h-screen items-center justify-center bg-background px-4">
        <div className="vp-card vp-pop-lg max-w-sm bg-surface p-5 text-center" role="alert">
          <p className="text-2xl font-bold uppercase text-ink">Sync issue</p>
          <p className="mt-2 text-sm text-ink">
            Your latest progress couldn't be loaded right now.
          </p>
          <button
            type="button"
            onClick={reload}
            className="vp-pop vp-press vp-label mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl border-[3px] border-ink bg-yellow px-5 text-ink"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      </div>
    );
  }
  return <Outlet />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <WellnessProvider>
          <FuelProvider>
            <CoachProvider>
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <a href="#vp-main" className="a11y-skip">
                Skip to content
              </a>
              <div id="vp-main" tabIndex={-1}>
                <ProgressGate />
              </div>
              <Accessibility />
              <Celebrations />
              <Toaster />
            </CoachProvider>
          </FuelProvider>
        </WellnessProvider>
      </GameProvider>
    </QueryClientProvider>
  );
}
