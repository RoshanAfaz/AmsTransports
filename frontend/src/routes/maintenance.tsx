import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/mock-data";
import { Wrench, Calendar, Truck, Plus } from "lucide-react";
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

export const getMaintenanceData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/maintenance");
});

export const addServiceAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/maintenance", {
      truck: data.truck,
      type: data.type,
      workshop: data.workshop,
      date: data.date,
      next: data.next,
      labour: Number(data.labour || 0),
      parts: Number(data.parts || 0),
    });
  });

export const deleteServiceAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as { _id: string })
  .handler(async ({ data }) => {
    return apiPost("/api/maintenance/delete", { id: data._id });
  });

import { swrLoader } from "@/lib/query-loader";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — AMS Transports" }, { name: "description", content: "Service history and upcoming maintenance reminders per vehicle." }] }),
  loader: ({ context: { queryClient } }) => 
    swrLoader({ queryClient, queryKey: ["maintenance"], queryFn: getMaintenanceData }),
  component: Maintenance,
});

function Maintenance() {
  const { services, trucks } = Route.useLoaderData();
  const router = useRouter();
  
  const [selectedTruck, setSelectedTruck] = useState<string>(trucks.length > 0 ? trucks[0].id : "");
  const [openAdd, setOpenAdd] = useState(false);

  const vehicleServices = services.filter((s: any) => s.truck === selectedTruck);
  const totalSpends = vehicleServices.reduce((sum: number, s: any) => sum + s.labour + s.parts, 0);

  async function onAddService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.truck = selectedTruck;
    
    try {
      await addServiceAction({ data });
      toast.success("Service record added");
      setOpenAdd(false);
      router.invalidate();
    } catch {
      toast.error("Failed to add service record");
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteServiceAction({ data: { _id: id } });
      toast.success("Service record removed");
      router.invalidate();
    } catch {
      toast.error("Failed to remove service record");
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
      <PageHeader title="Service & Maintenance" subtitle="Workshop visits, parts and labour tracking" action={headerAction} />
      
      {!selectedTruck ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10">
          <p className="text-muted-foreground">Please select a vehicle to view its service history.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold">Maintenance Log: {selectedTruck}</h2>
              <p className="text-sm text-muted-foreground">
                {vehicleServices.length} service records • Total Spend: <span className="font-semibold text-foreground">{formatINR(totalSpends)}</span>
              </p>
            </div>
            
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-accent text-accent-foreground shadow-accent">
                  <Plus className="mr-1 h-4 w-4" /> Log Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-background">
                <DialogHeader>
                  <DialogTitle>Log Service for {selectedTruck}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onAddService} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Service Type / Work Done</Label>
                    <Input name="type" placeholder="e.g., General Service, Engine Oil change" className="bg-muted/40" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Workshop / Mechanic Name</Label>
                    <Input name="workshop" placeholder="e.g., City Motors" className="bg-muted/40" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Service Date</Label>
                      <Input name="date" type="date" className="bg-muted/40" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Next Due (Date or KM)</Label>
                      <Input name="next" placeholder="e.g., 25000 KM" className="bg-muted/40" required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Labour Cost (₹)</Label>
                      <Input name="labour" type="number" placeholder="1500" className="bg-muted/40" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Parts Cost (₹)</Label>
                      <Input name="parts" type="number" placeholder="4500" className="bg-muted/40" required />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button type="submit" className="bg-primary text-primary-foreground">Save Record</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {vehicleServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/5">
              <Wrench className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold">No service history</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">Log the first workshop visit or repair for {selectedTruck}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {vehicleServices.map((s: any) => (
                <Card key={s._id} className="glass shadow-elegant p-5 animate-fade-in group relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-accent text-accent-foreground shadow-sm">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{s.type}</p>
                        <p className="text-xs text-muted-foreground">{s.workshop}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="border-secondary/40 bg-secondary/10 text-secondary">
                        <Calendar className="mr-1 h-3 w-3" /> Next {s.next}
                      </Badge>
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
                            <AlertDialogTitle>Remove Service Record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove the service record for {s.type} at {s.workshop}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(s._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-muted-foreground">Labour</p>
                      <p className="font-semibold">{formatINR(s.labour)}</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-muted-foreground">Parts</p>
                      <p className="font-semibold">{formatINR(s.parts)}</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2 border-l-2 border-accent/50 bg-accent/5">
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-bold text-accent">{formatINR(s.labour + s.parts)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Serviced on {s.date}</p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
