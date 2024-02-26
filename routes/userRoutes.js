const express = require('express');
const todo = require('../models/todoModel');
const authController = require('../controllers/authController');

const router = express.Router();
const userController = require('../controllers/userController');

router.post('/signup', authController.signUp);

router.post('/login', authController.login);

router.get(
  '/',
  authController.protect,
  authController.restrictToCurrentUser(todo),
  authController.restrictTo('admin', 'user'),
  userController.getAllUsers,
);

module.exports = router;
