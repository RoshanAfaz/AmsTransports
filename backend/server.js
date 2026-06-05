import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);
let db;

async function getDb() {
  if (!db) {
    await client.connect();
    db = client.db("ams_transports");
  }
  return db;
}

function getTripExpenses(t) {
  return (t.diesel || 0) +
         (t.toll || 0) +
         (t.bata || 0) +
         (t.food || 0) +
         (t.parking || 0) +
         (t.loading || 0) +
         (t.rto || 0) +
         (t.puncture || 0) +
         (t.maintenance || 0) +
         (t.misc || 0) +
         (t.customAmount || 0);
}

// 1. Dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const database = await getDb();
    const [
      trips, notifications, trucks, drivers, services, emis, expenses, settingsDoc
    ] = await Promise.all([
      database.collection("trips").find({}).sort({ _id: -1 }).toArray(),
      database.collection("notifications").find({}).toArray(),
      database.collection("trucks").find({}).toArray(),
      database.collection("drivers").find({}).toArray(),
      database.collection("services").find({}).toArray(),
      database.collection("emis").find({}).toArray(),
      database.collection("expenses").find({}).toArray(),
      database.collection("settings").findOne({ id: "global" })
    ]);

    const businessName = (settingsDoc?.businessName) || "AMS Transports";
    const totalTrucks = trucks.length;
    const runningTrips = trips.filter(t => t.status === "Running").length;
    
    const totalRevenue = trips.reduce((s, t) => s + (t.revenue || 0), 0);
    const tripExpenses = trips.reduce((s, t) => s + getTripExpenses(t), 0);
    const serviceExpenses = services.reduce((s, x) => s + (x.labour || 0) + (x.parts || 0), 0);
    const emiPaid = emis.reduce((s, x) => s + ((x.monthly || 0) * (x.paid || 0)), 0);
    
    const generalExpensesSum = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalExpenses = tripExpenses + serviceExpenses + emiPaid + generalExpensesSum;
    const netProfit = totalRevenue - totalExpenses;
    const dieselSpend = trips.reduce((s, t) => s + (t.diesel || 0), 0);
    
    const pendingEmiTotal = emis.filter(e => e.paid < e.tenure).reduce((s, e) => s + (e.monthly * (e.tenure - e.paid)), 0);
    const activeDrivers = drivers.filter(d => d.truck && d.truck !== "Unassigned" && d.truck !== "Vacant").length;
    const inMaintenance = trucks.filter(t => t.status === "Maintenance" || t.status === "Breakdown").length;

    // 1. Calculate dynamic monthly data
    const monthlyMap = {};
    trips.forEach(t => {
      if (!t.date) return;
      const dateObj = new Date(t.date);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      if (!monthlyMap[monthStr]) monthlyMap[monthStr] = { month: monthStr, revenue: 0, expense: 0, profit: 0 };
      monthlyMap[monthStr].revenue += t.revenue || 0;
      monthlyMap[monthStr].expense += getTripExpenses(t);
    });

    services.forEach(s => {
      if (!s.date) return;
      const dateObj = new Date(s.date);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      if (!monthlyMap[monthStr]) monthlyMap[monthStr] = { month: monthStr, revenue: 0, expense: 0, profit: 0 };
      monthlyMap[monthStr].expense += (s.labour || 0) + (s.parts || 0);
    });

    expenses.forEach(e => {
      if (!e.date) return;
      const dateObj = new Date(e.date);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      if (!monthlyMap[monthStr]) monthlyMap[monthStr] = { month: monthStr, revenue: 0, expense: 0, profit: 0 };
      monthlyMap[monthStr].expense += e.amount || 0;
    });

    Object.keys(monthlyMap).forEach(k => {
      monthlyMap[k].profit = monthlyMap[k].revenue - monthlyMap[k].expense;
    });

    const monthlyData = Object.values(monthlyMap);

    // 2. Calculate dynamic expense breakdown
    const generalCategories = {};
    expenses.forEach(e => {
      generalCategories[e.category] = (generalCategories[e.category] || 0) + (e.amount || 0);
    });

    const breakdownMap = {
      "Fuel (Diesel)": dieselSpend + (generalCategories["Fuel"] || 0),
      "Maintenance": serviceExpenses + (generalCategories["Maintenance"] || 0),
      "Tolls & Bata": trips.reduce((s, t) => s + (t.toll || 0) + (t.bata || 0) + (t.food || 0) + (t.parking || 0), 0),
      "EMI Payments": emiPaid + (generalCategories["EMI"] || 0),
      "Salaries & advance": generalCategories["Salary"] || 0,
      "Others": trips.reduce((s, t) => s + (t.misc || 0) + (t.customAmount || 0) + (t.loading || 0) + (t.rto || 0) + (t.puncture || 0) + (t.maintenance || 0), 0) + (generalCategories["Others"] || generalCategories["Permit"] || 0)
    };

    const expenseBreakdown = Object.entries(breakdownMap)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    // 3. Calculate dynamic truck-wise profit
    const truckProfitMap = {};
    trucks.forEach(t => {
      truckProfitMap[t.id] = 0;
    });
    trips.forEach(t => {
      if (!t.truck) return;
      const rev = t.revenue || 0;
      const exp = getTripExpenses(t);
      truckProfitMap[t.truck] = (truckProfitMap[t.truck] || 0) + (rev - exp);
    });
    services.forEach(s => {
      if (!s.truck) return;
      truckProfitMap[s.truck] = (truckProfitMap[s.truck] || 0) - ((s.labour || 0) + (s.parts || 0));
    });
    emis.forEach(e => {
      if (!e.truck) return;
      truckProfitMap[e.truck] = (truckProfitMap[e.truck] || 0) - ((e.monthly || 0) * (e.paid || 0));
    });
    const truckProfit = Object.entries(truckProfitMap).map(([name, profit]) => ({ name, profit }));

    // 4. Calculate dynamic diesel trend
    const dieselMap = {};
    trips.forEach(t => {
      if (!t.date || !t.dieselLitres) return;
      const dateObj = new Date(t.date);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      if (!dieselMap[monthStr]) dieselMap[monthStr] = { month: monthStr, litres: 0 };
      dieselMap[monthStr].litres += Number(t.dieselLitres || 0);
    });
    const dieselTrend = Object.values(dieselMap);

    res.json({
      businessName,
      monthlyData,
      expenseBreakdown,
      truckProfit,
      trips: trips.map(d => ({ ...d, _id: d._id.toString() })),
      dieselTrend,
      notifications: notifications.map(d => ({ ...d, _id: d._id.toString() })),
      stats: {
        totalTrucks, runningTrips, netProfit, totalExpenses, dieselSpend, pendingEmiTotal, activeDrivers, inMaintenance
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fleet
app.get('/api/fleet', async (req, res) => {
  try {
    const database = await getDb();
    const settings = await database.collection("settings").findOne({ id: "global" });
    const dieselPrice = Number(settings?.dieselPrice || 92.4);

    const trucks = await database.collection("trucks").find({}).toArray();
    const trips = await database.collection("trips").find({}).toArray();
    const services = await database.collection("services").find({}).toArray();
    const emis = await database.collection("emis").find({}).toArray();
    const drivers = await database.collection("drivers").find({}).toArray();

    const enrichedTrucks = trucks.map(t => {
      const tTrips = trips.filter(tr => tr.truck === t.id);
      const tServices = services.filter(s => s.truck === t.id);
      const tEmis = emis.filter(e => e.truck === t.id);

      const tripRev = tTrips.reduce((s, tr) => s + (tr.revenue || 0), 0);
      const tripExp = tTrips.reduce((s, tr) => s + getTripExpenses(tr), 0);
      const servExp = tServices.reduce((s, x) => s + (x.labour || 0) + (x.parts || 0), 0);
      const emiExp = tEmis.reduce((s, x) => s + ((x.monthly || 0) * (x.paid || 0)), 0);
      const profit = tripRev - (tripExp + servExp + emiExp);
      
      let totalDist = 0;
      let totalDieselLitres = 0;
      tTrips.filter(tr => tr.status === "Completed").forEach(tr => {
        const dRate = Number(tr.dieselRate || dieselPrice);
        if (tr.tripType === "Round") {
          const outDist = Math.max(0, Number(tr.outwardClosingKm || 0) - Number(tr.outwardOpeningKm || 0));
          const retDist = Math.max(0, Number(tr.returnClosingKm || 0) - Number(tr.returnOpeningKm || 0));
          totalDist += outDist + retDist;
          const retRate = Number(tr.returnDieselRate || dRate);
          totalDieselLitres += Number(tr.outwardLitres || 0) || (tr.outwardDiesel ? Number(tr.outwardDiesel) / dRate : 0);
          totalDieselLitres += Number(tr.returnLitres || 0) || (tr.returnDiesel ? Number(tr.returnDiesel) / retRate : 0);
        } else {
          const dist = Math.max(0, Number(tr.closingKm || 0) - Number(tr.openingKm || 0));
          totalDist += dist;
          totalDieselLitres += Number(tr.litres || 0) || (tr.diesel ? Number(tr.diesel) / dRate : 0);
        }
      });
      const mileage = totalDieselLitres > 0 ? Number((totalDist / totalDieselLitres).toFixed(2)) : (t.mileage || 0);

      return { ...t, _id: t._id.toString(), profit, mileage };
    });

    res.json({
      trucks: enrichedTrucks,
      drivers: drivers.map(d => ({ ...d, _id: d._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to dynamically update truck mileage and current odometer
async function updateTruckStats(database, truckId) {
  const truck = await database.collection("trucks").findOne({ id: truckId });
  if (!truck) return;

  const settings = await database.collection("settings").findOne({ id: "global" });
  const dieselPrice = Number(settings?.dieselPrice || 92.4);

  const trips = await database.collection("trips").find({ truck: truckId }).toArray();
  const completedTrips = trips.filter(t => t.status === "Completed");

  let maxKm = Number(truck.openingKm || 0);
  let totalDistance = 0;
  let totalLitres = 0;

  completedTrips.forEach(t => {
    const dRate = Number(t.dieselRate || dieselPrice);
    if (t.tripType === "Round") {
      const outDist = Math.max(0, Number(t.outwardClosingKm || 0) - Number(t.outwardOpeningKm || 0));
      const retDist = Math.max(0, Number(t.returnClosingKm || 0) - Number(t.returnOpeningKm || 0));
      totalDistance += outDist + retDist;

      const retRate = Number(t.returnDieselRate || dRate);
      const outLit = Number(t.outwardLitres || 0) || (t.outwardDiesel ? Number(t.outwardDiesel) / dRate : 0);
      const retLit = Number(t.returnLitres || 0) || (t.returnDiesel ? Number(t.returnDiesel) / retRate : 0);
      totalLitres += outLit + retLit;

      const closing = Number(t.returnClosingKm || t.outwardClosingKm || 0);
      if (closing > maxKm) maxKm = closing;
    } else {
      const dist = Math.max(0, Number(t.closingKm || 0) - Number(t.openingKm || 0));
      totalDistance += dist;

      const lit = Number(t.litres || 0) || (t.diesel ? Number(t.diesel) / dRate : 0);
      totalLitres += lit;

      const closing = Number(t.closingKm || 0);
      if (closing > maxKm) maxKm = closing;
    }
  });

  const avgMileage = totalLitres > 0 ? Number((totalDistance / totalLitres).toFixed(2)) : 0;

  await database.collection("trucks").updateOne(
    { id: truckId },
    { 
      $set: { 
        currentKm: maxKm,
        mileage: avgMileage
      } 
    }
  );
}

app.post('/api/fleet', async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    const driverName = data.driver || "Vacant";

    const openingKm = Number(data.openingKm || 0);
    const chassisCost = Number(data.chassisCost || 0);
    const bodyCost = Number(data.bodyCost || 0);
    const loanAmount = Number(data.loanAmount || 0);
    const purchaseVal = (chassisCost || bodyCost) ? (chassisCost + bodyCost) : Number(data.purchase || 0);

    await database.collection("trucks").insertOne({
      id: data.id,
      model: data.model,
      reg: data.reg,
      insurance: data.insurance || "N/A",
      permit: data.permit || "N/A",
      fitness: data.fitness || "N/A",
      purchase: purchaseVal,
      chassisCost: chassisCost || purchaseVal,
      bodyCost: bodyCost,
      loanAmount: loanAmount,
      openingKm: openingKm,
      currentKm: openingKm,
      driver: driverName,
      mileage: 0,
      status: "Idle",
      profit: 0
    });

    if (driverName !== "Vacant") {
      await database.collection("drivers").updateOne(
        { name: driverName },
        { $set: { truck: data.id } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fleet/edit', async (req, res) => {
  try {
    const database = await getDb();
    const { _id, ...updateData } = req.body;
    const driverName = updateData.driver || "Vacant";

    const oldTruck = await database.collection("trucks").findOne({ _id: new ObjectId(_id) });

    const chassisCost = Number(updateData.chassisCost || 0);
    const bodyCost = Number(updateData.bodyCost || 0);
    const loanAmount = Number(updateData.loanAmount || 0);
    const purchaseVal = (chassisCost || bodyCost) ? (chassisCost + bodyCost) : Number(updateData.purchase || 0);

    await database.collection("trucks").updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          id: updateData.id,
          model: updateData.model,
          reg: updateData.reg,
          insurance: updateData.insurance || "N/A",
          permit: updateData.permit || "N/A",
          fitness: updateData.fitness || "N/A",
          purchase: purchaseVal,
          chassisCost: chassisCost || purchaseVal,
          bodyCost: bodyCost,
          loanAmount: loanAmount,
          openingKm: Number(updateData.openingKm || 0),
          driver: driverName,
          status: updateData.status
        }
      }
    );

    if (oldTruck) {
      await updateTruckStats(database, updateData.id);
    }

    if (oldTruck && oldTruck.driver !== driverName) {
      if (oldTruck.driver && oldTruck.driver !== "Vacant") {
        await database.collection("drivers").updateOne(
          { name: oldTruck.driver },
          { $set: { truck: "Unassigned" } }
        );
      }
    }

    if (driverName !== "Vacant") {
      await database.collection("drivers").updateOne(
        { name: driverName },
        { $set: { truck: updateData.id } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const database = await getDb();
    const drivers = await database.collection("drivers").find({}).toArray();
    const trips = await database.collection("trips").find({}).toArray();
    const trucks = await database.collection("trucks").find({}).toArray();
    
    const enriched = drivers.map(d => {
      const driverTrips = trips.filter(t => t.driver === d.name);
      const totalRevenue = driverTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const percentage = Number(d.salary || 0);
      const earnedSalary = (totalRevenue * percentage) / 100;
      
      return { 
        ...d, 
        trips: driverTrips.length, 
        earnedSalary,
        _id: d._id.toString() 
      };
    });
    res.json({
      drivers: enriched,
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/drivers', async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    const truckId = data.truck || "Unassigned";

    await database.collection("drivers").insertOne({
      id: data.id || `DRV${Date.now().toString().slice(-4)}`,
      name: data.name,
      phone: data.phone,
      license: data.license,
      truck: truckId,
      trips: 0,
      salary: Number(data.salary || 0),
      advance: 0,
      score: 100,
    });

    if (truckId !== "Unassigned") {
      await database.collection("trucks").updateOne(
        { id: truckId },
        { $set: { driver: data.name } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/drivers/edit', async (req, res) => {
  try {
    const database = await getDb();
    const { _id, ...updateData } = req.body;
    const truckId = updateData.truck || "Unassigned";

    const oldDriver = await database.collection("drivers").findOne({ _id: new ObjectId(_id) });

    await database.collection("drivers").updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          name: updateData.name,
          phone: updateData.phone,
          license: updateData.license,
          truck: truckId,
          salary: Number(updateData.salary || 0),
          advance: Number(updateData.advance || 0),
          score: Number(updateData.score || 100)
        }
      }
    );

    if (oldDriver && oldDriver.truck !== truckId) {
      if (oldDriver.truck && oldDriver.truck !== "Unassigned") {
        await database.collection("trucks").updateOne(
          { id: oldDriver.truck },
          { $set: { driver: "Vacant" } }
        );
      }
    }

    if (truckId !== "Unassigned") {
      await database.collection("trucks").updateOne(
        { id: truckId },
        { $set: { driver: updateData.name } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/drivers/delete', async (req, res) => {
  try {
    const database = await getDb();
    const _id = req.body.id;
    const driver = await database.collection("drivers").findOne({ _id: new ObjectId(_id) });

    if (driver && driver.truck && driver.truck !== "Unassigned") {
      await database.collection("trucks").updateOne(
        { id: driver.truck },
        { $set: { driver: "Vacant" } }
      );
    }

    await database.collection("drivers").deleteOne({ _id: new ObjectId(_id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Trips
app.get('/api/trips', async (req, res) => {
  try {
    const database = await getDb();
    const trips = await database.collection("trips").find({}).sort({ _id: -1 }).toArray();
    const trucks = await database.collection("trucks").find({}).toArray();
    const drivers = await database.collection("drivers").find({}).toArray();
    res.json({
      trips: trips.map(t => ({ ...t, _id: t._id.toString() })),
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() })),
      drivers: drivers.map(d => ({ ...d, _id: d._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips', async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    
    let memoNo = data.memoNo;
    if (!memoNo) {
      const lastTrip = await database.collection("trips").findOne({}, { sort: { _id: -1 } });
      let nextNum = 1001;
      if (lastTrip && lastTrip.memoNo && lastTrip.memoNo.startsWith("MEMO-")) {
        const lastNum = parseInt(lastTrip.memoNo.replace("MEMO-", ""), 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      } else {
        const count = await database.collection("trips").countDocuments();
        nextNum = count + 1001;
      }
      memoNo = `MEMO-${nextNum}`;
    }

    const trip = {
      ...data,
      memoNo: memoNo,
      customer: data.customer || "",
      advance: Number(data.advance || 0),
      food: Number(data.food || 0),
      parking: Number(data.parking || 0),
      loading: Number(data.loading || 0),
      rto: Number(data.rto || 0),
      puncture: Number(data.puncture || 0),
      maintenance: Number(data.maintenance || 0),
      
      tripType: data.tripType || "Single",
      status: data.status || "Running",
      distance: Number(data.distance || 0),
      revenue: Number(data.revenue || 0),
      diesel: Number(data.diesel || 0),
      toll: Number(data.toll || 0),
      bata: Number(data.bata || 0),
      misc: Number(data.misc || 0),
      customAmount: Number(data.customAmount || 0),
      dieselRate: Number(data.dieselRate || 0),
      
      // Single trip fields
      openingKm: Number(data.openingKm || 0),
      closingKm: Number(data.closingKm || 0),
      litres: Number(data.litres || 0),
      
      // Round trip fields
      outwardOpeningKm: Number(data.outwardOpeningKm || 0),
      outwardClosingKm: Number(data.outwardClosingKm || 0),
      outwardDiesel: Number(data.outwardDiesel || 0),
      outwardLitres: Number(data.outwardLitres || 0),
      returnOpeningKm: Number(data.returnOpeningKm || 0),
      returnClosingKm: Number(data.returnClosingKm || 0),
      returnDiesel: Number(data.returnDiesel || 0),
      returnLitres: Number(data.returnLitres || 0),
    };
    
    if (trip.tripType === "Round") {
      trip.diesel = (trip.outwardDiesel || 0) + (trip.returnDiesel || 0);
      trip.litres = (trip.outwardLitres || 0) + (trip.returnLitres || 0);
    }

    if (trip.status === "Completed") {
      if (trip.tripType === "Round") {
        const outDist = Math.max(0, trip.outwardClosingKm - trip.outwardOpeningKm);
        const retDist = Math.max(0, trip.returnClosingKm - trip.returnOpeningKm);
        trip.distance = outDist + retDist;
      } else {
        trip.distance = Math.max(0, trip.closingKm - trip.openingKm);
      }
    }
    
    await database.collection("trips").insertOne(trip);
    
    if (trip.truck) {
      await updateTruckStats(database, trip.truck);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/finish', async (req, res) => {
  try {
    const database = await getDb();
    const { id, ...updateData } = req.body;
    
    const trip = await database.collection("trips").findOne({ _id: new ObjectId(id) });
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const isRound = trip.tripType === "Round";
    
    let distance = 0;
    let diesel = 0;
    let litres = 0;

    const parsedUpdate = {
      status: "Completed",
    };

    if (isRound) {
      parsedUpdate.outwardClosingKm = Number(updateData.outwardClosingKm || 0);
      parsedUpdate.outwardDiesel = Number(updateData.outwardDiesel || 0);
      parsedUpdate.outwardLitres = Number(updateData.outwardLitres || 0);

      parsedUpdate.returnOpeningKm = Number(updateData.returnOpeningKm || parsedUpdate.outwardClosingKm);
      parsedUpdate.returnClosingKm = Number(updateData.returnClosingKm || 0);
      parsedUpdate.returnDiesel = Number(updateData.returnDiesel || 0);
      parsedUpdate.returnLitres = Number(updateData.returnLitres || 0);

      const outDist = Math.max(0, parsedUpdate.outwardClosingKm - Number(trip.outwardOpeningKm || 0));
      const retDist = Math.max(0, parsedUpdate.returnClosingKm - parsedUpdate.returnOpeningKm);
      distance = outDist + retDist;
      diesel = parsedUpdate.outwardDiesel + parsedUpdate.returnDiesel;
      litres = parsedUpdate.outwardLitres + parsedUpdate.returnLitres;
    } else {
      parsedUpdate.closingKm = Number(updateData.closingKm || 0);
      parsedUpdate.diesel = Number(updateData.diesel || 0);
      parsedUpdate.litres = Number(updateData.litres || 0);

      distance = Math.max(0, parsedUpdate.closingKm - Number(trip.openingKm || 0));
      diesel = parsedUpdate.diesel;
      litres = parsedUpdate.litres;
    }

    parsedUpdate.distance = distance;
    parsedUpdate.diesel = diesel;
    parsedUpdate.litres = litres;
    parsedUpdate.dieselRate = Number(updateData.dieselRate || 0);
    
    if (updateData.revenue !== undefined) parsedUpdate.revenue = Number(updateData.revenue || 0);
    if (updateData.toll !== undefined) parsedUpdate.toll = Number(updateData.toll || 0);
    if (updateData.bata !== undefined) parsedUpdate.bata = Number(updateData.bata || 0);
    if (updateData.misc !== undefined) parsedUpdate.misc = Number(updateData.misc || 0);
    if (updateData.food !== undefined) parsedUpdate.food = Number(updateData.food || 0);
    if (updateData.parking !== undefined) parsedUpdate.parking = Number(updateData.parking || 0);
    if (updateData.loading !== undefined) parsedUpdate.loading = Number(updateData.loading || 0);
    if (updateData.rto !== undefined) parsedUpdate.rto = Number(updateData.rto || 0);
    if (updateData.puncture !== undefined) parsedUpdate.puncture = Number(updateData.puncture || 0);
    if (updateData.maintenance !== undefined) parsedUpdate.maintenance = Number(updateData.maintenance || 0);
    if (updateData.advance !== undefined) parsedUpdate.advance = Number(updateData.advance || 0);
    if (updateData.customer !== undefined) parsedUpdate.customer = updateData.customer || "";

    await database.collection("trips").updateOne(
      { _id: new ObjectId(id) },
      { $set: parsedUpdate }
    );

    // Update truck stats
    await updateTruckStats(database, trip.truck);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trips/delete', async (req, res) => {
  try {
    const database = await getDb();
    const { id } = req.body;
    const trip = await database.collection("trips").findOne({ _id: new ObjectId(id) });
    if (trip) {
      await database.collection("trips").deleteOne({ _id: new ObjectId(id) });
      await updateTruckStats(database, trip.truck);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Settings
app.get('/api/settings', async (req, res) => {
  try {
    const database = await getDb();
    const settings = await database.collection("settings").findOne({ id: "global" });
    const defaultStatePrices = {
      "Tamil Nadu": 92.4,
      "Maharashtra": 95.2,
      "Gujarat": 91.5,
      "Karnataka": 93.1,
      "Andhra Pradesh": 94.6,
      "Rajasthan": 96.8
    };
    if (settings) {
      res.json({
        businessName: settings.businessName || "AMS Transports",
        owner: settings.owner || "A. M. Selvam",
        gstin: settings.gstin || "33ABCDE1234F1Z5",
        headOffice: settings.headOffice || "Chennai, TN",
        dieselPrice: Number(settings.dieselPrice || 92.4),
        statePrices: settings.statePrices || defaultStatePrices
      });
    } else {
      res.json({
        businessName: "AMS Transports",
        owner: "A. M. Selvam",
        gstin: "33ABCDE1234F1Z5",
        headOffice: "Chennai, TN",
        dieselPrice: 92.4,
        statePrices: defaultStatePrices
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection("settings").updateOne(
      { id: "global" },
      {
        $set: {
          businessName: req.body.businessName,
          owner: req.body.owner,
          gstin: req.body.gstin,
          headOffice: req.body.headOffice,
          dieselPrice: Number(req.body.dieselPrice || 92.4),
          statePrices: req.body.statePrices
        }
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/clear', async (req, res) => {
  try {
    const database = await getDb();
    const collections = ["trucks", "drivers", "trips", "expenses", "services", "emis", "tyres", "expenseBreakdown", "monthlyData", "settings"];
    for (const name of collections) {
      try {
        await database.collection(name).deleteMany({});
      } catch (err) {
        console.error(`Failed to clear collection ${name}:`, err);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Reports
app.get('/api/reports', async (req, res) => {
  try {
    const database = await getDb();
    const settings = await database.collection("settings").findOne({ id: "global" });
    const dieselPrice = Number(settings?.dieselPrice || 92.4);

    const [trips, trucks, expenses, drivers] = await Promise.all([
      database.collection("trips").find({}).toArray(),
      database.collection("trucks").find({}).toArray(),
      database.collection("expenses").find({}).toArray(),
      database.collection("drivers").find({}).toArray(),
    ]);

    res.json({
      trips: trips.map(t => ({ ...t, _id: t._id.toString() })),
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() })),
      expenses: expenses.map(e => ({ ...e, _id: e._id.toString() })),
      drivers: drivers.map(d => ({ ...d, _id: d._id.toString() })),
      dieselPrice
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Profit & Loss
app.get('/api/profit-loss', async (req, res) => {
  try {
    const database = await getDb();
    const trucks = await database.collection("trucks").find({}).toArray();
    const trips = await database.collection("trips").find({}).toArray();
    const services = await database.collection("services").find({}).toArray();
    const emis = await database.collection("emis").find({}).toArray();
    const expenses = await database.collection("expenses").find({}).toArray();
    
    const calculatedTrucks = trucks.map(truck => {
      const tTrips = trips.filter(t => t.truck === truck.id);
      const tripRevenue = tTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const tripExpense = tTrips.reduce((sum, t) => sum + getTripExpenses(t), 0);
      
      const tServices = services.filter(s => s.truck === truck.id);
      const serviceExpense = tServices.reduce((sum, s) => sum + (s.labour || 0) + (s.parts || 0), 0);
      
      const tEmis = emis.filter(e => e.truck === truck.id);
      const totalEmiPaid = tEmis.reduce((sum, e) => sum + ((e.paid || 0) * (e.monthly || 0)), 0);
      
      const tExpenses = expenses.filter(e => e.truck === truck.id);
      const generalExpense = tExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      const totalExpense = tripExpense + serviceExpense + totalEmiPaid + generalExpense;
      const netProfit = tripRevenue - totalExpense;
      
      return {
        ...truck,
        _id: truck._id.toString(),
        profit: netProfit,
        revenue: tripRevenue,
        expense: totalExpense,
        tripCount: tTrips.length
      };
    });
    
    const monthlyMap = {};
    trips.forEach(t => {
      if (!t.date) return;
      const dateObj = new Date(t.date);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      if (!monthlyMap[monthStr]) monthlyMap[monthStr] = { month: monthStr, revenue: 0, expense: 0, profit: 0 };
      monthlyMap[monthStr].revenue += t.revenue || 0;
      monthlyMap[monthStr].expense += getTripExpenses(t);
    });

    services.forEach(s => {
      if (!s.date) return;
      const dateObj = new Date(s.date);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      if (!monthlyMap[monthStr]) monthlyMap[monthStr] = { month: monthStr, revenue: 0, expense: 0, profit: 0 };
      monthlyMap[monthStr].expense += (s.labour || 0) + (s.parts || 0);
    });

    expenses.forEach(e => {
      if (!e.date) return;
      const dateObj = new Date(e.date);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      if (!monthlyMap[monthStr]) monthlyMap[monthStr] = { month: monthStr, revenue: 0, expense: 0, profit: 0 };
      monthlyMap[monthStr].expense += e.amount || 0;
    });

    Object.keys(monthlyMap).forEach(k => {
      monthlyMap[k].profit = monthlyMap[k].revenue - monthlyMap[k].expense;
    });

    res.json({
      monthlyData: Object.values(monthlyMap),
      trucks: calculatedTrucks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const database = await getDb();
    const notifications = await database.collection("notifications").find({}).toArray();
    res.json(notifications.map(n => ({ ...n, _id: n._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Maintenance
app.get('/api/maintenance', async (req, res) => {
  try {
    const database = await getDb();
    const services = await database.collection("services").find({}).sort({ _id: -1 }).toArray();
    const trucks = await database.collection("trucks").find({}).toArray();
    res.json({
      services: services.map(s => ({ ...s, _id: s._id.toString() })),
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection("services").insertOne(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/maintenance/delete', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection("services").deleteOne({ _id: new ObjectId(req.body.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Garage
app.get('/api/garage', async (req, res) => {
  try {
    const database = await getDb();
    const trucks = await database.collection("trucks").find({}).toArray();
    const drivers = await database.collection("drivers").find({}).toArray();
    res.json({
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() })),
      drivers: drivers.map(d => ({ ...d, _id: d._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/garage', async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    const driverName = data.driver || "Vacant";
    
    const openingKm = Number(data.openingKm || 0);

    await database.collection("trucks").insertOne({
      id: data.id,
      model: data.model,
      reg: data.reg,
      insurance: data.insurance || "N/A",
      permit: data.permit || "N/A",
      fitness: data.fitness || "N/A",
      purchase: Number(data.purchase || 0),
      openingKm: openingKm,
      currentKm: openingKm,
      driver: driverName,
      mileage: 0,
      status: data.status || "Idle",
      profit: 0
    });
    
    if (driverName !== "Vacant") {
      await database.collection("drivers").updateOne(
        { name: driverName },
        { $set: { truck: data.id } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/garage/edit', async (req, res) => {
  try {
    const database = await getDb();
    const { _id, ...updateData } = req.body;
    const driverName = updateData.driver || "Vacant";
    
    const oldTruck = await database.collection("trucks").findOne({ _id: new ObjectId(_id) });
    
    await database.collection("trucks").updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          id: updateData.id,
          model: updateData.model,
          reg: updateData.reg,
          insurance: updateData.insurance || "N/A",
          permit: updateData.permit || "N/A",
          fitness: updateData.fitness || "N/A",
          purchase: Number(updateData.purchase || 0),
          openingKm: Number(updateData.openingKm || 0),
          driver: driverName,
          status: updateData.status || "Idle"
        }
      }
    );
    
    if (oldTruck) {
      await updateTruckStats(database, updateData.id);
    }

    if (oldTruck && oldTruck.driver !== driverName) {
      if (oldTruck.driver && oldTruck.driver !== "Vacant") {
        await database.collection("drivers").updateOne(
          { name: oldTruck.driver },
          { $set: { truck: "Unassigned" } }
        );
      }
    }
    
    if (driverName !== "Vacant") {
      await database.collection("drivers").updateOne(
        { name: driverName },
        { $set: { truck: updateData.id } }
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/garage/delete', async (req, res) => {
  try {
    const database = await getDb();
    const _id = req.body.id;
    const oldTruck = await database.collection("trucks").findOne({ _id: new ObjectId(_id) });
    
    if (oldTruck) {
      if (oldTruck.driver && oldTruck.driver !== "Vacant") {
        await database.collection("drivers").updateOne(
          { name: oldTruck.driver },
          { $set: { truck: "Unassigned" } }
        );
      }
      await database.collection("trucks").deleteOne({ _id: new ObjectId(_id) });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const database = await getDb();
    const expenses = await database.collection("expenses").find({}).sort({ _id: -1 }).toArray();
    const trucks = await database.collection("trucks").find({}).toArray();
    
    const categoriesMap = {};
    expenses.forEach(e => {
      const cat = e.category || "Others";
      categoriesMap[cat] = (categoriesMap[cat] || 0) + (e.amount || 0);
    });
    const expenseBreakdown = Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));

    res.json({
      expenses: expenses.map(e => ({ ...e, _id: e._id.toString() })),
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() })),
      expenseBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    await database.collection("expenses").insertOne({
      id: `EXP${Date.now().toString().slice(-4)}`,
      date: data.date,
      category: data.category,
      truck: data.truck === "none" ? "" : data.truck,
      amount: Number(data.amount || 0),
      note: data.note || ""
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses/delete', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection("expenses").deleteOne({ _id: new ObjectId(req.body.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. EMI
app.get('/api/emi', async (req, res) => {
  try {
    const database = await getDb();
    const emis = await database.collection("emis").find({}).sort({ _id: -1 }).toArray();
    const trucks = await database.collection("trucks").find({}).toArray();
    res.json({
      emis: emis.map(e => ({ ...e, _id: e._id.toString() })),
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emi', async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    await database.collection("emis").insertOne({
      truck: data.truck,
      lender: data.lender,
      loanAmount: Number(data.loanAmount),
      interestRate: Number(data.interestRate),
      monthly: Number(data.monthly),
      tenure: Number(data.tenure),
      paid: Number(data.paid || 0),
      due: data.due,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emi/pay', async (req, res) => {
  try {
    const database = await getDb();
    const { id, paid, currentDue } = req.body;
    
    const nextDue = new Date(currentDue);
    nextDue.setMonth(nextDue.getMonth() + 1);
    const nextDueStr = nextDue.toISOString().split("T")[0];

    const emi = await database.collection("emis").findOne({ _id: new ObjectId(id) });

    await database.collection("emis").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          paid: paid + 1,
          due: nextDueStr
        } 
      }
    );

    if (emi) {
      await database.collection("expenses").insertOne({
        date: new Date().toISOString().split("T")[0],
        category: "EMI",
        truck: emi.truck,
        amount: emi.monthly,
        note: `${emi.lender} - Instalment ${paid + 1}`
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emi/delete', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection("emis").deleteOne({ _id: new ObjectId(req.body.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Tyres
app.get('/api/tyres', async (req, res) => {
  try {
    const database = await getDb();
    const tyres = await database.collection("tyres").find({}).toArray();
    const trucks = await database.collection("trucks").find({}).toArray();
    res.json({
      tyres: tyres.map(t => ({ ...t, _id: t._id.toString() })),
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tyres', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection("tyres").insertOne(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tyres/delete', async (req, res) => {
  try {
    const database = await getDb();
    await database.collection("tyres").deleteOne({ _id: new ObjectId(req.body.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Diesel
app.get('/api/diesel', async (req, res) => {
  try {
    const database = await getDb();
    const settings = await database.collection("settings").findOne({ id: "global" });
    const dieselPrice = Number(settings?.dieselPrice || 92.4);
    const statePrices = settings?.statePrices || {
      "Tamil Nadu": 92.4,
      "Maharashtra": 95.2,
      "Gujarat": 91.5,
      "Karnataka": 93.1,
      "Andhra Pradesh": 94.6,
      "Rajasthan": 96.8
    };

    const trips = await database.collection("trips").find({}).sort({ _id: 1 }).toArray();
    const trucks = await database.collection("trucks").find({}).toArray();
    res.json({
      trips: trips.map(t => ({ ...t, _id: t._id.toString() })),
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() })),
      dieselPrice,
      statePrices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/diesel/price', async (req, res) => {
  try {
    const database = await getDb();
    const price = Number(req.body.price);
    await database.collection("settings").updateOne(
      { id: "global" },
      { $set: { dieselPrice: price } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/diesel/state-prices', async (req, res) => {
  try {
    const database = await getDb();
    const statePrices = req.body.statePrices;
    await database.collection("settings").updateOne(
      { id: "global" },
      { $set: { statePrices } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const database = await getDb();
    const [monthlyData, drivers, trucks, trips] = await Promise.all([
      database.collection("monthlyData").find({}).toArray(),
      database.collection("drivers").find({}).toArray(),
      database.collection("trucks").find({}).toArray(),
      database.collection("trips").find({}).sort({ _id: 1 }).toArray()
    ]);
    res.json({
      monthlyData: monthlyData.map(m => ({ ...m, _id: m._id.toString() })),
      drivers: drivers.map(d => ({ ...d, _id: d._id.toString() })),
      trucks: trucks.map(t => ({ ...t, _id: t._id.toString() })),
      trips: trips.map(t => ({ ...t, _id: t._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
