const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catcAsync');

const signToken = (id, role) => jwt.sign({ id, role }, process.env.SECRET_KEY, {
  expiresIn: process.env.JWT_EXPIRES_IN,
});

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id, user.role);
  res.status(201).json({
    status: 'succes',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  console.log('Kullanıcı Kaydı oluşturuldu. ');
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  newUser.password = undefined;

  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Provide email and password', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('User name or password are not correct', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // Get the token
  let token;
  if (
    req.headers.authorization
    && req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // console.log(token);
  if (!token) {
    return next(
      new AppError('You are not logged in. Plaese log int to get access.', 401),
    );
  }
  // Validate token

  const decoded = await promisify(jwt.verify)(token, process.env.SECRET_KEY);

  // If user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'The token belonging to this user does no longer exist',
        401,
      ),
    );
  }

  // If user changed password after the token was issued

  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again', 401),
    );
  }

  // Grant acces to protected user
  req.user = freshUser;
  next();
});

exports.restrictToCurrentUser = (Model) => (req, res, next) => {
  if (req.user.id !== Model.user) {
    return next(
      new AppError(
        'You are restrited to acces this document with your role.',
        203,
      ),
    );
  }
  next();
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError('You are restricted to acces this address', 203),
    );
  }
  next();
};

exports.getCurrentLoggedIn = () => (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError('There is no logged-in user on the system.', 203),
    );
  }
  // Store logged-in user information in res.locals
  res.locals.loggedInUser = req.user;

  // Proceed to the next middleware
  next();
};
