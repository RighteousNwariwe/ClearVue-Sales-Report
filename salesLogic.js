// ===== models/Customer.js =====
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contactInfo: {
        email: String,
        phone: String
    },
    lifetimeValue: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    lastPurchaseDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);

// ===== models/Product.js =====
const productSchema = new mongoose.Schema({
    productID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String },
    brand: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

// ===== models/Sale.js =====
const saleSchema = new mongoose.Schema({
    saleID: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    saleDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed'], default: 'completed' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);

// ===== models/Payment.js =====
const paymentSchema = new mongoose.Schema({
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'online'], required: true },
    paymentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed'], default: 'completed' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

// ===== logic/SalesLogic.js =====
// (Your full SalesLogic class as provided)
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

class SalesLogic {
    // ... (copy your full SalesLogic here)
}

module.exports = SalesLogic;

// ===== routes/salesRoutes.js =====
const express = require('express');
const router = express.Router();
const SalesLogic = require('../logic/SalesLogic');
const InventoryLogic = require('../logic/InventoryLogic');

// Process a complete sale
router.post('/', async (req, res) => {
    try {
        const result = await SalesLogic.processSale(req.body);
        res.status(201).json({ success: true, message: 'Sale processed successfully', data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// Sales analytics
router.get('/analytics/:timeframe', async (req, res) => {
    try {
        const analytics = await SalesLogic.getSalesAnalytics(req.params.timeframe);
        res.json({ success: true, data: analytics });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Inventory status
router.get('/inventory/status', async (req, res) => {
    try {
        const status = await InventoryLogic.checkInventoryLevels();
        res.json({ success: true, data: status });
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

// Connect MongoDB
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
