import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/schema";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

// Create a SQL client with Neon
const sql = neon(connectionString);

// Initialize Drizzle with the SQL client and schema
const db = drizzle(sql, { schema });

async function viewDatabaseContents() {
  try {
    console.log("Connecting to database...");
    
    // Get and display users
    console.log("\n=== USERS ===");
    const allUsers = await db.select().from(schema.users);
    console.table(allUsers);
    
    // Get and display trips
    console.log("\n=== TRIPS ===");
    const allTrips = await db.select().from(schema.trips);
    console.table(allTrips);
    
    // Get and display user-trip relationships
    console.log("\n=== USER TRIPS ===");
    const allUserTrips = await db.select().from(schema.userTrips);
    console.table(allUserTrips);
    
    // Get and display bills
    console.log("\n=== BILLS ===");
    const allBills = await db.select().from(schema.bills);
    // Transform the results to include columns that might not show in console.table
    const formattedBills = allBills.map(bill => {
      return {
        id: bill.id,
        name: bill.name,
        totalAmount: bill.totalAmount,
        tripId: bill.tripId,
        addedById: bill.addedById,
        // @ts-ignore - bill_type column exists but might not be in the TypeScript schema
        billType: bill.bill_type || 'items',
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt
      };
    });
    console.table(formattedBills);
    
    // Get and display bill items
    console.log("\n=== BILL ITEMS ===");
    try {
      const allBillItems = await db.select().from(schema.billItems);
      
      // Transform the results to format quantities properly
      const formattedBillItems = allBillItems.map(item => {
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          billId: item.billId,
          // Handle missing quantity column by defaulting to 1
          quantity: item.quantity || 1,
          createdAt: item.createdAt
        };
      });
      console.table(formattedBillItems);
    } catch (error) {
      console.error("Error fetching bill items:", error);
      console.log("You may need to run migrations to add the quantity column to the bill_items table.");
    }
    
    // Get and display user bill items
    console.log("\n=== USER BILL ITEMS ===");
    const allUserBillItems = await db.select().from(schema.userBillItems);
    console.table(allUserBillItems);
    
    // Get and display user bills (even split participants)
    console.log("\n=== USER BILLS (EVEN SPLIT) ===");
    const allUserBills = await db.select().from(schema.userBills);
    console.table(allUserBills);
    
  } catch (error) {
    console.error("Error viewing database contents:", error);
  }
}

// Run the function
viewDatabaseContents(); 