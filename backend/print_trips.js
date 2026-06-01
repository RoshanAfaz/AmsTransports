import { MongoClient } from 'mongodb';

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log("Databases list:");
    for (const d of dbsList.databases) {
      console.log(`- ${d.name}`);
      const db = client.db(d.name);
      const colls = await db.listCollections().toArray();
      for (const col of colls) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`    Collection: ${col.name} (documents: ${count})`);
      }
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
