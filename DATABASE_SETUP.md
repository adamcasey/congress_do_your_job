# Database Setup Complete! 🎉

Your CongressDoYourJob.com database infrastructure is now fully configured with MongoDB and Prisma.

## ✅ What Was Created

### 1. **Prisma Schema** (`prisma/schema.prisma`)
Complete database schema with:
- **Users** - User accounts with embedded representatives
- **ElectedOfficials** - All federal/state/local officials
- **Scorecards** - Historical performance tracking
- **Petitions** - Petition campaigns
- **PetitionSignatures** - User petition actions
- **DigestEditions** - Weekly summaries

**Key Features:**
- MongoDB-optimized with embedded documents and references
- Compound indexes for common queries
- Transparent scorecard methodology tracking
- Denormalized data for performance

### 2. **Database Connection Files** (`src/lib/`)
- **`prisma.ts`** - Prisma Client singleton (use for 80% of queries)
- **`mongodb.ts`** - Raw MongoDB client (for complex aggregations)
- **`db.ts`** - Unified export (import this in your code!)

### 3. **Seed Script** (`prisma/seed.ts`)
Sample data including:
- 4 Colorado elected officials (2 senators, 2 representatives)
- Scorecard records for each official
- 1 demo user with saved representatives
- 2 sample petitions

### 4. **TypeScript Types** (`src/types/index.ts`)
Shared types for API responses, dashboards, and more

### 5. **NPM Scripts** (added to `package.json`)
```bash
npm run db:generate  # Generate Prisma Client
npm run db:push      # Sync schema to MongoDB
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Run seed script
```

### 6. **Environment Variables** (`.env`)
Added MongoDB connection string placeholder

---

## 🚀 Next Steps

### Step 1: Set Up MongoDB Atlas

1. **Create a MongoDB Atlas account** (free tier available):
   - Go to https://cloud.mongodb.com
   - Sign up and create a new account

2. **Create a new cluster**:
   - Click "Build a Database"
   - Choose the **FREE M0 Shared** cluster
   - Select a cloud provider and region (choose one close to you)
   - Name your cluster (e.g., "congressdoyourjob")

3. **Create a database user**:
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and password (save these!)
   - Set user privileges to "Read and write to any database"

4. **Configure network access**:
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses

5. **Get your connection string**:
   - Go back to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It will look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

6. **Update your `.env` file**:
   ```bash
   MONGODB_URI="mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/congressdoyourjob?retryWrites=true&w=majority"
   ```

   Replace:
   - `your_username` with your database username
   - `your_password` with your database password
   - `cluster0.xxxxx` with your actual cluster address
   - Add `/congressdoyourjob` before the `?` to specify the database name

### Step 2: Initialize Your Database

Once your `.env` file is configured with the MongoDB URI:

```bash
# Generate the Prisma Client (already done!)
npm run db:generate

# Push the schema to MongoDB (creates collections and indexes)
npm run db:push

# Seed the database with sample data
npm run db:seed
```

### Step 3: Verify Everything Works

1. **Open Prisma Studio** to view your data:
   ```bash
   npm run db:studio
   ```
   This opens a GUI at http://localhost:5555 where you can browse all your data

2. **Test the database connection** in your code:
   ```typescript
   import { prisma } from '@/lib/db';

   // Fetch all elected officials
   const officials = await prisma.electedOfficial.findMany({
     where: { level: 'federal' },
     take: 10,
   });

   console.log(officials);
   ```

---

## 📖 Usage Examples

### Using Prisma (Recommended for most queries)

```typescript
import { prisma } from '@/lib/db';

// Find user by Clerk ID
const user = await prisma.user.findUnique({
  where: { clerkId: 'user_123' },
});

// Find officials with high scores
const topOfficials = await prisma.electedOfficial.findMany({
  where: {
    currentScore: { gte: 80 },
    level: 'federal',
  },
  orderBy: { currentScore: 'desc' },
  take: 10,
});

// Create a petition signature
const signature = await prisma.petitionSignature.create({
  data: {
    petitionId: 'petition_id_here',
    userId: 'user_id_here',
    deliveryMethod: 'email',
    deliveryStatus: 'pending',
  },
});
```

