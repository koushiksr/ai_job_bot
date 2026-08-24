/**
 * src/lib/mongodb.ts
 * Global MongoDB Atlas Connection Pool for Next.js App Router API routes.
 * Supports hot-reloading in dev and persistent connection in production.
 */

import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI || ''
const dbName = process.env.MONGODB_DB_NAME || 'ai_job_bot'

interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>
}

declare const global: GlobalWithMongo

let clientPromise: Promise<MongoClient> | null = null

export function isMongoConfigured(): boolean {
  return Boolean(uri && !uri.includes('<db_password>'))
}

export function getMongoClientPromise(): Promise<MongoClient> | null {
  if (!isMongoConfigured()) {
    return null
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
      })
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  } else {
    if (!clientPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 15,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
      })
      clientPromise = client.connect()
    }
    return clientPromise
  }
}

export async function getDb(): Promise<Db | null> {
  const promise = getMongoClientPromise()
  if (!promise) return null
  try {
    const client = await promise
    return client.db(dbName)
  } catch (err) {
    console.error('[MongoDB Error]', err)
    return null
  }
}
