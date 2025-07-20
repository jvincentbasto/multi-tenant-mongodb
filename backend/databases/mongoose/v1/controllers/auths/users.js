import { handlers } from "../handlers.js";
import { search as searchHandlers } from "../search.js";

// context
const { constBulk, responseSuccess, responseFailed } = handlers.utils;
const getContext = handlers.getContext;
const formatData = handlers.formatData;

//
const ctxArgs = {
  payload: { client: {}, conn: {}, model: { dynamic: true, name: "users" } },
  params: { enable: {} },
};

// main
const find = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { query, Model } = ctx;

    const results = await Model.find(query).lean();
    const format = results.map((item) => formatData(item));

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const findByName = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { params, Model } = ctx;
    const { id: name } = params;

    const results = await Model.find({ name }).lean();
    const format = results.map((item) => formatData(item));

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const findById = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { params, Model } = ctx;
    const { id } = params;

    const results = await Model.findById(id).lean();
    const format = [formatData(results)];

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const create = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { body, Model } = ctx;

    const results = await Model.create(body).toObject();
    const format = [formatData(results)];

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const update = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { params, body, Model } = ctx;
    const { id } = params;

    const payloadOpt = { new: true, runValidators: true };
    const results = await Model.findByIdAndUpdate(
      id,
      body,
      payloadOpt
    ).toObject();
    const format = [formatData(results)];

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const drop = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { params, Model } = ctx;
    const { id } = params;

    const results = await Model.findByIdAndDelete(id);
    const format = [{ id }];

    const payloadData = { res, data: format };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

// bulk
const findMany = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list, Model } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    // success
    const payloadQuery = { _id: { $in: list } };
    const results = await Model.find(payloadQuery).lean();
    const resultIds = results.map((doc) => doc._id.toString());
    success = results.map((item) => formatData(item));

    // failed
    const notFoundIds = list.filter((id) => !resultIds.includes(id));
    rejects.failed.push(...notFoundIds);

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const createMany = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list, Model } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    //
    const { method = 1 } = req.custom ?? {};

    // methods
    const methodSingle = async () => {
      for (const item of list) {
        try {
          const results = await Model.create(item).toObject();
          success.push(results);
        } catch (error) {
          const payload = { item, error: error.message };
          rejects.failed.push(payload);
        }
      }
    };
    const methodBulk = async () => {
      try {
        const resultBulk = await Model.insertMany(list, { ordered: false });
        const resultIds = resultBulk.map((doc) => doc._id.toString());

        // Fetch created documents
        const createdDocs = await Model.find({ _id: { $in: resultIds } });
        const insertedIds = new Set(
          createdDocs.map((doc) => doc._id.toString())
        );

        // success
        createdDocs.forEach((doc) => {
          const result = doc.toObject();
          success.push(result);
        });

        // failed
        list.forEach((item) => {
          if (!insertedIds.has(item._id?.toString())) {
            const payload = { item, error: "Item not created" };
            rejects.failed.push(payload);
          }
        });
      } catch (error) {
        const payload = { error: error.message };
        rejects.failed.push(payload);
      }
    };

    method === 1 ? await methodSingle() : await methodBulk();
    success = success.map((item) => formatData(item));

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const updateMany = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list, Model } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    //
    const { method = 1 } = req.custom ?? {};

    // methods
    const methodSingle = async () => {
      for (const { id, ...item } of list) {
        try {
          if (!id) throw new Error("Missing ID");

          const payloadOpt = { new: true, runValidators: true };
          const results = await Model.findByIdAndUpdate(
            id,
            item,
            payloadOpt
          ).toObject();

          success.push(results);
        } catch (error) {
          const payload = { id, item, error: error.message };
          rejects.failed.push(payload);
        }
      }
    };
    const methodBulk = async () => {
      const ids = list.map(({ id }) => id).filter(Boolean);

      // Add items with null ids to the failed array
      list.forEach((item) => {
        if (!item.id) {
          rejects.failed.push({ id: null, item, error: "Missing ID" });
        }
      });

      try {
        const existingDocs = await Model.find({ _id: { $in: ids } });
        const existingIds = new Set(
          existingDocs.map((doc) => doc._id.toString())
        );

        const bulkOps = list
          .filter(({ id }) => existingIds.has(id))
          .map(({ id, ...item }) => ({
            updateOne: {
              filter: { _id: id },
              update: { $set: item },
            },
          }));
        // console.log("bulkOps", bulkOps);

        // bulk write | return object
        const resultBulk = await Model.bulkWrite(bulkOps);
        // console.log("resultBulk", resultBulk);

        // Fetch updated documents
        const updatedDocs = await Model.find({ _id: { $in: ids } });
        const updatedIds = new Set(
          updatedDocs.map((doc) => doc._id.toString())
        );

        // success
        updatedDocs.forEach((doc) => {
          const result = enableToObject ? doc.toObject() : doc;
          success.push(result);
        });

        // failed data
        list.forEach((item) => {
          const { id } = item;

          if (!updatedIds.has(id)) {
            const payload = { id, item };
            rejects.failed.push(payload);
          }
        });
      } catch (error) {
        const payload = { error: error.message };
        rejects.failed.push(payload);
      }
    };

    method === 1 ? await methodSingle() : await methodBulk();
    success = success.map((item) => formatData(item));

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};
const deleteMany = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list, Model } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    //
    const { method = 1 } = req.custom ?? {};

    // methods
    const methodSingle = async () => {
      for (const id of list) {
        try {
          if (!id) throw new Error("Missing Id");

          const results = await Model.findByIdAndDelete(id);
          data.push(id);
        } catch (error) {
          const payload = { id, error: error.message };
          rejects.failed.push(payload);
        }
      }
    };
    const methodBulk = async () => {
      // 🔍 existing docs
      const existingDocs = await Model.find({ _id: { $in: list } });
      const existingIds = existingDocs.map((doc) => doc._id.toString());

      // ids not found
      const bodyIds = list.map((id) => id.toString());
      const notFoundIds = bodyIds.filter((id) => !existingIds.includes(id));
      notFoundIds.forEach((id) => {
        const payload = { id, error: "ID or document does not exist" };
        rejects.failed.push(payload);
      });

      // delete docs
      if (existingIds.length > 0) {
        await Model.deleteMany({ _id: { $in: existingIds } });

        // Re-verify documents
        const remainingDocs = await Model.find({ _id: { $in: existingIds } });
        const remainingIds = new Set(
          remainingDocs.map((doc) => doc._id.toString())
        );

        existingIds.forEach((id) => {
          if (remainingIds.has(id)) {
            const payload = { id, error: "Document not deleted" };
            rejects.failed.push(payload);
          } else {
            data.push(id);
          }
        });
      }
    };

    method === 1 ? await methodSingle() : await methodBulk();
    success = success.map((item) => formatData(item));

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

