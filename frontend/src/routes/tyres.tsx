import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/mock-data";
import { CircleDot, Truck, Plus, AlertTriangle } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-fetch";
import { useState } from "react";
import { toast } from "sonner";
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

export const getTyresData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/tyres");
});

export const addTyreAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/tyres", {
      truck: data.truck,
      pos: data.pos,
      brand: data.brand,
      serial: data.serial,
      installed: data.installed,
      cost: Number(data.cost || 0),
      kmRun: Number(data.kmRun || 0),
      health: Number(data.health || 100),
    });
  });

export const deleteTyreAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as { _id: string })
  .handler(async ({ data }) => {
    return apiPost("/api/tyres/delete", { id: data._id });
  });

export const Route = createFileRoute("/tyres")({
  head: () => ({ meta: [{ title: "Tyres — AMS Transports" }, { name: "description", content: "Tyre lifecycle and replacement tracking per vehicle." }] }),
  loader: () => getTyresData(),
  component: Tyres,
});

function healthColor(h: number) {
  if (h >= 70) return "text-success";
  if (h >= 40) return "text-warning-foreground";
  return "text-destructive";
}

const COMMON_POSITIONS = [
  "Steer - Left", "Steer - Right",
  "Drive 1 - Left Outer", "Drive 1 - Left Inner", "Drive 1 - Right Inner", "Drive 1 - Right Outer",
  "Drive 2 - Left Outer", "Drive 2 - Left Inner", "Drive 2 - Right Inner", "Drive 2 - Right Outer",
  "Trailer 1 - Left Outer", "Trailer 1 - Left Inner", "Trailer 1 - Right Inner", "Trailer 1 - Right Outer",
  "Trailer 2 - Left Outer", "Trailer 2 - Left Inner", "Trailer 2 - Right Inner", "Trailer 2 - Right Outer",
  "Trailer 3 - Left Outer", "Trailer 3 - Left Inner", "Trailer 3 - Right Inner", "Trailer 3 - Right Outer",
  "Spare"
];

function Tyres() {
  const { tyres, trucks } = Route.useLoaderData();
  const router = useRouter();
  
  // Default to first truck if available, else empty
  const [selectedTruck, setSelectedTruck] = useState<string>(trucks.length > 0 ? trucks[0].id : "");
  const [openAdd, setOpenAdd] = useState(false);
  const [posValue, setPosValue] = useState("");

  const vehicleTyres = tyres.filter((t: any) => t.truck === selectedTruck);

  async function onAddTyre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.truck = selectedTruck; // enforce selected truck
    
    try {
      await addTyreAction({ data });
      toast.success("Tyre record added");
      setOpenAdd(false);
      setPosValue("");
      router.invalidate();
    } catch {
      toast.error("Failed to add tyre");
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteTyreAction({ data: { _id: id } });
      toast.success("Tyre record removed");
      router.invalidate();
    } catch {
      toast.error("Failed to remove tyre");
    }
  }

  const headerAction = (
    <div className="flex items-center gap-2">
      <Truck className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedTruck} onValueChange={setSelectedTruck}>
        <SelectTrigger className="h-9 w-48 bg-muted/40">
          <SelectValue placeholder="Select vehicle" />
        </SelectTrigger>
        <SelectContent>
          {trucks.map((t: any) => (
            <SelectItem key={t.id} value={t.id}>{t.id} ({t.model})</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader title="Tyre Inventory & Health" subtitle="Manage wheels for each specific vehicle" action={headerAction} />
      
      {!selectedTruck ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10">
          <p className="text-muted-foreground">Please select a vehicle from the top right to manage its tyres.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold">Vehicle: {selectedTruck}</h2>
              <p className="text-sm text-muted-foreground">{vehicleTyres.length} tyres actively tracked on this vehicle</p>
            </div>
            
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-accent text-accent-foreground shadow-accent">
                  <Plus className="mr-1 h-4 w-4" /> Add Tyre
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-background">
                <DialogHeader>
                  <DialogTitle>Add Tyre Record to {selectedTruck}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onAddTyre} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Position / Axle Location</Label>
                    <input type="hidden" name="pos" value={posValue} required />
                    <Select value={posValue} onValueChange={setPosValue}>
                      <SelectTrigger className="h-9 w-full bg-muted/40 text-sm border border-border">
                        <SelectValue placeholder="Select wheel position..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground border border-border">
                        {COMMON_POSITIONS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Brand</Label>
                      <Input name="brand" placeholder="e.g., MRF, Apollo" className="bg-muted/40" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Serial No.</Label>
                      <Input name="serial" placeholder="TYR8890" className="bg-muted/40" required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Installed Date</Label>
                      <Input name="installed" type="date" className="bg-muted/40" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Cost (₹)</Label>
                      <Input name="cost" type="number" placeholder="22000" className="bg-muted/40" required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Current KM</Label>
                      <Input name="kmRun" type="number" placeholder="0" className="bg-muted/40" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Health (%)</Label>
                      <Input name="health" type="number" placeholder="100" max="100" min="0" className="bg-muted/40" required />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button type="submit" className="bg-primary text-primary-foreground">Save Tyre</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {vehicleTyres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/5">
              <CircleDot className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold">No tyres tracked yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">Add the first wheel for {selectedTruck} to start tracking health, KM run, and replacement schedules.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vehicleTyres.map((t: any) => (
                <Card key={t._id} className="glass shadow-elegant p-5 animate-fade-in group relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-sm">
                        <CircleDot className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{t.pos}</p>
                        <p className="text-xs text-muted-foreground">{t.brand} · <span className="font-mono">{t.serial}</span></p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {t.health < 30 && (
                        <Badge className="bg-destructive/15 text-destructive border-destructive/30 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Replace
                        </Badge>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[10px] text-destructive opacity-100 md:opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                          >
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Tyre Record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove the tyre record for the {t.pos} position ({t.brand})? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(t._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-muted/30 p-2"><p className="text-muted-foreground">Installed</p><p className="font-medium mt-0.5">{t.installed}</p></div>
                    <div className="rounded-md bg-muted/30 p-2"><p className="text-muted-foreground">KM Run</p><p className="font-medium mt-0.5">{t.kmRun?.toLocaleString("en-IN") || 0}</p></div>
                    <div className="rounded-md bg-muted/30 p-2"><p className="text-muted-foreground">Cost</p><p className="font-medium mt-0.5">{formatINR(t.cost)}</p></div>
                  </div>
                  
                  <div className="mt-4 rounded-lg border border-border/40 p-3 bg-muted/10">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tread health</span>
                      <span className={`font-bold ${healthColor(t.health)}`}>{t.health}%</span>
                    </div>
                    <Progress value={t.health} className="h-1.5" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
