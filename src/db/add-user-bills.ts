import { neon, neonConfig } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

async function addUserBillsTable() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is not defined. Please check your .env.local file.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = neon(DATABASE_URL);

  try {
    // Create the user_bills table if it doesn't exist
    console.log('Adding user_bills table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_bills (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY(user_id, bill_id)
      );
    `;
    console.log('user_bills table added successfully.');

    // Add any bills' creators to their respective bill automatically
    console.log('Adding bill creators to user_bills table...');
    await sql`
      INSERT INTO user_bills (user_id, bill_id)
      SELECT added_by_id, id FROM bills
      WHERE NOT EXISTS (
        SELECT 1 FROM user_bills
        WHERE user_bills.user_id = bills.added_by_id AND user_bills.bill_id = bills.id
      );
    `;
    console.log('Bill creators added to user_bills table successfully.');

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

addUserBillsTable().catch(console.error); 