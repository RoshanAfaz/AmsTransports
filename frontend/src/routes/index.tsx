import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Truck, Route as RouteIcon, TrendingUp, Receipt, Fuel, CreditCard, Users, Wrench } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatINR } from "@/lib/mock-data";
import { apiGet } from "@/lib/api-fetch";
import { useLanguage } from "@/lib/language-context";

export const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/dashboard");
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AMS Transports" },
      { name: "description", content: "Live fleet operations, trips, diesel, and profit analytics for AMS Transports." },
    ],
  }),
  loader: () => getDashboardData(),
  component: Dashboard,
});

const PIE_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-primary)", "var(--color-accent)", "var(--color-success)"];

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "var(--color-popover-foreground)",
};

function Dashboard() {
  const { monthlyData, expenseBreakdown, truckProfit, trips, dieselTrend, notifications, stats, businessName } = Route.useLoaderData();
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#38bdf8]">{t("Fleet Command Center")}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {t("Welcome back,")} <span className="text-[#34d399]">{businessName}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("Real-time view across your fleet, trips, fuel and finances.")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-success animate-pulse" />
              {t("All systems operational")}
            </Badge>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("Total Trucks")} value={stats.totalTrucks.toString()} delta={0} icon={Truck} accent="primary" />
        <StatCard label={t("Running Trips")} value={stats.runningTrips.toString()} icon={RouteIcon} accent="accent" />
        <StatCard label={t("Total Profit")} value={formatINR(stats.netProfit)} icon={TrendingUp} accent={stats.netProfit >= 0 ? "success" : "destructive"} />
        <StatCard label={t("Total Expenses")} value={formatINR(stats.totalExpenses)} icon={Receipt} accent="destructive" />
        <StatCard label={t("Diesel Spend")} value={formatINR(stats.dieselSpend)} icon={Fuel} accent="accent" />
        <StatCard label={t("Pending EMI")} value={formatINR(stats.pendingEmiTotal)} icon={CreditCard} accent="primary" />
        <StatCard label={t("Active Drivers")} value={stats.activeDrivers.toString()} icon={Users} accent="success" />
        <StatCard label={t("In Maintenance")} value={stats.inMaintenance.toString()} icon={Wrench} accent={stats.inMaintenance > 0 ? "warning" : "success"} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass glass-interactive shadow-elegant lg:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">{t("Profit vs Expenses")}</h3>
              <p className="text-xs text-muted-foreground">{t("Monthly performance · FY 2025-26")}</p>
            </div>
            <Badge className="bg-success/15 text-success border-success/30">{t("Live operations")}</Badge>
          </div>
          <div className="h-72">
            {monthlyData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-xl">
                <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm">{t("No transaction history recorded yet.")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#g-rev)" name={t("Revenue")} />
                  <Area type="monotone" dataKey="expense" stroke="var(--color-chart-4)" strokeWidth={2} fill="url(#g-exp)" name={t("Expense")} />
                  <Line type="monotone" dataKey="profit" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={false} name={t("Profit")} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="glass glass-interactive shadow-elegant p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold">{t("Expense Distribution")}</h3>
            <p className="text-xs text-muted-foreground">{t("Current month breakdown")}</p>
          </div>
          <div className="h-72">
            {expenseBreakdown.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-xl">
                <Receipt className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm">{t("No expenses logged yet.")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {expenseBreakdown.slice(0, 6).map((e, i) => (
              <div key={e.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-muted-foreground">{t(e.name)}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass glass-interactive shadow-elegant p-5">
          <h3 className="text-base font-semibold">{t("Truck-wise Profit")}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{t("Net profit per vehicle")}</p>
          <div className="h-56">
            {truckProfit.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-xl">
                <Truck className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm">No trucks logged in fleet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={truckProfit}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
                  <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
                    {truckProfit.map((d, i) => (
                      <Cell key={i} fill={d.profit >= 0 ? "var(--color-chart-3)" : "var(--color-chart-4)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="glass glass-interactive shadow-elegant p-5">
          <h3 className="text-base font-semibold">{t("Diesel Consumption")}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{t("Litres consumed (monthly)")}</p>
          <div className="h-56">
            {dieselTrend.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-xl">
                <Fuel className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm">{t("No diesel logs recorded yet.")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dieselTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="litres" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="glass glass-interactive shadow-elegant p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{t("Alerts")}</h3>
            <Link to="/notifications" className="text-xs text-accent hover:underline flex items-center gap-1.5 font-semibold">
              {t("View All")} <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent pointer-events-none h-5 px-1.5 text-[10px]">{notifications.length}</Badge>
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">{t("All systems clear. No pending alerts.")}</div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.type === "danger" ? "bg-destructive animate-pulse" : n.type === "warning" ? "bg-warning" : "bg-secondary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t(n.title)}</p>
                    <p className="text-xs text-muted-foreground truncate">{t(n.body)}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="animate-fade-in">
        <Card className="glass glass-interactive shadow-elegant p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">{t("Recent Trips")}</h3>
              <p className="text-xs text-muted-foreground">{t("Latest dispatches across the fleet")}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">{t("Trip")}</th>
                  <th className="py-3 pr-4 font-medium">{t("Truck")}</th>
                  <th className="py-3 pr-4 font-medium">{t("Route")}</th>
                  <th className="py-3 pr-4 font-medium">{t("Distance")}</th>
                  <th className="py-3 pr-4 font-medium">{t("Revenue")}</th>
                  <th className="py-3 pr-4 font-medium">{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground text-xs">{t("No recent trips recorded. Click \"Trips\" in the sidebar to add.")}</td>
                  </tr>
                ) : (
                  trips.slice(0, 6).map((trip: any) => (
                    <tr key={trip.id} className="border-b border-border/40 hover:bg-muted/40">
                      <td className="py-3 pr-4 font-mono text-xs">{trip.id}</td>
                      <td className="py-3 pr-4 font-medium">{trip.truck}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{trip.source} → {trip.destination}</td>
                      <td className="py-3 pr-4">{trip.distance} km</td>
                      <td className="py-3 pr-4 font-semibold">{formatINR(trip.revenue)}</td>
                      <td className="py-3 pr-4">
                        <Badge className={
                          trip.status === "Running" ? "bg-secondary/15 text-secondary border-secondary/30"
                          : trip.status === "Completed" ? "bg-success/15 text-success border-success/30"
                          : "bg-warning/15 text-warning-foreground border-warning/30"
                        }>
                          {t(trip.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
