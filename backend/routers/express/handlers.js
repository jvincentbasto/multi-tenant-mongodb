import { databases } from "../../databases/main/main.js";

const clients = databases.clients;

//
const fallbackRoute = (cb) => {
  const fallback = (req, res, next) => {
    return res.status(500).json();
  };

  if (!cb || typeof cb !== "function") return fallback;
  return cb;
};
const getDeepValue = (obj, pathArray = []) => {
  return pathArray.reduce(
    (acc, key) => (acc && acc[key] ? acc[key] : undefined),
    obj
  );
};

//
const getResource = (payload = {}) => {
  const { req } = payload;

  const curParams = {
    ...req.params,
    ...req.custom.params,
  };
  const { client, version } = curParams;
  let resource = {
    middlewares: {},
    controllers: {},
  };

  // client
  const curClient = clients[client];
  if (!curClient) return resource;

  // version
  const curVersion = curClient?.versions[version];
  if (!curVersion) return resource;

  //
  const { middlewares, controllers } = curVersion;
  if (middlewares) resource.middlewares = middlewares;
  if (controllers) resource.controllers = controllers;

  return resource;
};
const getMiddleware = (payload = {}) => {
  const { paths = [], enable = true } = payload;

  return (req, res, next) => {
    const { middlewares } = getResource({ req });

    //
    const controller = getDeepValue(middlewares, paths);
    const cb = fallbackRoute(controller);

    if (!enable) return next();
    return cb(req, res, next);
  };
};
const getController = (payload = {}) => {
  const { paths = [], enable = true } = payload;

  return (req, res, next) => {
    const { controllers } = getResource({ req });

    //
    const controller = getDeepValue(controllers, paths);
    const cb = fallbackRoute(controller);

    if (!enable) return next();
    return cb(req, res, next);
  };
};
const coreHandlers = {
  fallbackRoute,
  getResource,
  getMiddleware,
  getController,
};

// route handlers
const defaultRoutes = (payload = {}) => {
  const { router, base, middlewares, controllers } = payload;
  const { url, middlewares: baseMd = [] } = base;

  // middlewares
  const gm = (path = "verifyAuth") => {
    const { methods } = middlewares;

    const curPath = methods[path] ?? path;
    const curMiddlewares = {
      ...middlewares,
      paths: [...middlewares.paths, curPath],
      // enable: false,
    };

    return getMiddleware({ ...curMiddlewares });
  };

  // controllers
  const gc = (path = "") => {
    const { methods } = controllers;

    const curPath = methods[path] ?? path;
    const curControllers = {
      ...controllers,
      paths: [...controllers.paths, curPath],
    };

    return getController({ ...curControllers });
  };

  // main
  router.get(`${url}/`, ...baseMd, gm(), gc("find"));
  router.post(`${url}/`, ...baseMd, gm(), gc("create"));
  router.get(`${url}/:id`, ...baseMd, gm(), gc("findById"));
  router.put(`${url}/:id`, ...baseMd, gm(), gc("update"));
  router.delete(`${url}/:id`, ...baseMd, gm(), gc("delete"));
  // bulk
  router.get(`${url}/ids`, ...baseMd, gm(), gc("findMany"));
  router.post(`${url}/bulk`, ...baseMd, gm(), gc("createMany"));
  router.put(`${url}/bulk`, ...baseMd, gm(), gc("updateMany"));
  router.delete(`${url}/bulk`, ...baseMd, gm(), gc("deleteMany"));
  // search
  router.post(`${url}/search`, ...baseMd, gm(), gc("search"));
};
const authRoutes = (payload = {}) => {
  const { router, base, middlewares, controllers } = payload;
  const { url, middlewares: baseMd = [] } = base;

  // middlewares
  const gm = (path = "verifyAuth") => {
    const { methods } = middlewares;

    const curPath = methods[path] ?? path;
    const curMiddlewares = {
      ...middlewares,
      paths: [...middlewares.paths, curPath],
      enable: false,
    };

    return getMiddleware({ ...curMiddlewares });
  };

  // controllers
  const gc = (path = "") => {
    const { methods } = controllers;

    const curPath = methods[path] ?? path;
    const curControllers = {
      ...controllers,
      paths: [...controllers.paths, curPath],
    };

    return getController({ ...curControllers });
  };

  // main
  router.post(`${url}/signup`, ...baseMd, gm(), gc("signup"));
  router.post(`${url}/login`, ...baseMd, gm(), gc("login"));
  router.post(`${url}/logout`, ...baseMd, gm(), gc("logout"));
  router.post(`${url}/refresh`, ...baseMd, gm(), gc("refreshTokenHandler"));
  // email
  router.post(
    "/email/request",
    ...baseMd,
    gm(),
    gc("requestEmailVerification")
  );
  router.post(`${url}/email/verify`, ...baseMd, gm(), gc("verifyEmail"));
  // password
  router.post(`${url}/password/forgot`, ...baseMd, gm(), gc("forgotPassword"));
  router.post(`${url}/password/reset`, ...baseMd, gm(), gc("resetPassword"));
};
const setupRoutes = (payload = {}) => {
  const { router, base, middlewares, controllers } = payload;
  const { url, middlewares: baseMd = [] } = base;

  // middlewares
  const gm = (path = "verifyAuth") => {
    const { methods } = middlewares;

    const curPath = methods[path] ?? path;
    const curMiddlewares = {
      ...middlewares,
      paths: [...middlewares.paths, curPath],
      enable: false,
    };

    return getMiddleware({ ...curMiddlewares });
  };

  // controllers
  const gc = (path = "") => {
    const { methods } = controllers;

    const curPath = methods[path] ?? path;
    const curControllers = {
      ...controllers,
      paths: [...controllers.paths, curPath],
    };

    return getController({ ...curControllers });
  };

  // main
  router.post(`${url}/app`, ...baseMd, gm(), gc("app"));
};
const resourceHandlers = {
  defaultRoutes,
  authRoutes,
  setupRoutes,
};

export const handlers = {
  core: coreHandlers,
  resource: resourceHandlers,
};
