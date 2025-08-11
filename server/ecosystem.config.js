module.exports = {
  apps: [{
    name: 'fashion-backend',
    script: './app.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3000
    },
    // Logging
    error_file: '/var/log/pm2/err.log',
    out_file: '/var/log/pm2/out.log',
    log_file: '/var/log/pm2/combined.log',
    time: true,
    
    // Performance & Reliability
    watch: false,
    max_memory_restart: '800M',
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '10s',
    
    // Graceful shutdown settings
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true,
    
    // Auto-restart on crash
    autorestart: true,
    
    // Instance settings
    instance_var: 'INSTANCE_ID',
    
    // Health monitoring
    health_check_grace_period: 3000,
    
    // Environment-specific settings
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Spot instance optimizations
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log',
      '.git'
    ],
    
    // Custom environment variables for fashion e-commerce
    env_vars: {
      SPOT_INSTANCE: true,
      FASHION_BACKEND: true,
      AUTO_SCALING: true
    }
  }]
};
