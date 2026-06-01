import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "success" | "destructive" | "warning";
}

const accentMap = {
  primary: "from-primary/20 to-primary/0 text-primary",
  accent: "from-accent/25 to-accent/0 text-accent",
  success: "from-success/20 to-success/0 text-success",
  destructive: "from-destructive/20 to-destructive/0 text-destructive",
  warning: "from-warning/20 to-warning/0 text-warning",
};

export function StatCard({ label, value, delta, icon: Icon, accent = "primary" }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="relative overflow-hidden glass glass-interactive cursor-pointer shadow-elegant animate-fade-in p-5">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${accentMap[accent]} blur-2xl opacity-60`} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
          {delta !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}% vs last month
            </div>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
