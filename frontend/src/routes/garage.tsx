import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Truck, Plus, Edit2, Calendar, FileCheck2, ShieldCheck, 
  Trash2, User, AlertTriangle, AlertCircle, Wrench, Search, Filter, Gauge 
} from "lucide-react";
import { formatINR, type TruckStatus } from "@/lib/mock-data";
import { apiGet, apiPost } from "@/lib/api-fetch";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/lib/language-context";
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

export const getGarageDataAction = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/garage");
});

export const addGarageVehicleAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/garage", data);
  });

export const editGarageVehicleAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/garage/edit", data);
  });

export const deleteGarageVehicleAction = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: _id }) => {
    return apiPost("/api/garage/delete", { id: _id });
  });

import { swrLoader } from "@/lib/query-loader";

export const Route = createFileRoute("/garage")({
  head: () => ({ meta: [{ title: "Garage — AMS Transports" }, { name: "description", content: "Compliance checks, fitness schedules and permit controls." }] }),
  loader: ({ context: { queryClient } }) => 
    swrLoader({ queryClient, queryKey: ["garage"], queryFn: getGarageDataAction }),
  component: Garage,
});

const statusColor: Record<TruckStatus, string> = {
  Active: "bg-success/15 text-success border-success/30",
  Running: "bg-secondary/15 text-secondary border-secondary/30",
  Maintenance: "bg-warning/15 text-warning-foreground border-warning/30",
  Breakdown: "bg-destructive/15 text-destructive border-destructive/30",
  Idle: "bg-muted text-muted-foreground border-border",
};

