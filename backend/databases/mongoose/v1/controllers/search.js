const validateDateField = (value) => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const valid = typeof value === "string" && isoDateRegex.test(value);

  return valid;
};

// query handlers
const queryBuilder = (params = {}, options = {}) => {
  try {
    const { enableExact = false } = options;
    const { fieldType, field, value } = params;

    switch (fieldType) {
      case "String":
        const queryExact = { [field]: value };
        const queryRegex = {
          [field]: { $regex: String(value), $options: "i" },
        };
        return enableExact ? queryExact : queryRegex;

      case "Number":
        const numberVal = Number(value);
        if (!isNaN(numberVal)) return { [field]: numberVal };
        break;

      case "Boolean":
        if (typeof value === "string") {
          if (value.toLowerCase() === "true") return { [field]: true };
          if (value.toLowerCase() === "false") return { [field]: false };
        } else if (typeof value === "boolean") {
          return { [field]: value };
        }
        break;

      case "Date":
        const validDate = validateDateField(value);

        if (validDate) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return { [field]: date };
          }
        }
        return null;

      default:
        return null;
    }

    return null;
  } catch (error) {
    throw new Error(error?.message ?? "Search query builder error");
  }
};
const queryStringBuilder = (
  Model,
  stringValues = [],
  schemaFields = [],
  options = {}
) => {
  const { enableExact = false } = options;

  const success = [];
  const failed = [];

  // search across all fields
  for (const str of stringValues) {
    for (const field of schemaFields) {
      const fieldType = Model.schema.paths[field].instance;

      const queryParams = { fieldType, field, value: str };
      const queryOptions = { enableExact };
      const condition = queryBuilder(queryParams, queryOptions);

      if (condition) {
        success.push(condition);
      }
    }
  }

  return { success, failed };
};
const queryJsonBuilder = (
  Model,
  jsonValues = [],
  schemaFields = [],
  options = {}
) => {
  const { enableExact = false } = options;

  const success = [];
  const failed = [];

  // search across specific fields
  for (const obj of jsonValues) {
    for (const key in obj) {
      const hasKey = schemaFields.includes(key);

      if (!hasKey) {
        failed.push({ key, error: "Field not found" });
        continue;
      }

      const fieldType = Model.schema.paths[key]?.instance;
      const value = obj[key];

      const queryParams = { fieldType, field: key, value };
      const queryOptions = { enableExact };
      const condition = queryBuilder(queryParams, queryOptions);

      if (condition) {
        success.push(condition);
      }
    }
  }

  return { success, failed };
};
const queryHandlers = {
  queryBuilder,
  queryStringBuilder,
  queryJsonBuilder,
};

//
const getSchemaFields = (Model, params = {}, options = {}) => {
  try {
    if (!Model) {
      const message = "Model not found";
      return reject.method({ message });
    }

    const exclude = ["_id", "__v"];
    const paths = Model.schema.paths;
    const schemaFields = Object.keys(paths).filter(
      (field) => !exclude.includes(field)
    );

    return schemaFields;
  } catch (error) {
    const message = rejectMessage("find", error.message);
    return reject.method({ message });
  }
};
const groupSearchParams = (body = []) => {
  const strings = [];
  const jsons = [];
  const invalids = [];

  // group values
  for (const item of body) {
    try {
      const parsed = JSON.parse(item);

      if (typeof parsed === "object") {
        jsons.push(parsed);
      }
    } catch {
      if (typeof item === "object") {
        jsons.push(item);
        continue;
      } else if (typeof item === "string") {
        strings.push(item);
        continue;
      }

      invalids.push(item);
    }
  }

  return { strings, jsons, invalids };
};

export const search = {
  getSchemaFields,
  groupSearchParams,
  handlers: queryHandlers,
};
