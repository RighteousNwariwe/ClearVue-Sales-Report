const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    lifetimeValue: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date },
    totalPurchases: { type: Number, default: 0 },
    // Add any other fields as needed
});

module.exports = mongoose.model('Customer', customerSchema);
