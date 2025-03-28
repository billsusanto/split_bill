-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unique_id VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_trips join table
CREATE TABLE IF NOT EXISTS user_trips (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, trip_id)
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  added_by_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_bill_items join table
CREATE TABLE IF NOT EXISTS user_bill_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bill_item_id INTEGER NOT NULL REFERENCES bill_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, bill_item_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_trips_user_id ON user_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trips_trip_id ON user_trips(trip_id);
CREATE INDEX IF NOT EXISTS idx_bills_trip_id ON bills(trip_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_user_bill_items_user_id ON user_bill_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bill_items_bill_item_id ON user_bill_items(bill_item_id); 