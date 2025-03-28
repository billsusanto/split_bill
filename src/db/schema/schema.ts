import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clerkId: text("clerk_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  uniqueId: varchar("unique_id", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userTrips = pgTable(
  "user_trips",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.tripId] }),
  })
);

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  totalAmount: text("total_amount").notNull(),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  addedById: integer("added_by_id")
    .notNull()
    .references(() => users.id),
  billType: varchar("bill_type", { length: 255 }).notNull().default('items'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const billItems = pgTable("bill_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  billId: integer("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userBillItems = pgTable(
  "user_bill_items",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    billItemId: integer("bill_item_id")
      .notNull()
      .references(() => billItems.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.billItemId] }),
  })
);

export const userBills = pgTable(
  "user_bills",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.billId] }),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userTrips: many(userTrips),
  userBillItems: many(userBillItems),
  bills: many(bills, { relationName: "addedBy" }),
}));

export const tripsRelations = relations(trips, ({ many }) => ({
  userTrips: many(userTrips),
  bills: many(bills),
}));

export const userTripsRelations = relations(userTrips, ({ one }) => ({
  user: one(users, {
    fields: [userTrips.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [userTrips.tripId],
    references: [trips.id],
  }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  trip: one(trips, {
    fields: [bills.tripId],
    references: [trips.id],
  }),
  addedBy: one(users, {
    fields: [bills.addedById],
    references: [users.id],
  }),
  items: many(billItems),
  userBills: many(userBills),
}));

export const billItemsRelations = relations(billItems, ({ one, many }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id],
  }),
  userBillItems: many(userBillItems),
}));

export const userBillItemsRelations = relations(userBillItems, ({ one }) => ({
  user: one(users, {
    fields: [userBillItems.userId],
    references: [users.id],
  }),
  billItem: one(billItems, {
    fields: [userBillItems.billItemId],
    references: [billItems.id],
  }),
}));

export const userBillsRelations = relations(userBills, ({ one }) => ({
  user: one(users, {
    fields: [userBills.userId],
    references: [users.id],
  }),
  bill: one(bills, {
    fields: [userBills.billId],
    references: [bills.id],
  }),
})); 