const Customer = require('../models/customer');
const Sale = require('../models/sale');

class CustomerLogic {
    
    // Calculate customer lifetime value metrics
    static async calculateCustomerLTV(customerId) {
        const customer = await Customer.findById(customerId);
        if (!customer) throw new Error('Customer not found');
        
        const salesData = await Sale.aggregate([
            { $match: { customerId: customerId } },
            {
                $group: {
                    _id: '$customerId',
                    totalSpent: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' },
                    purchaseFrequency: { $sum: 1 },
                    firstPurchase: { $min: '$saleDate' },
                    lastPurchase: { $max: '$saleDate' }
                }
            }
        ]);
        
        const data = salesData[0] || {
            totalSpent: 0,
            averageOrderValue: 0,
            purchaseFrequency: 0
        };
        
        // Calculate LTV score (simplified)
        const ltvScore = this.calculateLTVScore(
            data.totalSpent,
            data.purchaseFrequency,
            data.averageOrderValue
        );
        
        return {
            customerId,
            lifetimeValue: data.totalSpent,
            averageOrderValue: data.averageOrderValue,
            purchaseFrequency: data.purchaseFrequency,
            ltvScore,
            customerSegment: this.assignCustomerSegment(ltvScore),
            firstPurchase: data.firstPurchase,
            lastPurchase: data.lastPurchase
        };
    }
    
    // Get overdue payments analysis
    static async getOverduePaymentsAnalysis() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const overdueData = await Sale.aggregate([
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'saleId',
                    as: 'payment'
                }
            },
            { $unwind: '$payment' },
            {
                $match: {
                    'payment.status': 'pending',
                    saleDate: { $lt: thirtyDaysAgo }
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $group: {
                    _id: '$customerId',
                    customerName: { $first: '$customer.name' },
                    totalOverdue: { $sum: '$total' },
                    oldestOverdue: { $min: '$saleDate' },
                    overdueCount: { $sum: 1 }
                }
            },
            { $sort: { totalOverdue: -1 } }
        ]);
        
        return overdueData;
    }
    
    static calculateLTVScore(totalSpent, frequency, avgOrderValue) {
        // Simplified LTV scoring algorithm
        const spendScore = Math.min(totalSpent / 100000, 10); // Max 10 points
        const frequencyScore = Math.min(frequency * 2, 5); // Max 5 points
        const valueScore = Math.min(avgOrderValue / 5000, 5); // Max 5 points
        
        return (spendScore + frequencyScore + valueScore) * 5; // Scale to 100
    }
    
    static assignCustomerSegment(ltvScore) {
        if (ltvScore >= 80) return 'Platinum';
        if (ltvScore >= 60) return 'Gold';
        if (ltvScore >= 40) return 'Silver';
        return 'Bronze';
    }
}

module.exports = CustomerLogic;