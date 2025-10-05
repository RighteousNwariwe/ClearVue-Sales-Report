const Product = require('../models/product');
const Sale = require('../models/sale');

class InventoryLogic {
    
    // Check stock levels and flag low inventory
    static async checkInventoryLevels() {
        const products = await Product.find();
        const lowStockProducts = [];
        const outOfStockProducts = [];
        
        for (let product of products) {
            // Business rule: flag if stock < 20% of average monthly sales
            const monthlySales = await this.getProductMonthlySales(product._id);
            const threshold = monthlySales * 0.2;
            
            if (product.stock === 0) {
                outOfStockProducts.push({
                    product: product.name,
                    currentStock: product.stock,
                    required: Math.ceil(monthlySales * 1.5) // 1.5 months supply
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
    
    static async getProductMonthlySales(productId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const sales = await Sale.aggregate([
            { $match: { saleDate: { $gte: thirtyDaysAgo } } },
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