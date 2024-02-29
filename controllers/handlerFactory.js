const catchAsync = require("../utils/catcAsync");
const AppError = require("../utils/appError");
const catcAsync = require("../utils/catcAsync");
const ApiFeature = require("../utils/apiFeatures");
const redis = require("redis");

// Redis Client connection
let redisClient = null;

(async () => {
  redisClient = redis.createClient();

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
  console.log("Redis Connected");
})();

exports.createOne = (Model) =>
  catcAsync(async (req, res, next) => {
    const { body } = req;
    body.user = req.user;
    const doc = await Model.create(body);
    if (doc) {
      res.status(201).json({
        status: "succes",
        data: {
          doc,
        },
      });
    }
  });

exports.cacheExist = (cacheParam) => {
  catcAsync(async (req, res, next) => {
    
  });
};

exports.getAll = (Model, cacheParam) =>
  catcAsync(async (req, res, next) => {
    let isCached = false;
    let docs = {};

    // Checks whether cached object in redis
    const keyExists = await redisClient.exists(cacheParam);
    console.log("Key durumu ", keyExists);
    // If does
    // Call from cache
    if (keyExists === 1) {
      console.log("Cachten geliyo");
      const cacheResult = await redisClient.get(cacheParam);
      docs = await JSON.parse(cacheResult);
      isCached = true;
    }
    // If does not
    // Call from db and save to the cache
    else {
      console.log("no cache");
      const features = new ApiFeature(Model.find(), req.query)
        .filter()
        .sort()
        .limit()
        .pagination();
      if (!features) {
        return next(
          new AppError("Something went wrong, there is no feature", 404)
        );
      }
      docs = await features.query;
      await redisClient.set(cacheParam, JSON.stringify(docs), {
        EX: 1800, // 5 min cached data
        NX: false,
      });
    }

    res.status(200).json({
      status: "success",
      isCached: isCached,
      results: docs.length,
      data: {
        docs,
      },
    });
  });

exports.getAllCurrentUser = (Model) =>
  catcAsync(async (req, res, next) => {
    const features = new ApiFeature(
      Model.find({ user: String(req.user._id) }),
      req.query
    )
      .filter()
      .sort()
      .limit()
      .pagination();

    if (!features) {
      return next(
        new AppError("Something went wrong, there is no feature", 404)
      );
    }

    const docs = await features.query;

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        docs,
      },
    });
  });

// Includes virtual populates
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

// Get one todo with current user
// Includes virtual populates
exports.getOneCurrentUser = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.find({ _id: req.params.id, user: req.user._id });
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(
        new AppError("No document found with that ID or user login req", 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.updateOne = (Model) =>
  catcAsync(async (req, res, next) => {
    const query = Model.updateOne(
      { _id: req.params.id, user: String(req.user._id) },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    const doc = await query;

    if (!doc) {
      return next(new AppError("Selected document could not updated", 401));
    }

    res.status(200).json({
      status: "sucess",
      data: {
        data: doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.deleteOne({
      _id: req.params.id,
      user: String(req.user._id),
    });

    if (!doc) {
      return next(new AppError("No document found by given id.", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
