import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("ride_sharing_app");
    // Drop existing index to avoid conflicts
    await db
      .collection("ride_routes")
      .dropIndex("route_2dsphere")
      .catch(() => {});
    // Create indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db
      .collection("users")
      .createIndex({ phoneNumber: 1 }, { unique: true });
    await db.collection("rides").createIndex({ driverId: 1 });
    await db.collection("ride_requests").createIndex({ rideId: 1, riderId: 1 });
    await db.collection("ride_routes").createIndex({ route: "2dsphere" });
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error("Database not connected");
  }
  return db;
}

export { connectDB, getDB };
