const axios = require('axios');

class SpotTerminationService {
  constructor() {
    this.isShuttingDown = false;
    this.server = null;
    this.checkInterval = null;
  }

  initialize(server) {
    this.server = server;
    this.startMonitoring();
    this.setupSignalHandlers();
  }

  startMonitoring() {
    console.log('🔍 Starting spot termination monitoring...');
    
    // Check for termination warning every 5 seconds
    this.checkInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      
      try {
        const response = await axios.get(
          'http://169.254.169.254/latest/meta-data/spot/termination-time',
          { 
            timeout: 1000,
            validateStatus: () => true // Don't throw on 404
          }
        );
        
        if (response.status === 200 && !this.isShuttingDown) {
          const terminationTime = response.data;
          console.log(`🚨 SPOT TERMINATION DETECTED at ${terminationTime}`);
          console.log('⏰ Initiating graceful shutdown in 2 minutes...');
          this.initiateGracefulShutdown();
        }
      } catch (err) {
        // 404 is normal (no termination), other errors should be logged
        if (err.code !== 'ENOTFOUND' && err.response?.status !== 404) {
          console.log('⚠️ Error checking spot termination:', err.message);
        }
      }
    }, 10000);
  }

  setupSignalHandlers() {
    // Handle SIGTERM (sent by AWS on instance termination)
    process.on('SIGTERM', () => {
      console.log('📡 SIGTERM received, initiating graceful shutdown');
      this.initiateGracefulShutdown();
    });

    // Handle SIGINT (Ctrl+C in development)
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, initiating graceful shutdown');
      this.initiateGracefulShutdown();
    });

    // Handle uncaught exceptions gracefully
    process.on('uncaughtException', (err) => {
      console.error('💥 Uncaught Exception:', err);
      this.initiateGracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚫 Unhandled Rejection at:', promise, 'reason:', reason);
      this.initiateGracefulShutdown();
    });
  }

  initiateGracefulShutdown() {
    if (this.isShuttingDown) {
      console.log('⏳ Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log('🛑 Starting graceful shutdown sequence...');

    // Clear the monitoring interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Set a maximum shutdown time (90 seconds to be safe)
    const forceShutdownTimer = setTimeout(() => {
      console.log('⚡ Force shutdown after 90 seconds');
      process.exit(1);
    }, 90000);

    // Give load balancer time to detect unhealthy instance (15 seconds)
    console.log('⏱️ Waiting 15 seconds for load balancer to detect shutdown...');
    setTimeout(() => {
      this.closeServer(forceShutdownTimer);
    }, 15000);
  }

  closeServer(forceShutdownTimer) {
    if (!this.server) {
      console.log('⚠️ No server instance to close');
      clearTimeout(forceShutdownTimer);
      process.exit(0);
      return;
    }

    console.log('🔌 Closing HTTP server...');
    this.server.close((err) => {
      clearTimeout(forceShutdownTimer);
      
      if (err) {
        console.error('❌ Error closing server:', err);
        process.exit(1);
      } else {
        console.log('✅ Server closed gracefully');
        console.log('👋 Goodbye!');
        process.exit(0);
      }
    });
  }

  isInShutdown() {
    return this.isShuttingDown;
  }
}

module.exports = new SpotTerminationService();
