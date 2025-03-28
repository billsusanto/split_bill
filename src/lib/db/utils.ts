'use server';

import { getDb } from "../../db";
import { 
  users, 
  trips, 
  userTrips, 
  bills,
  billItems,
  userBillItems,
  userBills
} from "../../db/schema/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// User functions
export async function getUserByName(name: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.name, name)).limit(1);
  return result[0] || null;
}

export async function createUser(name: string, clerkId?: string) {
  const db = getDb();
  try {
    // First check if a user with this clerk ID already exists
    if (clerkId) {
      const existingUser = await getUserByClerkId(clerkId);
      if (existingUser) {
        return existingUser; // Return the existing user instead of creating a duplicate
      }
    }
    
    const userData: any = { 
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (clerkId) {
      userData.clerkId = clerkId;
    }
    
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  } catch (error) {
    // If there's a duplicate key violation, try to retrieve the existing user
    if (clerkId && String(error).includes("duplicate key") && 
        (String(error).includes("clerk_id") || String(error).includes("users_clerk_id_idx"))) {
      console.log("Detected duplicate clerk_id, retrieving existing user");
      const existingUser = await getUserByClerkId(clerkId);
      if (existingUser) {
        return existingUser;
      }
    }
    
    // If clerk_id column doesn't exist, try without it
    if (String(error).includes("column") && String(error).includes("clerk_id")) {
      const result = await db.insert(users).values({ 
        name,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result[0];
    }
    throw error;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserByClerkId(clerkId: string) {
  const db = getDb();
  try {
    const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    return result[0] || null;
  } catch (error) {
    // The column might not exist yet
    console.error("Error getting user by clerk ID:", error);
    return null;
  }
}

// Trip functions
export async function createTrip(name: string, password: string, userId: number) {
  const db = await getDb();
  const uniqueId = uuidv4().substring(0, 8);
  
  // Create the trip
  const newTrip = await db.insert(trips).values({
    name,
    uniqueId,
    password,
  }).returning();
  
  // Add the creator to the trip
  await db.insert(userTrips).values({
    userId,
    tripId: newTrip[0].id,
  });
  
  return newTrip[0];
}

export async function getTripById(id: number) {
  const db = await getDb();
  const result = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  return result[0] || null;
}

export async function getTripByUniqueId(uniqueId: string) {
  const db = await getDb();
  const result = await db.select().from(trips).where(eq(trips.uniqueId, uniqueId)).limit(1);
  return result[0] || null;
}

export async function getUserTrips(userId: number) {
  const db = await getDb();
  
  const result = await db
    .select({
      trip: trips,
    })
    .from(userTrips)
    .innerJoin(trips, eq(userTrips.tripId, trips.id))
    .where(eq(userTrips.userId, userId));
    
  return result.map(r => r.trip);
}

export async function joinTrip(userId: number, uniqueId: string, password: string) {
  const db = await getDb();
  
  // Find the trip
  const trip = await getTripByUniqueId(uniqueId);
  if (!trip) return { success: false, message: "Trip not found" };
  
  // Check the password
  if (trip.password !== password) {
    return { success: false, message: "Incorrect password" };
  }
  
  // Check if the user is already in the trip
  const existing = await db
    .select()
    .from(userTrips)
    .where(
      and(
        eq(userTrips.userId, userId),
        eq(userTrips.tripId, trip.id)
      )
    )
    .limit(1);
    
  if (existing.length > 0) {
    return { success: true, trip, message: "User already in trip" };
  }
  
  // Add the user to the trip
  await db.insert(userTrips).values({
    userId,
    tripId: trip.id,
  });
  
  return { success: true, trip, message: "Joined trip successfully" };
}

// Bill functions
export async function createBill(tripId: number, userId: number, name: string, totalAmount: number, billType: string = 'items') {
  const db = await getDb();
  // Now we can use the billType field directly
  const result = await db.insert(bills).values({
    tripId,
    addedById: userId,
    name,
    totalAmount: totalAmount.toString(), // Convert to string for Drizzle decimal type
    billType,
  }).returning();
  
  return result[0];
}

export async function getTripBills(tripId: number) {
  const db = await getDb();
  const result = await db
    .select()
    .from(bills)
    .where(eq(bills.tripId, tripId))
    .orderBy(bills.createdAt);
    
  return result;
}

export async function getBillById(id: number) {
  const db = await getDb();
  const result = await db.select().from(bills).where(eq(bills.id, id)).limit(1);
  return result[0] || null;
}

export async function deleteBill(id: number) {
  const db = await getDb();
  await db.delete(bills).where(eq(bills.id, id));
}

export async function updateBill(id: number, name: string, totalAmount: number, billType?: string) {
  const db = await getDb();
  
  // Now we can use the billType field directly
  const updateData: any = {
    name,
    totalAmount: totalAmount.toString(), // Convert to string for Drizzle decimal type
    updatedAt: new Date()
  };
  
  if (billType) {
    updateData.billType = billType;
  }
  
  const result = await db.update(bills)
    .set(updateData)
    .where(eq(bills.id, id))
    .returning();
  
  return result[0] || null;
}

// Bill Items functions
export async function createBillItem(billId: number, name: string, price: number, quantity: number = 1) {
  const db = await getDb();
  const result = await db.insert(billItems).values({
    billId,
    name,
    price: price.toString(), // Convert to string for Drizzle decimal type
    quantity,
  }).returning();
  
  return result[0];
}

export async function getBillItems(billId: number) {
  const db = await getDb();
  return await db
    .select()
    .from(billItems)
    .where(eq(billItems.billId, billId))
    .orderBy(billItems.createdAt);
}

export async function deleteBillItem(id: number) {
  const db = await getDb();
  await db.delete(billItems).where(eq(billItems.id, id));
}

export async function updateBillItem(id: number, name: string, price: number, quantity: number = 1) {
  const db = await getDb();
  const result = await db.update(billItems)
    .set({
      name,
      price: price.toString(), // Convert to string for Drizzle decimal type
      quantity
    })
    .where(eq(billItems.id, id))
    .returning();
  
  return result[0] || null;
}

// User Bill Items functions
export async function assignUserToBillItem(userId: number, billItemId: number) {
  const db = await getDb();
  const result = await db.insert(userBillItems).values({
    userId,
    billItemId,
  }).returning();
  
  return result[0];
}

export async function removeUserFromBillItem(userId: number, billItemId: number) {
  const db = await getDb();
  await db.delete(userBillItems)
    .where(
      and(
        eq(userBillItems.userId, userId),
        eq(userBillItems.billItemId, billItemId)
      )
    );
}

export async function getUsersForBillItem(billItemId: number) {
  const db = await getDb();
  
  const result = await db
    .select({
      user: users,
    })
    .from(userBillItems)
    .innerJoin(users, eq(userBillItems.userId, users.id))
    .where(eq(userBillItems.billItemId, billItemId));
    
  return result.map(r => r.user);
}

export async function getBillItemsForUser(userId: number, billId: number) {
  const db = await getDb();
  
  const result = await db
    .select({
      billItem: billItems,
    })
    .from(userBillItems)
    .innerJoin(billItems, eq(userBillItems.billItemId, billItems.id))
    .where(
      and(
        eq(userBillItems.userId, userId),
        eq(billItems.billId, billId)
      )
    );
    
  return result.map(r => r.billItem);
}

// Even Split Bill functions
export async function assignUserToBill(userId: number, billId: number) {
  const db = await getDb();
  
  try {
    // Insert user into userBills table
    const result = await db.insert(userBills).values({
      userId,
      billId,
      createdAt: new Date()
    }).returning();
    
    return { success: true, userBill: result[0] };
  } catch (error) {
    console.error("Error assigning user to bill:", error);
    return { success: false, error };
  }
}

export async function removeUserFromBill(userId: number, billId: number) {
  const db = await getDb();
  
  try {
    // Remove user from userBills table
    await db.delete(userBills)
      .where(
        and(
          eq(userBills.userId, userId),
          eq(userBills.billId, billId)
        )
      );
    
    return { success: true };
  } catch (error) {
    console.error("Error removing user from bill:", error);
    return { success: false, error };
  }
}

export async function getUsersForBill(billId: number) {
  const db = await getDb();
  
  try {
    // Query userBills table joined with users
    const result = await db
      .select({
        user: users,
      })
      .from(userBills)
      .innerJoin(users, eq(userBills.userId, users.id))
      .where(eq(userBills.billId, billId));
      
    return result.map(r => r.user);
  } catch (error) {
    console.error("Error getting users for bill:", error);
    
    // Fallback to getting the bill creator
    const bill = await getBillById(billId);
    if (!bill) return [];
    
    const user = await getUserById(bill.addedById);
    return user ? [user] : [];
  }
}

// Check if user is part of a trip
export async function isUserInTrip(userId: number, tripId: number) {
  const db = await getDb();
  
  const result = await db
    .select()
    .from(userTrips)
    .where(
      and(
        eq(userTrips.userId, userId),
        eq(userTrips.tripId, tripId)
      )
    )
    .limit(1);
    
  return result.length > 0;
} 