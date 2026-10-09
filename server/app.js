const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const ApiResponse = require('./utils/apiResponse');

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration supporting HttpOnly cookies
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

// Body and Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(logger);

// Mounting API routes
app.use('/api', routes);

// 404 Route Handler
app.use((req, res) => {
  return ApiResponse.error(res, `Resource not found at ${req.originalUrl}`, 404);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
