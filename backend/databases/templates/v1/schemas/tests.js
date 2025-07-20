import mongoose from "mongoose";
import { handlers } from "./handlers.js";

const timestamps = handlers.timestamps;

const tests = {
  names: {
    collection: "tests",
    model: "Tests",
  },
  definition: {
    name: String,
    expiresAt: Date,
    ...timestamps.definition,
  },
  map: {
    name: "String",
    expiresAt: "Date",
    ...timestamps.map,
  },
  indices: [
    {
      name: "expiresAt",
      keys: { expiresAt: 1 },
      options: { expireAfterSeconds: 0 },
    },
  ],
  data: [],
};

export const testCollections = {
  tests,
};
