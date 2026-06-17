import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { TrendingUp, TrendingDown, Trophy, AlertTriangle, Calculator, Info } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/mock-data";
import { apiGet } from "@/lib/api-fetch";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const getPLData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/profit-loss");
});

import { swrLoader } from "@/lib/query-loader";

export const Route = createFileRoute("/profit-loss")({
  head: () => ({ meta: [{ title: "Profit & Loss — AMS Transports" }, { name: "description", content: "Logically verified profitability analysis across the fleet." }] }),
  loader: ({ context: { queryClient } }) => 
    swrLoader({ queryClient, queryKey: ["profit-loss"], queryFn: getPLData }),
  component: PL,
});

const tooltipStyle = { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: "12px", fontSize: "12px" };

function PL() {
  const { monthlyData, trucks } = Route.useLoaderData();
  
  const [chassisCost, setChassisCost] = useState(2800000);
  const [loanClaimed, setLoanClaimed] = useState(3100000);
  const [bodyCost, setBodyCost] = useState(700000);
  const [selectedTruckId, setSelectedTruckId] = useState<string>("custom");

  const handleTruckSelect = (truckId: string) => {
    setSelectedTruckId(truckId);
    if (truckId === "custom") {
      return;
    }
    const truck = trucks.find((t: any) => t.id === truckId);
    if (truck) {
      setChassisCost(truck.chassisCost || truck.purchase || 0);
      setBodyCost(truck.bodyCost || 0);
      setLoanClaimed(truck.loanAmount || 0);
    }
  };

  const totalAssetValue = chassisCost + bodyCost;
  const netEquity = Math.max(0, totalAssetValue - loanClaimed);
  const excessLoan = Math.max(0, loanClaimed - chassisCost);

  const sorted = [...trucks].sort((a, b) => b.profit - a.profit);
  const best = sorted.length > 0 && sorted[0].revenue > 0 ? sorted[0] : null;
  const worst = sorted.length > 0 && sorted[sorted.length - 1].profit < 0 ? sorted[sorted.length - 1] : null;
  
  const totalProfit = trucks.reduce((s: number, t: any) => s + t.profit, 0);
  const totalLoss = trucks.filter((t: any) => t.profit < 0).reduce((s: number, t: any) => s + t.profit, 0);

  return (
    <div>
      <PageHeader title="Profit & Loss" subtitle="Logically derived business performance from real trips and expenses" />
      
      {/* Capital Investment & Loan Analyzer */}
      <Card className="glass shadow-elegant p-5 mb-6 animate-fade-in border-accent/20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-accent" />
            <h3 className="text-base font-semibold">Chassis & Loan Capital Analyzer</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Load Vehicle:</span>
            <Select value={selectedTruckId} onValueChange={handleTruckSelect}>
              <SelectTrigger className="h-8 w-44 bg-muted/40 text-xs border border-border">
                <SelectValue placeholder="Select vehicle..." />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border border-border">
                <SelectItem value="custom">Custom (Manual)</SelectItem>
                {trucks.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Analyze how surplus loan disbursements and hand-cash bodybuilding costs combine to define your true net out-of-pocket investment (Equity) vs. your bank liability.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Chassis Purchase Price (₹)</label>
            <input 
              type="number" 
              value={chassisCost}
              onChange={(e) => setChassisCost(Number(e.target.value))}
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Claimed Bank Loan (₹)</label>
            <input 
              type="number" 
              value={loanClaimed}
              onChange={(e) => setLoanClaimed(Number(e.target.value))}
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Body Building Cost (₹ Hand Cash)</label>
            <input 
              type="number" 
              value={bodyCost}
              onChange={(e) => setBodyCost(Number(e.target.value))}
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/40 pt-4">
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Total Capitalized Asset Value</p>
            <p className="text-lg font-bold text-foreground mt-1">{formatINR(totalAssetValue)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Chassis + Body Building</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 border-l-2 border-accent/50 bg-accent/5">
            <p className="text-xs text-muted-foreground">True Net Downpayment (Equity)</p>
            <p className="text-lg font-bold text-accent mt-1">{formatINR(netEquity)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Your actual out-of-pocket cash</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Bank Financing Portion</p>
            <p className="text-lg font-bold text-foreground mt-1">{formatINR(loanClaimed)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">({((loanClaimed / (totalAssetValue || 1)) * 100).toFixed(1)}% of total value)</p>
          </div>
        </div>

        <div className="mt-4 flex gap-3 items-start bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
          <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Mathematical Logic & P&L Impact:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Surplus Loan Cash-back:</strong> Your bank loan of {formatINR(loanClaimed)} exceeded the chassis price of {formatINR(chassisCost)} by <span className="font-semibold text-foreground">{formatINR(excessLoan)}</span>. This surplus cash was received by you at vehicle delivery.
              </li>
              <li>
                <strong>Net Out-of-Pocket Cost:</strong> Since you spent {formatINR(bodyCost)} hand cash for bodybuilding, and had {formatINR(excessLoan)} cash-back from the loan, your true net cash out-of-pocket is <span className="font-semibold text-foreground">{formatINR(netEquity)}</span> ({formatINR(bodyCost)} - {formatINR(excessLoan)}).
              </li>
              <li>
                <strong>Monthly P&L Allocation:</strong> Your daily/monthly operational P&L is affected by the <strong>EMI payments of the full {formatINR(loanClaimed)} loan</strong>. The hand cash of {formatINR(bodyCost)} was a one-time capital investment (asset builder) and should not be counted as a monthly direct operating loss.
              </li>
            </ul>
          </div>
        </div>
      </Card>
      
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
            sorted.map((t: any) => {
              const maxAbs = Math.max(...trucks.map((x: any) => Math.abs(x.profit)), 1); 
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
