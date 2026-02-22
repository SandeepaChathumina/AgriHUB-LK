import Order from '../models/Order.js';
import Product from '../models/Product.js';

// Place a new order
// POST /api/orders
export const placeOrder = async (req, res) => {
    try {
        const { distributorId, productId, quantity } = req.body;

        // Validate required fields
        if (!distributorId || !productId || !quantity) {
            return res.status(400).json({ 
                message: 'distributorId, productId, and quantity are required' 
            });
        }

        // 1. Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // 2. Validate stock availability
        if (product.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock available' });
        }

        // 3. Calculate price and create order
        const totalPrice = product.price * quantity;
        const newOrder = new Order({
            distributor: distributorId, // Use distributorId from body instead of req.user.id
            product: productId,
            quantity,
            totalPrice
        });

        const savedOrder = await newOrder.save();

        // 4. Update Inventory (Crucial for Zero Hunger to keep data accurate)
        product.quantity -= quantity;
        await product.save();

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get orders for logged-in distributor
// GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
    try {
        const { distributorId } = req.query;
        
        if (!distributorId) {
            return res.status(400).json({ 
                message: 'distributorId query parameter is required' 
            });
        }
        
        const orders = await Order.find({ distributor: distributorId })
            .populate('product')
            .sort({ createdAt: -1 });
            
        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update order
// PUT /api/orders/:id
export const updateOrder = async (req, res) => {
    try {
        const { distributorId, quantity, status } = req.body;
        const orderId = req.params.id;

        if (!distributorId) {
            return res.status(400).json({ 
                message: 'distributorId is required for verification' 
            });
        }

        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify the order belongs to this distributor
        if (order.distributor.toString() !== distributorId) {
            return res.status(403).json({ 
                message: 'Not authorized - this order does not belong to you' 
            });
        }

        // If quantity is being updated, check stock and update totalPrice
        if (quantity && quantity !== order.quantity) {
            const product = await Product.findById(order.product);
            
            // Calculate stock difference
            const quantityDiff = quantity - order.quantity;
            
            if (quantityDiff > 0) {
                // Increasing quantity - check stock
                if (product.quantity < quantityDiff) {
                    return res.status(400).json({ 
                        message: 'Insufficient stock for quantity increase' 
                    });
                }
                product.quantity -= quantityDiff;
            } else {
                // Decreasing quantity - return stock
                product.quantity += Math.abs(quantityDiff);
            }
            
            await product.save();
            
            // Update total price
            req.body.totalPrice = product.price * quantity;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('product');

        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete/Cancel order
// DELETE /api/orders/:id
export const deleteOrder = async (req, res) => {
    try {
        const { distributorId } = req.body; // or req.query.distributorId
        const orderId = req.params.id;

        if (!distributorId) {
            return res.status(400).json({ 
                message: 'distributorId is required for verification' 
            });
        }

        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify the order belongs to this distributor
        if (order.distributor.toString() !== distributorId) {
            return res.status(403).json({ 
                message: 'Not authorized - this order does not belong to you' 
            });
        }

        // Only allow cancellation of pending orders
        if (order.status !== 'Pending') {
            return res.status(400).json({ 
                message: 'Only pending orders can be cancelled' 
            });
        }

        // Return products to inventory
        const product = await Product.findById(order.product);
        product.quantity += order.quantity;
        await product.save();

        await order.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};