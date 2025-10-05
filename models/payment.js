const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentDate: { type: Date, default: Date.now },
    status: { type: String, default: 'completed' }
});

module.exports = mongoose.model('Payment', paymentSchema);
