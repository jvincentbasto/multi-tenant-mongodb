import { config } from "./config.js";
import { templates } from "../templates/main/main.js";
import { handlers } from "../handlers/main/main.js";
import { clients } from "./client/main.js";

export const mailtrapHandlers = {
  config,
  clients,
  templates,
  handlers,
};
