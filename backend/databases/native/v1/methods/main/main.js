import { authHandlers } from "../auths/main";
import { collections } from "../collections";
import { databases } from "../databases";
import { documents } from "../documents";
import { entities } from "../entities/main";
import { schemas } from "../schemas";
import { setup } from "../setup";

export const methods = {
  setup,
  databases,
  collections,
  schemas,
  documents,
  entities,
  auths: authHandlers,
};
