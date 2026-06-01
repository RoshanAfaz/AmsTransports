export type TruckStatus = "Active" | "Running" | "Maintenance" | "Breakdown" | "Idle";

export const trucks = [
  { id: "TN01AB1234", model: "Tata LPT 3118", reg: "TN-01-AB-1234", insurance: "2026-03-12", permit: "2026-08-05", fitness: "2026-12-01", purchase: 3200000, driver: "Ramesh K.", mileage: 4.2, status: "Running" as TruckStatus, profit: 142000 },
  { id: "TN09CD5678", model: "Ashok Leyland 2820", reg: "TN-09-CD-5678", insurance: "2026-01-22", permit: "2025-12-18", fitness: "2026-06-10", purchase: 2950000, driver: "Suresh M.", mileage: 4.5, status: "Active" as TruckStatus, profit: 128500 },
  { id: "KA05EF9012", model: "BharatBenz 3523", reg: "KA-05-EF-9012", insurance: "2026-07-30", permit: "2026-04-15", fitness: "2027-01-22", purchase: 4100000, driver: "Vikram S.", mileage: 4.8, status: "Active" as TruckStatus, profit: 165000 },
  { id: "TN22GH3456", model: "Tata Signa 4825", reg: "TN-22-GH-3456", insurance: "2025-11-10", permit: "2026-02-28", fitness: "2026-09-14", purchase: 3850000, driver: "Karthik R.", mileage: 4.1, status: "Maintenance" as TruckStatus, profit: 89000 },
  { id: "AP07IJ7890", model: "Eicher Pro 6028", reg: "AP-07-IJ-7890", insurance: "2026-05-05", permit: "2026-06-20", fitness: "2026-11-30", purchase: 3500000, driver: "Mohan L.", mileage: 4.6, status: "Running" as TruckStatus, profit: 134000 },
  { id: "TN18KL2345", model: "Tata LPT 4225", reg: "TN-18-KL-2345", insurance: "2026-09-18", permit: "2026-03-10", fitness: "2027-02-08", purchase: 3650000, driver: "Anand P.", mileage: 4.3, status: "Idle" as TruckStatus, profit: 76000 },
  { id: "TN33MN6789", model: "BharatBenz 2823", reg: "TN-33-MN-6789", insurance: "2026-04-25", permit: "2026-07-12", fitness: "2026-10-05", purchase: 3950000, driver: "Vacant", mileage: 0, status: "Breakdown" as TruckStatus, profit: -22000 },
  { id: "KA12OP0123", model: "Ashok Leyland 3520", reg: "KA-12-OP-0123", insurance: "2026-02-14", permit: "2026-05-22", fitness: "2026-08-19", purchase: 3300000, driver: "Selvam V.", mileage: 4.4, status: "Running" as TruckStatus, profit: 118000 },
];

export const drivers = [
  { id: 1, name: "Ramesh Kumar", phone: "+91 98765 43210", license: "TN0120190001234", salary: 32000, advance: 5000, truck: "TN01AB1234", trips: 42, score: 92 },
  { id: 2, name: "Suresh Murugan", phone: "+91 98432 11234", license: "TN0920180005678", salary: 30000, advance: 0, truck: "TN09CD5678", trips: 38, score: 88 },
  { id: 3, name: "Vikram Singh", phone: "+91 99876 54321", license: "KA0520170009012", salary: 35000, advance: 8000, truck: "KA05EF9012", trips: 51, score: 95 },
  { id: 4, name: "Karthik Raja", phone: "+91 97654 32109", license: "TN2220200003456", salary: 28000, advance: 3000, truck: "TN22GH3456", trips: 29, score: 78 },
  { id: 5, name: "Mohan Lal", phone: "+91 98123 45678", license: "AP0720190007890", salary: 31000, advance: 0, truck: "AP07IJ7890", trips: 45, score: 90 },
  { id: 6, name: "Anand Pillai", phone: "+91 96543 21098", license: "TN1820180002345", salary: 29000, advance: 2000, truck: "TN18KL2345", trips: 33, score: 82 },
  { id: 7, name: "Selvam Velu", phone: "+91 94321 09876", license: "KA1220200000123", salary: 30000, advance: 6000, truck: "KA12OP0123", trips: 40, score: 86 },
];

