import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Truck, Users, Route as RouteIcon, Fuel, CircleDot,
  Wrench, Receipt, CreditCard, TrendingUp, BarChart3, FileText, Bell, Settings, LogOut,
  Warehouse,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/lib/language-context";

const groups = [
  {
    label: "Overview",
    colorClass: "text-[#38bdf8]", // Sky Blue
    barColor: "bg-[#38bdf8]",
    shadowColor: "shadow-[#38bdf8]/50",
    bgClass: "data-[active=true]:bg-[#38bdf8]/10 data-[active=true]:text-[#38bdf8]",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Analytics", url: "/analytics", icon: TrendingUp },
    ],
  },
  {
    label: "Operations",
    colorClass: "text-[#34d399]", // Emerald
    barColor: "bg-[#34d399]",
    shadowColor: "shadow-[#34d399]/50",
    bgClass: "data-[active=true]:bg-[#34d399]/10 data-[active=true]:text-[#34d399]",
    items: [
      { title: "Fleet", url: "/fleet", icon: Truck },
      { title: "Garage", url: "/garage", icon: Warehouse },
      { title: "Drivers", url: "/drivers", icon: Users },
      { title: "Trips", url: "/trips", icon: RouteIcon },
      { title: "Diesel", url: "/diesel", icon: Fuel },
      { title: "Tyres", url: "/tyres", icon: CircleDot },
      { title: "Maintenance", url: "/maintenance", icon: Wrench },
    ],
  },
  {
    label: "Finance",
    colorClass: "text-[#fbbf24]", // Amber
    barColor: "bg-[#fbbf24]",
    shadowColor: "shadow-[#fbbf24]/50",
    bgClass: "data-[active=true]:bg-[#fbbf24]/10 data-[active=true]:text-[#fbbf24]",
    items: [
      { title: "Expenses", url: "/expenses", icon: Receipt },
      { title: "EMI & Loans", url: "/emi", icon: CreditCard },
      { title: "Profit & Loss", url: "/profit-loss", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    colorClass: "text-[#f472b6]", // Pink
    barColor: "bg-[#f472b6]",
    shadowColor: "shadow-[#f472b6]/50",
    bgClass: "data-[active=true]:bg-[#f472b6]/10 data-[active=true]:text-[#f472b6]",
    items: [
      { title: "Reports", url: "/reports", icon: FileText },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useLanguage();

  const handleLinkClick = () => {
    setOpenMobile(false);
    setOpen(false);
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border group-data-[state=collapsed]:p-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
        <div className="flex items-center gap-3 px-2 py-3 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center transition-all duration-200">
          <div className="flex h-10 w-10 group-data-[state=collapsed]:h-8 group-data-[state=collapsed]:w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-white/10 shadow-sm transition-all duration-200">
            <Truck className="h-5 w-5 group-data-[state=collapsed]:h-4 group-data-[state=collapsed]:w-4 text-[#0a1120] transition-all duration-200" />
          </div>
          <div className="flex flex-col transition-all duration-200 group-data-[state=collapsed]:hidden">
            <span className="text-sm font-bold tracking-wider text-[#34d399]">AMS TRANSPORTS</span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#f97316] font-semibold">Fleet Command Centre</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50 transition-all duration-200 group-data-[state=collapsed]:hidden">
              {t(g.label)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={`group relative h-10 transition-colors ${active ? g.bgClass : ""}`}
                      >
                        <Link to={item.url} onClick={handleLinkClick} className="flex items-center gap-3">
                          {active && (
                            <span className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full ${g.barColor} ${g.shadowColor} shadow-[0_0_8px_var(--tw-shadow-color)]`} />
                          )}
                          <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? g.colorClass : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"}`} />
                          <span className={`text-sm transition-all duration-200 group-data-[state=collapsed]:hidden ${active ? "font-semibold" : ""}`}>{t(item.title)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="h-10 text-sidebar-foreground/80 hover:text-sidebar-foreground"
              onClick={() => {
                localStorage.removeItem("ams_auth");
                window.location.reload();
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm transition-all duration-200 group-data-[state=collapsed]:hidden">{t("Logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
