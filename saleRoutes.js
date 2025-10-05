// ===== models/Sale.js =====
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    saleID: { type: String, required: true, unique: true, index: true },
    customerID: { type: String, required: true, ref: 'Customer' },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    date: { type: Date, default: Date.now },
    total: { type: Number, required: true }
}, { timestamps: true });

saleSchema.index({ customerID: 1 });

module.exports = mongoose.model('Sale', saleSchema);

// ===== logic/SalesLogic.js =====
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const InventoryLogic = require('../InventoryLogic');

class SalesLogic {

    // Process a new sale
    static async processSale(saleData) {
        // Validate stock
        for (const item of saleData.items) {
            const product = await Product.findById(item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
        }

        // Calculate total
        let total = 0;
        for (const item of saleData.items) {
            const product = await Product.findById(item.productId);
            total += item.quantity * product.price;
            // Deduct stock
            product.stock -= item.quantity;
            await product.save();
        }

        // Create Sale record
        const sale = new Sale({
            saleID: saleData.saleID,
            customerID: saleData.customerID,
            items: saleData.items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                price: i.price
            })),
            total
        });

        await sale.save();
        return sale;
    }

    // Get sales analytics based on timeframe: 'daily', 'monthly', 'yearly'
    static async getSalesAnalytics(timeframe) {
        const now = new Date();
        let startDate;

        switch (timeframe) {
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                throw new Error('Invalid timeframe');
        }

        const analytics = await Sale.aggregate([
            { $match: { date: { $gte: startDate } } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product._id',
                    name: { $first: '$product.name' },
                    category: { $first: '$product.category' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$product.price'] } },
                    totalUnits: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        return analytics;
    }
}

module.exports = SalesLogic;

// ===== routes/salesRoutes.js =====
const express = require('express');
const router = express.Router();
const SalesLogic = require('../logic/SalesLogic');
const InventoryLogic = require('../logic/InventoryLogic');

// Process new sale
router.post('/', async (req, res) => {
    try {
        const result = await SalesLogic.processSale(req.body);
        res.status(201).json({ success: true, message: 'Sale processed successfully', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get sales analytics
router.get('/analytics/:timeframe', async (req, res) => {
    try {
        const analytics = await SalesLogic.getSalesAnalytics(req.params.timeframe);
        res.json({ success: true, data: analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get inventory status
router.get('/inventory/status', async (req, res) => {
    try {
        const status = await InventoryLogic.checkInventoryLevels();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

// ===== server.js =====
const express = require('express');
const connectDB = require('./db');

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');

// Mount routes
app.use('/customer', customerRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/sales', salesRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
