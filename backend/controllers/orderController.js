import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getUSDPrice } from "../utils/currencyConverter.js";

export const placeOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    const totalPriceLKR = product.price * quantity;

    // CALL THE IMPORTED UTILITY
    const totalPriceUSD = await getUSDPrice(totalPriceLKR);

    const newOrder = new Order({
      distributor: req.user._id, // From Teshan's middleware
      product: productId,
      quantity,
      totalPrice: totalPriceLKR,
      totalPriceUSD: totalPriceUSD || 0, // Store converted value
    });

    await newOrder.save();

    // Update product stock
    product.quantity -= quantity;
    await product.save();

    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get logged-in distributor's orders 
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

//Cancel Order and return stock to Inventory
//DELETE /api/orders/:id

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Security: Ensure it's the owner
    if (order.distributor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Return stock to Product inventory
    const product = await Product.findById(order.product);
    if (product) {
      product.quantity += order.quantity;
      await product.save();
    }

    await order.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Order cancelled and stock returned" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Update order quantity or status
//PUT /api/orders/:id

 
export const updateOrder = async (req, res) => {
  try {
    const { quantity, status } = req.body;
    const orderId = req.params.id;

    // 1. Find the order and populate product details
    const order = await Order.findById(orderId).populate("product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Security: Verify ownership (Role-based access) [cite: 24]
    if (order.distributor.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this order" });
    }

    // 3. Logic: Handle Quantity Changes
    if (quantity && quantity !== order.quantity) {
      const product = await Product.findById(order.product._id);
      const quantityDiff = quantity - order.quantity;

      if (quantityDiff > 0) {
        // Check if farmer has enough additional stock
        if (product.quantity < quantityDiff) {
          return res
            .status(400)
            .json({ message: "Insufficient stock for quantity increase" });
        }
        product.quantity -= quantityDiff;
      } else {
        // Return stock to inventory if quantity is decreased
        product.quantity += Math.abs(quantityDiff);
      }

      await product.save();

      // Recalculate prices including Third-party USD conversion
      order.quantity = quantity;
      order.totalPrice = product.price * quantity;
      order.totalPriceUSD = await getUSDPrice(order.totalPrice);
    }

    // 4. Update Status if provided
    if (status) order.status = status;

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: "Order updated successfully and stock adjusted",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
