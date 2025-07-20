import { handlers } from "./handlers.js";
import { config } from "./main/config.js";

// SAMPLES
// only for Frontend and Cross-origin
// fetch for all requests: (get, post, put, delete, options, etc)
const sampleCredentials = "include";

// only for Backend and Cross-origin (CORS response headers)
const allowedOrigins = ["https://myapp.com", "https://staging.myapp.com"];
const stringOrigins = allowedOrigins.includes("req.headers.origin")
  ? "req.headers.origin"
  : "";
const responseHeaders = {
  // response headers for domain/site configs
  "Access-Control-Allow-Origin": stringOrigins,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",

  // REQUIRED: "OPTIONS" -> Its an automatic request from the browser
  // before the actual request (POST/PUT/DELETE/etc.) to check if the server accepts it.

  // This happens when:
  // -> The method is not GET/POST
  // -> credentials: 'include' or has custom headers
  // Without this, your browser will block the actual request.

  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};
const sampleCors = {
  allowedOrigins,
  stringOrigins,
  responseHeaders,
};

// NOTE: You must manually configure CORS when:
// -> Your frontend and backend are on different origins (cross-origins).
// -> You're using cookies or Authorization headers.
// -> You want to secure your API by allowing only specific frontend origins.

// only for Cross-origin
const credentials = "include";
const corsResponseHeaders = {
  // default (all domains) = "*"
  "Access-Control-Allow-Origin": "yourdomain.com, your-subdomain.domain.com",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// credentials
const sameDomainCredentials = {
  // no need
};
const separateCredentials = {
  credentials: "include",
};
const domainCredentialOptions = {
  same: sameDomainCredentials,
  separate: separateCredentials,
};

// cors
const getCorsHeaders = async (payload = {}) => {
  const {
    req,
    res,
    methods,
    domains = [],
    enableHeader = true,
    ...rest
  } = payload;

  //
  // const headers = req.headers;
  const originType = await handlers.getOriginType({ req, res });
  const { origin, referer, currentOrigin } = originType.headers;
  const isProduction = originType.isProduction;

  // const currentMethods = methods ?? "GET, POST, PUT, PATCH, DELETE, OPTIONS";
  const currentMethods = methods ?? "GET, POST, PUT, DELETE, OPTIONS";

  //
  const currentDomains = [config.base, ...domains];
  let hostname = "";
  try {
    hostname = currentOrigin ? new URL(currentOrigin).hostname : "";
  } catch (e) {
    hostname = "";
  }

  const isAllowed = currentDomains.some((domain) => {
    const valid = hostname === domain || hostname.endsWith(`.${domain}`);
    return valid;
  });

  //
  const isValidOrigin = isAllowed && isProduction;
  const cors = {
    "Access-Control-Allow-Origin": isValidOrigin ? origin : "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": currentMethods,
    ...(rest ?? {}),
  };

  if (res) {
    for (const [key, value] of Object.entries(cors)) {
      res.setHeader(key, value);
    }
  }
};
const sameDomainCors = {
  // no need
  get: () => {},
};
const separateDomainCors = {
  get: getCorsHeaders,
};
const getCorsHandler = async (payload = {}, params = {}, options = {}) => {
  const { req, res } = payload;

  const originType = await handlers.getOriginType({ req, res });
  const option = originType.origin === 1 ? sameDomainCors : separateDomainCors;

  return option;
};
const domainCorsOptions = {
  same: sameDomainCors,
  separate: separateDomainCors,
  getHandler: getCorsHandler,
};

export const corsOptions = {
  credentials: domainCredentialOptions,
  cors: domainCorsOptions,
};
