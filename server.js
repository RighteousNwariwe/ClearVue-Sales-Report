const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/clearvueDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Models
const Product = require('./models/product');
const Customer = require('./models/customer');
const Sale = require('./models/sale');

// --- Products API ---
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

// --- Customers API ---
app.get('/api/customers', async (req, res) => {
  const customers = await Customer.find();
  res.json(customers);
});

app.post('/api/customers', async (req, res) => {
  const customer = new Customer(req.body);
  await customer.save();
  res.json(customer);
});

// --- Sales API ---
app.get('/api/sales', async (req, res) => {
  const sales = await Sale.find().populate('customerId').populate('items.productId');
  res.json(sales);
});

// --- Weekly Sales Aggregation ---
app.get('/api/sales/weekly', async (req, res) => {
  // Aggregate sales by product for the last 7 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const weekly = await Sale.aggregate([
    { $match: { saleDate: { $gte: startDate } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        totalUnits: { $sum: '$items.quantity' }
      }
    },
    { $sort: { totalSales: -1 } },
    { $limit: 10 }
  ]);
  res.json(weekly);
});

// --- Monthly Sales Aggregation ---
app.get('/api/sales/monthly', async (req, res) => {
  // Aggregate sales by category for the current month
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthly = await Sale.aggregate([
    { $match: { saleDate: { $gte: startDate } } },
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
        _id: '$product.category',
        revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        totalUnits: { $sum: '$items.quantity' }
      }
    }
  ]);
  res.json(monthly);
});

// --- Annual Sales Aggregation ---
app.get('/api/sales/annual', async (req, res) => {
  // Aggregate sales by quarter for the current year
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1);
  const annual = await Sale.aggregate([
    { $match: { saleDate: { $gte: startDate } } },
    {
      $addFields: {
        quarter: {
          $ceil: { $divide: [{ $month: '$saleDate' }, 3] }
        }
      }
    },
    {
      $group: {
        _id: '$quarter',
        revenue: { $sum: '$total' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  res.json(annual);
});

app.post('/api/sales', async (req, res) => {
  const sale = new Sale(req.body);
  await sale.save();
  res.json(sale);
});

// --- Start server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