export const trips = [
  { id: "TR-2025-1042", truck: "TN01AB1234", driver: "Ramesh K.", source: "Chennai", destination: "Bengaluru", distance: 348, load: "Auto parts • 18T", revenue: 42000, diesel: 18200, toll: 2400, bata: 1500, misc: 800, status: "Completed", date: "2026-05-12" },
  { id: "TR-2025-1043", truck: "KA05EF9012", driver: "Vikram S.", source: "Bengaluru", destination: "Hyderabad", distance: 575, load: "Textiles • 22T", revenue: 68000, diesel: 28500, toll: 3800, bata: 2200, misc: 1200, status: "Running", date: "2026-05-17" },
  { id: "TR-2025-1044", truck: "TN09CD5678", driver: "Suresh M.", source: "Coimbatore", destination: "Kochi", distance: 192, load: "FMCG • 16T", revenue: 28000, diesel: 9800, toll: 1100, bata: 900, misc: 400, status: "Completed", date: "2026-05-15" },
  { id: "TR-2025-1045", truck: "AP07IJ7890", driver: "Mohan L.", source: "Vizag", destination: "Chennai", distance: 798, load: "Steel coils • 25T", revenue: 92000, diesel: 38400, toll: 5200, bata: 3000, misc: 1800, status: "Running", date: "2026-05-18" },
  { id: "TR-2025-1046", truck: "KA12OP0123", driver: "Selvam V.", source: "Mangalore", destination: "Mumbai", distance: 1015, load: "Cashew • 20T", revenue: 118000, diesel: 49500, toll: 7200, bata: 4000, misc: 2200, status: "Completed", date: "2026-05-10" },
  { id: "TR-2025-1047", truck: "TN18KL2345", driver: "Anand P.", source: "Madurai", destination: "Pune", distance: 1180, load: "Cotton • 24T", revenue: 132000, diesel: 56800, toll: 8400, bata: 4500, misc: 2600, status: "Pending", date: "2026-05-19" },
];

export const monthlyData = [
  { month: "Jan", revenue: 820000, expense: 540000, profit: 280000, diesel: 320000 },
  { month: "Feb", revenue: 750000, expense: 510000, profit: 240000, diesel: 295000 },
  { month: "Mar", revenue: 910000, expense: 580000, profit: 330000, diesel: 348000 },
  { month: "Apr", revenue: 880000, expense: 565000, profit: 315000, diesel: 335000 },
  { month: "May", revenue: 1020000, expense: 640000, profit: 380000, diesel: 388000 },
  { month: "Jun", revenue: 960000, expense: 605000, profit: 355000, diesel: 365000 },
  { month: "Jul", revenue: 1080000, expense: 680000, profit: 400000, diesel: 410000 },
  { month: "Aug", revenue: 1140000, expense: 710000, profit: 430000, diesel: 432000 },
  { month: "Sep", revenue: 1050000, expense: 665000, profit: 385000, diesel: 398000 },
  { month: "Oct", revenue: 1190000, expense: 735000, profit: 455000, diesel: 445000 },
  { month: "Nov", revenue: 1220000, expense: 760000, profit: 460000, diesel: 462000 },
  { month: "Dec", revenue: 1340000, expense: 815000, profit: 525000, diesel: 498000 },
];

export const expenseBreakdown = [
  { name: "Diesel", value: 498000 },
  { name: "Driver Salary", value: 215000 },
  { name: "Service", value: 84000 },
  { name: "Tyres", value: 62000 },
  { name: "Toll", value: 48000 },
  { name: "EMI", value: 180000 },
  { name: "Insurance", value: 32000 },
  { name: "Misc", value: 28000 },
];

export const expenses = [
  { id: 1, date: "2026-05-18", category: "Diesel", truck: "AP07IJ7890", amount: 38400, note: "HP Vizag" },
  { id: 2, date: "2026-05-17", category: "Driver Salary", truck: "TN01AB1234", amount: 32000, note: "May payout" },
  { id: 3, date: "2026-05-16", category: "Service", truck: "TN22GH3456", amount: 18500, note: "Brake overhaul" },
  { id: 4, date: "2026-05-15", category: "Tyres", truck: "KA05EF9012", amount: 32000, note: "MRL 2x rear" },
  { id: 5, date: "2026-05-14", category: "Toll", truck: "KA12OP0123", amount: 7200, note: "Mumbai route" },
  { id: 6, date: "2026-05-13", category: "EMI", truck: "TN18KL2345", amount: 45000, note: "HDFC Apr" },
  { id: 7, date: "2026-05-12", category: "Insurance", truck: "TN09CD5678", amount: 28500, note: "Renewal" },
  { id: 8, date: "2026-05-11", category: "Repairs", truck: "TN33MN6789", amount: 24000, note: "Clutch plate" },
];

