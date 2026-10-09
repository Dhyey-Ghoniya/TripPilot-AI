require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Initialize Database Connection
connectDB();

const server = app.listen(PORT, () => {
  console.log(`[Server] TripPilot AI API Server running on port ${PORT}`);
  console.log(`[Server] Health check endpoint: http://localhost:${PORT}/api/health`);
});

// Handle unhandled rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]:', err);
});
