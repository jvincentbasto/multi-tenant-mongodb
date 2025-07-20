import { db } from "../db/main.js";
import { schemas } from "../schemas/main/main.js";
import { models } from "../models/main/main.js";
import { middlewares } from "../middlewares/main/main.js";
import { controllers } from "../controllers/main/main.js";

export const mongooseV1 = {
  db,
  schemas,
  models,
  middlewares,
  controllers,
};
