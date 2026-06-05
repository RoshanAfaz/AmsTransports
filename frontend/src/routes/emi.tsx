import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/mock-data";
import { CreditCard, Plus, CheckCircle, Trash2 } from "lucide-react";
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

export const getEmiData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/emi");
});

export const addEmiAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/emi", data);
  });

export const payEmiAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as { _id: string, paid: number, currentDue: string })
  .handler(async ({ data }) => {
    return apiPost("/api/emi/pay", { id: data._id, paid: data.paid, currentDue: data.currentDue });
  });

export const deleteEmiAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as { _id: string })
  .handler(async ({ data }) => {
    return apiPost("/api/emi/delete", { id: data._id });
  });


export const Route = createFileRoute("/emi")({
  head: () => ({ meta: [{ title: "EMI & Loans — AMS Transports" }, { name: "description", content: "EMI schedules, payments and loan balance tracking." }] }),
  loader: () => getEmiData(),
  component: EMI,
});

function Ring({ pct }: { pct: number }) {
  const c = 2 * Math.PI * 28;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r="28" stroke="var(--color-muted)" strokeWidth="6" fill="none" />
      <circle cx="36" cy="36" r="28" stroke="var(--color-accent)" strokeWidth="6" fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round" />
    </svg>
  );
}function EMI() {
  const { emis, trucks } = Route.useLoaderData();
  const router = useRouter();
  const [openAdd, setOpenAdd] = useState(false);
  const [truckValue, setTruckValue] = useState("");
  const [loanAmount, setLoanAmount] = useState("");

  const handleTruckChange = (val: string) => {
    setTruckValue(val);
    const selectedTruck = trucks.find((t: any) => t.id === val);
    if (selectedTruck && selectedTruck.loanAmount) {
      setLoanAmount(selectedTruck.loanAmount.toString());
    } else {
      setLoanAmount("");
    }
  };

  async function onAddLoan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await addEmiAction({ data });
      toast.success("Loan record added");
      setOpenAdd(false);
      setTruckValue("");
      setLoanAmount("");
      router.invalidate();
    } catch {
      toast.error("Failed to add loan");
    }
  }

  async function onPayEmi(id: string, paid: number, due: string) {
    try {
      await payEmiAction({ data: { _id: id, paid, currentDue: due } });
      toast.success("EMI payment recorded!");
      router.invalidate();
    } catch {
      toast.error("Failed to record payment");
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteEmiAction({ data: { _id: id } });
      toast.success("Loan record deleted");
      router.invalidate();
    } catch {
      toast.error("Failed to delete loan");
    }
  }

  const addAction = (
    <Dialog open={openAdd} onOpenChange={(val) => { setOpenAdd(val); if(!val) { setTruckValue(""); setLoanAmount(""); } }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-accent text-accent-foreground shadow-accent">
          <Plus className="mr-1 h-4 w-4" /> Add Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Add New Loan Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={onAddLoan} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
          
          <div className="space-y-2">
            <Label className="text-xs">Select Vehicle</Label>
            <input type="hidden" name="truck" value={truckValue} required />
            <Select value={truckValue} onValueChange={handleTruckChange}>
              <SelectTrigger className="h-9 w-full bg-muted/40 text-sm border border-border">
                <SelectValue placeholder="Select vehicle..." />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border border-border">
                {trucks.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Lender / Bank Name</Label>
            <Input name="lender" placeholder="e.g., HDFC Bank, Cholamandalam" className="bg-muted/40" required />
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Principal Loan Amount (₹)</Label>
              <Input name="loanAmount" type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="2500000" className="bg-muted/40" required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Interest Rate (%)</Label>
              <Input name="interestRate" type="number" step="0.01" placeholder="8.5" className="bg-muted/40" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Total Tenure (Months)</Label>
              <Input name="tenure" type="number" placeholder="60" className="bg-muted/40" required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Actual Monthly EMI (₹)</Label>
              <Input name="monthly" type="number" placeholder="45000" className="bg-muted/40" required />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Months Paid Already</Label>
              <Input name="paid" type="number" defaultValue="0" className="bg-muted/40" required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Next Due Date</Label>
              <Input name="due" type="date" className="bg-muted/40" required />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button type="submit" className="bg-primary text-primary-foreground">Save Loan</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <PageHeader title="EMI & Loans" subtitle="Loan progress and upcoming dues across the fleet" action={addAction} />
      
      {emis.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10">
          <CreditCard className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">No active loans</h3>
          <p className="text-sm text-muted-foreground">Add a loan record to start tracking EMIs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {emis.map((e: any) => {
            const pct = Math.min(100, Math.round((e.paid / e.tenure) * 100));
            const loanAmount = e.loanAmount || e.total || 0;
            const totalPayable = e.monthly * e.tenure;
            const totalInterest = Math.max(0, totalPayable - loanAmount);
            const remainingAmount = Math.max(0, (e.tenure - e.paid) * e.monthly);
            const isCompleted = e.paid >= e.tenure;
            const overdue = !isCompleted && new Date(e.due) < new Date();

            return (
              <Card key={e._id} className="glass shadow-elegant p-5 animate-fade-in group relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{e.truck}</p>
                      <p className="text-xs text-muted-foreground">{e.lender}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={
                      isCompleted ? "bg-success/15 text-success border-success/30" 
                      : overdue ? "bg-destructive/15 text-destructive border-destructive/30 animate-pulse-glow" 
                      : "bg-secondary/15 text-secondary border-secondary/30"
                    }>
                      {isCompleted ? "Completed" : overdue ? "Overdue" : "On track"}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-[10px] text-destructive opacity-100 md:opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to delete this loan record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the loan record for {e.truck}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(e._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative">
                    <Ring pct={pct} />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct}%</span>
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Principal</span><span className="font-semibold">{formatINR(loanAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Interest ({e.interestRate || 0}%)</span><span className="font-semibold text-destructive">+{formatINR(totalInterest)}</span></div>
                    <div className="flex justify-between border-t border-border/40 pt-1 mt-1"><span className="text-muted-foreground">Total Payable</span><span className="font-semibold">{formatINR(totalPayable)}</span></div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-4">
                  <div className="rounded-md bg-muted/30 p-2"><p className="text-muted-foreground">Monthly EMI</p><p className="font-semibold text-sm mt-0.5">{formatINR(e.monthly)}</p></div>
                  <div className="rounded-md bg-muted/30 p-2"><p className="text-muted-foreground">Next Due</p><p className="font-semibold text-sm mt-0.5">{isCompleted ? "Completed" : e.due}</p></div>
                  <div className="rounded-md bg-muted/30 p-2"><p className="text-muted-foreground">Paid</p><p className="font-semibold text-sm mt-0.5">{e.paid} / {e.tenure} mo</p></div>
                  <div className="rounded-md bg-muted/30 p-2 border-l-2 border-primary/50 bg-primary/5"><p className="text-muted-foreground">Remaining</p><p className="font-bold text-primary text-sm mt-0.5">{formatINR(remainingAmount)}</p></div>
                </div>
                
                {!isCompleted && (
                  <div className="mt-4 border-t border-border/40 pt-4">
                    <Button 
                      onClick={() => onPayEmi(e._id, e.paid, e.due)} 
                      variant="outline" 
                      className="w-full bg-success/5 hover:bg-success/15 text-success border-success/20 transition-all"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Record EMI Payment
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
