// ===== models/Product.js =====
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productID: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true }
}, { timestamps: true });

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });

module.exports = mongoose.model('Product', productSchema);

// ===== models/Sale.js =====
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

// ===== logic/InventoryLogic.js =====
const Product = require('../models/Product');
const Sale = require('../models/Sale');

class InventoryLogic {

    // Check stock levels and flag low inventory
    static async checkInventoryLevels() {
        const products = await Product.find();
        const lowStockProducts = [];
        const outOfStockProducts = [];

        for (let product of products) {
            const monthlySales = await this.getProductMonthlySales(product._id);
            const threshold = monthlySales * 0.2;

            if (product.stock === 0) {
                outOfStockProducts.push({
                    product: product.name,
                    currentStock: product.stock,
                    required: Math.ceil(monthlySales * 1.5)
                });
            } else if (product.stock < threshold) {
                lowStockProducts.push({
                    product: product.name,
                    currentStock: product.stock,
                    threshold: Math.ceil(threshold),
                    required: Math.ceil(monthlySales * 1.2) - product.stock
                });
            }
        }

        return {
            lowStock: lowStockProducts,
            outOfStock: outOfStockProducts,
            timestamp: new Date()
        };
    }

    // Calculate product performance metrics
    static async getProductPerformance(category = null) {
        const matchStage = category ? { 'product.category': category } : {};

        const performance = await Sale.aggregate([
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
            { $match: matchStage },
            {
                $group: {
                    _id: '$product._id',
                    name: { $first: '$product.name' },
                    category: { $first: '$product.category' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$product.price'] } },
                    totalUnits: { $sum: '$items.quantity' },
                    averagePrice: { $avg: '$product.price' }
                }
            },
            {
                $project: {
                    name: 1,
                    category: 1,
                    totalRevenue: 1,
                    totalUnits: 1,
                    averagePrice: 1,
                    revenuePerUnit: { $divide: ['$totalRevenue', '$totalUnits'] }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        return performance;
    }

    // Calculate total monthly sales for a product
    static async getProductMonthlySales(productId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sales = await Sale.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            { $unwind: '$items' },
            { $match: { 'items.productId': productId } },
            {
                $group: {
                    _id: null,
                    totalUnits: { $sum: '$items.quantity' }
                }
            }
        ]);

        return sales[0]?.totalUnits || 0;
    }
}

module.exports = InventoryLogic;

// ===== routes/inventoryRoutes.js =====
const express = require('express');
const router = express.Router();
const InventoryLogic = require('../logic/InventoryLogic');

// Check inventory levels
router.get('/check', async (req, res) => {
    try {
        const inventory = await InventoryLogic.checkInventoryLevels();
        res.json({ success: true, data: inventory });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get product performance metrics
router.get('/performance/:category?', async (req, res) => {
    try {
        const performance = await InventoryLogic.getProductPerformance(req.params.category);
        res.json({ success: true, data: performance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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

// Mount routes
app.use('/customer', customerRoutes);
app.use('/inventory', inventoryRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
