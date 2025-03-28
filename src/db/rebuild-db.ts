import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/schema";
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env files
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

// Create SQL client and db instance
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function rebuildDatabase() {
  try {
    console.log("===========================");
    console.log("STARTING DATABASE REBUILD");
    console.log("===========================");
    console.log("Connecting to database...");
    console.log(`Using connection: ${connectionString?.substring(0, 30)}...`);
    
    // Step 1: Drop all tables (in reverse order to respect foreign keys)
    console.log("\n--- STEP 1: Dropping existing tables ---");
    try {
      console.log("Dropping user_bill_items table...");
      await sql`DROP TABLE IF EXISTS user_bill_items CASCADE`;
      
      console.log("Dropping bill_items table...");
      await sql`DROP TABLE IF EXISTS bill_items CASCADE`;
      
      console.log("Dropping bills table...");
      await sql`DROP TABLE IF EXISTS bills CASCADE`;
      
      console.log("Dropping user_trips table...");
      await sql`DROP TABLE IF EXISTS user_trips CASCADE`;
      
      console.log("Dropping trips table...");
      await sql`DROP TABLE IF EXISTS trips CASCADE`;
      
      console.log("Dropping users table...");
      await sql`DROP TABLE IF EXISTS users CASCADE`;
      
      console.log("✅ All tables dropped successfully!");
    } catch (error) {
      console.error("Error dropping tables:", error);
      console.log("Continuing with script...");
    }
    
    // Step 2: Create new tables using schema
    console.log("\n--- STEP 2: Creating new tables ---");
    try {
      // Read migration file
      const migrationPath = path.join(__dirname, 'migrations', '0000_initial.sql');
      if (!fs.existsSync(migrationPath)) {
        console.error(`Migration file not found at ${migrationPath}`);
        process.exit(1);
      }
      
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      console.log("Executing migration SQL...");
      await sql`${migrationSql}`;
      console.log("✅ Tables created successfully!");
    } catch (error) {
      console.error("Error creating tables:", error);
      process.exit(1);
    }
    
    // Step 3: Create sample data
    console.log("\n--- STEP 3: Creating sample data ---");
    
    // Add sample users
    console.log("Creating sample users...");
    const user1 = await db.insert(schema.users).values({
      name: "John Doe",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const user2 = await db.insert(schema.users).values({
      name: "Jane Smith",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const user3 = await db.insert(schema.users).values({
      name: "Bob Johnson",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log(`Created ${user1.length + user2.length + user3.length} users`);
    
    // Add sample trips
    console.log("Creating sample trips...");
    const trip1 = await db.insert(schema.trips).values({
      name: "Summer Vacation",
      uniqueId: "summerv1",
      password: "summer123",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const trip2 = await db.insert(schema.trips).values({
      name: "Business Trip",
      uniqueId: "biztrip1",
      password: "business123",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log(`Created ${trip1.length + trip2.length} trips`);
    
    // Associate users with trips
    console.log("Associating users with trips...");
    await db.insert(schema.userTrips).values({
      userId: user1[0].id,
      tripId: trip1[0].id,
      createdAt: new Date()
    });
    
    await db.insert(schema.userTrips).values({
      userId: user2[0].id,
      tripId: trip1[0].id,
      createdAt: new Date()
    });
    
    await db.insert(schema.userTrips).values({
      userId: user1[0].id,
      tripId: trip2[0].id,
      createdAt: new Date()
    });
    
    await db.insert(schema.userTrips).values({
      userId: user3[0].id,
      tripId: trip2[0].id,
      createdAt: new Date()
    });
    
    console.log("Created 4 user-trip associations");
    
    // Add sample bills
    console.log("Creating sample bills...");
    const bill1 = await db.insert(schema.bills).values({
      name: "Dinner",
      totalAmount: "120.50",
      tripId: trip1[0].id,
      addedById: user1[0].id,
      billType: "items",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const bill2 = await db.insert(schema.bills).values({
      name: "Hotel",
      totalAmount: "350.00",
      tripId: trip1[0].id,
      addedById: user2[0].id,
      billType: "items",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    const bill3 = await db.insert(schema.bills).values({
      name: "Conference Fees",
      totalAmount: "500.00",
      tripId: trip2[0].id,
      addedById: user1[0].id,
      billType: "items",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log(`Created ${bill1.length + bill2.length + bill3.length} bills`);
    
    // Add bill items
    console.log("Creating bill items...");
    const item1 = await db.insert(schema.billItems).values({
      name: "Main Course",
      price: "80.00",
      billId: bill1[0].id,
      createdAt: new Date()
    }).returning();
    
    const item2 = await db.insert(schema.billItems).values({
      name: "Drinks",
      price: "40.50",
      billId: bill1[0].id,
      createdAt: new Date()
    }).returning();
    
    const item3 = await db.insert(schema.billItems).values({
      name: "Room Charge",
      price: "300.00",
      billId: bill2[0].id,
      createdAt: new Date()
    }).returning();
    
    const item4 = await db.insert(schema.billItems).values({
      name: "Room Service",
      price: "50.00",
      billId: bill2[0].id,
      createdAt: new Date()
    }).returning();
    
    const item5 = await db.insert(schema.billItems).values({
      name: "Registration",
      price: "500.00",
      billId: bill3[0].id,
      createdAt: new Date()
    }).returning();
    
    console.log(`Created ${item1.length + item2.length + item3.length + item4.length + item5.length} bill items`);
    
    // Associate users with bill items
    console.log("Associating users with bill items...");
    
    await db.insert(schema.userBillItems).values({
      userId: user1[0].id,
      billItemId: item1[0].id,
      createdAt: new Date()
    });
    
    await db.insert(schema.userBillItems).values({
      userId: user2[0].id,
      billItemId: item1[0].id,
      createdAt: new Date()
    });
    
    await db.insert(schema.userBillItems).values({
      userId: user1[0].id,
      billItemId: item2[0].id,
      createdAt: new Date()
    });
    
    await db.insert(schema.userBillItems).values({
      userId: user2[0].id,
      billItemId: item3[0].id,
      createdAt: new Date()
    });
    
    await db.insert(schema.userBillItems).values({
      userId: user1[0].id,
      billItemId: item5[0].id,
      createdAt: new Date()
    });
    
    await db.insert(schema.userBillItems).values({
      userId: user3[0].id,
      billItemId: item5[0].id,
      createdAt: new Date()
    });
    
    console.log("Created 6 user-bill-item associations");
    
    console.log("\n===========================");
    console.log("✅ DATABASE REBUILT SUCCESSFULLY!");
    console.log("===========================");
    
  } catch (error) {
    console.error("Error rebuilding database:", error);
    process.exit(1);
  }
}

// Run the function
rebuildDatabase(); 