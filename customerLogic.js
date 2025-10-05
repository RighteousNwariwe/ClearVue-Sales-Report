// ===== db.js =====
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/clearvueDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully!');
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;

// ===== models/Product.js =====
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productID: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true }
}, { timestamps: true });

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });

module.exports = mongoose.model('Product', productSchema);

// ===== models/Customer.js =====
const customerSchema = new mongoose.Schema({
    customerID: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    contactInfo: {
        email: { type: String },
        phone: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);

// ===== models/Sale.js =====
const saleSchema = new mongoose.Schema({
    saleID: { type: String, required: true, unique: true, index: true },
    customerID: { type: String, required: true, ref: 'Customer' },
    products: [
        {
            productID: { type: String, required: true, ref: 'Product' },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    date: { type: Date, default: Date.now },
    total: { type: Number, required: true }
}, { timestamps: true });

saleSchema.index({ customerID: 1 });

module.exports = mongoose.model('Sale', saleSchema);

// ===== models/Payment.js =====
const paymentSchema = new mongoose.Schema({
    paymentID: { type: String, required: true, unique: true, index: true },
    saleID: { type: String, required: true, ref: 'Sale' },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'card', 'online'], required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

paymentSchema.index({ saleID: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

// ===== logic/CustomerLogic.js =====
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

class CustomerLogic {
    
    // Calculate customer lifetime value metrics
    static async calculateCustomerLTV(customerID) {
        const customer = await Customer.findOne({ customerID }).lean();
        if (!customer) throw new Error('Customer not found');

        const salesData = await Sale.aggregate([
            { $match: { customerID } },
            {
                $group: {
                    _id: '$customerID',
                    totalSpent: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' },
                    purchaseFrequency: { $sum: 1 },
                    firstPurchase: { $min: '$date' },
                    lastPurchase: { $max: '$date' }
                }
            }
        ]);

        const data = salesData[0] || {
            totalSpent: 0,
            averageOrderValue: 0,
            purchaseFrequency: 0,
            firstPurchase: null,
            lastPurchase: null
        };

        const ltvScore = this.calculateLTVScore(
            data.totalSpent,
            data.purchaseFrequency,
            data.averageOrderValue
        );

        return {
            customerID,
            lifetimeValue: data.totalSpent,
            averageOrderValue: data.averageOrderValue,
            purchaseFrequency: data.purchaseFrequency,
            ltvScore,
            customerSegment: this.assignCustomerSegment(ltvScore),
            firstPurchase: data.firstPurchase,
            lastPurchase: data.lastPurchase
        };
    }

    // Overdue payments analysis
    static async getOverduePaymentsAnalysis() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const overdueData = await Sale.aggregate([
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'saleID',
                    as: 'payment'
                }
            },
            { $unwind: '$payment' },
            {
                $match: {
                    'payment.status': 'pending',
                    date: { $lt: thirtyDaysAgo }
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customerID',
                    foreignField: 'customerID',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $group: {
                    _id: '$customerID',
                    customerName: { $first: '$customer.name' },
                    totalOverdue: { $sum: '$total' },
                    oldestOverdue: { $min: '$date' },
                    overdueCount: { $sum: 1 }
                }
            },
            { $sort: { totalOverdue: -1 } }
        ]);

        return overdueData;
    }

    static calculateLTVScore(totalSpent, frequency, avgOrderValue) {
        const spendScore = Math.min(totalSpent / 100000, 10);
        const frequencyScore = Math.min(frequency * 2, 5);
        const valueScore = Math.min(avgOrderValue / 5000, 5);

        return (spendScore + frequencyScore + valueScore) * 5;
    }

    static assignCustomerSegment(ltvScore) {
        if (ltvScore >= 80) return 'Platinum';
        if (ltvScore >= 60) return 'Gold';
        if (ltvScore >= 40) return 'Silver';
        return 'Bronze';
    }
}

module.exports = CustomerLogic;

// ===== server.js =====
const express = require('express');
const connectDB = require('./db');

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Import logic and models
const CustomerLogic = require('./logic/CustomerLogic');

// Routes
app.get('/customer/:id/ltv', async (req, res) => {
    try {
        const result = await CustomerLogic.calculateCustomerLTV(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/overdue-payments', async (req, res) => {
    try {
        const overdue = await CustomerLogic.getOverduePaymentsAnalysis();
        res.json(overdue);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
