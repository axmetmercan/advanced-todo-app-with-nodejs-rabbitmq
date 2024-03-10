const express = require("express");
const todoController = require("../controllers/todoController");
const factory = require("../controllers/handlerFactory");

const router = express.Router();
const authController = require("../controllers/authController");

router.use(authController.protect);

router
  .route("/")
  .get(factory.cacheExist("all-todos"), todoController.getAllTodos)
  .post(todoController.createTodo);

router
  .route("/:id")
  .get(todoController.getTodo)
  .delete(todoController.deleteTodo)
  .put(
    todoController.uploadImages,
    todoController.resizeImages,
    todoController.updateTodo
  );

router.route("/user/me").get(todoController.getAllCurrentUserTodos);

module.exports = router;
