import { getDb } from "../src/lib/db";
import { drivers, trips, trucks, expenses, expenseBreakdown, monthlyData, dieselTrend, truckProfit, notifications, services, emis, tyres } from "../src/lib/mock-data";

async function seed() {
  console.log("Connecting to MongoDB...");
  const db = await getDb();
  
  console.log("Clearing existing data...");
  await Promise.all([
    db.collection("drivers").deleteMany({}),
    db.collection("trips").deleteMany({}),
    db.collection("trucks").deleteMany({}),
    db.collection("expenses").deleteMany({}),
    db.collection("expenseBreakdown").deleteMany({}),
    db.collection("monthlyData").deleteMany({}),
    db.collection("dieselTrend").deleteMany({}),
    db.collection("truckProfit").deleteMany({}),
    db.collection("notifications").deleteMany({}),
    db.collection("services").deleteMany({}),
    db.collection("emis").deleteMany({}),
    db.collection("tyres").deleteMany({})
  ]);

  console.log("Seeding collections...");
  await Promise.all([
    db.collection("drivers").insertMany(drivers),
    db.collection("trips").insertMany(trips),
    db.collection("trucks").insertMany(trucks),
    db.collection("expenses").insertMany(expenses),
    db.collection("expenseBreakdown").insertMany(expenseBreakdown),
    db.collection("monthlyData").insertMany(monthlyData),
    db.collection("dieselTrend").insertMany(dieselTrend),
    db.collection("truckProfit").insertMany(truckProfit),
    db.collection("notifications").insertMany(notifications),
    db.collection("services").insertMany(services),
    db.collection("emis").insertMany(emis),
    db.collection("tyres").insertMany(tyres)
  ]);

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch(console.error);
