const Product = require('../models/product');
const Sale = require('../models/sale');
const Payment = require('../models/payment');
const Customer = require('../models/customer');

class SalesLogic {
    
    // Process a complete sale transaction
    static async processSale(saleData) {
        const session = await Sale.startSession();
        session.startTransaction();
        
        try {
            // 1. Validate products and stock
            for (let item of saleData.items) {
                const product = await Product.findById(item.productId).session(session);
                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
                }
                
                // Update stock
                product.stock -= item.quantity;
                await product.save({ session });
            }
            
            // 2. Calculate totals
            const totals = await this.calculateSaleTotals(saleData.items);
            
            // 3. Create sale record
            const sale = new Sale({
                customerId: saleData.customerId,
                items: saleData.items,
                subtotal: totals.subtotal,
                tax: totals.tax,
                discount: totals.discount,
                total: totals.total,
                saleDate: new Date(),
                status: 'completed'
            });
            await sale.save({ session });
            
            // 4. Create payment record
            const payment = new Payment({
                saleId: sale._id,
                amount: totals.total,
                paymentMethod: saleData.paymentMethod,
                paymentDate: new Date(),
                status: 'completed'
            });
            await payment.save({ session });
            
            // 5. Update customer lifetime value
            await this.updateCustomerLTV(saleData.customerId, totals.total);
            
            await session.commitTransaction();
            
            return {
                sale,
                payment,
                stockUpdated: true
            };
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    // Calculate sale totals with business rules
    static async calculateSaleTotals(items) {
        let subtotal = 0;
        
        for (let item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;
            
            const itemTotal = product.price * item.quantity;
            
            // Apply volume discount
            let discount = 0;
            if (item.quantity >= 10) {
                discount = itemTotal * 0.05; // 5% volume discount
            } else if (item.quantity >= 50) {
                discount = itemTotal * 0.10; // 10% volume discount
            }
            
            subtotal += (itemTotal - discount);
        }
        
        const tax = subtotal * 0.15; // 15% VAT
        const total = subtotal + tax;
        
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            discount: 0, // Already applied per item
            total: Math.round(total * 100) / 100
        };
    }
    
    // Update customer lifetime value
    static async updateCustomerLTV(customerId, saleAmount) {
        const customer = await Customer.findById(customerId);
        if (!customer) return;
        
        customer.lifetimeValue = (customer.lifetimeValue || 0) + saleAmount;
        customer.lastPurchaseDate = new Date();
        customer.totalPurchases = (customer.totalPurchases || 0) + 1;
        
        await customer.save();
    }
    
    // Get sales analytics for dashboard
    static async getSalesAnalytics(timeframe = 'monthly') {
        const dateFilter = this.getDateFilter(timeframe);
        
        const analytics = await Sale.aggregate([
            { $match: { saleDate: dateFilter } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total' },
                    averageSale: { $avg: '$total' },
                    totalTransactions: { $sum: 1 },
                    taxCollected: { $sum: '$tax' }
                }
            }
        ]);
        
        return analytics[0] || {
            totalSales: 0,
            averageSale: 0,
            totalTransactions: 0,
            taxCollected: 0
        };
    }
    
    static getDateFilter(timeframe) {
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
            case 'daily':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'weekly':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'monthly':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'annual':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
        }
        
        return { $gte: startDate };
    }
}

module.exports = SalesLogic;