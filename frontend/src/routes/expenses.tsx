import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/mock-data";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiGet, apiPost } from "@/lib/api-fetch";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, PiggyBank, Trash2 } from "lucide-react";
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

export const getExpensesData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/expenses");
});

export const addExpenseAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as Record<string, any>)
  .handler(async ({ data }) => {
    return apiPost("/api/expenses", data);
  });

export const deleteExpenseAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data as { _id: string })
  .handler(async ({ data }) => {
    return apiPost("/api/expenses/delete", { id: data._id });
  });

import { swrLoader } from "@/lib/query-loader";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Expenses — AMS Transports" }, { name: "description", content: "All business expenses, categorized and filterable." }] }),
  loader: ({ context: { queryClient } }) => 
    swrLoader({ queryClient, queryKey: ["expenses"], queryFn: getExpensesData }),
  component: Expenses,
});

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-primary)", "var(--color-accent)", "var(--color-success)"];
const tooltipStyle = { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: "12px", fontSize: "12px" };

function Expenses() {
  const { expenses, expenseBreakdown, trucks } = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function onDeleteExpense(id: string) {
    try {
      await deleteExpenseAction({ data: { _id: id } });
      toast.success("Expense deleted successfully");
      router.invalidate();
    } catch {
      toast.error("Failed to delete expense");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await addExpenseAction({ data });
      toast.success("Expense recorded successfully");
      setOpen(false);
      router.invalidate();
    } catch (error) {
      toast.error("Failed to add expense");
    }
  }

  const addAction = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90 shadow-accent">
          <Plus className="mr-1 h-4 w-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Record New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
          
          <div className="space-y-2">
            <Label className="text-xs">Date</Label>
            <Input name="date" type="date" className="bg-muted/40" required />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Category</Label>
            <Select name="category" required>
              <SelectTrigger className="bg-muted/40 h-9">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Fuel">Fuel</SelectItem>
                <SelectItem value="EMI">EMI</SelectItem>
                <SelectItem value="Salary">Salary</SelectItem>
                <SelectItem value="Permit">Permit</SelectItem>
                <SelectItem value="Toll">Toll</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Truck Association (Optional)</Label>
            <Select name="truck" defaultValue="none">
              <SelectTrigger className="bg-muted/40 h-9">
                <SelectValue placeholder="Select truck" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General / No Truck</SelectItem>
                {trucks.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Amount (₹)</Label>
            <Input name="amount" type="number" placeholder="5000" className="bg-muted/40" required />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Note</Label>
            <Input name="note" placeholder="e.g., Engine oil change, driver advance" className="bg-muted/40" />
          </div>

          <div className="flex justify-end mt-4">
            <Button type="submit" className="bg-primary text-primary-foreground">Save Expense</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Category-wise spending intelligence" action={addAction} />
      
      <Card className="glass shadow-elegant p-5">
        <h3 className="text-base font-semibold">Spend by Category</h3>
        <p className="mb-4 text-xs text-muted-foreground">Current month</p>
        <div className="h-72">
          {expenseBreakdown.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed border-border/60 rounded-xl">
              <PiggyBank className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm">No expenses recorded yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {expenseBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="glass shadow-elegant mt-6 p-5">
        <h3 className="text-base font-semibold">Recent Expenses</h3>
        <div className="mt-4 overflow-x-auto">
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No recent transactions. Click "Add Expense" to record one.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 pr-4 font-medium">Category</th>
                  <th className="py-3 pr-4 font-medium">Truck</th>
                  <th className="py-3 pr-4 font-medium">Note</th>
                  <th className="py-3 pr-4 font-medium text-right">Amount</th>
                  <th className="py-3 pl-4 font-medium text-right w-16"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e: any) => (
                  <tr key={e._id} className="border-b border-border/40 hover:bg-muted/40 group">
                    <td className="py-3 pr-4 text-muted-foreground">{e.date || "N/A"}</td>
                    <td className="py-3 pr-4"><Badge variant="outline" className="border-border bg-muted/40">{e.category}</Badge></td>
                    <td className="py-3 pr-4 font-mono text-xs">{e.truck || "N/A"}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{e.note}</td>
                    <td className="py-3 pr-4 text-right font-semibold">{formatINR(e.amount)}</td>
                    <td className="py-3 pl-4 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 opacity-100 md:opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this expense record for {formatINR(e.amount)} ({e.category})? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteExpense(e._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
