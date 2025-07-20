const sampleResource = {
  default: "{resource}",
  _id: "{resource}/[id]",
  __route: {
    default: "{resource}/[...route]",
    bulk: "{resource}/bulk",
    search: "{resource}/search",
  },
};

const sampleMainRoutes = {
  main: {
    databases: {
      _db: {
        collections: "databases/[db]/collections",
        schemas: "databases/[db]/schemas",
        documents: {
          _model: "databases/[db]/documents/[model]",
        },
      },
      resource: "resource",
    },
  },
  versions: {
    _version: "versions/[version]",
  },
};
const sampleEnvRoutes = {
  environments: {
    _env: {
      databases: {
        _db: {
          collections: "environments/[env]/database/[db]/collections",
          schemas: "environments/[env]/database/[db]/schemas",
          documents: {
            _model: "environments/[env]/database/[db]/documents/[model]",
          },
        },
        resource: "resource",
      },
    },
  },
  versions: {
    _version: "versions/[version]",
  },
};
