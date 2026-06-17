import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Fuel, Gauge, TrendingDown, Droplet, Truck, AlertTriangle, 
  MapPin, Calculator, Calendar, ArrowRight, ShieldAlert, Award,
  Sparkles, Plus, Trash2, HelpCircle
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Cell, Line, LineChart } from "recharts";
import { formatINR } from "@/lib/mock-data";
import { apiGet, apiPost } from "@/lib/api-fetch";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const getDieselData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/diesel");
});

export const updateDieselPriceAction = createServerFn({ method: "POST" })
  .inputValidator((price: number) => price)
  .handler(async ({ data: price }) => {
    return apiPost("/api/diesel/price", { price });
  });

export const updateStatePricesAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as { statePrices: Record<string, number> })
  .handler(async ({ data }) => {
    return apiPost("/api/diesel/state-prices", data);
  });

import { useLanguage } from "@/lib/language-context";

import { swrLoader } from "@/lib/query-loader";

export const Route = createFileRoute("/diesel")({
  head: () => ({ meta: [{ title: "Diesel & Fuel Intelligence — AMS Transports" }, { name: "description", content: "Intelligent fuel analytics, state prices tracker and mileage dashboard." }] }),
  loader: ({ context: { queryClient } }) => 
    swrLoader({ queryClient, queryKey: ["diesel"], queryFn: getDieselData }),
  component: Diesel,
});

const tooltipStyle = { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: "12px", fontSize: "12px" };

interface RefuelStop {
  id: string;
  state: string;
  price: number;
  litres: number;
}

