import mongoose from "mongoose";
import { handlers } from "./handlers.js";

const timestamps = handlers.timestamps;

// role
const role = {
  names: {
    collection: "roles",
    model: "Role",
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

// permission fields
const permissionSubject = {
  names: {
    collection: "permissionSubjects",
    model: "PermissionSubject",
  },
  definition: {
    name: { type: String, required: true },
    ...timestamps.definition,
  },
  map: {
    name: { type: "String", required: true },
    ...timestamps.map,
  },
  data: [
    { name: "User" },
    { name: "Role" },
    { name: "Environment" },
    { name: "Organization" },
    { name: "Workspace" },
  ],
};
const permissionAction = {
  names: {
    collection: "permissionActions",
    model: "PermissionAction",
  },
  definition: {
    name: { type: String, required: true },
    ...timestamps.definition,
  },
  map: {
    name: { type: "String", required: true },
    ...timestamps.map,
  },
  data: [
    { name: "read" },
    { name: "create" },
    { name: "update" },
    { name: "delete" },
    //
    { name: "bulkCreate" },
    { name: "bulkUpdate" },
    { name: "bulkDelete" },
  ],
};
const permissionResource = {
  names: {
    collection: "permissionResources",
    model: "PermissionResource",
  },
  definition: {
    name: { type: String, required: true },
    ...timestamps.definition,
  },
  map: {
    name: { type: "String", required: true },
    ...timestamps.map,
  },
  data: [
    { name: "Role" },
    { name: "Environment" },
    { name: "Organization" },
    { name: "Workspace" },
    //
    { name: "Post" },
    { name: "Comment" },
    { name: "Blog" },
  ],
};
const permissionScope = {
  names: {
    collection: "permissionScopes",
    model: "PermissionScope",
  },
  definition: {
    name: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed },
    ...timestamps.definition,
  },
  map: {
    name: { type: "String", required: true },
    value: { type: "Mixed" },
    ...timestamps.map,
  },
  data: [
    { name: "Role" },
    { name: "Environment" },
    { name: "Organization" },
    { name: "Workspace" },
    //
    { name: "Post" },
    { name: "Comment" },
    { name: "Blog" },
  ],
};

// permission
const permission = {
  names: {
    collection: "permissions",
    model: "Permission",
  },
  definition: {
    // subject
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PermissionSubject",
      required: true,
    },
    subjectRefId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // action
    action: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PermissionAction",
      required: true,
    },
    // resource
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PermissionResource",
      required: true,
    },
    resourceRefId: { type: mongoose.Schema.Types.ObjectId },
    // scope
    scope: [{ type: mongoose.Schema.Types.ObjectId, ref: "PermissionScope" }],
    ...timestamps.definition,
  },
  map: {
    // subject
    subject: {
      type: "ObjectId",
      ref: "PermissionSubject",
      required: true,
    },
    subjectRefId: { type: "ObjectId", required: true },
    // action
    action: {
      type: "ObjectId",
      ref: "PermissionAction",
      required: true,
    },
    // resource
    resource: {
      type: "ObjectId",
      ref: "PermissionResource",
      required: true,
    },
    resourceRefId: { type: "ObjectId" },
    // scope
    scope: {
      type: "Array",
      items: { type: "ObjectId", ref: "PermissionScope" },
    },
    ...timestamps.map,
  },
  indices: [
    {
      name: "subjectRefId",
      keys: { subjectRefId: 1 },
    },
    {
      name: "action",
      keys: { action: 1 },
    },
    {
      name: "resourceRefId",
      keys: { resourceRefId: 1 },
    },
  ],
  data: [],
};

export const permissionCollections = {
  role,
  permissionSubject,
  permissionAction,
  permissionResource,
  permissionScope,
  permission,
};

// // sample mongoose
// const hasPermission = await Permission.exists({
//   subjectRefId: user._id,
//   action: action._id,
//   resource: resource._id,
//   permissionData: { $in: [orgPermissionDataId] }
// });

// // sample mongo native
// const db = client.db("yourdb");
// const result = await db.collection("permissions").findOne({
//   subjectRefId: userId,
//   action: actionId,
//   resource: resourceId,
//   permissionData: {
//     $elemMatch: { name: "org", value: "myorg" }
//   }
// });
