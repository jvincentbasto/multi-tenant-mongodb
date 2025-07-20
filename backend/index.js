import { entries } from "./configs/entry.js";

const { getDatabases, getRouters } = entries;
const { setup, connect, getDomains } = getDatabases();

// startup db
const startupDb = async () => {
  try {
    // setup
    const successSetup = await setup();
    const successsDb = await connect();

    const success = successSetup && successsDb;
    if (!success) {
      throw new Error("Failed to Start Database");
    }

    return success;
  } catch (err) {
    console.error("Failed to start Database:", err.message);
    return false;
  }
};
const success = await startupDb();

// startup servers
const { express, fastify } = getRouters();
await express({ success, getDomains });
// await fastify({ success, getDomains })