export const emis = [
  { truck: "TN01AB1234", lender: "HDFC Bank", monthly: 42000, due: "2026-06-05", remaining: 980000, total: 2400000, paid: 30, tenure: 60 },
  { truck: "KA05EF9012", lender: "ICICI Bank", monthly: 48000, due: "2026-06-10", remaining: 1450000, total: 3000000, paid: 18, tenure: 60 },
  { truck: "TN22GH3456", lender: "Sundaram Finance", monthly: 45000, due: "2026-05-28", remaining: 1820000, total: 2800000, paid: 12, tenure: 60 },
  { truck: "AP07IJ7890", lender: "Axis Bank", monthly: 39000, due: "2026-06-15", remaining: 740000, total: 2200000, paid: 36, tenure: 60 },
  { truck: "TN18KL2345", lender: "HDFC Bank", monthly: 44000, due: "2026-06-02", remaining: 1280000, total: 2700000, paid: 24, tenure: 60 },
];

export const tyres = [
  { truck: "TN01AB1234", pos: "Front-L", brand: "MRF Steel Muscle", installed: "2025-11-12", cost: 16500, kmRun: 38200, health: 72 },
  { truck: "TN01AB1234", pos: "Front-R", brand: "MRF Steel Muscle", installed: "2025-11-12", cost: 16500, kmRun: 38200, health: 70 },
  { truck: "KA05EF9012", pos: "Rear-L1", brand: "Apollo Endurace", installed: "2025-08-04", cost: 18200, kmRun: 52400, health: 45 },
  { truck: "KA05EF9012", pos: "Rear-R1", brand: "Apollo Endurace", installed: "2025-08-04", cost: 18200, kmRun: 52400, health: 42 },
  { truck: "AP07IJ7890", pos: "Front-L", brand: "JK Jetway", installed: "2026-02-18", cost: 15800, kmRun: 18900, health: 88 },
  { truck: "TN22GH3456", pos: "Rear-L2", brand: "CEAT Win Energy", installed: "2025-05-22", cost: 17400, kmRun: 68500, health: 22 },
];

export const services = [
  { truck: "TN22GH3456", type: "Engine Overhaul", workshop: "Anand Motors", labour: 12000, parts: 38000, date: "2026-05-16", next: "2026-11-16" },
  { truck: "TN01AB1234", type: "Oil Change", workshop: "Tata Authorised", labour: 1200, parts: 4800, date: "2026-04-22", next: "2026-07-22" },
  { truck: "KA05EF9012", type: "Brake Service", workshop: "Sai Workshop", labour: 3500, parts: 9200, date: "2026-04-10", next: "2026-10-10" },
  { truck: "AP07IJ7890", type: "Battery Replacement", workshop: "Exide Care", labour: 500, parts: 14500, date: "2026-03-28", next: "2027-03-28" },
];

export const notifications = [
  { id: 1, type: "warning", title: "Permit expiring", body: "TN09CD5678 permit expires in 32 days", time: "2h" },
  { id: 2, type: "danger", title: "EMI overdue", body: "TN22GH3456 — Sundaram Finance ₹45,000", time: "1d" },
  { id: 3, type: "info", title: "Service due", body: "TN01AB1234 next service on Jul 22", time: "1d" },
  { id: 4, type: "warning", title: "Tyre health critical", body: "TN22GH3456 Rear-L2 at 22%", time: "2d" },
  { id: 5, type: "danger", title: "Insurance expiring", body: "TN22GH3456 in 14 days", time: "3d" },
  { id: 6, type: "info", title: "Trip completed", body: "TR-2025-1046 Mangalore → Mumbai", time: "4d" },
];

export const truckProfit = trucks.map(t => ({ name: t.id.slice(-4), profit: t.profit }));

export const dieselTrend = monthlyData.map(m => ({ month: m.month, litres: Math.round(m.diesel / 92), cost: m.diesel }));

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
