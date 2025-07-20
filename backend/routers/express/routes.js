import { handlers } from "./handlers.js";

//
const { defaultRoutes, authRoutes, setupRoutes } = handlers.resource;

//
const getRoutes = (payload = {}) => {
  const { router, url, middlewares = [] } = payload;
  const baseMd = [middlewares.clients({}), middlewares.envs({})];
  const baseDb = `${url}/dbs/:db`;

  // utils
  const getBase = (path) => {
    const base = {
      url: path ?? `${url}`,
      middlewares: baseMd,
    };

    return base;
  };
  const getMiddlewares = (paths, enable = true, methods) => {
    const base = {
      paths: paths ?? ["auth"],
      enable,
      methods: methods ?? {},
    };

    return base;
  };
  const getControllers = (paths, enable = true, methods) => {
    const base = {
      paths: paths ?? [],
      enable,
      methods: methods ?? {},
    };

    return base;
  };

  // base
  const curPayload = {
    router,
    base: getBase(),
    middlewares: getMiddlewares(),
    controllers: getControllers(),
  };

  //
  setupRoutes({
    ...curPayload,
    base: getBase(`${url}/setup`),
    middlewares: getMiddlewares(["databases"], false),
    controllers: getControllers(["setup"]),
  });
  defaultRoutes({
    ...curPayload,
    base: getBase(`${url}/resource`),
    middlewares: getMiddlewares(["databases"]),
    controllers: getControllers(["databases"], true, {
      findById: "findByName",
    }),
  });

  const dbPaths = [`${url}/dbs/:db`, `${url}/:db`];
  const defineDbPaths = (payload = {}) => {
    const { url } = payload;

    // entities
    defaultRoutes({
      ...curPayload,
      base: getBase(`${url}/entities/databases`),
      middlewares: getMiddlewares(["databases"]),
      controllers: getControllers(["entities", "databases"], true, {
        findById: "findByName",
      }),
    });
    defaultRoutes({
      ...curPayload,
      base: getBase(`${url}/entities/collections`),
      controllers: getControllers(["entities", "collections"], true, {
        findById: "findByName",
      }),
    });

    // system
    defaultRoutes({
      ...curPayload,
      base: getBase(`${url}/apps`),
      middlewares: getMiddlewares(["databases"]),
      controllers: getControllers(["apps"]),
    });
    defaultRoutes({
      ...curPayload,
      base: getBase(`${url}/collections`),
      controllers: getControllers(["collections"], true, {
        findById: "findByName",
      }),
    });
    defaultRoutes({
      ...curPayload,
      base: getBase(`${url}/schemas`),
      controllers: getControllers(["schemas"]),
    });

    // auth
    authRoutes({
      ...curPayload,
      base: getBase(`${url}/auth`),
      middlewares: getMiddlewares([], false),
      controllers: getControllers(["auths", "auth"]),
    });
    defaultRoutes({
      ...curPayload,
      base: getBase(`${url}/auth/documents/persons`),
      controllers: getControllers(["auths", "persons"]),
    });
    defaultRoutes({
      ...curPayload,
      base: getBase(`${url}/auth/documents/users`),
      controllers: getControllers(["auths", "users"]),
    });

    // documents
    defaultRoutes({
      ...curPayload,
      base: getBase(`${url}/documents`),
      controllers: getControllers(["documents"]),
    });
  };

  for (const url of dbPaths) {
    defineDbPaths({ url });
  }
};

export const routes = {
  getRoutes,
};
