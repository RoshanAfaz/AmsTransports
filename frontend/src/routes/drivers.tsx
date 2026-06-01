import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/mock-data";
import { apiGet, apiPost } from "@/lib/api-fetch";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export const getDrivers = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/drivers");
});

export const addDriverAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/drivers", data);
  });

export const editDriverAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/drivers/edit", data);
  });

export const deleteDriverAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as { _id: string })
  .handler(async ({ data }) => {
    return apiPost("/api/drivers/delete", { id: data._id });
  });

export const Route = createFileRoute("/drivers")({
  head: () => ({ meta: [{ title: "Drivers — AMS Transports" }, { name: "description", content: "Manage drivers, salaries, performance and assignments." }] }),
  loader: () => getDrivers(),
  component: Drivers,
});

const avatarColors = ["bg-gradient-primary", "bg-gradient-accent", "bg-gradient-success"];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function Drivers() {
  const { drivers, trucks } = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await addDriverAction({ data });
      toast.success("Driver added successfully");
      setOpen(false);
      router.invalidate();
    } catch (error) {
      toast.error("Failed to add driver");
    }
  }

  async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data._id = editingDriver._id;
    
    try {
      await editDriverAction({ data });
      toast.success("Driver updated successfully");
      setEditingDriver(null);
      router.invalidate();
    } catch (error) {
      toast.error("Failed to update driver");
    }
  }

  async function onDelete() {
    try {
      await deleteDriverAction({ data: { _id: editingDriver._id } });
      toast.success("Driver deleted successfully");
      setEditingDriver(null);
      router.invalidate();
    } catch (error) {
      toast.error("Failed to delete driver");
    }
  }

  const addAction = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90 shadow-accent">
          <Plus className="mr-1 h-4 w-4" /> Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="id" className="text-right text-xs">Driver ID</Label>
            <Input id="id" name="id" placeholder="DRV01 (Optional)" className="col-span-3 bg-muted/40" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-xs">Name</Label>
            <Input id="name" name="name" placeholder="Ramesh K." className="col-span-3 bg-muted/40" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right text-xs">Phone</Label>
            <Input id="phone" name="phone" placeholder="+91 98765 43210" className="col-span-3 bg-muted/40" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="license" className="text-right text-xs">License</Label>
            <Input id="license" name="license" placeholder="TN01 20120034567" className="col-span-3 bg-muted/40" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="truck" className="text-right text-xs">Truck</Label>
            <Select name="truck" defaultValue="Unassigned">
              <SelectTrigger id="truck" className="col-span-3 bg-muted/40 h-9">
                <SelectValue placeholder="Select Truck" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                {trucks.map((t: any) => (
                  <SelectItem key={t._id} value={t.id}>{t.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="salary" className="text-right text-xs">Salary (%)</Label>
            <Input id="salary" name="salary" type="number" placeholder="10" className="col-span-3 bg-muted/40" required />
          </div>
          <div className="flex justify-end mt-4">
            <Button type="submit" className="bg-primary text-primary-foreground">Save Driver</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <PageHeader title="Drivers" subtitle="Performance, salary and assignment tracking" action={addAction} />
      
      {/* Edit Driver Modal */}
      <Dialog open={!!editingDriver} onOpenChange={(val) => !val && setEditingDriver(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Edit Driver Details</DialogTitle>
          </DialogHeader>
          {editingDriver && (
            <form onSubmit={onEditSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right text-xs">Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingDriver.name} className="col-span-3 bg-muted/40" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right text-xs">Phone</Label>
                <Input id="edit-phone" name="phone" defaultValue={editingDriver.phone} className="col-span-3 bg-muted/40" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-license" className="text-right text-xs">License</Label>
                <Input id="edit-license" name="license" defaultValue={editingDriver.license} className="col-span-3 bg-muted/40" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-truck" className="text-right text-xs">Truck</Label>
                <Select name="truck" defaultValue={editingDriver.truck || "Unassigned"}>
                  <SelectTrigger id="edit-truck" className="col-span-3 bg-muted/40 h-9">
                    <SelectValue placeholder="Select Truck" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                    {trucks.map((t: any) => (
                      <SelectItem key={t._id} value={t.id}>{t.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-salary" className="text-right text-xs">Salary (%)</Label>
                <Input id="edit-salary" name="salary" type="number" defaultValue={editingDriver.salary} className="col-span-3 bg-muted/40" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-advance" className="text-right text-xs">Advance (₹)</Label>
                <Input id="edit-advance" name="advance" type="number" defaultValue={editingDriver.advance} className="col-span-3 bg-muted/40" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-score" className="text-right text-xs">Performance (%)</Label>
                <Input id="edit-score" name="score" type="number" defaultValue={editingDriver.score} max="100" min="0" className="col-span-3 bg-muted/40" required />
              </div>
              <div className="flex justify-between mt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">Delete Driver</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the driver
                        and remove them from their assigned truck.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button type="submit" className="bg-primary text-primary-foreground">Update Driver</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {drivers.map((d: any, i: number) => (
          <Card key={d.id} className="glass shadow-elegant p-5 animate-fade-in group">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-primary-foreground shadow-elegant ${avatarColors[i % 3]}`}>
                {initials(d.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-secondary/40 bg-secondary/10 text-secondary">{d.truck}</Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={() => setEditingDriver(d)}
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-muted-foreground">Trips</p><p className="text-sm font-semibold">{d.trips}</p></div>
                <div><p className="text-muted-foreground">Salary ({d.salary}%)</p><p className="text-sm font-semibold text-success">{formatINR(d.earnedSalary)}</p></div>
                <div><p className="text-muted-foreground">Advance</p><p className="text-sm font-semibold">{formatINR(d.advance)}</p></div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="font-semibold">{d.score}%</span>
                </div>
                <Progress value={d.score} className="h-2" />
              </div>
              <p className="text-muted-foreground">License · <span className="font-mono">{d.license}</span></p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
