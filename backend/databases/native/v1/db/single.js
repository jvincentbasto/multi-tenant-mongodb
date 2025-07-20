import { entryConfigs } from "@/dbs/configs/config";
import { MongoClient } from "mongodb";

// const { env } = entryConfigs
// const uri = env.uri.asia.dev
const uri = process.env.MONGODB_URI_CLIENT;
if (!uri) {
  throw new Error("Database URI not found.");
}

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
const clientPromise = global._mongoClientPromise;

const getMongodbClient = async () => {
  return await clientPromise;
};
const connectMongdb = async (name) => {
  const client = await clientPromise;
  const db = client.db(name);

  return db;
};

export const singleDb = {
  getClient: getMongodbClient,
  connect: connectMongdb,
};
