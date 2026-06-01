import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, FileSpreadsheet, FileType, Filter } from "lucide-react";
import { useState } from "react";
import { apiGet } from "@/lib/api-fetch";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const getReportsData = createServerFn({ method: "GET" }).handler(async () => {
  return apiGet("/api/reports");
});

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — AMS Transports" }, { name: "description", content: "Generate and export business reports." }] }),
  loader: () => getReportsData(),
  component: Reports,
});

function Reports() {
  const { trips, trucks, expenses, drivers, dieselPrice } = Route.useLoaderData();
  const [vehicle, setVehicle] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filterByDateAndVehicle = (data: any[], dateField: string = "date") => {
    return data.filter((item) => {
      const vMatch = vehicle === "all" || item.truck === vehicle;
      const dateVal = new Date(item[dateField] || Date.now());
      const sMatch = !startDate || dateVal >= new Date(startDate);
      const eMatch = !endDate || dateVal <= new Date(endDate);
      return vMatch && sMatch && eMatch;
    });
  };

  const exportData = (title: string, headers: string[], rows: any[][], format: "pdf" | "excel" | "csv") => {
    if (rows.length === 0) {
      toast.error("No data found for the selected filters.");
      return;
    }

    const filename = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      const csvContent = [headers.join(","), ...rows.map(row => row.map(v => `"${v}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      toast.success("CSV Downloaded!");
    } else if (format === "excel") {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success("Excel Downloaded!");
    } else if (format === "pdf") {
      const doc = new jsPDF("landscape");
      doc.text(title, 14, 15);
      doc.setFontSize(10);
      doc.text(`Vehicle: ${vehicle} | Period: ${startDate || "Any"} to ${endDate || "Any"}`, 14, 22);
      
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [24, 24, 27] } // dark header
      });
      doc.save(`${filename}.pdf`);
      toast.success("PDF Downloaded!");
    }
  };

  const getTripExpenses = (t: any) => {
    return Number(t.diesel || 0) + 
           Number(t.toll || 0) + 
           Number(t.bata || 0) + 
           Number(t.food || 0) + 
           Number(t.parking || 0) + 
           Number(t.loading || 0) + 
           Number(t.rto || 0) + 
           Number(t.puncture || 0) + 
           Number(t.maintenance || 0) + 
           Number(t.misc || 0) + 
           Number(t.customAmount || 0);
  };

  const getTripFuel = (t: any) => {
    const dRate = Number(t.dieselRate || dieselPrice);
    if (t.tripType === "Round") {
      const retRate = Number(t.returnDieselRate || dRate);
      const outLit = Number(t.outwardLitres || 0) || (t.outwardDiesel ? Number(t.outwardDiesel) / dRate : 0);
      const retLit = Number(t.returnLitres || 0) || (t.returnDiesel ? Number(t.returnDiesel) / retRate : 0);
      return {
        litres: outLit + retLit,
        cost: Number(t.outwardDiesel || 0) + Number(t.returnDiesel || 0)
      };
    } else {
      const lit = Number(t.litres || 0) || (t.diesel ? Number(t.diesel) / dRate : 0);
      return {
        litres: lit,
        cost: Number(t.diesel || 0)
      };
    }
  };

  const handleTripReport = (format: "pdf" | "excel" | "csv") => {
    const data = filterByDateAndVehicle(trips, "date");
    const headers = [
      "Trip Memo No", 
      "Date", 
      "Truck", 
      "Driver", 
      "Route", 
      "Distance",
      "Revenue (₹)", 
      "Diesel (₹)", 
      "Tolls (₹)", 
      "Bata (₹)", 
      "Others (₹)", 
      "Total Exp (₹)", 
      "Net Profit (₹)"
    ];
    const rows = data.map(t => {
      const dieselCost = getTripFuel(t).cost;
      const tolls = Number(t.toll || 0);
      const bata = Number(t.bata || 0);
      const totalExp = getTripExpenses(t);
      const others = totalExp - dieselCost - tolls - bata;
      const profit = Number(t.revenue || 0) - totalExp;
      
      return [
        t.memoNo || `TRP${t._id.slice(-6).toUpperCase()}`, 
        t.date || "N/A", 
        t.truck, 
        t.driver, 
        `${t.source} to ${t.destination}`, 
        `${t.distance || 0} km`,
        t.revenue || 0,
        dieselCost,
        tolls,
        bata,
        others,
        totalExp,
        profit
      ];
    });
    exportData("Trip Revenue & Expense Report", headers, rows, format);
  };

  const handleDieselReport = (format: "pdf" | "excel" | "csv") => {
    const data = filterByDateAndVehicle(trips, "date");
    const headers = ["Trip Memo No", "Date", "Truck", "Route", "Distance", "Diesel Cost (₹)", "Mileage (Approx)"];
    const rows = data.map(t => {
      const fuel = getTripFuel(t);
      const mileage = fuel.litres > 0 ? (t.distance / fuel.litres).toFixed(2) : "0.00";
      return [
        t.memoNo || `TRP${t._id.slice(-6).toUpperCase()}`, 
        t.date || "N/A", 
        t.truck, 
        `${t.source} to ${t.destination}`, 
        `${t.distance || 0} km`, 
        fuel.cost, 
        `${mileage} km/L`
      ];
    });
    exportData("Diesel & Mileage Report", headers, rows, format);
  };

  const handleExpenseReport = (format: "pdf" | "excel" | "csv") => {
    const data = filterByDateAndVehicle(expenses, "date");
    const headers = ["Date", "Category", "Truck", "Amount", "Note"];
    const rows = data.map(e => [e.date || "N/A", e.category, e.truck || "N/A", e.amount, e.note || ""]);
    exportData("General Expenses Report", headers, rows, format);
  };

  const handleProfitReport = (format: "pdf" | "excel" | "csv") => {
    const tripData = filterByDateAndVehicle(trips, "date");
    const expData = filterByDateAndVehicle(expenses, "date");
    
    // Group by Truck
    const profitMap: Record<string, { rev: number, exp: number }> = {};
    trucks.forEach((t: any) => { profitMap[t.id] = { rev: 0, exp: 0 }; });
    
    tripData.forEach((t: any) => {
      if (profitMap[t.truck]) {
        profitMap[t.truck].rev += (t.revenue || 0);
        profitMap[t.truck].exp += getTripExpenses(t);
      }
    });
    
    expData.forEach((e: any) => {
      if (e.truck && profitMap[e.truck]) {
        profitMap[e.truck].exp += (e.amount || 0);
      }
    });

    const headers = ["Truck", "Total Revenue", "Total Expenses", "Net Profit", "Margin"];
    const rows = Object.entries(profitMap).map(([truck, stats]) => {
      const profit = stats.rev - stats.exp;
      const margin = stats.rev > 0 ? ((profit / stats.rev) * 100).toFixed(1) + "%" : "0%";
      return [truck, stats.rev, stats.exp, profit, margin];
    });

    exportData("Profit & Loss Report", headers, rows, format);
  };

  const reportsList = [
    { name: "Trip Report", desc: "All trips with revenue and expense breakdown", handler: handleTripReport },
    { name: "Diesel Report", desc: "Fuel consumption and mileage by truck", handler: handleDieselReport },
    { name: "Expense Report", desc: "Categorised business expenses (Maintenance, EMIs, etc)", handler: handleExpenseReport },
    { name: "Profit Report", desc: "P&L summary across the fleet", handler: handleProfitReport },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Professional, printable, exportable" />
      
      {/* Filters */}
      <Card className="glass shadow-elegant p-5 mb-6 animate-fade-in border-accent/20">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent"><Filter className="h-4 w-4" /> Customise Report Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Vehicle</Label>
            <Select value={vehicle} onValueChange={setVehicle}>
              <SelectTrigger className="h-9 bg-muted/40">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fleet</SelectItem>
                {trucks.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.id}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 bg-muted/40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 bg-muted/40" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        {reportsList.map((r) => (
          <Card key={r.name} className="glass shadow-elegant p-5 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button onClick={() => r.handler("pdf")} variant="outline" size="sm" className="gap-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"><FileType className="h-3.5 w-3.5" /> PDF</Button>
              <Button onClick={() => r.handler("excel")} variant="outline" size="sm" className="gap-1 hover:bg-success/10 hover:text-success hover:border-success/30 transition-colors"><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</Button>
              <Button onClick={() => r.handler("csv")} variant="outline" size="sm" className="gap-1 hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-colors"><Download className="h-3.5 w-3.5" /> CSV</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
