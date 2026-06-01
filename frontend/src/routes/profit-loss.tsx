import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/mock-data";
import { apiGet } from "@/lib/api-fetch";

export const getPLData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/profit-loss");
});

export const Route = createFileRoute("/profit-loss")({
  head: () => ({ meta: [{ title: "Profit & Loss — AMS Transports" }, { name: "description", content: "Logically verified profitability analysis across the fleet." }] }),
  loader: () => getPLData(),
  component: PL,
});

const tooltipStyle = { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: "12px", fontSize: "12px" };

function PL() {
  const { monthlyData, trucks } = Route.useLoaderData();
  
  const sorted = [...trucks].sort((a, b) => b.profit - a.profit);
  const best = sorted.length > 0 && sorted[0].revenue > 0 ? sorted[0] : null;
  const worst = sorted.length > 0 && sorted[sorted.length - 1].profit < 0 ? sorted[sorted.length - 1] : null;
  
  const totalProfit = trucks.reduce((s, t) => s + t.profit, 0);
  const totalLoss = trucks.filter(t => t.profit < 0).reduce((s, t) => s + t.profit, 0);

  return (
    <div>
      <PageHeader title="Profit & Loss" subtitle="Logically derived business performance from real trips and expenses" />
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fleet Net Profit" value={formatINR(totalProfit)} delta={0} icon={TrendingUp} accent={totalProfit >= 0 ? "success" : "destructive"} />
        <StatCard label="Total Loss Deficit" value={formatINR(Math.abs(totalLoss))} delta={0} icon={TrendingDown} accent="destructive" />
        <StatCard label="Best Performer" value={best ? best.id : "N/A"} icon={Trophy} accent="accent" />
        <StatCard label="Needs Attention" value={worst ? worst.id : "None"} icon={AlertTriangle} accent="warning" />
      </div>

      <Card className="glass shadow-elegant mt-6 p-5">
        <h3 className="text-base font-semibold">Revenue · Expense · Profit</h3>
        <p className="mb-4 text-xs text-muted-foreground">Historical Monthly Trend (Aggregated)</p>
        <div className="h-80">
          {monthlyData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-xl">
              <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm">No transaction history recorded yet to show monthly trend.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <defs>
                  <linearGradient id="g-p" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
                <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} barSize={18} />
                <Bar dataKey="expense" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} barSize={18} />
                <Line type="monotone" dataKey="profit" stroke="var(--color-success)" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="glass shadow-elegant mt-6 p-5">
        <h3 className="text-base font-semibold">Vehicle-wise Logical Profitability</h3>
        <p className="mb-4 text-xs text-muted-foreground">Derived automatically from Trip Revenue minus (Trip Expenses + Services + EMI Paid)</p>
        <div className="mt-4 space-y-3">
          {sorted.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No vehicles tracked yet. Add vehicles in the Fleet page to start.</div>
          ) : (
            sorted.map((t) => {
              const maxAbs = Math.max(...trucks.map(x => Math.abs(x.profit)), 1); 
              const pct = (Math.abs(t.profit) / maxAbs) * 100;
              
              return (
                <div key={t.id} className="rounded-lg border border-border/60 bg-muted/30 p-3 animate-fade-in">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{t.id} · <span className="text-muted-foreground">{t.model} ({t.tripCount} Trips)</span></span>
                    <span className={`font-bold ${t.profit >= 0 ? "text-success" : "text-destructive"}`}>{formatINR(t.profit)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${t.profit >= 0 ? "bg-gradient-success" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>Revenue: {formatINR(t.revenue)}</span>
                    <span>Total Expense: {formatINR(t.expense)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
