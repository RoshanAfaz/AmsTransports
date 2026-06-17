import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
} from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { LanguageProvider } from "@/lib/language-context";
import "../styles.css";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Route off the map</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist in the AMS Transports system.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-gradient-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-accent">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { useState, useEffect, Suspense } from "react";
import { LoginPage } from "@/components/login-page";
import { TruckLoader } from "@/components/truck-loader";
import { apiGet } from "@/lib/api-fetch";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Artificial mounting/waking delay to show the gorgeous truck loader drive
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 1800);

    setIsAuthenticated(localStorage.getItem("ams_auth") === "true");

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Prefetch data in the background to ensure all navigations are completely instant
  useEffect(() => {
    if (isMounted && isAuthenticated) {
      const routesToPrefetch = [
        { key: ["dashboard"], fn: () => apiGet("/api/dashboard") },
        { key: ["drivers"], fn: () => apiGet("/api/drivers") },
        { key: ["trips"], fn: () => apiGet("/api/trips").then(async (d: any) => {
            const settings = await apiGet("/api/settings").catch(() => null);
            return { ...d, settings };
          }) 
        },
        { key: ["fleet"], fn: () => apiGet("/api/fleet") },
        { key: ["maintenance"], fn: () => apiGet("/api/maintenance") },
        { key: ["tyres"], fn: () => apiGet("/api/tyres") },
        { key: ["expenses"], fn: () => apiGet("/api/expenses") },
        { key: ["emi"], fn: () => apiGet("/api/emi") },
        { key: ["diesel"], fn: () => apiGet("/api/diesel") },
        { key: ["settings"], fn: () => apiGet("/api/settings").then(d => ({ settings: d })) },
        { key: ["notifications"], fn: () => apiGet("/api/notifications") },
      ];

      routesToPrefetch.forEach(({ key, fn }) => {
        queryClient.prefetchQuery({ queryKey: key, queryFn: fn }).catch(() => {});
      });
    }
  }, [isMounted, isAuthenticated, queryClient]);

  if (!isMounted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#070b19] font-sans overflow-hidden">
        <div className="text-center flex flex-col items-center">
          <TruckLoader />
          <p className="text-sm font-bold tracking-widest text-[#38bdf8] uppercase mt-6">AMS TRANSPORTS</p>
          <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase mt-1.5 font-semibold">Establishing Secure Link...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <LoginPage onLogin={() => setIsAuthenticated(true)} />
        </LanguageProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SidebarProvider defaultOpen={false}>
          <div className="flex min-h-screen w-full relative overflow-hidden bg-background bg-grid transition-all duration-500">
            <div className="absolute inset-0 pointer-events-none bg-gradient-glow opacity-80" />
            <AppSidebar />
            <SidebarInset 
              className="flex min-h-screen flex-1 flex-col relative z-10"
              style={{ backgroundColor: "transparent" }}
            >
              <Topbar />
              <main className="flex-1 p-4 md:p-6 lg:p-8">
                <Suspense fallback={
                  <div className="flex h-[50vh] w-full items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#38bdf8]" />
                  </div>
                }>
                  <Outlet />
                </Suspense>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
