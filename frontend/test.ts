import { getDb } from "./src/lib/db";

async function run() {
  const db = await getDb();
  const trucks = await db.collection("trucks").find({}).toArray();
  console.log("Trucks:", JSON.stringify(trucks, null, 2));
  process.exit(0);
}

run().catch(console.error);
