import mongoose from "mongoose";
import { handlers } from "./handlers.js";

const timestamps = handlers.timestamps;

const appStatus = {
  options: {
    adminOnly: true,
  },
  names: {
    collection: "appStatus",
    model: "AppStatus",
  },
  definition: {
    name: String,
    description: String,
    ...timestamps.definition,
  },
  map: {
    name: "String",
    description: "String",
    ...timestamps.map,
  },
  data: [
    {
      name: "active",
    },
    {
      name: "inaactive",
    },
    {
      name: "archived",
    },
    {
      name: "maintenance",
    },
  ],
};
const appOwner = {
  options: {
    adminOnly: true,
  },
  names: {
    collection: "appOwners",
    model: "AppOwner",
  },
  definition: {
    name: String,
    description: String,
    ...timestamps.definition,
  },
  map: {
    name: "String",
    description: "String",
    ...timestamps.map,
  },
  data: [],
};
const apps = {
  options: {
    adminOnly: true,
  },
  names: {
    collection: "apps",
    model: "Apps",
  },
  definition: {
    name: { type: String, required: true, unique: true },
    slug: String,
    AppStatus: { type: mongoose.Schema.Types.ObjectId, ref: "AppStatus" },
    AppOwner: { type: mongoose.Schema.Types.ObjectId, ref: "AppOwner" },
    description: String,
    // images
    logo: String,
    images: String, // string[]
    // urls
    domains: String, // string[]
    apiUrl: String, // string[]
    frontendUrl: String, // string[]
    //
    dbName: String,
    collections: String, // string[]
    //
    techTags: String, // string[]
    envs: String, // string[]
    versions: String, // string[]
    features: String, // string[]
    //
    public: Boolean,
    //
    publishedAt: Date,
    ...timestamps.definition,
  },
  map: {
    name: { type: "String", required: true, unique: true },
    slug: "String",
    AppStatus: { type: "ObjectId", ref: "AppStatus" },
    AppOwner: { type: "ObjectId", ref: "AppOwner" },
    description: "String",
    // images
    logo: "String",
    images: "String", // string[]
    // urls
    domains: "String", // string[]
    apiUrl: "String", // string[]
    frontendUrl: "String", // string[]
    //
    dbName: "String",
    collections: "String", // string[]
    //
    techTags: "String", // string[]
    envs: "String", // string[]
    versions: "String", // string[]
    features: "String", // string[]
    //
    public: Boolean,
    //
    publishedAt: Date,
    ...timestamps.map,
  },
  indices: [
    {
      name: "expiresAt",
      keys: { expiresAt: 1 },
      options: { expireAfterSeconds: 0 },
    },
  ],
  data: [
    {
      name: "AppCreator",
      domains: '["http://localhost:3000"]',
    },
    {
      name: "EntityCreator",
      domains: '["http://localhost:3001"]',
    },
    {
      name: "EntityDashboard",
      domains: '["http://localhost:3002"]',
    },
  ],
};

export const appCollections = {
  apps,
  appStatus,
  appOwner,
};
