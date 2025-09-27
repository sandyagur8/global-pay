# Database Setup Guide

## Quick Setup (For Development)

### Option 1: Use Vercel Postgres (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new Postgres database
3. Copy the connection string
4. Add to `.env.local`:
   ```
   DATABASE_URL="your-vercel-postgres-connection-string"
   ```

### Option 2: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE globalpay;
   ```
3. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/globalpay"
   ```

### Option 3: Docker PostgreSQL
1. Run PostgreSQL in Docker:
   ```bash
   docker run --name globalpay-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=globalpay -p 5432:5432 -d postgres
   ```
2. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/globalpay"
   ```

## After Database Setup

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Run Migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Restart Development Server:**
   ```bash
   npm run dev
   ```

## Current Status

The app currently works **without a database** using mock data for development and testing. The signup flow and route protection work perfectly.

**To enable full database functionality:**
1. Set up a database using one of the options above
2. Run the migration commands
3. The app will automatically use the real database

## Features Working Without Database

✅ **Signup Flow** - Uses mock data  
✅ **Route Protection** - Based on user type  
✅ **UI Components** - All working perfectly  
✅ **Web3 Integration** - Wallet connection works  

## Features Requiring Database

🔄 **User Persistence** - Currently uses session storage  
🔄 **Organization Management** - Currently uses mock data  
🔄 **Employee Records** - Currently uses mock data  

The app is fully functional for UI/UX testing and development!
