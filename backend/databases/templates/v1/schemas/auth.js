import mongoose from "mongoose";
import { handlers } from "./handlers.js";

const timestamps = handlers.timestamps;

// user
const person = {
  names: {
    collection: "persons",
    model: "Person",
  },
  definition: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: String,
    birthdate: Date,
    address: String,
    contactNumber1: String,
    contactNumber2: String,
    ...timestamps.definition,
  },
  map: {
    firstName: { type: "String", required: true },
    middleName: "String",
    lastName: { type: "String", required: true },
    birthdate: "Date",
    address: "String",
    contactNumber1: "String",
    contactNumber2: "String",
    ...timestamps.map,
  },
  data: [],
};
const userType = {
  names: {
    collection: "userTypes",
    model: "UserType",
  },
  definition: {
    name: { type: String, required: true },
    type: Number,
    ...timestamps.definition,
  },
  map: {
    name: { type: "String", required: true },
    type: "Number",
    ...timestamps.map,
  },
  data: [
    { name: "Normal", type: 0 },
    { name: "Administrator", type: 1 },
    { name: "Technical Administrator", type: 2 },
  ],
};
const user = {
  names: {
    collection: "users",
    model: "User",
  },
  definition: {
    // references
    Person: { type: mongoose.Schema.Types.ObjectId, ref: "Person" },
    UserType: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserType" }],
    // standard login
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // email
    emailConfirmed: { type: Boolean, default: false },
    // contact number
    contactNumber1: Number,
    contactNumber2: Number,
    // socials logins
    GoogleProviderId: String,
    FacebookProviderId: String,
    GitHubProviderId: String,
    //
    ...timestamps.definition,
  },
  map: {
    // references
    Person: { type: "ObjectId", ref: "Person" },
    UserType: { type: "Array", items: { type: "ObjectId", ref: "UserType" } },
    // standard login
    email: { type: "String", required: true, unique: true },
    password: { type: "String", required: true },
    // email
    emailConfirmed: { type: "Boolean", default: false },
    // contact number
    contactNumber1: "Number",
    contactNumber2: "Number",
    // socials logins
    GoogleProviderId: "String",
    FacebookProviderId: "String",
    GitHubProviderId: "String",
    //
    ...timestamps.map,
  },
  data: [],
};

// user sessions
const session = {
  names: {
    collection: "sessions",
    model: "Session",
  },
  definition: {
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: { type: String, required: true, unique: true },
    oldToken: { type: String, default: null },
    accessJti: { type: String },
    ip: String,
    userAgent: String,
    expiresAt: { type: Date, required: true },
    ...timestamps.definition,
  },
  map: {
    User: { type: "ObjectId", ref: "User", required: true },
    token: { type: "String", required: true, unique: true },
    oldToken: { type: "String", default: null },
    accessJti: { type: "String" },
    ip: "String",
    userAgent: "String",
    expiresAt: { type: "Date", required: true },
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

export const authCollections = {
  person,
  userType,
  user,
  //
  session,
};
