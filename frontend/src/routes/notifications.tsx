import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { apiGet } from "@/lib/api-fetch";

export const getNotificationsData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/notifications");
});

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — AMS Transports" }, { name: "description", content: "All alerts and system notifications." }] }),
  loader: () => getNotificationsData(),
  component: Notifications,
});

const cfg = {
  danger: { Icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  warning: { Icon: AlertTriangle, color: "text-warning-foreground", bg: "bg-warning/10 border-warning/30" },
  info: { Icon: Info, color: "text-secondary", bg: "bg-secondary/10 border-secondary/30" },
};

function Notifications() {
  const notifications = Route.useLoaderData();
  return (
    <div>
      <PageHeader title="Notification Center" subtitle="Stay ahead of every deadline" action={<></>} />
      <div className="space-y-3">
        {notifications.map((n) => {
          const c = cfg[n.type as keyof typeof cfg];
          return (
            <Card key={n.id} className={`glass shadow-elegant p-4 animate-fade-in border ${c.bg}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background/40 ${c.color}`}>
                  <c.Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{n.title}</p>
                    <Badge variant="outline" className="text-[10px] uppercase">{n.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                </div>
                <span className="text-xs text-muted-foreground">{n.time} ago</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
