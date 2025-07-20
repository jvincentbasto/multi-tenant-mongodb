import { handlers } from "./handlers.js";

//
const cookieInfo = {
  httpOnly: "not accessible to js 'document.cookie' ",
  secure: {
    true: "https",
    false: "http",
    values: [true, false],
  },
  sameSite: {
    strict: "same-origin",
    lax: "same-origin",
    none: "cross-origin",
    // (cross-origin): sameSite: "none", secure: true
    values: ["strict", "lax", "none"],
  },
  domain: {
    domain: "yourdomain.com",
    subdomain: "share across subdomains (.) '.yourdomain.com' ",
    values: ["yourdomain.com", ".yourdomain.com"],
  },
  path: {
    allRoutes: "/",
    specificRoutes: "/specific/route",
    values: ["/", "/specific/route"],
  },
};

// sample domains | frontend (fe), backend (be)
const sampleSameDomain = {
  // monolith
  local: {
    fe: ["localhost:3000"],
    be: ["localhost:3000"],
  },
  prod: {
    fe: [
      ["myapp1.com", "dev.myapp1.com", "staging.myapp1.com"],
      ["myapp2.com", "dev.myapp2.com", "staging.myapp2.com"],
    ],
    be: ["backend.com"],
  },
};
const sampleSeparateDomain = {
  // multi-tenant backend
  local: {
    fe: ["localhost:3000"],
    be: ["localhost:4000"],
  },
  prod: {
    fe: [
      ["myapp1.com", "dev.myapp1.com", "staging.myapp1.com"],
      ["myapp2.com", "dev.myapp2.com", "staging.myapp2.com"],
    ],
    be: ["backend.com"],
  },
};
const sampleDomains = {
  same: sampleSameDomain,
  separate: sampleSeparateDomain,
};

// this is regardless of runtimes (nextjs, backend, etc.)
const localCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
};
const prodCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none", // (cross-origin): sameSite: "none", secure: true
  path: "/",
};
const shareLocalCookieOptions = (payload = {}) => {
  const { domain } = payload;

  const cookie = { ...localCookieOptions, domain };
  return cookie;
};
const shareProdCookieOptions = (payload = {}) => {
  const { domain } = payload;

  const cookie = { ...prodCookieOptions, domain };
  return cookie;
};
const cookieOptions = {
  local: localCookieOptions,
  prod: prodCookieOptions,
  share: {
    // share cookies across a domain and its subdomains
    local: shareLocalCookieOptions,
    pord: shareProdCookieOptions,
  },
};

//
const sameDomain = {
  // same frontend and backend
  local: cookieOptions.local,
  prod: cookieOptions.prod,
  share: cookieOptions.share,
};
const separateDomain = {
  // separate frontend and backend
  local: cookieOptions.local,
  prod: cookieOptions.prod,
  share: cookieOptions.share,
};
const getCookieHandler = async (payload = {}, params = {}, options = {}) => {
  const { req, res } = payload;

  const originType = await handlers.getOriginType({ req, res });
  const domain = originType.origin === 1 ? sameDomain : separateDomain;
  const option = originType.isProduction ? domain.prod : domain.local;

  return option;
};

export const cookieHandlers = {
  options: cookieOptions,
  same: sameDomain,
  separate: separateDomain,
  getHandler: getCookieHandler,
};
