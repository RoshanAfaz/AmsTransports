import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api-fetch";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Image } from "lucide-react";
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

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — AMS Transports" }, { name: "description", content: "Company, theme, language and system preferences." }] }),
  loader: async () => {
    const settings = await getSettingsAction();
    return { settings };
  },
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
  const [bgInput, setBgInput] = useState(typeof window !== "undefined" ? (localStorage.getItem("ams_bg_image") || "") : "");

  function handleBgSave(url: string) {
    console.log("DEBUG: handleBgSave called with url:", url ? url.slice(0, 50) + "..." : null);
    if (!url) {
      localStorage.removeItem("ams_bg_image");
      setBgInput("");
      toast.success("Background reset to default!");
    } else {
      localStorage.setItem("ams_bg_image", url);
      setBgInput(url);
      toast.success("Background image updated!");
    }
    console.log("DEBUG: Dispatching ams_bg_image_changed event on window");
    window.dispatchEvent(new Event("ams_bg_image_changed"));
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Please select an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        handleBgSave(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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

        <Card className="glass shadow-elegant p-5 animate-fade-in flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image className="h-5 w-5 text-accent" />
              <h3 className="text-base font-semibold">{t("Background Image")}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {t("Paste any image URL or select from our curated high-quality presets to set a custom system background.")}
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bg-url-input" className="text-xs font-semibold">{t("Custom Image URL")}</Label>
                <Input
                  id="bg-url-input"
                  placeholder="https://example.com/image.jpg"
                  value={bgInput}
                  onChange={(e) => setBgInput(e.target.value)}
                  className="bg-muted/40 h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bg-file-input" className="text-xs font-semibold">{t("Upload from Device")}</Label>
                <Input
                  id="bg-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-muted/40 h-9 p-1 cursor-pointer text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t("Curated Presets")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: t("Cyber Highway"), url: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=1000&auto=format&fit=crop" },
                    { name: t("Starry Sky"), url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1000&auto=format&fit=crop" },
                    { name: t("Neon City"), url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop" }
                  ].map((preset) => (
                    <Button 
                      key={preset.name} 
                      variant="outline" 
                      size="sm"
                      className="text-[10px] h-8 truncate px-1 hover:border-accent/40"
                      onClick={() => handleBgSave(preset.url)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => handleBgSave("")}
              className="text-xs h-9"
            >
              {t("Reset Default")}
            </Button>
            <Button 
              onClick={() => handleBgSave(bgInput)}
              className="bg-gradient-accent text-accent-foreground text-xs h-9 min-w-[80px]"
            >
              {t("Apply")}
            </Button>
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
