const express = require('express');
const router = express.Router();
const CustomerLogic = require('../logic/customerLogic');

// Get customer LTV analysis
router.get('/:id/ltv', async (req, res) => {
    try {
        const ltvAnalysis = await CustomerLogic.calculateCustomerLTV(req.params.id);
        res.json({
            success: true,
            data: ltvAnalysis
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get overdue payments analysis
router.get('/analytics/overdue', async (req, res) => {
    try {
        const overdue = await CustomerLogic.getOverduePaymentsAnalysis();
        res.json({
            success: true,
            data: overdue
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;