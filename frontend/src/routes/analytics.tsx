import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { TrendingUp, Activity, Gauge, Target, Users, Truck as TruckIcon } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { formatINR } from "@/lib/mock-data";
import { apiGet } from "@/lib/api-fetch";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const getAnalyticsData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/analytics");
});

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — AMS Transports" }, { name: "description", content: "Predictive analytics for transport operations." }] }),
  loader: () => getAnalyticsData(),
  component: Analytics,
});

const tooltipStyle = { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: "12px", fontSize: "12px" };

function Analytics() {
  const { drivers, trucks, trips } = Route.useLoaderData() as any;
  const [selectedTruck, setSelectedTruck] = useState<string>("all");

  const driverData = drivers.map((d: any) => ({ name: d.name.split(" ")[0], score: d.score }));
  
  const headerAction = (
    <div className="flex items-center gap-2">
      <TruckIcon className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedTruck} onValueChange={setSelectedTruck}>
        <SelectTrigger className="h-9 w-40 bg-muted/40">
          <SelectValue placeholder="Select vehicle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Fleet</SelectItem>
          {trucks.map((t: any) => (
            <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const getTripExpenses = (t: any) => {
    return Number(t.diesel || 0) + 
           Number(t.toll || 0) + 
           Number(t.bata || 0) + 
           Number(t.food || 0) +
           Number(t.parking || 0) +
           Number(t.loading || 0) +
           Number(t.rto || 0) +
           Number(t.puncture || 0) +
           Number(t.maintenance || 0) +
           Number(t.misc || 0) + 
           Number(t.customAmount || 0);
  };

  // 1. Calculate stats dynamically for All Fleet (when selectedTruck === "all")
  const totalTripsCount = trips.length;
  const totalRevenueAll = trips.reduce((s: number, t: any) => s + (t.revenue || 0), 0);
  const totalExpensesAll = trips.reduce((s: number, t: any) => s + getTripExpenses(t), 0);
  const totalProfitAll = totalRevenueAll - totalExpensesAll;
  const avgTripProfitAll = totalTripsCount > 0 ? totalProfitAll / totalTripsCount : 0;
  
  const totalTrucksCount = trucks.length;
  const runningTrucksCount = trucks.filter((t: any) => t.status === "Running" || t.status === "Active").length;
  const fleetUtilisation = totalTrucksCount > 0 ? Math.round((runningTrucksCount / totalTrucksCount) * 100) : 0;

  const activeDriversCount = drivers.filter((d: any) => d.truck && d.truck !== "Unassigned" && d.truck !== "Vacant").length;
  const avgDriverScore = drivers.length > 0 ? Math.round(drivers.reduce((s: number, d: any) => s + (d.score || 0), 0) / drivers.length) : 0;

  // 2. Generate monthly data dynamically from trips
  const monthlyMap: Record<string, { month: string; revenue: number; profit: number }> = {};
  const sortedTrips = [...trips].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedTrips.forEach((t: any) => {
    if (!t.date) return;
    const dateObj = new Date(t.date);
    if (isNaN(dateObj.getTime())) return;
    
    // Formatting monthly label e.g., "May 2026"
    const monthStr = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    
    const rev = t.revenue || 0;
    const exp = getTripExpenses(t);
    const prof = rev - exp;
    
    if (!monthlyMap[monthStr]) {
      monthlyMap[monthStr] = { month: monthStr, revenue: 0, profit: 0 };
    }
    monthlyMap[monthStr].revenue += rev;
    monthlyMap[monthStr].profit += prof;
  });
  
  const dynamicMonthlyData = Object.values(monthlyMap);

  // 3. Calculate truck-specific stats
  const truckTrips = trips.filter((t: any) => t.truck === selectedTruck);
  const truckRevenue = truckTrips.reduce((s: number, t: any) => s + (t.revenue || 0), 0);
  const truckExpenses = truckTrips.reduce((s: number, t: any) => s + getTripExpenses(t), 0);
  const truckDistance = truckTrips.reduce((s: number, t: any) => s + (t.distance || 0), 0);
  const truckAvgProfit = truckTrips.length > 0 ? (truckRevenue - truckExpenses) / truckTrips.length : 0;
  
  const tripChartData = truckTrips.map((t: any, i: number) => ({
    name: `Trip ${i+1}`,
    revenue: t.revenue || 0,
    profit: (t.revenue || 0) - getTripExpenses(t)
  }));

  return (
    <div>
      <PageHeader 
        title={selectedTruck === "all" ? "Fleet Analytics" : `Analytics: ${selectedTruck}`} 
        subtitle={selectedTruck === "all" ? "The pulse of your transport business" : "Vehicle-specific performance and trends"} 
        action={headerAction} 
      />
      
      {selectedTruck === "all" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <StatCard label="Fleet Revenue" value={formatINR(totalRevenueAll)} icon={TrendingUp} accent="success" />
          <StatCard label="Fleet Utilisation" value={`${fleetUtilisation}%`} icon={Activity} accent="primary" />
          <StatCard label="Avg Trip Profit" value={formatINR(avgTripProfitAll)} icon={Target} accent={avgTripProfitAll >= 0 ? "accent" : "destructive"} />
          <StatCard label="Avg Driver Score" value={drivers.length > 0 ? `${avgDriverScore} / 100` : "N/A"} icon={Gauge} accent="success" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <StatCard label="Total Trips" value={truckTrips.length.toString()} icon={Activity} accent="primary" />
          <StatCard label="Total Revenue" value={formatINR(truckRevenue)} icon={TrendingUp} accent="success" />
          <StatCard label="Distance Covered" value={`${truckDistance} km`} icon={Gauge} accent="accent" />
          <StatCard label="Avg Profit / Trip" value={formatINR(truckAvgProfit)} icon={Target} accent={truckAvgProfit >= 0 ? "success" : "destructive"} />
        </div>
      )}

      {selectedTruck === "all" ? (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 animate-fade-in">
          <Card className="glass shadow-elegant lg:col-span-2 p-5">
            <h3 className="text-base font-semibold">Monthly Revenue Trend</h3>
            <p className="mb-4 text-xs text-muted-foreground">Aggregated trend from operational trips</p>
            <div className="h-72">
              {dynamicMonthlyData.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-xl">
                  <Activity className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">No trip data recorded to generate monthly trend.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicMonthlyData}>
                    <defs>
                      <linearGradient id="g-f" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2.5} fill="url(#g-f)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="glass shadow-elegant p-5">
            <h3 className="text-base font-semibold">Driver Performance</h3>
            <p className="mb-4 text-xs text-muted-foreground">Composite score comparison</p>
            <div className="h-72">
              {driverData.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-xl">
                  <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">No drivers registered yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driverData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={10} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Score"]} />
                    <Bar dataKey="score" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} name="Score" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 animate-fade-in">
          <Card className="glass shadow-elegant p-5">
            <h3 className="text-base font-semibold">Trip-wise Performance for {selectedTruck}</h3>
            <p className="mb-4 text-xs text-muted-foreground">Revenue and Net Profit per trip</p>
            <div className="h-80">
              {truckTrips.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-xl">
                  <TruckIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">No trips recorded for this vehicle yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tripChartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} name="Total Revenue" />
                    <Area type="monotone" dataKey="profit" stroke="var(--color-success)" fillOpacity={1} fill="url(#colorProf)" strokeWidth={2.5} name="Net Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