function Diesel() {
  const { t } = useLanguage();
  const { trips, trucks, dieselPrice, statePrices } = Route.useLoaderData();
  const [selectedTruck, setSelectedTruck] = useState<string>("all");
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(dieselPrice.toString());
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  
  // Local state-wise prices
  const [localStatePrices, setLocalStatePrices] = useState<Record<string, number>>(statePrices || {});
  const [editingState, setEditingState] = useState<string | null>(null);
  const [editingStateVal, setEditingStateVal] = useState("");
  const [isSavingStates, setIsSavingStates] = useState(false);

  // Calculator states
  const [calcStops, setCalcStops] = useState<RefuelStop[]>([
    { id: "1", state: "Tamil Nadu", price: statePrices?.["Tamil Nadu"] || 92.4, litres: 100 }
  ]);

  // Tab selection
  const [activeTab, setActiveTab] = useState<"dashboard" | "states" | "calculator" | "reports">("dashboard");

  const router = useRouter();

  useEffect(() => {
    setPriceInput(dieselPrice.toString());
  }, [dieselPrice]);

  useEffect(() => {
    if (statePrices) {
      setLocalStatePrices(statePrices);
    }
  }, [statePrices]);

  const handleUpdatePrice = async () => {
    const num = Number(priceInput);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    setIsUpdatingPrice(true);
    try {
      await updateDieselPriceAction({ data: num });
      toast.success("Diesel price updated successfully!");
      setEditingPrice(false);
      router.invalidate();
    } catch {
      toast.error("Failed to update diesel price");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleSaveStatePrices = async (updatedPrices: Record<string, number>) => {
    setIsSavingStates(true);
    try {
      await updateStatePricesAction({ data: { statePrices: updatedPrices } });
      toast.success("State-wise diesel prices updated!");
      router.invalidate();
    } catch {
      toast.error("Failed to save state prices");
    } finally {
      setIsSavingStates(false);
    }
  };

  const handleStatePriceChange = (state: string, val: string) => {
    const num = Number(val);
    if (isNaN(num)) return;
    const newPrices = { ...localStatePrices, [state]: num };
    setLocalStatePrices(newPrices);
    handleSaveStatePrices(newPrices);
    setEditingState(null);
  };

  const getTripFuel = (t: any) => {
    const dRate = Number(t.dieselRate || dieselPrice);
    if (t.tripType === "Round") {
      const retRate = Number(t.returnDieselRate || dRate);
      const outLit = Number(t.outwardLitres || 0) || (t.outwardDiesel ? Number(t.outwardDiesel) / dRate : 0);
      const retLit = Number(t.returnLitres || 0) || (t.returnDiesel ? Number(t.returnDiesel) / retRate : 0);
      return {
        litres: outLit + retLit,
        cost: Number(t.outwardDiesel || 0) + Number(t.returnDiesel || 0),
        outwardLitres: outLit,
        returnLitres: retLit
      };
    } else {
      const lit = Number(t.litres || 0) || (t.diesel ? Number(t.diesel) / dRate : 0);
      return {
        litres: lit,
        cost: Number(t.diesel || 0),
        outwardLitres: lit,
        returnLitres: 0
      };
    }
  };

  const filteredTrips = selectedTruck === "all" ? trips : trips.filter((t: any) => t.truck === selectedTruck);
  const completedTrips = filteredTrips.filter((t: any) => t.status === "Completed");

  // Calculate statistics
  let totalDistance = 0;
  let totalLitres = 0;
  let totalCost = 0;

  completedTrips.forEach((t: any) => {
    const fuel = getTripFuel(t);
    totalLitres += fuel.litres;
    totalCost += fuel.cost;

    if (t.tripType === "Round") {
      const outDist = Math.max(0, Number(t.outwardClosingKm || 0) - Number(t.outwardOpeningKm || 0));
      const retDist = Math.max(0, Number(t.returnClosingKm || 0) - Number(t.returnOpeningKm || 0));
      totalDistance += outDist + retDist;
    } else {
      totalDistance += Math.max(0, Number(t.closingKm || 0) - Number(t.openingKm || 0));
    }
  });

  const avgMileage = totalLitres > 0 ? (totalDistance / totalLitres).toFixed(2) : "0.00";
  const costPerKm = totalDistance > 0 ? (totalCost / totalDistance).toFixed(2) : "0.00";

  // Trip-wise trend data
  const trendData = completedTrips.map((t: any) => {
    const fuel = getTripFuel(t);
    let distance = 0;
    if (t.tripType === "Round") {
      const outDist = Math.max(0, Number(t.outwardClosingKm || 0) - Number(t.outwardOpeningKm || 0));
      const retDist = Math.max(0, Number(t.returnClosingKm || 0) - Number(t.returnOpeningKm || 0));
      distance = outDist + retDist;
    } else {
      distance = Math.max(0, Number(t.closingKm || 0) - Number(t.openingKm || 0));
    }
    const tripMileage = fuel.litres > 0 ? (distance / fuel.litres) : 0;
    return {
      name: t.memoNo || t.id,
      cost: fuel.cost,
      litres: Math.round(fuel.litres),
      mileage: Number(tripMileage.toFixed(2)),
      distance: distance,
      truck: t.truck,
      route: `${t.source} → ${t.destination}`
    };
  });

  // Global truck mileage data for leaderboard
  const truckMileage = trucks.map((t: any) => {
    const tTrips = trips.filter((tr: any) => tr.truck === t.id && tr.status === "Completed");
    let dCost = 0;
    let dist = 0;
    let lit = 0;

    tTrips.forEach((tr: any) => {
      const fuel = getTripFuel(tr);
      dCost += fuel.cost;
      lit += fuel.litres;

      if (tr.tripType === "Round") {
        const outDist = Math.max(0, Number(tr.outwardClosingKm || 0) - Number(tr.outwardOpeningKm || 0));
        const retDist = Math.max(0, Number(tr.returnClosingKm || 0) - Number(tr.returnOpeningKm || 0));
        dist += outDist + retDist;
      } else {
        dist += Math.max(0, Number(tr.closingKm || 0) - Number(tr.openingKm || 0));
      }
    });

    const mil = lit > 0 ? (dist / lit) : 0;
    return {
      name: t.id.split("-").pop() || t.id,
      fullId: t.id,
      mileage: Number(mil.toFixed(2)),
      litres: Math.round(lit),
      cost: dCost,
      distance: dist
    };
  }).filter((t: any) => t.distance > 0).sort((a: any, b: any) => b.mileage - a.mileage);

  // Calculator logic
  const calcTotalLitres = calcStops.reduce((sum, s) => sum + s.litres, 0);
  const calcTotalCost = calcStops.reduce((sum, s) => sum + (s.litres * s.price), 0);
  const calcWeightedAvg = calcTotalLitres > 0 ? (calcTotalCost / calcTotalLitres) : 0;

  const addCalcStop = () => {
    const defaultState = Object.keys(localStatePrices)[0] || "Tamil Nadu";
    const defaultPrice = localStatePrices[defaultState] || 92.4;
    setCalcStops([
      ...calcStops,
      { id: Date.now().toString(), state: defaultState, price: defaultPrice, litres: 100 }
    ]);
  };

  const removeCalcStop = (id: string) => {
    if (calcStops.length === 1) return;
    setCalcStops(calcStops.filter(s => s.id !== id));
  };

  const updateCalcStop = (id: string, field: keyof RefuelStop, value: any) => {
    setCalcStops(calcStops.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (field === "state") {
        updated.price = localStatePrices[value as string] || 92.4;
      }
      return updated;
    }));
  };

  // Smart Alerts
  const alerts: Array<{ truck: string; msg: string; severity: "high" | "warning"; recommendation: string }> = [];
  truckMileage.forEach((tm: any) => {
    if (tm.mileage < 3.8) {
      alerts.push({
        truck: tm.fullId,
        msg: `Critical fuel efficiency alert: ${tm.mileage} km/L average mileage is 15% below target.`,
        severity: "high",
        recommendation: "Inspect engine cylinders, air filter, and tyre pressure calibration immediately."
      });
    } else if (tm.mileage < 4.2) {
      alerts.push({
        truck: tm.fullId,
        msg: `Sub-optimal fuel efficiency alert: ${tm.mileage} km/L average mileage is below standard.`,
        severity: "warning",
        recommendation: "Schedule routine maintenance and monitor driver speed parameters."
      });
    }
  });

  trendData.forEach((td: any) => {
    if (td.mileage > 0 && td.mileage < 3.2) {
      alerts.push({
        truck: td.truck,
        msg: `Abnormal mileage (${td.mileage} km/L) detected on trip ${td.name} (${td.route}).`,
        severity: "high",
        recommendation: "Check driver log for idling periods, traffic delays, or potential fuel theft/pilferage."
      });
    }
  });

  // Monthly Consumption Report
  const monthlyMap: Record<string, { month: string; litres: number; cost: number; distance: number }> = {};
  completedTrips.forEach((t: any) => {
    if (!t.date) return;
    const dateObj = new Date(t.date);
    if (isNaN(dateObj.getTime())) return;
    const monthStr = dateObj.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const fuel = getTripFuel(t);

    let distance = 0;
    if (t.tripType === "Round") {
      const outDist = Math.max(0, Number(t.outwardClosingKm || 0) - Number(t.outwardOpeningKm || 0));
      const retDist = Math.max(0, Number(t.returnClosingKm || 0) - Number(t.returnOpeningKm || 0));
      distance = outDist + retDist;
    } else {
      distance = Math.max(0, Number(t.closingKm || 0) - Number(t.openingKm || 0));
    }

    if (!monthlyMap[monthStr]) {
      monthlyMap[monthStr] = { month: monthStr, litres: 0, cost: 0, distance: 0 };
    }
    monthlyMap[monthStr].litres += fuel.litres;
    monthlyMap[monthStr].cost += fuel.cost;
    monthlyMap[monthStr].distance += distance;
  });

  const monthlyReportData = Object.values(monthlyMap);

  const headerAction = (
    <div className="flex items-center gap-3">
      {/* Global Price Control */}
      <div className="flex items-center gap-1.5 bg-muted/40 border border-border/40 rounded-lg px-2.5 py-1 text-sm shadow-sm">
        <span className="text-muted-foreground text-xs font-medium">Global Price:</span>
        {editingPrice ? (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">₹</span>
            <Input
              type="number"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="h-7 w-20 px-1 py-0.5 text-xs bg-background border-border/80 focus:ring-1 focus:ring-accent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdatePrice();
                if (e.key === "Escape") {
                  setPriceInput(dieselPrice.toString());
                  setEditingPrice(false);
                }
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 font-medium"
              onClick={handleUpdatePrice}
              disabled={isUpdatingPrice}
            >
              {isUpdatingPrice ? "..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted font-medium"
              onClick={() => {
                setPriceInput(dieselPrice.toString());
                setEditingPrice(false);
              }}
              disabled={isUpdatingPrice}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">₹{dieselPrice}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] uppercase font-bold tracking-wider text-[#38bdf8] hover:bg-[#38bdf8]/10"
              onClick={() => setEditingPrice(true)}
            >
              Edit
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedTruck} onValueChange={setSelectedTruck}>
          <SelectTrigger className="h-9 w-40 bg-muted/40">
            <SelectValue placeholder={t("Select vehicle") || "Select vehicle"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Fleet") || "All Fleet"}</SelectItem>
            {trucks.map((t: any) => (
              <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title={t("Fuel Intelligence & Analytics") || "Fuel Intelligence & Analytics"} subtitle={t("Enterprise diesel tracking and state-wise pricing systems") || "Enterprise diesel tracking and state-wise pricing systems"} action={headerAction} />
      
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("Avg Price/L")} value={`₹${dieselPrice}`} delta={2} icon={Droplet} accent="accent" />
        <StatCard label={selectedTruck === "all" ? t("Total Litres Consumed") : t("Vehicle Litres Consumed")} value={Math.round(totalLitres).toLocaleString()} delta={6} icon={Fuel} accent="primary" />
        <StatCard label={selectedTruck === "all" ? t("Fleet Avg Mileage") : t("Vehicle Mileage")} value={`${avgMileage} km/L`} delta={Number(avgMileage) >= 4 ? 3 : -2} icon={Gauge} accent={Number(avgMileage) >= 4 ? "success" : "destructive"} />
        <StatCard label={t("Cost / km")} value={`₹${costPerKm}`} delta={Number(costPerKm) < 25 ? -1 : 4} icon={TrendingDown} accent={Number(costPerKm) < 25 ? "success" : "destructive"} />
      </div>

      {/* Tabs Menu */}
      <div className="mt-6 flex border-b border-border/60">
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "dashboard" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Sparkles className="h-4 w-4" /> {t("Overview & Leaderboard")}
        </button>
        <button 
          onClick={() => setActiveTab("states")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "states" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <MapPin className="h-4 w-4" /> {t("State Diesel Rates")}
        </button>
        <button 
          onClick={() => setActiveTab("calculator")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "calculator" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Calculator className="h-4 w-4" /> {t("Refuel Avg Calculator")}
        </button>
        <button 
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "reports" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Calendar className="h-4 w-4" /> {t("Consumption & Smart Alerts")}
        </button>
      </div>

      {/* Active Tab Panel */}
      <div className="mt-6">
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="glass shadow-elegant lg:col-span-2 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold">{selectedTruck === "all" ? t("Fleet Fuel Trend (By Trip)") : `${selectedTruck} - ${t("Trip Performance")}`}</h3>
                <p className="mb-4 text-xs text-muted-foreground">Diesel Cost & Mileage across recent completed trips</p>
              </div>
              <div className="h-80">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                      <YAxis yAxisId="left" stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `${v} km/l`} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area yAxisId="left" type="monotone" dataKey="cost" name="Cost (₹)" stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#colorCost)" />
                      <Line yAxisId="right" type="monotone" dataKey="mileage" name="Mileage (km/L)" stroke="var(--color-chart-4)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No trips logged for this selection yet.</div>
                )}
              </div>
            </Card>

            <Card className="glass shadow-elegant p-5 flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-1.5"><Award className="h-4 w-4 text-accent" /> Mileage Leaderboard</h3>
                  <p className="text-xs text-muted-foreground">Avg km per litre comparison by vehicle</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 mt-3 space-y-3">
                {truckMileage.length > 0 ? (
                  truckMileage.map((item: any, idx: number) => (
                    <div 
                      key={item.fullId} 
                      className={`flex items-center justify-between rounded-lg p-2.5 border transition-all cursor-pointer hover:bg-muted/10 ${selectedTruck === item.fullId ? 'bg-primary/5 border-primary/40' : 'border-border/40 bg-muted/5'}`}
                      onClick={() => setSelectedTruck(item.fullId)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-4">#{idx + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{item.fullId}</p>
                          <p className="text-[10px] text-muted-foreground">{item.distance.toLocaleString()} km · {item.litres} L</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-black ${item.mileage >= 4.5 ? 'text-success' : item.mileage >= 4.0 ? 'text-accent' : 'text-destructive'}`}>
                          {item.mileage} km/L
                        </p>
                        <p className="text-[9px] text-muted-foreground">₹{(item.cost / (item.distance || 1)).toFixed(1)}/km</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">No truck mileage data available.</div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "states" && (
          <Card className="glass shadow-elegant p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-1.5"><MapPin className="h-5 w-5 text-accent" /> State-wise Diesel Prices</h3>
                <p className="text-xs text-muted-foreground">Current rate of fuel in major operating states. Used for average calculations on multi-state trips.</p>
              </div>
              {isSavingStates && <Badge className="bg-primary/20 text-primary border-primary/30 animate-pulse">Saving changes...</Badge>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {Object.entries(localStatePrices).map(([state, price]) => (
                <div key={state} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/10 p-4 shadow-sm group">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground font-medium">{state}</p>
                    {editingState === state ? (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-bold">₹</span>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={editingStateVal}
                          onChange={(e) => setEditingStateVal(e.target.value)}
                          className="h-8 w-24 text-xs font-bold bg-background border-border focus:ring-1 focus:ring-accent"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleStatePriceChange(state, editingStateVal);
                            if (e.key === "Escape") setEditingState(null);
                          }}
                        />
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2 text-xs text-success hover:bg-success/10 font-bold"
                          onClick={() => handleStatePriceChange(state, editingStateVal)}
                        >
                          ✓
                        </Button>
                      </div>
                    ) : (
                      <p className="text-lg font-black text-foreground">₹{price.toFixed(2)}</p>
                    )}
                  </div>
                  {editingState !== state && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-[#38bdf8] opacity-100 md:opacity-0 group-hover:opacity-100 hover:bg-[#38bdf8]/10 transition-all font-bold"
                      onClick={() => {
                        setEditingState(state);
                        setEditingStateVal(price.toString());
                      }}
                    >
                      Update
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-border/40 pt-4 flex justify-between items-center text-xs text-muted-foreground bg-muted/5 p-3 rounded-lg border">
              <span className="flex items-center gap-1 text-accent font-medium">
                <ShieldAlert className="h-3.5 w-3.5 text-accent animate-pulse-glow" /> Weighted Calculation Formula:
              </span>
              <span>Weighted Avg Rate = (Litres 1 * Price 1 + Litres 2 * Price 2 + ...) / Total Litres</span>
            </div>
          </Card>
        )}

        {activeTab === "calculator" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
            <Card className="glass shadow-elegant lg:col-span-2 p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-1.5"><Calculator className="h-5 w-5 text-accent" /> Refuel Stop Weighted Average Calculator</h3>
                  <p className="text-xs text-muted-foreground">Calculate the true average rate of fuel when buying diesel across different states with varying prices.</p>
                </div>
                <Button onClick={addCalcStop} size="sm" variant="outline" className="border-accent/40 text-accent hover:bg-accent/10">
                  <Plus className="h-4 w-4 mr-1" /> Add Refuel Stop
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                {calcStops.map((stop, idx) => (
                  <div key={stop.id} className="flex flex-wrap items-center gap-3 bg-muted/15 border border-border/50 rounded-xl p-3.5 shadow-sm">
                    <span className="text-xs font-bold text-muted-foreground w-8">Stop {idx + 1}</span>
                    
                    <div className="flex-1 min-w-[140px] space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium">State / Region</label>
                      <Select 
                        value={stop.state} 
                        onValueChange={(val) => updateCalcStop(stop.id, "state", val)}
                      >
                        <SelectTrigger className="h-8 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(localStatePrices).map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-[120px] space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium">Price / Litre (₹)</label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={stop.price} 
                        onChange={(e) => updateCalcStop(stop.id, "price", Number(e.target.value))}
                        className="h-8 bg-background font-bold text-xs" 
                      />
                    </div>

                    <div className="w-[120px] space-y-1">
                      <label className="text-[10px] text-muted-foreground font-medium">Refuel Litres (L)</label>
                      <Input 
                        type="number" 
                        value={stop.litres} 
                        onChange={(e) => updateCalcStop(stop.id, "litres", Number(e.target.value))}
                        className="h-8 bg-background font-bold text-xs" 
                      />
                    </div>

                    <div className="w-[110px] space-y-1">
                      <p className="text-[10px] text-muted-foreground font-medium">Subtotal</p>
                      <p className="text-xs font-black text-foreground pt-1.5">₹{(stop.litres * stop.price).toLocaleString("en-IN")}</p>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeCalcStop(stop.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 mt-5"
                      disabled={calcStops.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="glass shadow-elegant p-5 flex flex-col justify-between border-accent/20 bg-accent/5">
              <div>
                <h3 className="text-base font-bold text-foreground">Calculation Summary</h3>
                <p className="text-xs text-muted-foreground">Weighted results for multi-state refueling</p>
                
                <div className="mt-6 space-y-4 text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Total Stops Logged</span>
                    <span className="font-bold text-foreground">{calcStops.length} stops</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Total Litres refueled</span>
                    <span className="font-black text-primary text-sm">{calcTotalLitres.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span className="font-black text-foreground text-sm">₹{calcTotalCost.toLocaleString("en-IN", {maximumFractionDigits: 1})}</span>
                  </div>

                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-1.5 mt-4">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Weighted Average Rate</span>
                    <p className="text-3xl font-black text-primary">₹{calcWeightedAvg.toFixed(2)}/L</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  className="w-full bg-gradient-accent text-accent-foreground shadow-accent font-semibold"
                  onClick={() => {
                    navigator.clipboard.writeText(calcWeightedAvg.toFixed(2));
                    toast.success("Copied rate to clipboard!");
                  }}
                >
                  Copy Rate to Clipboard
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Smart Alerts Section */}
            {alerts.length > 0 && (
              <Card className="glass border-destructive/20 bg-destructive/5 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-destructive flex items-center gap-1.5 mb-3">
                  <ShieldAlert className="h-4 w-4 text-destructive animate-pulse-glow" /> Smart Fuel Alerts ({alerts.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alerts.map((al, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-background/50 border border-destructive/10 rounded-lg p-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground flex items-center gap-2">
                          <span className="bg-destructive/10 text-destructive border border-destructive/20 rounded px-1.5 py-0.5 text-[9px] uppercase font-mono">
                            {al.truck}
                          </span>
                          {al.severity === "high" ? "Critical Discrepancy" : "Low Efficiency"}
                        </p>
                        <p className="text-xs text-muted-foreground">{al.msg}</p>
                        <p className="text-[10px] text-emerald-500 font-medium">Recomm: {al.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Monthly Report Table */}
            <Card className="glass shadow-elegant p-5">
              <h3 className="text-base font-semibold">Monthly Fuel Consumption Report</h3>
              <p className="mb-4 text-xs text-muted-foreground">Historical monthly aggregation of litres consumed, costs, and standard metrics.</p>

              <div className="overflow-x-auto rounded-xl border border-border/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground border-b border-border/40">
                      <th className="p-3 font-semibold">Month</th>
                      <th className="p-3 font-semibold">Total Litres Consumed</th>
                      <th className="p-3 font-semibold">Total Fuel Cost</th>
                      <th className="p-3 font-semibold">Total Kilometers Run</th>
                      <th className="p-3 font-semibold">Average Fleet Mileage</th>
                      <th className="p-3 font-semibold">Cost Per Kilometer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReportData.length > 0 ? (
                      monthlyReportData.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-bold text-foreground">{item.month}</td>
                          <td className="p-3 font-semibold">{Math.round(item.litres).toLocaleString()} L</td>
                          <td className="p-3 font-bold text-primary">{formatINR(item.cost)}</td>
                          <td className="p-3 font-semibold">{item.distance.toLocaleString()} km</td>
                          <td className="p-3 font-black text-success">
                            {(item.distance / (item.litres || 1)).toFixed(2)} km/L
                          </td>
                          <td className="p-3 font-bold text-foreground">
                            ₹{(item.cost / (item.distance || 1)).toFixed(2)}/km
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">No monthly consumption data recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
