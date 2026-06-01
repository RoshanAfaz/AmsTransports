import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/language-context";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/mock-data";
import { 
  MapPin, ArrowRight, Plus, Gauge, Fuel, ChevronDown, ChevronUp, 
  Trash2, FileDown, Search, Filter, HelpCircle, User, Truck, Receipt
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPost } from "@/lib/api-fetch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const getTrips = createServerFn({ method: "GET" }).handler(async () => {
  const data = await apiGet("/api/trips") as Record<string, any>;
  const settings = await apiGet("/api/settings").catch(() => null);
  return { ...data, settings };
});

export const addTripAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/trips", data);
  });

export const finishTripAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/trips/finish", data);
  });

export const deleteTripAction = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    return apiPost("/api/trips/delete", { id });
  });

export const Route = createFileRoute("/trips")({
  head: () => ({ meta: [{ title: "Digital Trip Memos — AMS Transports" }, { name: "description", content: "Create, view and download digital transport memos, invoice summaries and operational stats." }] }),
  loader: () => getTrips(),
  component: Trips,
});

function Trips() {
  const { t } = useLanguage();
  const { trips, trucks, drivers, settings } = Route.useLoaderData() as any;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tripType, setTripType] = useState<"Single" | "Round">("Single");
  const [status, setStatus] = useState<"Running" | "Completed">("Running");
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [openingKmVal, setOpeningKmVal] = useState<number>(0);
  const [outwardClosingKmVal, setOutwardClosingKmVal] = useState<number>(0);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fuel states for Add New Trip Memo
  const defaultRate = (settings?.dieselPrice || 92.4).toString();
  const [addDieselRate, setAddDieselRate] = useState(defaultRate);
  const [addDiesel, setAddDiesel] = useState("");
  const [addLitres, setAddLitres] = useState("");
  const [addLastEdited, setAddLastEdited] = useState<"diesel" | "litres">("diesel");

  const [addOutwardRate, setAddOutwardRate] = useState(defaultRate);
  const [addOutwardDiesel, setAddOutwardDiesel] = useState("");
  const [addOutwardLitres, setAddOutwardLitres] = useState("");
  const [addOutwardLastEdited, setAddOutwardLastEdited] = useState<"diesel" | "litres">("diesel");

  const [addReturnRate, setAddReturnRate] = useState(defaultRate);
  const [addReturnDiesel, setAddReturnDiesel] = useState("");
  const [addReturnLitres, setAddReturnLitres] = useState("");
  const [addReturnLastEdited, setAddReturnLastEdited] = useState<"diesel" | "litres">("diesel");

  const syncAddSingleLitres = (costStr: string, rateStr: string) => {
    const cost = parseFloat(costStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
      setAddLitres((cost / rate).toFixed(2));
    }
  };
  const syncAddSingleDiesel = (litStr: string, rateStr: string) => {
    const lit = parseFloat(litStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(lit) && !isNaN(rate)) {
      setAddDiesel((lit * rate).toFixed(2));
    }
  };

  const syncAddOutwardLitres = (costStr: string, rateStr: string) => {
    const cost = parseFloat(costStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
      setAddOutwardLitres((cost / rate).toFixed(2));
    }
  };
  const syncAddOutwardDiesel = (litStr: string, rateStr: string) => {
    const lit = parseFloat(litStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(lit) && !isNaN(rate)) {
      setAddOutwardDiesel((lit * rate).toFixed(2));
    }
  };

  const syncAddReturnLitres = (costStr: string, rateStr: string) => {
    const cost = parseFloat(costStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
      setAddReturnLitres((cost / rate).toFixed(2));
    }
  };
  const syncAddReturnDiesel = (litStr: string, rateStr: string) => {
    const lit = parseFloat(litStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(lit) && !isNaN(rate)) {
      setAddReturnDiesel((lit * rate).toFixed(2));
    }
  };

  const handleAddDieselRateChange = (newRate: string) => {
    setAddDieselRate(newRate);
    const rate = parseFloat(newRate);
    if (addLastEdited === "litres" && addLitres) {
      const lit = parseFloat(addLitres);
      if (!isNaN(lit) && !isNaN(rate)) {
        setAddDiesel((lit * rate).toFixed(2));
      }
    } else if (addDiesel) {
      const cost = parseFloat(addDiesel);
      if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
        setAddLitres((cost / rate).toFixed(2));
      }
    }
  };

  const handleAddOutwardRateChange = (newRate: string) => {
    setAddOutwardRate(newRate);
    const rate = parseFloat(newRate);
    if (addOutwardLastEdited === "litres" && addOutwardLitres) {
      const lit = parseFloat(addOutwardLitres);
      if (!isNaN(lit) && !isNaN(rate)) {
        setAddOutwardDiesel((lit * rate).toFixed(2));
      }
    } else if (addOutwardDiesel) {
      const cost = parseFloat(addOutwardDiesel);
      if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
        setAddOutwardLitres((cost / rate).toFixed(2));
      }
    }
  };

  const handleAddReturnRateChange = (newRate: string) => {
    setAddReturnRate(newRate);
    const rate = parseFloat(newRate);
    if (addReturnLastEdited === "litres" && addReturnLitres) {
      const lit = parseFloat(addReturnLitres);
      if (!isNaN(lit) && !isNaN(rate)) {
        setAddReturnDiesel((lit * rate).toFixed(2));
      }
    } else if (addReturnDiesel) {
      const cost = parseFloat(addReturnDiesel);
      if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
        setAddReturnLitres((cost / rate).toFixed(2));
      }
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.tripType = tripType;
    data.status = status;
    
    try {
      await addTripAction({ data });
      toast.success("Memo / Trip saved successfully");
      setOpen(false);
      router.invalidate();
      setSelectedTruckId("");
      setOpeningKmVal(0);
      setOutwardClosingKmVal(0);
      setTripType("Single");
      setStatus("Running");
      setAddDieselRate(defaultRate);
      setAddDiesel("");
      setAddLitres("");
      setAddLastEdited("diesel");
      setAddOutwardRate(defaultRate);
      setAddOutwardDiesel("");
      setAddOutwardLitres("");
      setAddOutwardLastEdited("diesel");
      setAddReturnRate(defaultRate);
      setAddReturnDiesel("");
      setAddReturnLitres("");
      setAddReturnLastEdited("diesel");
    } catch (error) {
      toast.error("Failed to add trip memo");
    }
  }

  // Filter trips
  const filteredMemos = trips.filter((t: any) => {
    const sTerm = search.toLowerCase();
    const matchesSearch = 
      (t.id || "").toLowerCase().includes(sTerm) ||
      (t.memoNo || "").toLowerCase().includes(sTerm) ||
      (t.truck || "").toLowerCase().includes(sTerm) ||
      (t.driver || "").toLowerCase().includes(sTerm) ||
      (t.customer || "").toLowerCase().includes(sTerm) ||
      (t.source || "").toLowerCase().includes(sTerm) ||
      (t.destination || "").toLowerCase().includes(sTerm);

    const matchesType = typeFilter === "all" || t.tripType === typeFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const addAction = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90 shadow-accent font-semibold">
          <Plus className="mr-1 h-4 w-4" /> {t("Create Trip Memo")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] bg-background">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{t("Create Digital Trip Memo")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto px-3">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="tripType" className="text-xs">{t("Trip Type")}</Label>
              <Select name="tripType" value={tripType} onValueChange={(val: "Single" | "Round") => setTripType(val)}>
                <SelectTrigger id="tripType" className="bg-muted/40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">{t("Single Trip (One-Way)")}</SelectItem>
                  <SelectItem value="Round">{t("Round Trip (Return)")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs">{t("Status")}</Label>
              <Select name="status" value={status} onValueChange={(val: "Running" | "Completed") => setStatus(val)}>
                <SelectTrigger id="status" className="bg-muted/40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Running">{t("Running (Active)")}</SelectItem>
                  <SelectItem value="Completed">{t("Completed (Archived)")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="customer" className="text-xs">{t("Customer Name / Billing Party")}</Label>
              <Input id="customer" name="customer" placeholder="e.g. Tata Steel Logistics" className="bg-muted/40 h-9" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs">{t("Trip Date")}</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="bg-muted/40 h-9" required />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="source" className="text-xs">{t("Source / Loading Point")}</Label>
              <Input id="source" name="source" placeholder="e.g. Chennai, TN" className="bg-muted/40 h-9" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="destination" className="text-xs">{t("Destination / Unloading Point")}</Label>
              <Input id="destination" name="destination" placeholder="e.g. Ahmedabad, GJ" className="bg-muted/40 h-9" required />
            </div>
          </div>
 
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="truck" className="text-xs">{t("Truck No")}</Label>
              <Select name="truck" required onValueChange={(val) => {
                setSelectedTruckId(val);
                const tr = trucks.find((t: any) => t.id === val);
                const currentOdo = tr ? (tr.currentKm !== undefined ? tr.currentKm : (tr.openingKm || 0)) : 0;
                setOpeningKmVal(currentOdo);
              }}>
                <SelectTrigger id="truck" className="bg-muted/40 h-9">
                  <SelectValue placeholder={t("Select vehicle...")} />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="driver" className="text-xs">{t("Driver Name")}</Label>
              <Select name="driver" required>
                <SelectTrigger id="driver" className="bg-muted/40 h-9">
                  <SelectValue placeholder={t("Select driver...")} />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d: any) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="load" className="text-xs">{t("Material / Load")}</Label>
              <Input id="load" name="load" placeholder="Steel / Cement" className="bg-muted/40 h-9" required />
            </div>
          </div>
 
          {tripType === "Single" ? (
            <div className="border border-border/60 rounded-lg p-3 bg-muted/20 space-y-3">
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider">{t("Odometer & Fuel (Single Trip)")}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="openingKm" className="text-xs">{t("Opening Kilometer (km)")}</Label>
                  <Input 
                    id="openingKm" 

                    name="openingKm" 
                    type="number" 
                    value={openingKmVal} 
                    onChange={(e) => setOpeningKmVal(Number(e.target.value))} 
                    className="bg-muted/40 h-9 font-bold text-xs" 
                    required 
                  />
                </div>
                {status === "Completed" && (
                  <div className="space-y-1">
                    <Label htmlFor="closingKm" className="text-xs">Closing Kilometer (km)</Label>
                    <Input id="closingKm" name="closingKm" type="number" placeholder="Enter closing km" className="bg-muted/40 h-9 font-bold text-xs" required />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="dieselRate" className="text-xs">{t("Diesel Price (₹/L)")}</Label>
                  <Input 
                    id="dieselRate" 
                    name="dieselRate" 
                    type="number" 
                    step="0.01" 
                    value={addDieselRate} 
                    onChange={(e) => handleAddDieselRateChange(e.target.value)} 
                    className="bg-muted/40 h-9" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="diesel" className="text-xs">{t("Diesel Cost (₹)")}</Label>
                  <Input 
                    id="diesel" 
                    name="diesel" 
                    type="number" 
                    value={addDiesel} 
                    onChange={(e) => {
                      setAddDiesel(e.target.value);
                      setAddLastEdited("diesel");
                      syncAddSingleLitres(e.target.value, addDieselRate);
                    }} 
                    placeholder="e.g. 15000" 
                    className="bg-muted/40 h-9" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="litres" className="text-xs">{t("Diesel Litres (L)")}</Label>
                  <Input 
                    id="litres" 
                    name="litres" 
                    type="number" 
                    value={addLitres} 
                    onChange={(e) => {
                      setAddLitres(e.target.value);
                      setAddLastEdited("litres");
                      syncAddSingleDiesel(e.target.value, addDieselRate);
                    }} 
                    placeholder="e.g. 160" 
                    className="bg-muted/40 h-9" 
                    required 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border/60 rounded-lg p-3 bg-muted/20 space-y-3">
              <h4 className="text-xs font-bold text-accent uppercase tracking-wider">{t("Odometer & Fuel (Round Trip)")}</h4>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground border-b border-border/40 pb-1">{t("Outward Leg")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="outwardOpeningKm" className="text-xs">{t("Opening Kilometer (km)")}</Label>
                    <Input 
                      id="outwardOpeningKm" 
                      name="outwardOpeningKm" 
                      type="number" 
                      value={openingKmVal} 
                      onChange={(e) => setOpeningKmVal(Number(e.target.value))} 
                      className="bg-muted/40 h-9 font-bold text-xs" 
                      required 
                    />
                  </div>
                  {status === "Completed" && (
                    <div className="space-y-1">
                      <Label htmlFor="outwardClosingKm" className="text-xs">{t("Closing Kilometer (km)")}</Label>
                      <Input 
                        id="outwardClosingKm" 
                        name="outwardClosingKm" 
                        type="number" 
                        placeholder="Outward closing km" 
                        value={outwardClosingKmVal || ""} 
                        onChange={(e) => setOutwardClosingKmVal(Number(e.target.value))}
                        className="bg-muted/40 h-9 font-bold text-xs" 
                        required 
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="dieselRate" className="text-xs">{t("Diesel Price (₹/L)")}</Label>
                    <Input 
                      id="dieselRate" 
                      name="dieselRate" 
                      type="number" 
                      step="0.01" 
                      value={addOutwardRate} 
                      onChange={(e) => handleAddOutwardRateChange(e.target.value)} 
                      className="bg-muted/40 h-9" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="outwardDiesel" className="text-xs">{t("Outward Leg")} {t("Diesel Cost (₹)")}</Label>
                    <Input 
                      id="outwardDiesel" 
                      name="outwardDiesel" 
                      type="number" 
                      value={addOutwardDiesel} 
                      onChange={(e) => {
                        setAddOutwardDiesel(e.target.value);
                        setAddOutwardLastEdited("diesel");
                        syncAddOutwardLitres(e.target.value, addOutwardRate);
                      }} 
                      placeholder="Diesel cost" 
                      className="bg-muted/40 h-9" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="outwardLitres" className="text-xs">{t("Outward Leg")} {t("Diesel Litres (L)")}</Label>
                    <Input 

                      id="outwardLitres" 
                      name="outwardLitres" 
                      type="number" 
                      value={addOutwardLitres} 
                      onChange={(e) => {
                        setAddOutwardLitres(e.target.value);
                        setAddOutwardLastEdited("litres");
                        syncAddOutwardDiesel(e.target.value, addOutwardRate);
                      }} 
                      placeholder="Liters consumed" 
                      className="bg-muted/40 h-9" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {status === "Completed" && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <p className="text-xs font-medium text-muted-foreground border-b border-border/40 pb-1">{t("Return Leg")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="returnOpeningKm" className="text-xs">{t("Opening Kilometer (km)")}</Label>
                      <Input 
                        id="returnOpeningKm" 
                        name="returnOpeningKm" 
                        type="number" 
                        value={outwardClosingKmVal}
                        placeholder="Return opening km" 
                        className="bg-muted/40 h-9 font-bold text-xs" 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="returnClosingKm" className="text-xs">{t("Closing Kilometer (km)")}</Label>
                      <Input id="returnClosingKm" name="returnClosingKm" type="number" placeholder="Return closing km" className="bg-muted/40 h-9 font-bold text-xs" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="returnDieselRate" className="text-xs">{t("Diesel Price (₹/L)")}</Label>
                      <Input 
                        id="returnDieselRate" 
                        name="returnDieselRate" 
                        type="number" 
                        step="0.01" 
                        value={addReturnRate} 
                        onChange={(e) => handleAddReturnRateChange(e.target.value)} 
                        className="bg-muted/40 h-9" 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="returnDiesel" className="text-xs">{t("Return Leg")} {t("Diesel Cost (₹)")}</Label>
                      <Input 
                        id="returnDiesel" 
                        name="returnDiesel" 
                        type="number" 
                        value={addReturnDiesel} 
                        onChange={(e) => {
                          setAddReturnDiesel(e.target.value);
                          setAddReturnLastEdited("diesel");
                          syncAddReturnLitres(e.target.value, addReturnRate);
                        }} 
                        placeholder="Diesel cost" 
                        className="bg-muted/40 h-9" 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="returnLitres" className="text-xs">{t("Return Leg")} {t("Diesel Litres (L)")}</Label>
                      <Input 
                        id="returnLitres" 
                        name="returnLitres" 
                        type="number" 
                        value={addReturnLitres} 
                        onChange={(e) => {
                          setAddReturnLitres(e.target.value);
                          setAddReturnLastEdited("litres");
                          syncAddReturnDiesel(e.target.value, addReturnRate);
                        }} 
                        placeholder="Liters consumed" 
                        className="bg-muted/40 h-9" 
                        required 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === "Running" && (
            <div className="space-y-1">
              <Label htmlFor="distance" className="text-xs">{t("Est. Total Distance (km)")}</Label>
              <Input id="distance" name="distance" type="number" placeholder="e.g. 1200" className="bg-muted/40 h-9" required />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="revenue" className="text-xs">{t("Freight Amount (Revenue)")} (₹)</Label>
              <Input id="revenue" name="revenue" type="number" placeholder="65000" className="bg-muted/40 h-9 font-bold text-xs text-primary" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="advance" className="text-xs">{t("Advance Received")} (₹)</Label>
              <Input id="advance" name="advance" type="number" placeholder="20000" className="bg-muted/40 h-9 font-bold text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="toll" className="text-xs">{t("Toll Gate Charges")} (₹)</Label>
              <Input id="toll" name="toll" type="number" placeholder="2400" className="bg-muted/40 h-9" required />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="bata" className="text-xs">{t("Driver Bata Allowance")} (₹)</Label>
              <Input id="bata" name="bata" type="number" placeholder="1500" className="bg-muted/40 h-9" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="misc" className="text-xs">{t("Miscellaneous")} (₹)</Label>
              <Input id="misc" name="misc" type="number" placeholder="1000" className="bg-muted/40 h-9" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="food" className="text-xs">{t("Food / Refreshment Expenses")} (₹)</Label>
              <Input id="food" name="food" type="number" placeholder="0" className="bg-muted/40 h-9" />
            </div>
          </div>

          <div className="border border-border/60 rounded-lg p-3 bg-muted/10 space-y-3">
            <h4 className="text-xs font-bold text-accent uppercase tracking-wider">{t("Extended Operational Expenses")} (₹)</h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="parking" className="text-xs">{t("Parking Charges")}</Label>
                <Input id="parking" name="parking" type="number" placeholder="0" className="bg-muted/40 h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="loading" className="text-xs">{t("Loading/Unloading")}</Label>
                <Input id="loading" name="loading" type="number" placeholder="0" className="bg-muted/40 h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rto" className="text-xs">{t("RTO / Permit Fees")}</Label>
                <Input id="rto" name="rto" type="number" placeholder="0" className="bg-muted/40 h-8 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="puncture" className="text-xs">{t("Puncture / Tyre Rep")}</Label>
                <Input id="puncture" name="puncture" type="number" placeholder="0" className="bg-muted/40 h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="maintenance" className="text-xs">{t("Maintenance / Spares")}</Label>
                <Input id="maintenance" name="maintenance" type="number" placeholder="0" className="bg-muted/40 h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customAmount" className="text-xs">{t("Custom / Other Cost")}</Label>
                <Input id="customAmount" name="customAmount" type="number" placeholder="0" className="bg-muted/40 h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="customName" className="text-xs">{t("Custom Cost Label")}</Label>
              <Input id="customName" name="customName" placeholder="e.g. State Entry Tax" className="bg-muted/40 h-8 text-xs" />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button type="submit" className="bg-primary text-primary-foreground font-semibold px-6">{t("Save & Issue Memo")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <PageHeader title={t("Digital Trip Memos")} subtitle={t("Paperless transport memo book with real-time financial tracking and print downloads")} action={addAction} />
      
      {/* Guide Banner for User-Friendliness */}
      <div className="bg-gradient-to-r from-accent/10 via-secondary/5 to-transparent border border-accent/20 rounded-2xl p-4 mt-5 flex flex-col sm:flex-row items-start gap-4 shadow-sm">
        <div className="p-2 bg-accent/15 rounded-xl text-accent-foreground shrink-0">
          <HelpCircle className="h-5 w-5 text-accent" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            {t("How Digital Memos Work")}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
            {t("This module digitizes traditional transport office memo books. Create a new memo when a truck departs to track running expenses, advance payments, and freight details. Once the trip ends, click")} <strong className="text-secondary font-semibold">"{t("Finish Trip & Record Closing Km")}"</strong> {t("to input final mileage, calculate fuel efficiency (mileage), compute net profits, and instantly download a stamp-verified PDF invoice summary.")}
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <Card className="glass shadow-elegant p-4 mt-6 border-accent/20">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder={t("Search by Memo No, Truck registration, Driver name, Customer or Route...")} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9 h-9.5 bg-muted/20 border-border/80 text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-muted/30 border border-border/60 rounded-lg px-2 py-1">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1"><Filter className="h-3 w-3" /> {t("Type")}:</span>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-7 bg-transparent border-0 text-xs py-0 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Trips")}</SelectItem>
                  <SelectItem value="Single">{t("Single")}</SelectItem>
                  <SelectItem value="Round">{t("Round")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 bg-muted/30 border border-border/60 rounded-lg px-2 py-1">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1"><Filter className="h-3 w-3" /> {t("Status")}:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 bg-transparent border-0 text-xs py-0 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Running">Running</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      </Card>

      {/* Grid of Memo Cards */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 mt-6">
        {filteredMemos.length > 0 ? (
          filteredMemos.map((t: any) => (
            <TripCard key={t._id} trip={t} router={router} settings={settings} />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/5 border border-dashed border-border/60 rounded-2xl">
            <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="font-semibold text-sm">No trip memos found</p>
            <p className="text-xs text-muted-foreground mt-1">Try refining your search terms or filter parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TripCard({ trip: t, router, settings }: { trip: any; router: any; settings: any }) {
  const { t: translate } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  
  const defaultRate = (settings?.dieselPrice || 92.4).toString();
  const [dieselRate, setDieselRate] = useState(t.dieselRate?.toString() || defaultRate);
  const [outwardDieselRate, setOutwardDieselRate] = useState(t.dieselRate?.toString() || defaultRate);
  const [returnDieselRate, setReturnDieselRate] = useState(t.returnDieselRate?.toString() || defaultRate);

  const [closingKm, setClosingKm] = useState(t.closingKm?.toString() || "");
  const [diesel, setDiesel] = useState(t.diesel?.toString() || "");
  const [litres, setLitres] = useState(t.litres?.toString() || "");

  const [outwardClosingKm, setOutwardClosingKm] = useState(t.outwardClosingKm?.toString() || "");
  const [outwardDiesel, setOutwardDiesel] = useState(t.outwardDiesel?.toString() || "");
  const [outwardLitres, setOutwardLitres] = useState(t.outwardLitres?.toString() || "");
  const [returnOpeningKm, setReturnOpeningKm] = useState(t.returnOpeningKm?.toString() || t.outwardClosingKm?.toString() || "");
  const [returnClosingKm, setReturnClosingKm] = useState(t.returnClosingKm?.toString() || "");
  const [returnDiesel, setReturnDiesel] = useState(t.returnDiesel?.toString() || "");
  const [returnLitres, setReturnLitres] = useState(t.returnLitres?.toString() || "");

  const [lastEditedSingle, setLastEditedSingle] = useState<"diesel" | "litres">("diesel");
  const [lastEditedOutward, setLastEditedOutward] = useState<"diesel" | "litres">("diesel");
  const [lastEditedReturn, setLastEditedReturn] = useState<"diesel" | "litres">("diesel");

  // Other actual final values in Finish form
  const [food, setFood] = useState(t.food?.toString() || "0");
  const [parking, setParking] = useState(t.parking?.toString() || "0");
  const [loading, setLoading] = useState(t.loading?.toString() || "0");
  const [rto, setRto] = useState(t.rto?.toString() || "0");
  const [puncture, setPuncture] = useState(t.puncture?.toString() || "0");
  const [maintenance, setMaintenance] = useState(t.maintenance?.toString() || "0");
  const [advance, setAdvance] = useState(t.advance?.toString() || "0");
  const [customer, setCustomer] = useState(t.customer || "");

  useEffect(() => {
    setDieselRate(t.dieselRate?.toString() || defaultRate);
    setOutwardDieselRate(t.dieselRate?.toString() || defaultRate);
    setReturnDieselRate(t.returnDieselRate?.toString() || defaultRate);
    setClosingKm(t.closingKm?.toString() || "");
    setDiesel(t.diesel?.toString() || "");
    setLitres(t.litres?.toString() || "");
    setOutwardClosingKm(t.outwardClosingKm?.toString() || "");
    setOutwardDiesel(t.outwardDiesel?.toString() || "");
    setOutwardLitres(t.outwardLitres?.toString() || "");
    setReturnOpeningKm(t.returnOpeningKm?.toString() || t.outwardClosingKm?.toString() || "");
    setReturnClosingKm(t.returnClosingKm?.toString() || "");
    setReturnDiesel(t.returnDiesel?.toString() || "");
    setReturnLitres(t.returnLitres?.toString() || "");
    setFood(t.food?.toString() || "0");
    setParking(t.parking?.toString() || "0");
    setLoading(t.loading?.toString() || "0");
    setRto(t.rto?.toString() || "0");
    setPuncture(t.puncture?.toString() || "0");
    setMaintenance(t.maintenance?.toString() || "0");
    setAdvance(t.advance?.toString() || "0");
    setCustomer(t.customer || "");
  }, [t, defaultRate]);

  const syncSingleLitres = (costStr: string, rateStr: string) => {
    const cost = parseFloat(costStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
      setLitres((cost / rate).toFixed(2));
    }
  };
  const syncSingleDiesel = (litStr: string, rateStr: string) => {
    const lit = parseFloat(litStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(lit) && !isNaN(rate)) {
      setDiesel((lit * rate).toFixed(2));
    }
  };

  const syncOutwardLitres = (costStr: string, rateStr: string) => {
    const cost = parseFloat(costStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
      setOutwardLitres((cost / rate).toFixed(2));
    }
  };
  const syncOutwardDiesel = (litStr: string, rateStr: string) => {
    const lit = parseFloat(litStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(lit) && !isNaN(rate)) {
      setOutwardDiesel((lit * rate).toFixed(2));
    }
  };

  const syncReturnLitres = (costStr: string, rateStr: string) => {
    const cost = parseFloat(costStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
      setReturnLitres((cost / rate).toFixed(2));
    }
  };
  const syncReturnDiesel = (litStr: string, rateStr: string) => {
    const lit = parseFloat(litStr);
    const rate = parseFloat(rateStr);
    if (!isNaN(lit) && !isNaN(rate)) {
      setReturnDiesel((lit * rate).toFixed(2));
    }
  };

  const handleSingleRateChange = (newRate: string) => {
    setDieselRate(newRate);
    const rate = parseFloat(newRate);
    if (lastEditedSingle === "litres" && litres) {
      const lit = parseFloat(litres);
      if (!isNaN(lit) && !isNaN(rate)) {
        setDiesel((lit * rate).toFixed(2));
      }
    } else if (diesel) {
      const cost = parseFloat(diesel);
      if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
        setLitres((cost / rate).toFixed(2));
      }
    }
  };

  const handleOutwardRateChange = (newRate: string) => {
    setOutwardDieselRate(newRate);
    const rate = parseFloat(newRate);
    if (lastEditedOutward === "litres" && outwardLitres) {
      const lit = parseFloat(outwardLitres);
      if (!isNaN(lit) && !isNaN(rate)) {
        setOutwardDiesel((lit * rate).toFixed(2));
      }
    } else if (outwardDiesel) {
      const cost = parseFloat(outwardDiesel);
      if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
        setOutwardLitres((cost / rate).toFixed(2));
      }
    }
  };

  const handleReturnRateChange = (newRate: string) => {
    setReturnDieselRate(newRate);
    const rate = parseFloat(newRate);
    if (lastEditedReturn === "litres" && returnLitres) {
      const lit = parseFloat(returnLitres);
      if (!isNaN(lit) && !isNaN(rate)) {
        setReturnDiesel((lit * rate).toFixed(2));
      }
    } else if (returnDiesel) {
      const cost = parseFloat(returnDiesel);
      if (!isNaN(cost) && !isNaN(rate) && rate > 0) {
        setReturnLitres((cost / rate).toFixed(2));
      }
    }
  };

  const fuelCost = Number(t.diesel || 0) || (Number(t.outwardDiesel || 0) + Number(t.returnDiesel || 0));
  const fuelLitres = Number(t.litres || 0) || (Number(t.outwardLitres || 0) + Number(t.returnLitres || 0));

  // Expense total calculation
  const totalExp = fuelCost + 
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

  const profit = Number(t.revenue || 0) - totalExp;
  const cpk = (totalExp / (t.distance || 1)).toFixed(2);
  const overallMileage = fuelLitres > 0 ? (t.distance / fuelLitres).toFixed(2) : "0.0";
  const advanceOutstanding = Number(t.revenue || 0) - Number(t.advance || 0);

  async function handleFinishSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: Record<string, any> = { id: t._id };
      if (t.tripType === "Round") {
        payload.outwardClosingKm = Number(outwardClosingKm);
        payload.outwardDiesel = Number(outwardDiesel);
        payload.outwardLitres = Number(outwardLitres);
        payload.returnOpeningKm = Number(returnOpeningKm || outwardClosingKm);
        payload.returnClosingKm = Number(returnClosingKm);
        payload.returnDiesel = Number(returnDiesel);
        payload.returnLitres = Number(returnLitres);
        payload.dieselRate = Number(outwardDieselRate);
        payload.returnDieselRate = Number(returnDieselRate);
      } else {
        payload.closingKm = Number(closingKm);
        payload.diesel = Number(diesel);
        payload.litres = Number(litres);
        payload.dieselRate = Number(dieselRate);
      }

      payload.food = Number(food);
      payload.parking = Number(parking);
      payload.loading = Number(loading);
      payload.rto = Number(rto);
      payload.puncture = Number(puncture);
      payload.maintenance = Number(maintenance);
      payload.advance = Number(advance);
      payload.customer = customer;
      
      await finishTripAction({ data: payload });
      toast.success("Memo finalized successfully!");
      setFinishOpen(false);
      router.invalidate();
    } catch {
      toast.error("Failed to finish trip");
    }
  }

  async function handleDelete() {
    try {
      await deleteTripAction({ data: t._id });
      toast.success("Trip memo deleted");
      router.invalidate();
    } catch {
      toast.error("Failed to delete trip");
    }
  }

  const downloadMemoPDF = () => {
    const formatPDFCurrency = (val: number) => {
      const formatted = new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0
      }).format(val);
      return "Rs. " + formatted;
    };

    const doc = new jsPDF("p", "mm", "a4");
    
    // Header Band
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 38, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(settings?.businessName || "AMS TRANSPORTS", 15, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Fleet Operations & Logistics Manager", 15, 24);
    doc.text(`GSTIN: ${settings?.gstin || "33ABCDE1234F1Z5"} | HQ: ${settings?.headOffice || "Chennai, TN"}`, 15, 29);
    
    // Header label stamp
    doc.setFillColor(56, 189, 248);
    doc.rect(145, 10, 50, 12, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DIGITAL TRIP SHEET", 148, 17);
    
    // Memo Details Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("OPERATIONAL MEMO DETAILS", 15, 48);
    doc.line(15, 50, 195, 50);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Memo Number: ${t.memoNo || `TRP${t._id.slice(-6).toUpperCase()}`}`, 15, 56);
    doc.text(`Trip Date: ${t.date || new Date().toISOString().split("T")[0]}`, 15, 62);
    doc.text(`Truck Registration: ${t.truck}`, 15, 68);
    doc.text(`Assigned Driver: ${t.driver}`, 15, 74);
    
    doc.text(`Customer / Bill To: ${t.customer || "Direct Client"}`, 110, 56);
    doc.text(`Route: ${t.source} to ${t.destination}`, 110, 62);
    doc.text(`Trip Mode: ${t.tripType || "Single"} (${t.status})`, 110, 68);
    doc.text(`Cargo / Material: ${t.load}`, 110, 74);
    
    // Financial Title
    doc.setFont("helvetica", "bold");
    doc.text("FINANCIAL STATEMENT & BREAKDOWN", 15, 86);
    doc.line(15, 88, 195, 88);
    
    // Generate Rows
    const rows = [
      ["1. Freight Amount (Revenue)", formatPDFCurrency(t.revenue || 0)],
      ["2. Advance Received", formatPDFCurrency(t.advance || 0)],
      ["3. Fuel Expenses (Diesel)", formatPDFCurrency(fuelCost)],
      ["4. Toll Gate Charges", formatPDFCurrency(t.toll || 0)],
      ["5. Driver Bata Allowance", formatPDFCurrency(t.bata || 0)],
      ["6. Food / Refreshment Expenses", formatPDFCurrency(t.food || 0)],
      ["7. Parking Charges", formatPDFCurrency(t.parking || 0)],
      ["8. Loading / Unloading Costs", formatPDFCurrency(t.loading || 0)],
      ["9. RTO Checkpost Fees", formatPDFCurrency(t.rto || 0)],
      ["10. Tyre Puncture Repair", formatPDFCurrency(t.puncture || 0)],
      ["11. Way-side Maintenance", formatPDFCurrency(t.maintenance || 0)],
      ["12. Miscellaneous", formatPDFCurrency(t.misc || 0)],
    ];
    if (t.customAmount > 0) {
      rows.push([`13. Custom Expense: ${t.customName || "Other"}`, formatPDFCurrency(t.customAmount)]);
    }

    autoTable(doc, {
      startY: 92,
      head: [["Description / Account Head", "Amount (INR)"]],
      body: rows,
      theme: "striped",
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } }
    });

    // Calculations Summary Box
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(15, finalY, 180, 25, "F");
    doc.rect(15, finalY, 180, 25, "S");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Trip Expenses: ${formatPDFCurrency(totalExp)}`, 18, finalY + 7);
    
    const netProfitVal = Number(t.revenue || 0) - totalExp;
    doc.setTextColor(netProfitVal >= 0 ? 22 : 220, netProfitVal >= 0 ? 101 : 38, netProfitVal >= 0 ? 52 : 38);
    doc.text(`Net Memo Profit: ${formatPDFCurrency(netProfitVal)}`, 18, finalY + 16);
    
    doc.setTextColor(15, 23, 42);
    const balanceDue = Number(t.revenue || 0) - Number(t.advance || 0);
    doc.text(`Outstanding Balance: ${formatPDFCurrency(balanceDue)}`, 110, finalY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Odo Distance: ${t.distance || 0} km (CPK: Rs.${cpk})`, 110, finalY + 16);
    
    // Draw Official Stamp & Signatures
    const stampY = finalY + 35;
    
    // Circular Red Stamp
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.6);
    doc.circle(55, stampY + 15, 12);
    doc.setFontSize(6.5);
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.text("AMS TRANSPORTS", 44, stampY + 12);
    doc.text("OFFICIAL STAMP", 44, stampY + 15);
    doc.text("VERIFIED & SIGNED", 42, stampY + 18);
    
    // Signature Line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.line(135, stampY + 22, 185, stampY + 22);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.text("Manager / Owner Signature", 143, stampY + 26);
    
    doc.save(`AMS_Memo_${t.memoNo || t._id.slice(-6).toUpperCase()}.pdf`);
    toast.success("Memo PDF downloaded successfully!");
  };

  return (
    <Card className="glass shadow-elegant p-5 animate-fade-in relative flex flex-col justify-between group border-accent/15">
      <div>
        
        {/* Card Header details */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#38bdf8] font-bold">{t.memoNo || `TRP${t._id.slice(-6).toUpperCase()}`}</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0.5 px-2 tracking-wide border-accent/20 text-accent bg-accent/5">
                {t.tripType || "Single"}
              </Badge>
              {t.customer && (
                <Badge variant="outline" className="text-[9px] font-medium py-0.5 px-1.5 border-border/80 text-muted-foreground">
                  {t.customer}
                </Badge>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4 text-accent" /> {t.source}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <MapPin className="h-4 w-4 text-success" /> {t.destination}
            </div>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground flex items-center gap-0.5"><Truck className="h-3 w-3 text-muted-foreground" /> {t.truck}</span> · 
              <span className="flex items-center gap-0.5"><User className="h-3 w-3 text-muted-foreground" /> {t.driver}</span> · 
              <span>{t.load}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={downloadMemoPDF}
              variant="outline" 
              size="sm" 
              className="h-8 border-[#38bdf8]/40 text-[#38bdf8] hover:bg-[#38bdf8]/10 text-xs font-semibold gap-1"
            >
              <FileDown className="h-3.5 w-3.5" /> PDF
            </Button>

            <Badge className={
              t.status === "Running" ? "bg-secondary/15 text-secondary border-secondary/30"
              : t.status === "Completed" ? "bg-success/15 text-success border-success/30"
              : "bg-warning/15 text-warning-foreground border-warning/30"
            }>{t.status}</Badge>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{translate("Delete Trip Memo")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {translate("Are you sure you want to delete this digital trip memo? Operational stats, truck current mileage and analytics will be updated.")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{translate("Cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/95">{translate("Delete")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* 4 Block statistics */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { l: translate("Distance"), v: `${t.distance || 0} km` },
            { l: translate("Freight Amount"), v: formatINR(t.revenue) },
            { l: translate("Total Expenses"), v: formatINR(totalExp) },
            { l: translate("CPK (Cost/km)"), v: `₹${cpk}` },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{s.l}</p>
              <p className="mt-0.5 text-xs font-bold">{s.v}</p>
            </div>
          ))}
        </div>

        {/* Advance outstanding alert banner */}
        <div className="mt-2.5 flex items-center justify-between text-xs rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5">
          <div className="text-[10px] text-muted-foreground">
            {translate("Advance")}: <span className="font-bold text-foreground">{formatINR(t.advance || 0)}</span>
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground">
            {translate("Bal Outstanding")}: <span className={`font-bold ${advanceOutstanding > 0 ? "text-[#f59e0b]" : "text-muted-foreground"}`}>{formatINR(advanceOutstanding)}</span>
          </div>
        </div>

        {t.status === "Completed" && (
          <div className="mt-3 grid grid-cols-2 gap-2.5 rounded-lg border border-border/40 bg-accent/5 p-3">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-accent" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">{translate("Fuel Consumed")}</p>
                <p className="text-xs font-bold">{t.litres ? `${t.litres.toFixed(1)} L` : "N/A"} <span className="text-[10px] text-muted-foreground font-normal">({formatINR(t.diesel)})</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-success" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">{translate("Overall Mileage")}</p>
                <p className="text-xs font-bold text-success-foreground">{overallMileage} km/L</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs bg-muted/30 border border-border/40 rounded-lg p-2.5 space-y-1.5">
          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span>{translate("Odometer Status")}:</span>
            {t.tripType === "Round" ? (
              <span className="font-mono font-medium">{t.outwardOpeningKm} km → {t.status === "Completed" ? `${t.returnClosingKm} km` : translate("Running...")}</span>
            ) : (
              <span className="font-mono font-medium">{t.openingKm} km → {t.status === "Completed" ? `${t.closingKm} km` : translate("Running...")}</span>
            )}
          </div>
        </div>

        {t.tripType === "Round" && t.status === "Completed" && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-xs flex items-center justify-between h-8 hover:bg-muted/50 border border-border/50 rounded-lg px-3"
            >
              <span>{showDetails ? translate("Hide Single Leg Mileage") : translate("View Outward & Return Mileage")}</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showDetails && (
              <div className="mt-2 space-y-2 border-l-2 border-accent/30 pl-2.5 py-1 animate-fade-in">
                <div className="text-xs bg-muted/20 border border-border/40 rounded p-2">
                  <p className="font-bold text-[11px] text-accent">{translate("Outward")}: {t.source} → {t.destination}</p>
                  <div className="grid grid-cols-3 gap-2 mt-1.5 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">{translate("Odometer Status")?.replace(" Status", "") || "Odo"}:</span>
                      <p className="font-mono font-semibold">{t.outwardOpeningKm}-{t.outwardClosingKm}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{translate("Fuel/Cost")}:</span>
                      <p className="font-semibold">{t.outwardLitres} L / {formatINR(t.outwardDiesel)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{translate("Mileage")}:</span>
                      <p className="font-bold text-success">
                        {t.outwardLitres > 0 ? `${((t.outwardClosingKm - t.outwardOpeningKm) / t.outwardLitres).toFixed(2)} km/L` : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>


                <div className="text-xs bg-muted/20 border border-border/40 rounded p-2">
                  <p className="font-bold text-[11px] text-success-foreground">{translate("Return")}: {t.destination} → {t.source}</p>
                  <div className="grid grid-cols-3 gap-2 mt-1.5 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">{translate("Odometer Status")?.replace(" Status", "") || "Odo"}:</span>
                      <p className="font-mono font-semibold">{t.returnOpeningKm}-{t.returnClosingKm}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{translate("Fuel/Cost")}:</span>
                      <p className="font-semibold">{t.returnLitres} L / {formatINR(t.returnDiesel)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{translate("Mileage")}:</span>
                      <p className="font-bold text-success">
                        {t.returnLitres > 0 ? `${((t.returnClosingKm - t.returnOpeningKm) / t.returnLitres).toFixed(2)} km/L` : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expense categories drawer breakdown */}
        <div className="mt-3">
          <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 flex items-center gap-1">{translate("Expense Account Summary:")}</div>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("Diesel")}</p><p className="font-bold text-[11px]">{formatINR(t.diesel)}</p></div>
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("Tolls")}</p><p className="font-bold text-[11px]">{formatINR(t.toll)}</p></div>
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("Bata")}</p><p className="font-bold text-[11px]">{formatINR(t.bata)}</p></div>
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("Food")}</p><p className="font-bold text-[11px]">{formatINR(t.food || 0)}</p></div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-xs mt-1.5">
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("Parking")}</p><p className="font-bold text-[11px]">{formatINR(t.parking || 0)}</p></div>
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("Loading")}</p><p className="font-bold text-[11px]">{formatINR(t.loading || 0)}</p></div>
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("RTO")}</p><p className="font-bold text-[11px]">{formatINR(t.rto || 0)}</p></div>
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("Puncture")}</p><p className="font-bold text-[11px]">{formatINR(t.puncture || 0)}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs mt-1.5">
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("Maint.")}</p><p className="font-bold text-[11px]">{formatINR(t.maintenance || 0)}</p></div>
            <div className="rounded bg-muted/30 p-1.5 text-center"><p className="text-[9px] text-muted-foreground">{translate("Misc")}</p><p className="font-bold text-[11px]">{formatINR(t.misc)}</p></div>
            {t.customAmount > 0 && (
              <div className="rounded bg-warning/10 border border-warning/20 p-1.5 text-center"><p className="text-[9px] text-warning-foreground truncate font-semibold" title={t.customName}>{t.customName || "Other"}</p><p className="font-black text-[11px] text-warning-foreground">{formatINR(t.customAmount)}</p></div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-gradient-to-r from-muted/40 to-muted/20 px-3 py-2 text-xs">
          <span className="uppercase tracking-wider text-muted-foreground font-semibold">{translate("Net Profit Margin")}</span>
          <span className={`text-sm font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>{formatINR(profit)}</span>
        </div>

        {t.status === "Running" && (
          <div className="mt-3">
            <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-9 font-semibold text-xs rounded-lg shadow-sm">
                  {translate("Finish Trip & Record Closing Km")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-background">
                <DialogHeader>
                  <DialogTitle>{translate("Finish Trip & Record Closing Km")}: {t.source} to {t.destination}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFinishSubmit} className="grid gap-4 py-4 max-h-[75vh] overflow-y-auto px-1">
                  
                  {t.tripType === "Round" ? (
                    <div className="space-y-4">
                      <div className="space-y-2 border-b border-border/40 pb-3">
                        <h4 className="text-xs font-bold text-accent uppercase">{translate("Outward Leg")}</h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">{translate("Opening Kilometer (km)")?.replace(" (km)", "") || "Opening Km"}:</span>
                            <p className="font-semibold font-mono">{t.outwardOpeningKm} km</p>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="outwardClosingKm" className="text-xs">{translate("Closing Kilometer (km)")?.replace(" (km)", "") || "Closing Km"}</Label>
                            <Input 
                              id="outwardClosingKm" 
                              type="number" 
                              required 
                              value={outwardClosingKm} 
                              onChange={(e) => {
                                setOutwardClosingKm(e.target.value);
                                setReturnOpeningKm(e.target.value);
                              }} 
                              placeholder="e.g. 500" 
                              className="bg-muted/40 h-9 font-bold text-xs" 
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="space-y-1">
                            <Label htmlFor="outwardDieselRate" className="text-xs">{translate("Diesel Price (₹/L)")}</Label>
                            <Input 
                              id="outwardDieselRate" 
                              type="number" 
                              step="0.01" 
                              required 
                              value={outwardDieselRate} 
                              onChange={(e) => handleOutwardRateChange(e.target.value)} 
                              className="bg-muted/40 h-9" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="outwardDiesel" className="text-xs">{translate("Diesel Cost (₹)")}</Label>
                            <Input 
                              id="outwardDiesel" 
                              type="number" 
                              required 
                              value={outwardDiesel} 
                              onChange={(e) => {
                                setOutwardDiesel(e.target.value);
                                setLastEditedOutward("diesel");
                                syncOutwardLitres(e.target.value, outwardDieselRate);
                              }} 
                              placeholder="cost" 
                              className="bg-muted/40 h-9" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="outwardLitres" className="text-xs">{translate("Diesel Litres (L)")}</Label>
                            <Input 
                              id="outwardLitres" 
                              type="number" 
                              required 
                              value={outwardLitres} 
                              onChange={(e) => {
                                setOutwardLitres(e.target.value);
                                setLastEditedOutward("litres");
                                syncOutwardDiesel(e.target.value, outwardDieselRate);
                              }} 
                              placeholder="litres" 
                              className="bg-muted/40 h-9" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-success uppercase">{translate("Return Leg")}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="returnOpeningKm" className="text-xs">{translate("Opening Kilometer (km)")?.replace(" (km)", "") || "Opening Km"}</Label>
                            <Input id="returnOpeningKm" type="number" required value={returnOpeningKm} onChange={(e) => setReturnOpeningKm(e.target.value)} className="bg-muted/40 h-9 font-bold text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="returnClosingKm" className="text-xs">{translate("Closing Kilometer (km)")?.replace(" (km)", "") || "Closing Km"}</Label>
                            <Input id="returnClosingKm" type="number" required value={returnClosingKm} onChange={(e) => setReturnClosingKm(e.target.value)} placeholder="e.g. 1000" className="bg-muted/40 h-9 font-bold text-xs" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="space-y-1">
                            <Label htmlFor="returnDieselRate" className="text-xs">{translate("Diesel Price (₹/L)")}</Label>
                            <Input 
                              id="returnDieselRate" 
                              type="number" 
                              step="0.01" 
                              required 
                              value={returnDieselRate} 
                              onChange={(e) => handleReturnRateChange(e.target.value)} 
                              className="bg-muted/40 h-9" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="returnDiesel" className="text-xs">{translate("Diesel Cost (₹)")}</Label>
                            <Input 
                              id="returnDiesel" 
                              type="number" 
                              required 
                              value={returnDiesel} 
                              onChange={(e) => {
                                setReturnDiesel(e.target.value);
                                setLastEditedReturn("diesel");
                                syncReturnLitres(e.target.value, returnDieselRate);
                              }} 
                              placeholder="cost" 
                              className="bg-muted/40 h-9" 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="returnLitres" className="text-xs">{translate("Diesel Litres (L)")}</Label>
                            <Input 
                              id="returnLitres" 
                              type="number" 
                              required 
                              value={returnLitres} 
                              onChange={(e) => {
                                setReturnLitres(e.target.value);
                                setLastEditedReturn("litres");
                                syncReturnDiesel(e.target.value, returnDieselRate);
                              }} 
                              placeholder="litres" 
                              className="bg-muted/40 h-9" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">{translate("Opening Kilometer (km)")?.replace(" (km)", "") || "Opening Km"}:</span>
                          <p className="font-semibold font-mono">{t.openingKm} km</p>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="closingKm" className="text-xs">{translate("Closing Kilometer (km)")}</Label>
                          <Input id="closingKm" type="number" required value={closingKm} onChange={(e) => setClosingKm(e.target.value)} placeholder="e.g. 500" className="bg-muted/40 h-9 font-bold text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="dieselRate" className="text-xs">{translate("Diesel Price (₹/L)")}</Label>
                          <Input 
                            id="dieselRate" 
                            type="number" 
                            step="0.01" 
                            required 
                            value={dieselRate} 
                            onChange={(e) => handleSingleRateChange(e.target.value)} 

                            className="bg-muted/40 h-9" 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="diesel" className="text-xs">{translate("Diesel Cost (₹)")}</Label>
                          <Input 
                            id="diesel" 
                            type="number" 
                            required 
                            value={diesel} 
                            onChange={(e) => {
                              setDiesel(e.target.value);
                              setLastEditedSingle("diesel");
                              syncSingleLitres(e.target.value, dieselRate);
                            }} 
                            placeholder="Diesel cost" 
                            className="bg-muted/40 h-9" 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="litres" className="text-xs">{translate("Diesel Litres (L)")}</Label>
                          <Input 
                            id="litres" 
                            type="number" 
                            required 
                            value={litres} 
                            onChange={(e) => {
                              setLitres(e.target.value);
                              setLastEditedSingle("litres");
                              syncSingleDiesel(e.target.value, dieselRate);
                            }} 
                            placeholder="Fuel in Litres" 
                            className="bg-muted/40 h-9" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border/40 my-2 pt-2 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{translate("Final Operational Statements (Adjustments)")}</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="customer" className="text-xs">{translate("Customer Name")}</Label>
                        <Input id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} className="bg-muted/40 h-9 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="advance" className="text-xs">{translate("Advance Received") + " (₹)"}</Label>
                        <Input id="advance" type="number" value={advance} onChange={(e) => setAdvance(e.target.value)} className="bg-muted/40 h-9 text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="food" className="text-xs">{translate("Food") + " (₹)"}</Label>
                        <Input id="food" type="number" value={food} onChange={(e) => setFood(e.target.value)} className="bg-muted/40 h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="parking" className="text-xs">{translate("Parking") + " (₹)"}</Label>
                        <Input id="parking" type="number" value={parking} onChange={(e) => setParking(e.target.value)} className="bg-muted/40 h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="loading" className="text-xs">{translate("Loading") + " (₹)"}</Label>
                        <Input id="loading" type="number" value={loading} onChange={(e) => setLoading(e.target.value)} className="bg-muted/40 h-8 text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="rto" className="text-xs">{translate("RTO") + " (₹)"}</Label>
                        <Input id="rto" type="number" value={rto} onChange={(e) => setRto(e.target.value)} className="bg-muted/40 h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="puncture" className="text-xs">{translate("Puncture") + " (₹)"}</Label>
                        <Input id="puncture" type="number" value={puncture} onChange={(e) => setPuncture(e.target.value)} className="bg-muted/40 h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="maintenance" className="text-xs">{translate("Maint.") + " (₹)"}</Label>
                        <Input id="maintenance" type="number" value={maintenance} onChange={(e) => setMaintenance(e.target.value)} className="bg-muted/40 h-8 text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button type="submit" className="bg-primary text-primary-foreground font-semibold px-5">{translate("Finalize Memo & Close")}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </Card>
  );
}
