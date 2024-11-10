import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

class Mongo {
  private static instance: Promise<MongoClient>;

  static getInstance(): Promise<MongoClient> {
    if (!this.instance) {
      const client = new MongoClient(uri, options);
      
      if (process.env.NODE_ENV === 'development') {
        // In development mode, use a global variable so that the value
        // is preserved across module reloads caused by HMR (Hot Module Replacement).
        if (!global._mongoClientPromise) {
          global._mongoClientPromise = client.connect()
            .then((client) => {
              console.log('Connected to MongoDB');
              return client;
            })
            .catch((error) => {
              console.error('Failed to connect to MongoDB:', error);
              throw error;
            });
        }
        this.instance = global._mongoClientPromise;
      } else {
        // In production mode, it's best to not use a global variable.
        this.instance = client.connect()
          .then((client) => {
            console.log('Connected to MongoDB');
            return client;
          })
          .catch((error) => {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
          });
      }
    }
    return this.instance;
  }
}

// Export a module-scoped MongoClient promise
const clientPromise = Mongo.getInstance();

export default clientPromise;

// Helper function to get database instance
export async function getDb(dbName = 'brain-dump') {
  const client = await clientPromise;
  return client.db(dbName);
}

// Helper function to get collection
export async function getCollection(collectionName: string, dbName = 'brain-dump') {
  const db = await getDb(dbName);
  return db.collection(collectionName);
}
