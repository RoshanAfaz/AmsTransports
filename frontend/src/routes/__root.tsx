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

import { useState, useEffect } from "react";
import { LoginPage } from "@/components/login-page";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setIsAuthenticated(localStorage.getItem("ams_auth") === "true");
    setBgImage(localStorage.getItem("ams_bg_image"));

    const handleBgChange = () => {
      const val = localStorage.getItem("ams_bg_image");
      console.log("DEBUG: handleBgChange event triggered, val:", val ? val.slice(0, 50) + "..." : null);
      setBgImage(val);
    };
    window.addEventListener("ams_bg_image_changed", handleBgChange);
    return () => window.removeEventListener("ams_bg_image_changed", handleBgChange);
  }, []);

  console.log("DEBUG: RootComponent render, bgImage:", bgImage ? bgImage.slice(0, 50) + "..." : null);

  if (!isMounted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#070b19] font-sans">
        <div className="text-center">
          <div className="relative h-12 w-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-900" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-bold tracking-widest text-blue-400 uppercase">AMS TRANSPORTS</p>
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
          <div 
            className={`flex min-h-screen w-full relative overflow-hidden bg-cover bg-center bg-no-repeat transition-all duration-500 ${!bgImage ? "bg-background bg-grid" : ""}`}
            style={bgImage ? { backgroundImage: `url("${bgImage}")` } : undefined}
          >
            {bgImage && (
              <div className="absolute inset-0 pointer-events-none backdrop-blur-[3px]" style={{ backgroundColor: "rgba(10, 15, 30, 0.85)" }} />
            )}
            <div className="absolute inset-0 pointer-events-none bg-gradient-glow opacity-80" />
            <AppSidebar />
            <SidebarInset 
              className="flex min-h-screen flex-1 flex-col relative z-10"
              style={{ backgroundColor: "transparent" }}
            >
              <Topbar />
              <main className="flex-1 p-4 md:p-6 lg:p-8">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
