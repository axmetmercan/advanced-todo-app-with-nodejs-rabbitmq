const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const AppError = require('../utils/appError');
const authController = require('../controllers/authController');

const todoScheme = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    // unique:true,
    maxLength: [40, 'A todo title must have a title'],
    minLength: [5, 'A todo title must have at least 5 characters'],
    validate: validator.isAscii,
  },
  slug: String,
  importance: {
    type: String,
    required: [true, 'A todo must have importance value'],
    enum: {
      values: ['important', 'less important', 'most important'],
      message:
        "Importance level of an todo is either 'important','less important', 'most important'",
    },
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now,
    select: false,
  },
  situation: {
    type: String,
    required: [true, 'A todo must have situation value'],
    enum: {
      values: ['finished', 'on it', 'not started'],
      message:
        "Importance level of an todo is either 'finished','on it', 'not started'",
    },
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

todoScheme.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  // this.user = req.user.id;
  next();
});

const Todo = mongoose.model('Todo', todoScheme);
module.exports = Todo;
