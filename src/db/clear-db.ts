import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/schema";
import 'dotenv/config';

async function clearDb() {
  // Use direct connection string to avoid any issues with the getDb function
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL is not defined in the environment variables");
    process.exit(1);
  }
  
  console.log("Connecting to database...");
  
  // Create direct connection
  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });
  
  console.log("Connected to database. Clearing tables...");
  
  try {
    // Delete data from all tables in the correct order (respecting foreign key constraints)
    console.log("Deleting billItems...");
    await db.delete(schema.billItems).execute();
    
    console.log("Deleting userBillItems...");
    await db.delete(schema.userBillItems).execute();
    
    console.log("Deleting bills...");
    await db.delete(schema.bills).execute();
    
    console.log("Deleting userTrips...");
    await db.delete(schema.userTrips).execute();
    
    console.log("Deleting trips...");
    await db.delete(schema.trips).execute();
    
    console.log("Deleting users...");
    await db.delete(schema.users).execute();
    
    console.log("✅ All tables cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing tables:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the function
clearDb(); 