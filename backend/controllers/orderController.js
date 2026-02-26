import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getUSDPrice } from "../utils/currencyConverter.js";
import * as paymentController from "./paymentController.js";

//Place a new order with Stripe Integration
//POST /api/orders

export const placeOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // 1. Validate Product and Stock
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    const totalPriceLKR = product.price * quantity;

    // 2. Fetch Third-party Currency Conversion
    const totalPriceUSD = await getUSDPrice(totalPriceLKR);

    // 3. Initialize Order with Payment Status
    const newOrder = new Order({
      distributor: req.user._id, // Verified via Teshan's protect middleware
      product: productId,
      quantity,
      totalPrice: totalPriceLKR,
      totalPriceUSD: totalPriceUSD || 0,
      paymentStatus: 'unpaid', // Default status for new orders
      status: 'Pending'
    });

    // 4. Generate Stripe Checkout Session using the Service Layer
    const session = await paymentController.createStripeSession(newOrder, product);
    
    newOrder.stripeSessionId = session.id;
    await newOrder.save();

    // 5. Update Product Inventory (Atomic update)
    product.quantity -= quantity;
    await product.save();

    res.status(201).json({ 
      success: true, 
      message: "Order initiated. Please complete payment.",
      checkoutUrl: session.url, // URL for Postman/Browser testing
      order: newOrder 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get logged-in distributor's orders (with Pagination)
//GET /api/orders/my-orders

export const getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ distributor: req.user._id })
      .populate("product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ distributor: req.user._id });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Update order quantity or status with stock re-sync
//PUT /api/orders/:id

export const updateOrder = async (req, res) => {
  try {
    const { quantity, status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId).populate("product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Security: Ownership verification
    if (order.distributor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }

    if (quantity && quantity !== order.quantity) {
      const product = await Product.findById(order.product._id);
      const quantityDiff = quantity - order.quantity;

      if (quantityDiff > 0) {
        if (product.quantity < quantityDiff) {
          return res.status(400).json({ message: "Insufficient stock for increase" });
        }
        product.quantity -= quantityDiff;
      } else {
        product.quantity += Math.abs(quantityDiff);
      }

      await product.save();

      order.quantity = quantity;
      order.totalPrice = product.price * quantity;
      order.totalPriceUSD = await getUSDPrice(order.totalPrice);
    }

    if (status) order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Cancel Order and restore stock
//DELETE /api/orders/:id

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.distributor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const product = await Product.findById(order.product);
    if (product) {
      product.quantity += order.quantity;
      await product.save();
    }

    await order.deleteOne();
    res.status(200).json({ success: true, message: "Order cancelled and stock restored" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// In orderController.js
export const verifyPayment = async (req, res) => {
    try {
        const { session_id } = req.query; 

        if (!session_id) {
            return res.status(400).send("Session ID is missing.");
        }

        // Use the named import 'paymentController' you defined at the top
        const session = await paymentController.verifyStripeSession(session_id);

        if (session.payment_status === 'paid') {
            await Order.findByIdAndUpdate(session.metadata.orderId, { 
                paymentStatus: 'paid', 
                status: 'Confirmed' 
            });

            res.send(`
                <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #28a745;">Payment Successful!</h1>
                    <p>Order ID: ${session.metadata.orderId}</p>
                    <a href="http://localhost:3000/api/orders/my-orders">View My Orders</a>
                </div>
            `);
        } else {
            res.status(400).send("Payment not completed.");
        }
    } catch (error) {
        console.error("Verification Error:", error.message);
        res.status(500).send("Internal Server Error.");
    }
};