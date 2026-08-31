import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = parseInt(process.env.PORT, 10) || 5000;

let server;

const startServer = async () => {
  try {
    server = http.createServer(app);

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
        console.error(`   👉 Run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
      } else {
        console.error('❌ Server error:', err);
      }
    });

    server.listen(PORT, () => {
      console.log(`\n🚀 Mazhai Vaanam API Server`);
      console.log(`   ├─ Port:        ${PORT}`);
      console.log(`   ├─ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   ├─ Health:      http://localhost:${PORT}/api/health`);
      console.log(`   └─ Frontend:    ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
    });

    // Connect to MongoDB
    await connectDB();
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
  }
};

// Graceful shutdown on restart / exit
const handleShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Closing server gracefully...`);
  if (server) {
    server.close(() => {
      console.log('   ✅ HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