function Garage() {
  const { trucks, drivers } = Route.useLoaderData();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [open, setOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");

  function getDocHealth(dateStr?: string) {
    if (!dateStr || dateStr === "N/A" || dateStr === "") {
      return { status: "missing", label: t("No Date"), color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    }
    const expiry = new Date(dateStr);
    const now = new Date();
    // Reset hours to compare dates only
    expiry.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: "expired", label: t("Expired"), color: "text-destructive bg-destructive/10 border-destructive/20" };
    } else if (diffDays <= 30) {
      return { status: "warning", label: `${diffDays} ${t("days left")}`, color: "text-warning bg-warning/10 border-warning/20 animate-pulse-glow" };
    } else {
      return { status: "valid", label: t("Valid"), color: "text-success bg-success/10 border-success/20" };
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await addGarageVehicleAction({ data });
      toast.success(t("Vehicle added to garage successfully"));
      setOpen(false);
      router.invalidate();
    } catch {
      toast.error(t("Failed to add vehicle"));
    }
  }

  async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data._id = editingTruck._id;
    
    try {
      await editGarageVehicleAction({ data });
      toast.success(t("Vehicle updated successfully"));
      setEditingTruck(null);
      router.invalidate();
    } catch {
      toast.error(t("Failed to update vehicle"));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGarageVehicleAction({ data: id });
      toast.success(t("Vehicle removed from system"));
      router.invalidate();
    } catch {
      toast.error(t("Failed to delete vehicle"));
    }
  }

  // Filter trucks
  const filteredTrucks = useMemo(() => {
    return trucks.filter((t: any) => {
      const matchSearch = 
        t.id.toLowerCase().includes(search.toLowerCase()) || 
        t.reg.toLowerCase().includes(search.toLowerCase()) || 
        t.model.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      
      // Compliance filter
      let matchCompliance = true;
      if (complianceFilter !== "all") {
        const fitHealth = getDocHealth(t.fitness).status;
        const perHealth = getDocHealth(t.permit).status;
        const insHealth = getDocHealth(t.insurance).status;
        
        if (complianceFilter === "expired") {
          matchCompliance = fitHealth === "expired" || perHealth === "expired" || insHealth === "expired";
        } else if (complianceFilter === "warning") {
          matchCompliance = fitHealth === "warning" || perHealth === "warning" || insHealth === "warning";
        } else if (complianceFilter === "attention") {
          matchCompliance = fitHealth === "expired" || perHealth === "expired" || insHealth === "expired" ||
                            fitHealth === "warning" || perHealth === "warning" || insHealth === "warning";
        } else if (complianceFilter === "valid") {
          matchCompliance = fitHealth === "valid" && perHealth === "valid" && insHealth === "valid";
        }
      }
      
      return matchSearch && matchStatus && matchCompliance;
    });
  }, [trucks, search, statusFilter, complianceFilter]);

  // Stats summaries
  const stats = useMemo(() => {
    let total = trucks.length;
    let attention = 0;
    let maintenance = 0;
    let compliant = 0;
    
    trucks.forEach((t: any) => {
      const fit = getDocHealth(t.fitness).status;
      const per = getDocHealth(t.permit).status;
      const ins = getDocHealth(t.insurance).status;
      
      if (t.status === "Maintenance" || t.status === "Breakdown") {
        maintenance++;
      }
      
      if (fit === "expired" || per === "expired" || ins === "expired" ||
          fit === "warning" || per === "warning" || ins === "warning") {
        attention++;
      } else if (fit === "valid" && per === "valid" && ins === "valid") {
        compliant++;
      }
    });
    
    return { total, attention, maintenance, compliant };
  }, [trucks]);

  const addAction = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90 shadow-accent">
          <Plus className="mr-1 h-4 w-4" /> {t("Add Vehicle")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-background">
        <DialogHeader>
          <DialogTitle>{t("Add New Vehicle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4 max-h-[75vh] overflow-y-auto px-2">
          <div className="space-y-1">
            <Label htmlFor="id">{t("Vehicle ID / Fleet No")}</Label>
            <Input id="id" name="id" placeholder="e.g. TR-105" className="bg-muted/40 h-9" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reg">{t("Registration Plate")}</Label>
            <Input id="reg" name="reg" placeholder="e.g. TN-37-BY-5678" className="bg-muted/40 h-9" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="model">{t("Vehicle Model")}</Label>
            <Input id="model" name="model" placeholder="e.g. Ashok Leyland 1618" className="bg-muted/40 h-9" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="purchase">{t("Purchase Cost (₹)")}</Label>
              <Input id="purchase" name="purchase" type="number" placeholder="3200000" className="bg-muted/40 h-9" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="openingKm">{t("Opening Kilometers (km)")}</Label>
              <Input id="openingKm" name="openingKm" type="number" placeholder="0" defaultValue="0" className="bg-muted/40 h-9" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="status">{t("Initial Status")}</Label>
              <Select name="status" defaultValue="Idle">
                <SelectTrigger id="status" className="bg-muted/40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Idle">{t("Idle")}</SelectItem>
                  <SelectItem value="Active">{t("Active")}</SelectItem>
                  <SelectItem value="Maintenance">{t("Maintenance")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="driver">{t("Assign Driver")}</Label>
            <Select name="driver" defaultValue="Vacant">
              <SelectTrigger id="driver" className="bg-muted/40 h-9">
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vacant">Vacant</SelectItem>
                {drivers.map((d: any) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="border-t border-border/60 my-2 pt-2">
            <h4 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{t("Compliance Documents")}</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="fitness" className="text-xs">{t("Fitness Certificate Date")}</Label>
                <Input id="fitness" name="fitness" type="date" className="bg-muted/40 h-9" required />
              </div>
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="permit" className="text-xs">{t("Permit Expiry Date")}</Label>
                <Input id="permit" name="permit" type="date" className="bg-muted/40 h-9" required />
              </div>
              <div className="grid grid-cols-2 items-center gap-2">
                <Label htmlFor="insurance" className="text-xs">{t("Insurance Expiry Date")}</Label>
                <Input id="insurance" name="insurance" type="date" className="bg-muted/40 h-9" required />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button type="submit" className="bg-gradient-accent text-accent-foreground shadow-accent">{t("Save Vehicle")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Garage" subtitle="Monitor vehicle health, roadworthiness permits, and fitness compliance" action={addAction} />

      {/* Stats row */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="glass p-4 flex items-center justify-between shadow-elegant border-border/40">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">{t("Total Fleet")}</p>
            <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.total}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary" />
          </div>
        </Card>
        
        <Card className="glass p-4 flex items-center justify-between shadow-elegant border-border/40">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">{t("FC & Permit Attention")}</p>
            <h3 className="text-2xl font-bold mt-1 text-warning-foreground">{stats.attention}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
        </Card>

        <Card className="glass p-4 flex items-center justify-between shadow-elegant border-border/40">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">{t("In Maintenance")}</p>
            <h3 className="text-2xl font-bold mt-1 text-destructive">{stats.maintenance}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-destructive" />
          </div>
        </Card>

        <Card className="glass p-4 flex items-center justify-between shadow-elegant border-border/40">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">{t("Fully Compliant")}</p>
            <h3 className="text-2xl font-bold mt-1 text-success">{stats.compliant}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
            <FileCheck2 className="h-5 w-5 text-success" />
          </div>
        </Card>
      </section>

      {/* Filters row */}
      <section className="flex flex-wrap items-center gap-3 bg-muted/20 border border-border/40 p-3 rounded-xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder={t("Search by Vehicle ID, Reg plate, model…")} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9 h-9 bg-background/50 border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 bg-background/50 border-border text-xs">
              <SelectValue placeholder={t("All Statuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Statuses")}</SelectItem>
              <SelectItem value="Active">{t("Active")}</SelectItem>
              <SelectItem value="Idle">{t("Idle")}</SelectItem>
              <SelectItem value="Maintenance">{t("Maintenance")}</SelectItem>
              <SelectItem value="Breakdown">{t("Breakdown")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={complianceFilter} onValueChange={setComplianceFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-background/50 border-border text-xs">
              <SelectValue placeholder={t("All Compliance")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Compliance")}</SelectItem>
              <SelectItem value="valid">{t("Fully Compliant")}</SelectItem>
              <SelectItem value="attention">{t("FC & Permit Attention")}</SelectItem>
              <SelectItem value="expired">{t("Expired Documents")}</SelectItem>
              <SelectItem value="warning">{t("Expiring Soon (<30d)")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Vehicle Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTrucks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10 border border-dashed border-border/80 rounded-2xl">
            <Truck className="h-12 w-12 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium">{t("No vehicles found in garage matching filters.")}</p>
          </div>
        ) : (
          filteredTrucks.map((tTruck: any) => {
            const fitH = getDocHealth(tTruck.fitness);
            const perH = getDocHealth(tTruck.permit);
            const insH = getDocHealth(tTruck.insurance);
            
            return (
              <Card key={tTruck._id} className="glass shadow-elegant p-5 border-border/40 hover:border-accent/40 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-sm tracking-wider border border-muted-foreground/30 bg-muted/40 px-2 py-0.5 rounded font-bold inline-block select-all">
                        {tTruck.reg}
                      </div>
                      <h4 className="text-base font-semibold mt-2">{tTruck.model}</h4>
                      <p className="text-xs text-muted-foreground">{t("ID")}: {tTruck.id}</p>
                    </div>
                    <Badge variant="outline" className={statusColor[tTruck.status as TruckStatus] || statusColor.Idle}>
                      {t(tTruck.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded-lg">
                      <User className="h-3.5 w-3.5 text-accent" />
                      <span className="font-medium text-foreground">{t("Driver")}:</span>
                      <span className="ml-auto font-medium text-accent-foreground">{t(tTruck.driver)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded-lg">
                      <Gauge className="h-3.5 w-3.5 text-success" />
                      <span className="font-medium text-foreground">{t("Odometer")}:</span>
                      <span className="ml-auto font-medium text-success-foreground">{(tTruck.currentKm !== undefined ? tTruck.currentKm : (tTruck.openingKm || 0)).toLocaleString()} km</span>
                    </div>

                    {/* FC Status */}
                    <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{t("Fitness Date (FC)")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-muted-foreground">{tTruck.fitness || "N/A"}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${fitH.color}`}>
                          {fitH.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Permit Status */}
                    <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileCheck2 className="h-3.5 w-3.5 text-success" />
                        <span>{t("Road Permit")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-muted-foreground">{tTruck.permit || "N/A"}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${perH.color}`}>
                          {perH.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Insurance Status */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                        <span>{t("Insurance")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-muted-foreground">{tTruck.insurance || "N/A"}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${insH.color}`}>
                          {insH.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-2 justify-end border-t border-border/40 pt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted" 
                    onClick={() => setEditingTruck(tTruck)}
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("Remove Vehicle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("Are you sure you want to remove vehicle")} {tTruck.reg} {t("from the garage? This clears all compliance dates and details.")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(tTruck._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {t("Delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })
        )}
      </section>

      {/* Edit Vehicle Modal */}
      <Dialog open={!!editingTruck} onOpenChange={(val) => !val && setEditingTruck(null)}>
        <DialogContent className="sm:max-w-[450px] bg-background">
          <DialogHeader>
            <DialogTitle>{t("Edit Vehicle Details")}</DialogTitle>
          </DialogHeader>
          {editingTruck && (
            <form onSubmit={onEditSubmit} className="grid gap-4 py-4 max-h-[75vh] overflow-y-auto px-2">
              <div className="space-y-1">
                <Label htmlFor="edit-id">{t("Vehicle ID / Fleet No")}</Label>
                <Input id="edit-id" name="id" defaultValue={editingTruck.id} className="bg-muted/40 h-9" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-reg">{t("Registration Plate")}</Label>
                <Input id="edit-reg" name="reg" defaultValue={editingTruck.reg} className="bg-muted/40 h-9" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-model">{t("Vehicle Model")}</Label>
                <Input id="edit-model" name="model" defaultValue={editingTruck.model} className="bg-muted/40 h-9" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-purchase">{t("Purchase Cost (₹)")}</Label>
                  <Input id="edit-purchase" name="purchase" type="number" defaultValue={editingTruck.purchase} className="bg-muted/40 h-9" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-openingKm">{t("Opening Kilometers (km)")}</Label>
                  <Input id="edit-openingKm" name="openingKm" type="number" defaultValue={editingTruck.openingKm || 0} className="bg-muted/40 h-9" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-status">{t("Status")}</Label>
                  <Select name="status" defaultValue={editingTruck.status}>
                    <SelectTrigger id="edit-status" className="bg-muted/40 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Idle">{t("Idle")}</SelectItem>
                      <SelectItem value="Active">{t("Active")}</SelectItem>
                      <SelectItem value="Maintenance">{t("Maintenance")}</SelectItem>
                      <SelectItem value="Breakdown">{t("Breakdown")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-driver">{t("Assign Driver")}</Label>
                <Select name="driver" defaultValue={editingTruck.driver}>
                  <SelectTrigger id="edit-driver" className="bg-muted/40 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vacant">Vacant</SelectItem>
                    {drivers.map((d: any) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t border-border/60 my-2 pt-2">
                <h4 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{t("Compliance Documents")}</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 items-center gap-2">
                    <Label htmlFor="edit-fitness" className="text-xs">{t("Fitness Certificate Date")}</Label>
                    <Input id="edit-fitness" name="fitness" type="date" defaultValue={editingTruck.fitness} className="bg-muted/40 h-9" required />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-2">
                    <Label htmlFor="edit-permit" className="text-xs">{t("Permit Expiry Date")}</Label>
                    <Input id="edit-permit" name="permit" type="date" defaultValue={editingTruck.permit} className="bg-muted/40 h-9" required />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-2">
                    <Label htmlFor="edit-insurance" className="text-xs">{t("Insurance Expiry Date")}</Label>
                    <Input id="edit-insurance" name="insurance" type="date" defaultValue={editingTruck.insurance} className="bg-muted/40 h-9" required />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="submit" className="bg-gradient-accent text-accent-foreground shadow-accent">{t("Save Changes")}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
