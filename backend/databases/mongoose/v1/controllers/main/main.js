import { setup } from "../setup.js";
import { databases } from "../databases.js";
import { collections } from "../collections.js";
import { schemas } from "../schemas.js";
import { authHandlers } from "../auths/main.js";
import { apps } from "../apps.js";
import { entities } from "../entities/main.js";
import { documents } from "../documents.js";

export const controllers = {
  setup,
  databases,
  collections,
  schemas,
  auths: authHandlers,
  entities,
  apps,
  documents,
};
