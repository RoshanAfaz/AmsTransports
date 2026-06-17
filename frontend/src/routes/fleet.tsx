import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck, Plus, Edit2, Gauge } from "lucide-react";
import { formatINR, type TruckStatus } from "@/lib/mock-data";
import { apiGet, apiPost } from "@/lib/api-fetch";
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const getFleet = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/fleet");
});

export const addFleetAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/fleet", data);
  });

export const editFleetAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/fleet/edit", data);
  });

import { swrLoader } from "@/lib/query-loader";

export const Route = createFileRoute("/fleet")({
  head: () => ({ meta: [{ title: "Fleet — AMS Transports" }, { name: "description", content: "Manage your truck fleet, status, insurance and permits." }] }),
  loader: ({ context: { queryClient } }) => 
    swrLoader({ queryClient, queryKey: ["fleet"], queryFn: getFleet }),
  component: Fleet,
});

const statusColor: Record<TruckStatus, string> = {
  Active: "bg-success/15 text-success border-success/30",
  Running: "bg-secondary/15 text-secondary border-secondary/30",
  Maintenance: "bg-warning/15 text-warning-foreground border-warning/30",
  Breakdown: "bg-destructive/15 text-destructive border-destructive/30",
  Idle: "bg-muted text-muted-foreground border-border",
};

