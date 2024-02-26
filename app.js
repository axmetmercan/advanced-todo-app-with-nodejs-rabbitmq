const express = require('express');
const todoRouter = require('./routes/todoRouter');

const app = express();
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');
const limiter = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
const getTime = require('./utils/getDateTime');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const cronJob = require('./utils/cronJobs');

app.use(helmet());

app.use(express.json({ limit: '10kb' }));
const staticFilesDirectory = path.join(__dirname, 'public');
app.use(express.static(staticFilesDirectory));

// To remove data using defaults
app.use(mongoSanitize());
// Prevent HTML injection
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['importance', 'situation'],
  }),
);

const rateLimiterDetails = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

const rateLimiterDetailsForUser = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

const rateLimiterGeneral = limiter(rateLimiterDetails);
const rateLimiterUser = limiter(rateLimiterDetailsForUser);

app.use(rateLimiterGeneral);
// app.use("/api/v1/user", rateLimiterUser);

// Calls the cron job to inform users daily status

// Prints the requested wep page url
app.use((req, res, next) => {
  const pre = String(process.env.PORT);
  console.log(
    `${req.method} ${req.hostname}/${pre}${req.path} ${getTime()}`,
  );
  console.log(req.query);
  next();
});
app.use('/api/v1/todos', todoRouter);
app.use('/api/v1/user', rateLimiterUser, userRouter);

// Simple CronJob that returns completed todos
// It can be used for notification or smth...
cronJob;

// Deny all other web pages other than above ones.
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
