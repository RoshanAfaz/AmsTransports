import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { 
  Bell, Search, Moon, Sun, Globe, HelpCircle, 
  BookOpen, Truck, Fuel, TrendingUp, Sparkles, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Topbar() {
  const [dark, setDark] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const langCode = language === "English" ? "EN" : language === "தமிழ்" ? "TA" : "HI";

  const toggleLanguage = () => {
    if (language === "English") {
      setLanguage("தமிழ்");
    } else if (language === "தமிழ்") {
      setLanguage("हिन्दी");
    } else {
      setLanguage("English");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl">
      <SidebarTrigger className="text-foreground" />
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t("Search trucks, drivers, trips…")} className="h-9 pl-9 bg-muted/40 border-border" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        
        {/* Onboarding / User Guide Modal Button */}
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title={t("Help & User Guide")}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-background border border-border/80 p-0 overflow-hidden rounded-2xl">
            <div className="flex flex-col md:flex-row h-[500px]">
              
              {/* Sidebar Tabs */}
              <div className="w-full md:w-[220px] bg-muted/30 border-r border-border/60 p-4 flex flex-col gap-1 shrink-0">
                <div className="mb-4 px-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("User Manual")}</h3>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">{t("AMS Transports Guide")}</p>
                </div>
                
                <button
                  onClick={() => setActiveTab("welcome")}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    activeTab === "welcome" 
                      ? "bg-accent/15 text-accent border border-accent/25" 
                      : "text-muted-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{t("Welcome Hub")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("trips")}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    activeTab === "trips" 
                      ? "bg-accent/15 text-accent border border-accent/25" 
                      : "text-muted-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span>{t("Trip Memos (PDF)")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("fleet")}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    activeTab === "fleet" 
                      ? "bg-accent/15 text-accent border border-accent/25" 
                      : "text-muted-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>{t("Fleet & Maintenance")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("diesel")}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    activeTab === "diesel" 
                      ? "bg-accent/15 text-accent border border-accent/25" 
                      : "text-muted-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <Fuel className="h-4 w-4 shrink-0" />
                  <span>{t("Diesel & Tyres")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("profit")}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    activeTab === "profit" 
                      ? "bg-accent/15 text-accent border border-accent/25" 
                      : "text-muted-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  <span>{t("Analytics & Reports")}</span>
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="flex-1 p-6 overflow-y-auto bg-background/50 flex flex-col justify-between">
                <div>
                  {activeTab === "welcome" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <h2 className="text-lg font-bold text-foreground">Welcome to AMS Transports Command Center! 🚀</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          This platform manages daily transport logistics, tracks operational costs, manages vehicle service status, and analyzes freight business profits.
                        </p>
                      </div>
                      
                      <div className="border border-border/50 bg-muted/20 rounded-xl p-3.5 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" /> Quick Keyboard Reference
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                          <li><strong>Search Box</strong>: Look up trucks, drivers or route points globally at the top bar.</li>
                          <li><strong>Language selector ({langCode})</strong>: Toggle language between English, Tamil, and Hindi.</li>
                          <li><strong>Night Mode</strong>: Switch between Dark/Light themes using the Sun/Moon toggle.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === "trips" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <h2 className="text-lg font-bold text-[#38bdf8]">Digital Trip Memos & Invoices 📄</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Digitize daily operations. No more paper memo books or manual diaries.
                        </p>
                      </div>
                      <div className="space-y-3 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-[10px] shrink-0 mt-0.5">1</span>
                          <p><strong>Create Trip Memo</strong>: Input truck, driver, destination, and freight revenue. Select status as <em>Running</em> or <em>Completed</em>.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-[10px] shrink-0 mt-0.5">2</span>
                          <p><strong>Track expenses</strong>: Record diesel rate, litres, toll charges, driver bata, loading costs, and wayside repairs.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-[10px] shrink-0 mt-0.5">3</span>
                          <p><strong>Finish & PDF Download</strong>: Click <em>Finish Trip</em>, input closing odometer km. Get calculated fuel mileage, net memo profit, and download a stamp-verified PDF invoice statement instantly.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "fleet" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <h2 className="text-lg font-bold text-[#34d399]">Fleet Control & Vehicle Maintenance 🛠️</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Keep your vehicles active and reduce breakdown costs with proper health tracking.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div className="border border-border/40 p-3 rounded-xl bg-muted/10 space-y-1">
                          <h4 className="font-semibold text-foreground">Fleet Module</h4>
                          <p>Track truck models, purchase price, insurance details, fitness certificates, and driver assignments.</p>
                        </div>
                        <div className="border border-border/40 p-3 rounded-xl bg-muted/10 space-y-1">
                          <h4 className="font-semibold text-foreground">Garage & Maintenance</h4>
                          <p>Issue service cards, monitor labour/parts costs, track wayside breakdowns, and set next-service alerts.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "diesel" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <h2 className="text-lg font-bold text-accent">Diesel Management & Tyre Tracking ⛽</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Control your biggest operational cost centers.
                        </p>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                        <li><strong>Diesel Fuel Logs</strong>: Log fuel fills by rate and quantity. Review consumption trends to audit driver/truck performance.</li>
                        <li><strong>Tyre Life Tracker</strong>: Track installation dates, cost, odometer run, and visual health percentages. Receive replacement warnings before tyres blow out.</li>
                      </ul>
                    </div>
                  )}

                  {activeTab === "profit" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <h2 className="text-lg font-bold text-foreground">Profitability & EMI Management 📈</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Review company financial health with charts and generate business statement sheets.
                        </p>
                      </div>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p><strong>P&L Analyzer</strong>: Review monthly income vs expenses, diesel spend ratios, and driver salary structures.</p>
                        <p><strong>EMI Calendar</strong>: Monitor truck loan payments, lenders, tenure completed, and upcoming installment alert dates.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-border/40 mt-4">
                  <Button
                    onClick={() => setHelpOpen(false)}
                    className="bg-primary text-primary-foreground font-semibold px-4 h-9 text-xs rounded-xl"
                  >
                    {t("Got It, Let's Go!")}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDark(!dark)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
          AM
        </div>
      </div>
    </header>
  );
}
