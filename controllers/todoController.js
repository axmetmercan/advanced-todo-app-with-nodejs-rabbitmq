const multer = require("multer");
const sharp = require("sharp");
const Todo = require("../models/todoModel");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catcAsync");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "/imgs/todos/");
//   },
//   filename: (req, file, cb) => {
//     const unique_name =
//       file.fieldname + "-" + Date.now() + Math.round(Math.random * 1e9);
//     cb(null, unique_name);
//   },
// });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images", 400), false);
  }
};

const limits = { fieldSize: 5000, files: 3 };
const upload = multer({
  storage,
  fileFilter,
  limits,
});

exports.uploadImages = upload.fields([{ name: "todoImage", maxCount: 3 }]);

exports.resizeImages = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.todoImage) {
    return next();
  }

  req.body.images = [];

  await Promise.all(
    req.files.todoImage.map(async (file, i) => {
      // Renames the file
      const filename =
        `todo${req.params.id}` +
        `-${Date.now()}${Math.round(Math.random() * 1e9)}`;
      console.log(filename);

      // Change the file size and deterime the type
      await sharp(file.buffer)
        .resize(2000, 2000)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/todos/${filename}.jpeg`);

      req.body.images.push(filename);
    })
  );
  next();
});

exports.deleteTodo = factory.deleteOne(Todo);
exports.getTodo = factory.getOneCurrentUser(Todo);
exports.updateTodo = factory.updateOne(Todo);
exports.createTodo = factory.createOne(Todo);
exports.getAllTodos = factory.getAll(Todo, "all-todos");
exports.getAllCurrentUserTodos = factory.getAllCurrentUser(Todo);
