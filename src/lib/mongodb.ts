import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

const DB_NAME = 'Brain-Dump-Database';

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

let clientPromise: Promise<MongoClient>;

async function connectToDatabase(): Promise<MongoClient> {
  try {
    const client = new MongoClient(uri, options);
    console.log('Attempting to connect to MongoDB...');
    const connectedClient = await client.connect();
    console.log('Successfully connected to MongoDB');
    
    // Test the connection by accessing our database
    const db = connectedClient.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log(`Connected to ${DB_NAME}. Available collections:`, collections.map(col => col.name));
    
    return connectedClient;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectToDatabase();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = connectToDatabase();
}

export default clientPromise;

// Helper function to get database instance
export async function getDb(dbName = DB_NAME) {
  try {
    console.log(`Getting database: ${dbName}`);
    const client = await clientPromise;
    const db = client.db(dbName);
    
    // Test database access by listing collections
    const collections = await db.listCollections().toArray();
    console.log(`Collections in ${dbName}:`, collections.map(col => col.name));
    
    return db;
  } catch (error) {
    console.error(`Failed to get database ${dbName}:`, error);
    throw error;
  }
}

// Helper function to get collection
export async function getCollection(collectionName: string, dbName = DB_NAME) {
  try {
    console.log(`Getting collection: ${collectionName} from database: ${dbName}`);
    const db = await getDb(dbName);
    return db.collection(collectionName);
  } catch (error) {
    console.error(`Failed to get collection ${collectionName}:`, error);
    throw error;
  }
}

// Helper function to check database connection
export async function checkConnection() {
  try {
    console.log('Checking database connection...');
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const result = await db.command({ ping: 1 });
    console.log('Database ping result:', result);
    return result.ok === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
