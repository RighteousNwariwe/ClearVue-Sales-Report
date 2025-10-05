const express = require('express');
const router = express.Router();
const SalesLogic = require('../logic/salesLogic');
const InventoryLogic = require('../logic/inventoryLogic');

// Process new sale with business logic
router.post('/', async (req, res) => {
    try {
        const result = await SalesLogic.processSale(req.body);
        res.status(201).json({
            success: true,
            message: 'Sale processed successfully',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get sales analytics for dashboard
router.get('/analytics/:timeframe', async (req, res) => {
    try {
        const analytics = await SalesLogic.getSalesAnalytics(req.params.timeframe);
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get inventory status
router.get('/inventory/status', async (req, res) => {
    try {
        const status = await InventoryLogic.checkInventoryLevels();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;