### Using MongoDB (For complex aggregations)

```typescript
import { getCollection } from '@/lib/db';

// Complex analytics query
const scorecards = await getCollection('scorecards');
const analytics = await scorecards.aggregate([
  { $match: { periodType: 'weekly' } },
  {
    $group: {
      _id: '$officialId',
      avgScore: { $avg: '$totalScore' },
      scoreHistory: { $push: '$totalScore' },
    },
  },
  { $sort: { avgScore: -1 } },
  { $limit: 10 },
]).toArray();
```

---

## 🎯 Decision Guide: Prisma vs MongoDB

### Use Prisma for:
- ✅ Simple CRUD operations
- ✅ Finding records by ID or simple filters
- ✅ Creating/updating/deleting records
- ✅ Relations and joins
- ✅ Type-safe queries
- ✅ 80% of your database operations

### Use Raw MongoDB for:
- ✅ Complex aggregations (grouping, averages, etc.)
- ✅ Geospatial queries
- ✅ Full-text search
- ✅ Analytics and reporting
- ✅ Operations requiring raw MongoDB power

---

## 🗂️ Database Schema Overview

### Users Collection
Stores user accounts with **embedded** representatives for fast lookups.

```typescript
{
  clerkId: "user_123",
  email: "user@example.com",
  address: "123 Main St, Denver, CO 80202",
  representatives: [
    {
      officialId: "official_id_123",
      name: "Michael Bennet",
      office: "U.S. Senator",
      level: "federal"
    }
  ],
  membershipTier: "basic"
}
```

### ElectedOfficials Collection
Stores all elected officials with contact info and current scores.

```typescript
{
  fullName: "Michael Bennet",
  office: "U.S. Senator",
  level: "federal",
  jurisdiction: "United States",
  bioguideId: "B001267",
  currentScore: 72.5,
  socialMedia: {
    twitter: "@SenBennetCO"
  }
}
```

### Scorecards Collection
Historical performance tracking with transparent methodology.

```typescript
{
  officialId: "official_id_123",
  periodType: "weekly",
  totalScore: 72.5,
  components: [
    {
      category: "bipartisanship",
      score: 75,
      weight: 0.3,
      details: { billsCosponsored: 8 }
    }
  ],
  methodology: "v1.0"
}
```

---

## 🔧 Troubleshooting

### Issue: "Environment variable not found: MONGODB_URI"
**Solution:** Make sure your `.env` file exists and contains the `MONGODB_URI` variable.

### Issue: "Authentication failed" when connecting to MongoDB
**Solution:**
1. Check that your username and password are correct in the connection string
2. Make sure you created a database user (not just a MongoDB Atlas account)
3. Ensure your IP address is whitelisted in Network Access

### Issue: "Cannot find module '@prisma/client'"
**Solution:** Run `npm run db:generate` to generate the Prisma Client

### Issue: Prisma Studio won't open
**Solution:**
1. Make sure your MongoDB connection is working
2. Try `npx prisma studio` directly
3. Check that port 5555 is not already in use

---

## 📚 Additional Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **MongoDB Atlas Docs:** https://www.mongodb.com/docs/atlas
- **Prisma with MongoDB:** https://www.prisma.io/docs/concepts/database-connectors/mongodb
- **Next.js API Routes:** https://nextjs.org/docs/api-routes/introduction

---

## 🎨 What's Special About This Setup

1. **Hybrid Approach** - Best of Prisma (type safety) AND MongoDB (flexibility)
2. **Production-Ready** - Proper indexes, error handling, and connection pooling
3. **Scalable** - Embedded docs for performance, references for flexibility
4. **Transparent** - All scoring algorithms tracked via `methodology` field
5. **Type-Safe** - Full TypeScript support with Prisma-generated types

---

**You're all set! 🚀**

Once you've configured your MongoDB Atlas connection, run the seed script and start building features!
