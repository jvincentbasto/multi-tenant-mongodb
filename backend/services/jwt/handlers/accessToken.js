import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

import { entryConfigs } from "../../../configs/config.js";
import { config as jwtConfig } from "../main/config.js";

const { db: configDb } = entryConfigs.configs;

const { secrets } = jwtConfig.envs;
const secret = secrets.accessToken;

const config = {
  // tokenName: "accessToken",
  tokenName: "at",
  placeholder: "Bearer",
  expiresIn: "15m",
  // maxAge: 15 * 60 * 1000,
  maxAge: 60 * 60 * 1000,
  // expiresIn: "1m",
};

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
const generateToken = async (payload = {}, params = {}, options = {}) => {
  const { body = {}, expiresIn = config.expiresIn, ...rest } = payload;

  const payloadJwt = { ...body, iss: "", aud: "" };
  const token = jwt.sign(payloadJwt, secret, { expiresIn, ...rest });
  return token;
};
const getToken = async (payload = {}, params = {}, options = {}) => {
  const { req, res } = payload;

  const headers = req.headers || {};
  const authorization = headers["authorization"] ?? headers["Authorization"];
  if (!authorization) return null;

  const [_, token] = authorization.split(" ") ?? [];
  return token;
};
const verifyToken = async (payload = {}, params = {}, options = {}) => {
  const { token, name = config.tokenName } = payload;

  if (!token) return null;

  let decoded;
  try {
    decoded = jwt.verify(token, secret) ?? null;
  } catch {
    decoded = null;
  }

  return decoded;
};
const setName = (payload = {}, params = {}, options = {}) => {
  const { token, placeholder = config.placeholder } = payload;

  const value = `${placeholder} ${token}`;
  return value;
};

export const accessToken = {
  config,
  getTokenName,
  getSessionInfo,
  generateJti,
  generateToken,
  getToken,
  verifyToken,
  setName,
};
