import jwt from "jsonwebtoken";

import crypto from "crypto";
import { randomUUID } from "crypto";
import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";

import { entryConfigs } from "../../../configs/config.js";
import { config as jwtConfig } from "../main/config.js";
import { corsHandlers } from "../../cors/main/main.js";

const { db: configDb } = entryConfigs.configs;

const { secrets } = jwtConfig.envs;
const secret = secrets.refreshToken;
const { cookies: cookieHandlers } = corsHandlers;

const config = {
  // tokenName: "refreshToken",
  tokenName: "rt",
  placeholder: "Bearer",
  expiresIn: "7d",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

//
const hashTokenKey = (key) => {
  const value = crypto
    .createHash("sha256")
    .update(key)
    .digest("hex")
    .slice(0, 12); // Trim to 12 chars
  return value;
};
const getTokenName = async (payload = {}, params = {}, options = {}) => {
  const {
    req,
    res,
    name = config.tokenName,
    region = configDb.region,
    env = configDb.env,
  } = payload;

  const headers = req.headers || {};
  const host = headers["host"];

  const key = `${env}_${region}_${host}`;
  const hash = hashTokenKey(key);
  const tokenName = `${name}_${hash}`;
  // const tokenName = `${name}`;

  return tokenName;
};
const getSessionInfo = async (payload = {}, params = {}, options = {}) => {
  const { req, res } = payload;

  const headers = req.headers || {};
  const socket = req.socket ?? {};

  const host = headers["host"];
  const userAgent = headers["user-agent"];
  const ip = headers["x-forwarded-for"] ?? socket?.remoteAddress;

  const session = {
    // host,
    userAgent,
    ip,
  };

  return session;
};

//
const generateJti = async (payload = {}, params = {}, options = {}) => {
  const {} = payload;
  const { type = 0 } = params;

  let id;
  if (type === 1) {
    id = randomUUID();
  } else {
    id = randomUUID();
  }

  return id;
};
const generateId = async (payload = {}, params = {}, options = {}) => {
  const {} = payload;
  const { type = 0 } = params;

  let id;
  if (type === 1) {
    id = uuidv4();
  } else {
    id = nanoid();
  }

  return id;
};
const generateToken = async (payload = {}, params = {}, options = {}) => {
  const { body = {}, expiresIn = config.expiresIn, ...rest } = payload;

  // const category = { env: "", region: "", project: "" }
  const payloadJwt = { ...body, iss: "", aud: "" };
  const token = jwt.sign(payloadJwt, secret, { expiresIn, ...rest });
  return token;
};
const verifyToken = async (payload = {}, params = {}, options = {}) => {
  const { token } = payload;

  if (!token) return null;

  let decoded;
  try {
    decoded = jwt.verify(token, secret) ?? null;
  } catch {
    decoded = null;
  }

  return decoded;
};
const getCookie = async (payload = {}, params = {}, options = {}) => {
  const { req, res, name = config.tokenName, region, env } = payload;

  const cookieName = await getTokenName({ req, res, name, region, env });
  const token = req.cookies?.[cookieName];

  if (!token) return null;
  return token;
};
const setCookie = async (payload = {}, params = {}, options = {}) => {
  const {
    req,
    res,
    name = config.tokenName,
    region,
    env,
    token,
    maxAge = config.maxAge,
  } = payload;

  const cookieName = await getTokenName({ req, res, name, region, env });

  const cookieOptions = await cookieHandlers.getHandler({ req, res });
  res.cookie(cookieName, token, {
    ...cookieOptions,
    maxAge,
  });

  return token;
};
const clearCookie = async (payload = {}, params = {}, options = {}) => {
  const { req, res, name = config.tokenName, region, env } = payload;

  const cookieName = await getTokenName({ req, res, name, region, env });
  res.clearCookie(cookieName);
};
const setName = (payload = {}, params = {}, options = {}) => {
  const { token, placeholder = config.placeholder } = payload;

  const value = `${placeholder} ${token}`;
  return value;
};

export const refreshToken = {
  config,
  getTokenName,
  getSessionInfo,
  generateJti,
  generateId,
  generateToken,
  verifyToken,
  getCookie,
  setCookie,
  clearCookie,
  setName,
};
