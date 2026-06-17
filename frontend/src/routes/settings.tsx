import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api-fetch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useLanguage, Language } from "@/lib/language-context";
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

export const clearDatabaseAction = createServerFn({ method: "POST" })
  .handler(async () => {
    return apiPost("/api/settings/clear", {});
  });

export const getSettingsAction = createServerFn({ method: "GET" })
  .handler(async () => {
    return apiGet("/api/settings");
  });

export const saveSettingsAction = createServerFn({ method: "POST" })
  .inputValidator((data: any) => data)
  .handler(async ({ data }: { data: any }) => {
    return apiPost("/api/settings", data);
  });

import { swrLoader } from "@/lib/query-loader";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — AMS Transports" }, { name: "description", content: "Company, theme, language and system preferences." }] }),
  loader: ({ context: { queryClient } }) => 
    swrLoader({ 
      queryClient, 
      queryKey: ["settings"], 
      queryFn: async () => {
        const settings = await getSettingsAction();
        return { settings };
      }
    }),
  component: Settings,
});

function Settings() {
  const { settings } = Route.useLoaderData();
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const [businessName, setBusinessName] = useState(settings.businessName || "AMS Transports");
  const [owner, setOwner] = useState(settings.owner || "A. M. Selvam");
  const [gstin, setGstin] = useState(settings.gstin || "33ABCDE1234F1Z5");
  const [headOffice, setHeadOffice] = useState(settings.headOffice || "Chennai, TN");
  const [dieselPrice, setDieselPrice] = useState(settings.dieselPrice || 92.4);


  async function handleClearDatabase() {
    setIsClearing(true);
    try {
      await clearDatabaseAction();
      toast.success("Database cleared successfully!");
      router.invalidate();
    } catch {
      toast.error("Failed to clear database.");
    } finally {
      setIsClearing(false);
    }
  }

  async function handleSaveCompany() {
    setIsSaving(true);
    try {
      await saveSettingsAction({
        data: {
          businessName,
          owner,
          gstin,
          headOffice,
          dieselPrice: Number(dieselPrice)
        }
      });
      toast.success("Company settings saved!");
      router.invalidate();
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("Settings")} subtitle={t("Tune AMS Transports to your operations") || "Tune AMS Transports to your operations"} action={<></>} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass shadow-elegant p-5 animate-fade-in flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold">{t("Company")}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <Label>{t("Business name")}</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 bg-muted/40" />
              </div>
              <div>
                <Label>{t("Owner")}</Label>
                <Input value={owner} onChange={(e) => setOwner(e.target.value)} className="mt-1 bg-muted/40" />
              </div>
              <div>
                <Label>{t("GSTIN") || "GSTIN"}</Label>
                <Input value={gstin} onChange={(e) => setGstin(e.target.value)} className="mt-1 bg-muted/40" />
              </div>
              <div>
                <Label>{t("Head Office") || "Head Office"}</Label>
                <Input value={headOffice} onChange={(e) => setHeadOffice(e.target.value)} className="mt-1 bg-muted/40" />
              </div>
              <div>
                <Label>{t("Diesel Price (₹/Litre)")}</Label>
                <Input type="number" step="0.01" value={dieselPrice} onChange={(e) => setDieselPrice(Number(e.target.value))} className="mt-1 bg-muted/40" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveCompany} disabled={isSaving} className="bg-gradient-accent text-accent-foreground min-w-[80px]">
              {isSaving ? t("Saving...") : t("Save")}
            </Button>
          </div>
        </Card>

        <Card className="glass shadow-elegant p-5 animate-fade-in">
          <h3 className="text-base font-semibold">{t("Preferences")}</h3>
          <div className="mt-4 space-y-4">
            {[
              { label: t("Dark mode"), desc: t("Optimised for night operations"), on: true },
              { label: t("Service alerts"), desc: t("Notify upcoming maintenance"), on: true },
              { label: t("EMI reminders"), desc: t("Alert 3 days before due date"), on: true },
              { label: t("Low profit warnings"), desc: t("Flag trips below threshold"), on: false },
              { label: t("Auto cloud backup"), desc: t("Daily backup to MongoDB Atlas"), on: true },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
                <Switch defaultChecked={p.on} />
              </div>
            ))}
          </div>
        </Card>


        <Card className="glass shadow-elegant p-5 animate-fade-in">
          <h3 className="text-base font-semibold">{t("Data & Backup")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("MongoDB Atlas Free Tier · text-only storage") || "MongoDB Atlas Free Tier · text-only storage"}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline">{t("Export all")}</Button>
            <Button variant="outline">{t("Backup now")}</Button>
          </div>
        </Card>

        {/* Danger Zone Card */}
        <Card className="glass shadow-elegant p-5 animate-fade-in lg:col-span-2 border-destructive/20 bg-destructive/5 mt-2">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive animate-pulse-glow rounded-full p-0.5" />
            <h3 className="text-base font-semibold text-destructive">{t("Danger Zone")}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("Wipe all operational data completely. This action cannot be reversed and deletes all vehicles, trips, drivers, loans, and expenses.")}</p>
          <div className="mt-4 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20">
                  {isClearing ? t("Clearing Database...") : t("Delete All System Data")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("Are you absolutely sure?")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("This is a destructive action. This will permanently delete:")}
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>{t("All Fleet vehicles & models")}</li>
                      <li>{t("All Driver profiles & allocations")}</li>
                      <li>{t("All recorded Trips & diesel history")}</li>
                      <li>{t("All Expenses logs & transaction history")}</li>
                      <li>{t("All Services & tyre tracking data")}</li>
                      <li>{t("All Loan & EMI logs")}</li>
                    </ul>
                    {t("This action cannot be undone.")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearDatabase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("Yes, Wipe Database")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      </div>
    </div>
  );
}
