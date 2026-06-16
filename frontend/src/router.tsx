import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { TruckLoader } from "./components/truck-loader";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: () => (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#070b19] font-sans overflow-hidden">
        <div className="text-center flex flex-col items-center">
          <TruckLoader />
          <p className="text-sm font-bold tracking-widest text-[#38bdf8] uppercase mt-6">AMS TRANSPORTS</p>
          <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase mt-1.5 font-semibold">Establishing Secure Link...</p>
        </div>
      </div>
    ),
    defaultPendingMs: 0,
  });

  return router;
};