function Fleet() {
  const { trucks, drivers } = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<any | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await addFleetAction({ data });
      toast.success("Truck added to fleet successfully");
      setOpen(false);
      router.invalidate();
    } catch (error) {
      toast.error("Failed to add truck");
    }
  }

  async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data._id = editingTruck._id;
    
    try {
      await editFleetAction({ data });
      toast.success("Truck updated successfully");
      setEditingTruck(null);
      router.invalidate();
    } catch (error) {
      toast.error("Failed to update truck");
    }
  }

  const addAction = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90 shadow-accent">
          <Plus className="mr-1 h-4 w-4" /> Add Truck
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Add New Truck</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="id" className="text-right text-xs">Truck No</Label>
            <Input id="id" name="id" placeholder="TN01AB1234" className="col-span-3 bg-muted/40" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reg" className="text-right text-xs">Reg No</Label>
            <Input id="reg" name="reg" placeholder="TN-01-AB-1234" className="col-span-3 bg-muted/40" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right text-xs">Model</Label>
            <Input id="model" name="model" placeholder="Tata Signa 4825" className="col-span-3 bg-muted/40" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chassisCost" className="text-right text-xs">Chassis Price (₹)</Label>
            <Input id="chassisCost" name="chassisCost" type="number" placeholder="2800000" className="col-span-3 bg-muted/40" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bodyCost" className="text-right text-xs">Body Build (₹)</Label>
            <Input id="bodyCost" name="bodyCost" type="number" placeholder="700000" className="col-span-3 bg-muted/40" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="loanAmount" className="text-right text-xs">Loan Claimed (₹)</Label>
            <Input id="loanAmount" name="loanAmount" type="number" placeholder="3100000" className="col-span-3 bg-muted/40" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchase" className="text-right text-xs">Total / Price (₹)</Label>
            <Input id="purchase" name="purchase" type="number" placeholder="Or total price" className="col-span-3 bg-muted/40" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="openingKm" className="text-right text-xs">Opening Km</Label>
            <Input id="openingKm" name="openingKm" type="number" placeholder="0" defaultValue="0" className="col-span-3 bg-muted/40" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driver" className="text-right text-xs">Driver</Label>
            <Select name="driver" defaultValue="Vacant">
              <SelectTrigger id="driver" className="col-span-3 bg-muted/40 h-9">
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vacant">Vacant</SelectItem>
                {drivers.map((d: any) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="insurance" className="text-right text-xs">Insurance Date</Label>
            <Input id="insurance" name="insurance" type="date" className="col-span-3 bg-muted/40" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="permit" className="text-right text-xs">Permit Date</Label>
            <Input id="permit" name="permit" type="date" className="col-span-3 bg-muted/40" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fitness" className="text-right text-xs">Fitness Date</Label>
            <Input id="fitness" name="fitness" type="date" className="col-span-3 bg-muted/40" />
          </div>
          <div className="flex justify-end mt-4">
            <Button type="submit" className="bg-primary text-primary-foreground">Save Truck</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <PageHeader title="Fleet Management" subtitle="Every truck, every detail — at a glance" action={addAction} />
      
      {/* Edit Truck Modal */}
      <Dialog open={!!editingTruck} onOpenChange={(val) => !val && setEditingTruck(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Edit Truck Details</DialogTitle>
          </DialogHeader>
          {editingTruck && (
            <form onSubmit={onEditSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-id" className="text-right text-xs">Truck No</Label>
                <Input id="edit-id" name="id" defaultValue={editingTruck.id} className="col-span-3 bg-muted/40" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-reg" className="text-right text-xs">Reg No</Label>
                <Input id="edit-reg" name="reg" defaultValue={editingTruck.reg} className="col-span-3 bg-muted/40" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-model" className="text-right text-xs">Model</Label>
                <Input id="edit-model" name="model" defaultValue={editingTruck.model} className="col-span-3 bg-muted/40" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-chassisCost" className="text-right text-xs">Chassis Price (₹)</Label>
                <Input id="edit-chassisCost" name="chassisCost" type="number" defaultValue={editingTruck.chassisCost || editingTruck.purchase} className="col-span-3 bg-muted/40" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-bodyCost" className="text-right text-xs">Body Build (₹)</Label>
                <Input id="edit-bodyCost" name="bodyCost" type="number" defaultValue={editingTruck.bodyCost || 0} className="col-span-3 bg-muted/40" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-loanAmount" className="text-right text-xs">Loan Claimed (₹)</Label>
                <Input id="edit-loanAmount" name="loanAmount" type="number" defaultValue={editingTruck.loanAmount || 0} className="col-span-3 bg-muted/40" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-purchase" className="text-right text-xs">Total / Price (₹)</Label>
                <Input id="edit-purchase" name="purchase" type="number" defaultValue={editingTruck.purchase} className="col-span-3 bg-muted/40" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-openingKm" className="text-right text-xs">Opening Km</Label>
                <Input id="edit-openingKm" name="openingKm" type="number" defaultValue={editingTruck.openingKm || 0} className="col-span-3 bg-muted/40" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-driver" className="text-right text-xs">Driver</Label>
                <Select name="driver" defaultValue={editingTruck.driver || "Vacant"}>
                  <SelectTrigger id="edit-driver" className="col-span-3 bg-muted/40 h-9">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vacant">Vacant</SelectItem>
                    {drivers.map((d: any) => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-insurance" className="text-right text-xs">Insurance Date</Label>
                <Input id="edit-insurance" name="insurance" type="date" defaultValue={editingTruck.insurance !== "N/A" ? editingTruck.insurance : ""} className="col-span-3 bg-muted/40" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-permit" className="text-right text-xs">Permit Date</Label>
                <Input id="edit-permit" name="permit" type="date" defaultValue={editingTruck.permit !== "N/A" ? editingTruck.permit : ""} className="col-span-3 bg-muted/40" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-fitness" className="text-right text-xs">Fitness Date</Label>
                <Input id="edit-fitness" name="fitness" type="date" defaultValue={editingTruck.fitness !== "N/A" ? editingTruck.fitness : ""} className="col-span-3 bg-muted/40" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right text-xs">Status</Label>
                <Select name="status" defaultValue={editingTruck.status}>
                  <SelectTrigger id="edit-status" className="col-span-3 bg-muted/40 h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Breakdown">Breakdown</SelectItem>
                    <SelectItem value="Idle">Idle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="submit" className="bg-primary text-primary-foreground">Update Truck</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="mb-4">
        <Input placeholder="Search by truck number, model, driver…" className="max-w-sm bg-muted/40" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trucks.map((t: any) => (
          <Card key={t.id} className="glass shadow-elegant overflow-hidden p-5 animate-fade-in group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold tracking-tight">{t.id}</p>
                  <p className="text-xs text-muted-foreground">{t.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColor[t.status as TruckStatus]}>{t.status}</Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={() => setEditingTruck(t)}
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-muted-foreground">Driver</p><p className="font-medium">{t.driver}</p></div>
              <div><p className="text-muted-foreground">Odometer</p><p className="font-medium">{(t.currentKm !== undefined ? t.currentKm : (t.openingKm || 0)).toLocaleString()} km</p></div>
              <div><p className="text-muted-foreground">Mileage</p><p className="font-medium">{t.mileage} km/L</p></div>
              <div>
                <p className="text-muted-foreground">Purchase Cost</p>
                <p className="font-medium">
                  {formatINR(t.purchase)}
                  {(t.chassisCost || t.bodyCost) ? (
                    <span className="text-[9px] text-muted-foreground block leading-tight font-normal">
                      ({formatINR(t.chassisCost || 0)} + {formatINR(t.bodyCost || 0)})
                    </span>
                  ) : null}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Claimed Loan</p>
                <p className="font-medium">
                  {t.loanAmount ? formatINR(t.loanAmount) : "N/A"}
                  {t.loanAmount && t.purchase ? (
                    <span className="text-[9px] text-accent block leading-tight font-normal">
                      ({((t.loanAmount / t.purchase) * 100).toFixed(0)}% Financed)
                    </span>
                  ) : null}
                </p>
              </div>
              <div><p className="text-muted-foreground">Insurance</p><p className="font-medium">{t.insurance}</p></div>
              <div><p className="text-muted-foreground">Permit</p><p className="font-medium">{t.permit}</p></div>
              <div><p className="text-muted-foreground">Fitness</p><p className="font-medium">{t.fitness}</p></div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">YTD profit</span>
              <span className={`text-sm font-bold ${t.profit >= 0 ? "text-success" : "text-destructive"}`}>{formatINR(t.profit)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
