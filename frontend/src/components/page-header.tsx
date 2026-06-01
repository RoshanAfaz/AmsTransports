import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t(title)}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{t(subtitle)}</p>}
      </div>
      {action ?? (
        <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90 shadow-accent">
          <Plus className="mr-1 h-4 w-4" /> {t("New")}
        </Button>
      )}
    </div>
  );
}
