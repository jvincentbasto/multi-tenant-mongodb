import { accessToken } from "../accessToken.js";
import { refreshToken } from "../refreshToken.js";

// node -> require('crypto').randomBytes(64).toString('hex');
export const handlers = {
  accessToken,
  refreshToken,
};
