const express = require('express');
const router = express.Router();
const secureOrderController = require('../controllers/secureOrder');

// Access order via magic link token
router.get('/track/:token', secureOrderController.accessOrderByToken);

// Access order via PIN verification
router.post('/access-pin', secureOrderController.accessOrderByPIN);

// Request new magic link
router.post('/request-link', secureOrderController.requestNewMagicLink);

// Check order access status
router.get('/check-access/:orderId', secureOrderController.checkOrderAccess);

module.exports = router;
