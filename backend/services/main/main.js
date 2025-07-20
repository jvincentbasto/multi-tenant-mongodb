import { jwtHandlers } from "../jwt/main/main.js";
import { mailtrapHandlers } from "../mailtrap/main/main.js";

export const services = {
  jwt: jwtHandlers,
  mailtrap: mailtrapHandlers,
};
