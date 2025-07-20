import { handlers } from "./handlers.js";
import { schemaCollections } from "./schemas.js";
import { authCollections } from "./auth.js";
import { appCollections } from "./app.js";
import { tokenCollections } from "./tokens.js";
import { permissionCollections } from "./permissions.js";
import { testCollections } from "./tests.js";

// Initial
const collections = {
  schemas: schemaCollections,
  auth: authCollections,
  app: appCollections,
  tokens: tokenCollections,
  permissions: permissionCollections,
  tests: testCollections,
};
const allCollections = {
  ...schemaCollections,
  ...authCollections,
  ...appCollections,
  ...tokenCollections,
  ...permissionCollections,
  ...testCollections,
};
const groupCollections = {
  all: allCollections,
  schemas: schemaCollections,
  auth: authCollections,
  app: appCollections,
  tokens: tokenCollections,
  permissions: permissionCollections,
  tests: testCollections,
};

export const schemas = {
  ...collections,
  groups: groupCollections,
  handlers,
};
