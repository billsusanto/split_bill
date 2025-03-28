# Split Bill App

A web application to help groups split bills during trips.

## Features

- User signup with just a name
- Create trips and invite others by sharing a unique ID and password
- Add bills to trips
- Add items to bills and select which items you want to pay for
- See your total share of each bill automatically calculated

## Tech Stack

- **Frontend**: Next.js, React, and Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM and Neon Database

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL database (we recommend using [Neon](https://neon.tech))

### Setup

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Create a `.env.local` file with your database connection string:
   ```
   DATABASE_URL=postgres://your-connection-string
   ```
4. Run database migrations
   ```
   npm run migrate
   ```
5. Start the development server
   ```
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

- **Users**: Store user information
- **Trips**: Store trip information with a unique ID and password
- **UserTrips**: Junction table for users and trips
- **Bills**: Store bill information with a link to the trip
- **BillItems**: Store individual items in a bill
- **UserBillItems**: Junction table to track which users are paying for which items

## Deployment

This app can be deployed to any platform that supports Next.js, such as Vercel or Netlify.

1. Connect your GitHub repository to the platform
2. Set the `DATABASE_URL` environment variable
3. Deploy

## License

MIT
