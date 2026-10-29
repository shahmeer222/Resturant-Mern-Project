require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const categoryRoutes = require('./routes/categoryRoutes');
const foodRoutes = require('./routes/foodRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'restaurant_menu';
const uploadDir = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  '/uploads',
  express.static(uploadDir, {
    maxAge: '1d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant Menu System API is running',
    endpoints: {
      categories: '/api/categories',
      foods: '/api/foods',
    },
  });
});

app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    message: isConnected ? 'Server and database are healthy' : 'Database is not connected',
    database: isConnected ? 'connected' : 'disconnected',
  });
});

app.use('/api/categories', categoryRoutes);
app.use('/api/foods', foodRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Something went wrong';

  if (error.name === 'MulterError') {
    statusCode = 400;

    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'Image size cannot exceed 5 MB';
    } else if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Only one image can be uploaded per request';
    } else {
      message = `Image upload error: ${error.message}`;
    }
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors || {})
      .map((item) => item.message)
      .join(', ') || 'Validation failed';
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || error.keyPattern || {})[0] || 'value';
    message = `A record with this ${field} already exists`;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path || 'value'}`;
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { error: error.message } : {}),
  });
});

const startServer = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is missing in the .env file');
    }

    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

const stopServer = async () => {
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGINT', stopServer);
process.on('SIGTERM', stopServer);

startServer();
