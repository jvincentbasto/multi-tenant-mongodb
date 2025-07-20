import { cookieHandlers } from "../cookies.js";
import { corsOptions } from "../cors.js";
import { handlers } from "../handlers.js";
import { config } from "./config.js";

export const corsHandlers = {
  config,
  handlers,
  cookies: cookieHandlers,
  cors: corsOptions,
};
