const express = require('express');
const router = express.Router();
const telegramService = require('../services/telegramService');

// Test endpoint to verify Telegram setup
router.post('/test', async (req, res) => {
  try {
    const result = await telegramService.sendTestNotification();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Telegram test notification sent successfully!',
        status: 'Telegram bot is working correctly'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send test notification',
        reason: result.reason || result.error,
        status: 'Telegram not configured or bot not working'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing Telegram service',
      error: error.message
    });
  }
});

// Get Telegram configuration status
router.get('/status', (req, res) => {
  const isEnabled = process.env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true';
  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
  const hasChatId = !!process.env.TELEGRAM_ADMIN_CHAT_ID;
  
  res.json({
    enabled: isEnabled,
    hasToken: hasToken,
    hasChatId: hasChatId,
    configured: isEnabled && hasToken && hasChatId,
    clientUrl: process.env.CLIENT_URL || 'Not set',
    status: isEnabled && hasToken && hasChatId ? 'Ready' : 'Needs Configuration'
  });
});

module.exports = router;
