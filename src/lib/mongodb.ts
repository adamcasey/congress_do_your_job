/**
 * Raw MongoDB Client
 *
 * Use this for:
 * - Complex aggregations
 * - Geospatial queries
 * - Full-text search
 * - Analytics and reporting
 * - Operations that need raw MongoDB power
 */

import { MongoClient, Db, Document } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable to preserve the client across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Get the MongoDB database instance
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(); // Uses database from connection string
}

/**
 * Get a specific collection (with type safety)
 */
export async function getCollection<T extends Document = Document>(collectionName: string) {
  const db = await getDb();
  return db.collection<T>(collectionName);
}

export { clientPromise };
export default clientPromise;