// search
const search = async (req, res) => {
  try {
    const payloadContext = { req, ...ctxArgs.payload };
    const paramContext = { ...ctxArgs.params };
    const ctx = await getContext(payloadContext, paramContext);
    const { bulk: list, Model } = ctx;

    const bulkLists = constBulk();
    let { success, rejects } = bulkLists;

    //
    const { getSchemaFields, groupSearchParams, handlers } = searchHandlers;

    //
    const schemaFields = getSchemaFields(Model);
    const { strings, jsons, invalids } = groupSearchParams(list);
    rejects.failed.push(...invalids);

    // strings
    const stringQueryOptions = { enableExact };
    const stringQueries = handlers.queryStringBuilder(
      Model,
      strings,
      schemaFields,
      stringQueryOptions
    );

    // jsons
    const jsonQueryOptions = { enableExact };
    const jsonQueries = handlers.queryJsonBuilder(
      Model,
      jsons,
      schemaFields,
      jsonQueryOptions
    );

    // queries
    const searchQueries = [...stringQueries.success, ...jsonQueries.success];
    const failedQueries = [...stringQueries.failed, ...jsonQueries.failed];
    if (searchQueries.length <= 0) {
      throw new Error("No valid search queries found");
    }

    // results
    rejects.failed.push(...failedQueries);
    success = await Model.find({ $or: searchQueries });
    success = results.map((item) => formatData(item));

    const payloadData = { res, data: success, rejects };
    const response = responseSuccess({ ...payloadData });
    return response;
  } catch (error) {
    return responseFailed({ res, error, message: error.message });
  }
};

export const users = {
  find,
  findById,
  findByName,
  //
  create,
  update,
  delete: drop,
  //
  findMany,
  createMany,
  updateMany,
  deleteMany,
  //
  search,
};
